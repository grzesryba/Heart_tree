from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import cloudinary
import cloudinary.uploader
import cloudinary.api

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---- MongoDB ----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---- Cloudinary ----
cloudinary.config(
    cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'],
    api_key=os.environ['CLOUDINARY_API_KEY'],
    api_secret=os.environ['CLOUDINARY_API_SECRET'],
    secure=True,
)

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class Photo(BaseModel):
    public_id: str
    url: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class DateState(BaseModel):
    date_id: int
    done: bool = False
    photos: List[Photo] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DateStateUpdate(BaseModel):
    done: bool


# ---------- Helpers ----------
def _serialize(doc):
    if not doc:
        return None
    doc.pop('_id', None)
    return doc


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Drzewko Randek API"}


@api_router.get("/dates", response_model=List[DateState])
async def get_all_dates():
    """Return state for every date that has any data saved."""
    docs = await db.date_states.find().to_list(1000)
    return [DateState(**_serialize(d)) for d in docs]


@api_router.get("/dates/{date_id}", response_model=DateState)
async def get_date(date_id: int):
    doc = await db.date_states.find_one({"date_id": date_id})
    if not doc:
        return DateState(date_id=date_id)
    return DateState(**_serialize(doc))


@api_router.patch("/dates/{date_id}", response_model=DateState)
async def update_date(date_id: int, payload: DateStateUpdate):
    existing = await db.date_states.find_one({"date_id": date_id})
    if existing:
        await db.date_states.update_one(
            {"date_id": date_id},
            {"$set": {"done": payload.done, "updated_at": datetime.utcnow()}},
        )
        doc = await db.date_states.find_one({"date_id": date_id})
    else:
        new_state = DateState(date_id=date_id, done=payload.done)
        await db.date_states.insert_one(new_state.dict())
        doc = new_state.dict()
    return DateState(**_serialize(doc))


@api_router.post("/dates/{date_id}/photos", response_model=DateState)
async def upload_photo(date_id: int, file: UploadFile = File(...)):
    """Upload a photo to Cloudinary inside a folder dedicated to this date."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Plik musi być obrazem")

    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:  # 15 MB
        raise HTTPException(status_code=413, detail="Plik za duży (max 15 MB)")

    folder = f"drzewko-randek/randka-{date_id}"
    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
        )
    except Exception as e:
        logging.exception("Cloudinary upload failed")
        raise HTTPException(status_code=500, detail=f"Błąd uploadu: {e}")

    photo = Photo(
        public_id=result["public_id"],
        url=result["secure_url"],
    )

    existing = await db.date_states.find_one({"date_id": date_id})
    if existing:
        await db.date_states.update_one(
            {"date_id": date_id},
            {
                "$push": {"photos": photo.dict()},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )
    else:
        new_state = DateState(date_id=date_id, photos=[photo])
        await db.date_states.insert_one(new_state.dict())

    doc = await db.date_states.find_one({"date_id": date_id})
    return DateState(**_serialize(doc))


@api_router.delete("/dates/{date_id}/photos/{public_id:path}", response_model=DateState)
async def delete_photo(date_id: int, public_id: str):
    """Delete a photo from Cloudinary and remove from MongoDB."""
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception as e:
        logging.warning(f"Cloudinary destroy failed: {e}")

    await db.date_states.update_one(
        {"date_id": date_id},
        {"$pull": {"photos": {"public_id": public_id}},
         "$set": {"updated_at": datetime.utcnow()}},
    )
    doc = await db.date_states.find_one({"date_id": date_id})
    if not doc:
        return DateState(date_id=date_id)
    return DateState(**_serialize(doc))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

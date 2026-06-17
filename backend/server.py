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

from seed_ideas import SEED_IDEAS, CATEGORIES

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
logger = logging.getLogger(__name__)


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


class DateIdea(BaseModel):
    id: int
    title: str
    description: str
    categories: List[str]


class DateIdeaCreate(BaseModel):
    title: str
    description: str
    categories: List[str]


class DateIdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    categories: Optional[List[str]] = None


# ---------- Helpers ----------
def _serialize(doc):
    if not doc:
        return None
    doc.pop('_id', None)
    return doc


async def _next_idea_id() -> int:
    last = await db.ideas.find_one(sort=[("id", -1)])
    return (last["id"] + 1) if last else 1


# ---------- Startup: seed defaults if empty ----------
@app.on_event("startup")
async def seed_defaults():
    try:
        count = await db.ideas.count_documents({})
        if count == 0:
            await db.ideas.insert_many([dict(d) for d in SEED_IDEAS])
            logger.info(f"Seeded {len(SEED_IDEAS)} default date ideas")
    except Exception as e:
        logger.exception("Seed failed: %s", e)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Drzewko Randek API"}


# ----- Date ideas (CRUD) -----
@api_router.get("/ideas", response_model=List[DateIdea])
async def list_ideas():
    docs = await db.ideas.find().sort("id", 1).to_list(2000)
    return [DateIdea(**_serialize(d)) for d in docs]


@api_router.get("/ideas/categories")
async def list_categories():
    return CATEGORIES


@api_router.post("/ideas", response_model=DateIdea)
async def create_idea(payload: DateIdeaCreate):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Tytuł jest wymagany")
    if not payload.categories:
        raise HTTPException(status_code=400, detail="Wybierz przynajmniej jedną kategorię")
    invalid = [c for c in payload.categories if c not in CATEGORIES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Nieznane kategorie: {invalid}")

    new_id = await _next_idea_id()
    idea = DateIdea(id=new_id, **payload.dict())
    await db.ideas.insert_one(idea.dict())
    return idea


@api_router.patch("/ideas/{idea_id}", response_model=DateIdea)
async def update_idea(idea_id: int, payload: DateIdeaUpdate):
    existing = await db.ideas.find_one({"id": idea_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Randka nie istnieje")

    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if "categories" in update_data:
        invalid = [c for c in update_data["categories"] if c not in CATEGORIES]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Nieznane kategorie: {invalid}")

    if update_data:
        await db.ideas.update_one({"id": idea_id}, {"$set": update_data})
    doc = await db.ideas.find_one({"id": idea_id})
    return DateIdea(**_serialize(doc))


@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: int):
    res = await db.ideas.delete_one({"id": idea_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Randka nie istnieje")

    # Also clean up the state and its Cloudinary photos
    state = await db.date_states.find_one({"date_id": idea_id})
    if state:
        for p in state.get("photos", []):
            try:
                cloudinary.uploader.destroy(p["public_id"], resource_type="image")
            except Exception as e:
                logger.warning("Cloudinary cleanup failed: %s", e)
        await db.date_states.delete_one({"date_id": idea_id})
    return {"ok": True}


# ----- Date state (done + photos) -----
@api_router.get("/dates", response_model=List[DateState])
async def get_all_dates():
    docs = await db.date_states.find().to_list(2000)
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
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Plik musi być obrazem")

    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Plik za duży (max 15 MB)")

    folder = f"drzewko-randek/randka-{date_id}"
    try:
        result = cloudinary.uploader.upload(
            contents, folder=folder, resource_type="image",
        )
    except Exception as e:
        logger.exception("Cloudinary upload failed")
        raise HTTPException(status_code=500, detail=f"Błąd uploadu: {e}")

    photo = Photo(public_id=result["public_id"], url=result["secure_url"])

    existing = await db.date_states.find_one({"date_id": date_id})
    if existing:
        await db.date_states.update_one(
            {"date_id": date_id},
            {"$push": {"photos": photo.dict()},
             "$set": {"updated_at": datetime.utcnow()}},
        )
    else:
        await db.date_states.insert_one(DateState(date_id=date_id, photos=[photo]).dict())

    doc = await db.date_states.find_one({"date_id": date_id})
    return DateState(**_serialize(doc))


@api_router.delete("/dates/{date_id}/photos/{public_id:path}", response_model=DateState)
async def delete_photo(date_id: int, public_id: str):
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception as e:
        logger.warning("Cloudinary destroy failed: %s", e)

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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

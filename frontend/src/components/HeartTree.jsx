import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { Heart, Check, Upload, Trash2, Loader2, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DATE_IDEAS, CATEGORIES } from "../data/dateIdeas";
import "./HeartTree.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/* ---------- Tree SVG (trunk + branches + swing) ---------- */
const TreeSVG = () => (
  <svg
    viewBox="0 0 1000 1200"
    preserveAspectRatio="xMidYMax meet"
    className="absolute inset-0 w-full h-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bark" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#5a3a2a" />
        <stop offset="50%" stopColor="#7a4e34" />
        <stop offset="100%" stopColor="#4a2c1e" />
      </linearGradient>
      <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#c79a72" stopOpacity="0.0" />
        <stop offset="100%" stopColor="#8c5e3d" stopOpacity="0.35" />
      </linearGradient>
      <radialGradient id="canopyShadow" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#e9b88a" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#e9b88a" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="500" cy="430" rx="430" ry="320" fill="url(#canopyShadow)" />
    <ellipse cx="500" cy="1170" rx="320" ry="20" fill="url(#ground)" />

    {/* roots */}
    <path d="M430,1150 C460,1140 470,1120 500,1115 C530,1120 540,1140 575,1150"
      stroke="url(#bark)" strokeWidth="22" strokeLinecap="round" fill="none" />

    {/* trunk */}
    <path d="M500,1150 C 480,1050 530,950 495,840 C 478,780 520,720 500,650"
      stroke="url(#bark)" strokeWidth="62" strokeLinecap="round" fill="none" />
    <path d="M488,1140 C 478,1040 520,940 488,830 C 472,775 510,715 492,655"
      stroke="#8b5a3c" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55" />

    {/* Main branches — left */}
    <path d="M500,760 C 420,720 320,700 220,640 C 170,610 130,560 105,500"
      stroke="url(#bark)" strokeWidth="34" strokeLinecap="round" fill="none" />
    <path d="M300,700 C 250,660 220,600 170,560"
      stroke="url(#bark)" strokeWidth="20" strokeLinecap="round" fill="none" />
    <path d="M220,640 C 200,580 180,520 200,440"
      stroke="url(#bark)" strokeWidth="18" strokeLinecap="round" fill="none" />

    {/* Main branches — right */}
    <path d="M500,760 C 580,720 680,700 780,640 C 830,610 870,560 895,500"
      stroke="url(#bark)" strokeWidth="34" strokeLinecap="round" fill="none" />
    <path d="M700,700 C 750,660 780,600 830,560"
      stroke="url(#bark)" strokeWidth="20" strokeLinecap="round" fill="none" />
    <path d="M780,640 C 800,580 820,520 800,440"
      stroke="url(#bark)" strokeWidth="18" strokeLinecap="round" fill="none" />

    {/* Center upper branches */}
    <path d="M500,700 C 470,620 460,540 440,460 C 425,400 430,340 460,290"
      stroke="url(#bark)" strokeWidth="22" strokeLinecap="round" fill="none" />
    <path d="M500,700 C 530,620 540,540 560,460 C 575,400 570,340 540,290"
      stroke="url(#bark)" strokeWidth="22" strokeLinecap="round" fill="none" />
    <path d="M500,700 C 500,600 505,500 500,380 C 498,330 500,280 500,240"
      stroke="url(#bark)" strokeWidth="20" strokeLinecap="round" fill="none" />

    <path d="M460,460 C 410,440 380,400 360,360" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
    <path d="M540,460 C 590,440 620,400 640,360" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
    <path d="M440,360 C 400,330 380,290 390,250" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M560,360 C 600,330 620,290 610,250" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />

    {/* Swing — hangs from right main branch */}
    <g className="swing" style={{ transformOrigin: "690px 700px" }}>
      <line x1="650" y1="700" x2="640" y2="900" stroke="#6b4a30" strokeWidth="2.5" />
      <line x1="730" y1="700" x2="740" y2="900" stroke="#6b4a30" strokeWidth="2.5" />
      <rect x="620" y="900" width="140" height="14" rx="3" fill="#7a4e34" />
      <rect x="620" y="900" width="140" height="4" rx="2" fill="#a0704d" />
    </g>

    {/* grass tufts */}
    <g opacity="0.6">
      <path d="M280,1158 q5,-18 12,-2" stroke="#7a8b4a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M300,1158 q4,-14 10,-1" stroke="#7a8b4a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M680,1158 q5,-18 12,-2" stroke="#7a8b4a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M700,1158 q4,-14 10,-1" stroke="#7a8b4a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M380,1162 q5,-12 10,-1" stroke="#7a8b4a" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M610,1162 q5,-12 10,-1" stroke="#7a8b4a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  </svg>
);

/* ---------- 100 heart positions distributed in the canopy ---------- */
const HEART_POSITIONS = (() => {
  const positions = [];
  const clusters = [
    { cx: 50, cy: 14, rx: 11, ry: 8, count: 12 },
    { cx: 42, cy: 22, rx: 11, ry: 8, count: 10 },
    { cx: 58, cy: 22, rx: 11, ry: 8, count: 10 },
    { cx: 22, cy: 30, rx: 13, ry: 10, count: 13 },
    { cx: 13, cy: 40, rx: 10, ry: 9, count: 10 },
    { cx: 30, cy: 42, rx: 10, ry: 8, count: 9 },
    { cx: 78, cy: 30, rx: 13, ry: 10, count: 13 },
    { cx: 87, cy: 40, rx: 10, ry: 9, count: 10 },
    { cx: 70, cy: 42, rx: 10, ry: 8, count: 9 },
    { cx: 40, cy: 36, rx: 9, ry: 7, count: 8 },
    { cx: 60, cy: 36, rx: 9, ry: 7, count: 8 },
    { cx: 50, cy: 46, rx: 10, ry: 6, count: 6 },
  ];
  const seedRand = (i) => {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  let idx = 0;
  clusters.forEach((cl) => {
    for (let i = 0; i < cl.count; i++) {
      const a = seedRand(idx * 2 + 1) * Math.PI * 2;
      const r = Math.sqrt(seedRand(idx * 2 + 2));
      const x = cl.cx + Math.cos(a) * cl.rx * r;
      const y = cl.cy + Math.sin(a) * cl.ry * r;
      const size = 42 + Math.floor(seedRand(idx * 2 + 3) * 18);
      const rot = (seedRand(idx * 2 + 4) - 0.5) * 50;
      positions.push({ x, y, size, rot });
      idx++;
    }
  });
  return positions.slice(0, 100);
})();

/* ---------- Heart SVG icon ---------- */
const HeartIcon = ({ color, size = 40, rotate = 0, done = false }) => {
  const gid = `g-${color.replace("#", "")}-${done ? "d" : "n"}`;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ transform: `rotate(${rotate}deg)`, display: "block" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={done ? 0.55 : 1} />
          <stop offset="100%" stopColor={color} stopOpacity={done ? 0.4 : 0.78} />
        </linearGradient>
      </defs>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 7.9 3.4 4 7.2 4c2 0 3.5 1 4.8 2.6C13.3 5 14.8 4 16.8 4c3.8 0 6.3 3.9 4.8 7.8C19.5 16.4 12 21 12 21z"
        fill={`url(#${gid})`}
        stroke="rgba(80,30,10,0.4)"
        strokeWidth="0.6"
      />
      <path d="M8 8.5c0.8-1.4 2.2-1.9 3.2-1.2"
        stroke="rgba(255,255,255,0.7)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      {done && (
        <path d="M8 12.5 l3 3 l5-6" stroke="white" strokeWidth="2.2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

/* ---------- Floating petals in the background ---------- */
const Petals = () => {
  const petals = Array.from({ length: 18 });
  const colors = ["#f4a89a", "#e8a09a", "#f4b89a", "#e89aa9", "#ffd1c1", "#f8c3a1"];
  return (
    <div className="petals-layer">
      {petals.map((_, i) => {
        const left = (i * 6 + 3) % 100;
        const dur = 14 + (i % 7) * 2.4;
        const delay = -((i * 1.9) % 14);
        return (
          <span
            key={i}
            className="petal"
            style={{
              left: `${left}%`,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              background: colors[i % colors.length],
              transform: `rotate(${i * 27}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};

/* ============================================================= */
const HeartTree = () => {
  const [active, setActive] = useState(null);
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState(null); // currently active category filter
  const fileInputRef = useRef(null);

  const placedHearts = useMemo(
    () => HEART_POSITIONS.map((pos, i) => ({ ...pos, idea: DATE_IDEAS[i % DATE_IDEAS.length] })),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/dates`);
        const map = {};
        data.forEach((d) => { map[d.date_id] = d; });
        setStates(map);
      } catch (e) {
        console.error("Failed to load states", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeState = active ? states[active.id] || { done: false, photos: [] } : null;
  // primary category drives the heart color
  const primaryCat = (idea) => CATEGORIES[idea.categories[0]];

  const toggleDone = async () => {
    if (!active) return;
    try {
      const { data } = await axios.patch(`${API}/dates/${active.id}`, {
        done: !activeState?.done,
      });
      setStates((s) => ({ ...s, [active.id]: data }));
    } catch (e) { console.error(e); }
  };

  const handleFiles = async (files) => {
    if (!active || !files || files.length === 0) return;
    setUploading(true);
    try {
      let updated = null;
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await axios.post(
          `${API}/dates/${active.id}/photos`, fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        updated = data;
      }
      if (updated) setStates((s) => ({ ...s, [active.id]: updated }));
    } catch (e) {
      console.error("Upload failed", e);
      alert("Nie udało się wgrać zdjęcia.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (public_id) => {
    if (!active) return;
    if (!window.confirm("Usunąć to zdjęcie?")) return;
    try {
      const encoded = encodeURIComponent(public_id);
      const { data } = await axios.delete(`${API}/dates/${active.id}/photos/${encoded}`);
      setStates((s) => ({ ...s, [active.id]: data }));
    } catch (e) { console.error(e); }
  };

  const doneCount = Object.values(states).filter((s) => s?.done).length;

  return (
    <div className="tree-page relative">
      <Petals />

      {/* tiny counter */}
      <div className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur border border-[#e8c9a5]/70 rounded-full px-4 py-1.5 text-sm text-[#4a2f23] shadow-sm flex items-center gap-2">
        <Heart className="w-4 h-4 text-[#c44141]" fill="#c44141" />
        <span>{doneCount} / 100</span>
      </div>

      {/* tree fills the viewport */}
      <div className="w-full min-h-screen flex items-center justify-center px-2 pt-6 pb-44">
        <div
          className="relative mx-auto"
          style={{
            aspectRatio: "1000 / 1200",
            height: "min(90vh, 1200px)",
            maxWidth: "100%",
          }}
        >
          <TreeSVG />

          {placedHearts.map((h, i) => {
            const cat = primaryCat(h.idea);
            const isDone = states[h.idea.id]?.done;
            const matchesFilter = !filter || h.idea.categories.includes(filter);
            return (
              <div
                key={i}
                className="heart-wrap absolute"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: matchesFilter ? 1 : 0.15,
                  filter: matchesFilter ? "none" : "grayscale(0.5)",
                  transition: "opacity 350ms ease, filter 350ms ease",
                  pointerEvents: matchesFilter ? "auto" : "none",
                }}
              >
                <button
                  onClick={() => setActive(h.idea)}
                  aria-label={`Randka: ${h.idea.title}`}
                  className="heart-leaf"
                  style={{ background: "transparent", border: "none", padding: 0 }}
                >
                  <HeartIcon color={cat.color} size={h.size} rotate={h.rot} done={isDone} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----- Categories legend / filters at the bottom ----- */}
      <div className="legend-bar">
        <div className="legend-inner">
          <button
            onClick={() => setFilter(null)}
            className={`legend-pill ${filter === null ? "active" : ""}`}
            title="Pokaż wszystkie"
          >
            <Heart className="w-3.5 h-3.5" fill="#4a2f23" stroke="#4a2f23" />
            Wszystkie
          </button>
          {Object.entries(CATEGORIES).map(([key, c]) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(isActive ? null : key)}
                className={`legend-pill ${isActive ? "active" : ""}`}
                title={c.desc}
                style={isActive ? { background: c.color, borderColor: c.color, color: "white" } : {}}
              >
                <span className="legend-dot" style={{ background: c.color }} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----- Modal ----- */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="idea-card max-w-lg p-0 overflow-hidden border-0">
          {active && (
            <div className="relative">
              <div
                className="h-24 flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(180deg, ${primaryCat(active).color}33 0%, transparent 100%)`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: primaryCat(active).color }}
                >
                  <Heart className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>

              <div className="px-7 pb-7 pt-2">
                <div className="text-center">
                  {/* multiple category tags */}
                  <div className="flex justify-center flex-wrap gap-1.5 mb-2">
                    {active.categories.map((k) => {
                      const c = CATEGORIES[k];
                      return (
                        <span
                          key={k}
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ background: `${c.color}24`, color: c.color }}
                        >
                          {c.label}
                        </span>
                      );
                    })}
                  </div>
                  <DialogTitle className="serif text-3xl font-semibold text-[#3a2418]">
                    {active.title}
                  </DialogTitle>
                  <p className="text-[#4a2f23]/80 text-base leading-relaxed mt-2">
                    {active.desc}
                  </p>
                </div>

                <button
                  onClick={toggleDone}
                  className={`mt-5 w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    activeState?.done
                      ? "bg-[#2a9d8f]/10 border-[#2a9d8f]/40"
                      : "bg-white border-[#e8c9a5] hover:border-[#c44141]/50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                      activeState?.done
                        ? "bg-[#2a9d8f] border-[#2a9d8f]"
                        : "border-[#4a2f23]/40 bg-white"
                    }`}
                  >
                    {activeState?.done && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-[#3a2418] font-medium">
                    {activeState?.done ? "Zaliczone " : "Oznacz jako zaliczone"}
                  </span>
                </button>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="serif text-lg font-semibold text-[#3a2418]">
                      Wasze zdjęcia
                    </h4>
                    <span className="text-xs text-[#4a2f23]/60">
                      {activeState?.photos?.length || 0} szt.
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(Array.from(e.target.files || []));
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e8c9a5] hover:border-[#c44141]/60 bg-white/60 hover:bg-white text-[#4a2f23] py-4 transition disabled:opacity-60"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Wgrywanie…</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Wgraj zdjęcie</>
                    )}
                  </button>

                  {activeState?.photos?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {activeState.photos.map((p) => (
                        <div key={p.public_id} className="relative group rounded-lg overflow-hidden border border-[#e8c9a5] aspect-square">
                          <img src={p.url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => deletePhoto(p.public_id)}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            aria-label="Usuń zdjęcie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="handwritten text-base text-[#4a2f23]/55 mt-5 text-center">
                  randka #{active.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="fixed inset-0 bg-[#fdf3e3]/80 flex items-center justify-center z-50 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-[#c44141]" />
        </div>
      )}
    </div>
  );
};

export default HeartTree;

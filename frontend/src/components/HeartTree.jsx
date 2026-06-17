import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  Heart, Check, Upload, Trash2, Loader2,
  CheckCircle2, Circle, Settings, X, Minus, Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DATE_IDEAS, CATEGORIES } from "../data/dateIdeas";
import "./HeartTree.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MIN_HEARTS = 5;
const MAX_HEARTS = 300;
const DEFAULT_HEARTS = 100;
const STORAGE_KEY = "drzewko_hearts_count";

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
    <path d="M430,1150 C460,1140 470,1120 500,1115 C530,1120 540,1140 575,1150"
      stroke="url(#bark)" strokeWidth="22" strokeLinecap="round" fill="none" />
    <path d="M500,1150 C 480,1050 530,950 495,840 C 478,780 520,720 500,650"
      stroke="url(#bark)" strokeWidth="62" strokeLinecap="round" fill="none" />
    <path d="M488,1140 C 478,1040 520,940 488,830 C 472,775 510,715 492,655"
      stroke="#8b5a3c" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55" />
    <path d="M500,760 C 420,720 320,700 220,640 C 170,610 130,560 105,500"
      stroke="url(#bark)" strokeWidth="34" strokeLinecap="round" fill="none" />
    <path d="M300,700 C 250,660 220,600 170,560"
      stroke="url(#bark)" strokeWidth="20" strokeLinecap="round" fill="none" />
    <path d="M220,640 C 200,580 180,520 200,440"
      stroke="url(#bark)" strokeWidth="18" strokeLinecap="round" fill="none" />
    <path d="M500,760 C 580,720 680,700 780,640 C 830,610 870,560 895,500"
      stroke="url(#bark)" strokeWidth="34" strokeLinecap="round" fill="none" />
    <path d="M700,700 C 750,660 780,600 830,560"
      stroke="url(#bark)" strokeWidth="20" strokeLinecap="round" fill="none" />
    <path d="M780,640 C 800,580 820,520 800,440"
      stroke="url(#bark)" strokeWidth="18" strokeLinecap="round" fill="none" />
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

    <g className="swing" style={{ transformOrigin: "690px 700px" }}>
      <line x1="650" y1="700" x2="640" y2="900" stroke="#6b4a30" strokeWidth="2.5" />
      <line x1="730" y1="700" x2="740" y2="900" stroke="#6b4a30" strokeWidth="2.5" />
      <rect x="620" y="900" width="140" height="14" rx="3" fill="#7a4e34" />
      <rect x="620" y="900" width="140" height="4" rx="2" fill="#a0704d" />
    </g>

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

/* ---------- Heart positions — generated dynamically for any count ---------- */
const seedRand = (i) => {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/* Cluster weights based on total hearts count.
   We scale each cluster's count proportionally so the distribution shape stays the same. */
const CLUSTER_TEMPLATE = [
  { cx: 50, cy: 14, rx: 11, ry: 8, weight: 12 },
  { cx: 42, cy: 22, rx: 11, ry: 8, weight: 10 },
  { cx: 58, cy: 22, rx: 11, ry: 8, weight: 10 },
  { cx: 22, cy: 30, rx: 13, ry: 10, weight: 13 },
  { cx: 13, cy: 40, rx: 10, ry: 9, weight: 10 },
  { cx: 30, cy: 42, rx: 10, ry: 8, weight: 9 },
  { cx: 78, cy: 30, rx: 13, ry: 10, weight: 13 },
  { cx: 87, cy: 40, rx: 10, ry: 9, weight: 10 },
  { cx: 70, cy: 42, rx: 10, ry: 8, weight: 9 },
  { cx: 40, cy: 36, rx: 9, ry: 7, weight: 8 },
  { cx: 60, cy: 36, rx: 9, ry: 7, weight: 8 },
  { cx: 50, cy: 46, rx: 10, ry: 6, weight: 6 },
];

const generatePositions = (count) => {
  const totalWeight = CLUSTER_TEMPLATE.reduce((a, c) => a + c.weight, 0);
  // hearts get bigger when there are fewer of them
  const baseSize = count <= 20 ? 70 : count <= 50 ? 56 : count <= 120 ? 46 : 38;
  const sizeJitter = count <= 20 ? 22 : 16;

  // First pass: compute target count per cluster (proportional, rounded)
  let allocated = 0;
  const perCluster = CLUSTER_TEMPLATE.map((c, i) => {
    const n = Math.floor((c.weight / totalWeight) * count);
    allocated += n;
    return n;
  });
  // distribute leftover hearts to clusters with biggest weight
  let leftover = count - allocated;
  const sortedIdx = CLUSTER_TEMPLATE
    .map((c, i) => ({ i, w: c.weight }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.i);
  let p = 0;
  while (leftover > 0) {
    perCluster[sortedIdx[p % sortedIdx.length]] += 1;
    leftover--;
    p++;
  }

  const positions = [];
  let idx = 0;
  CLUSTER_TEMPLATE.forEach((cl, ci) => {
    for (let i = 0; i < perCluster[ci]; i++) {
      const a = seedRand(idx * 2 + 1) * Math.PI * 2;
      const r = Math.sqrt(seedRand(idx * 2 + 2));
      const x = cl.cx + Math.cos(a) * cl.rx * r;
      const y = cl.cy + Math.sin(a) * cl.ry * r;
      const size = baseSize + Math.floor(seedRand(idx * 2 + 3) * sizeJitter);
      const rot = (seedRand(idx * 2 + 4) - 0.5) * 50;
      positions.push({ x, y, size, rot });
      idx++;
    }
  });
  return positions;
};

/* deterministic color cat pick */
const pickColorCategory = (idea) => {
  const seed = (idea.id * 2654435761) >>> 0;
  return idea.categories[seed % idea.categories.length];
};

const HeartIcon = ({ color, size = 40, rotate = 0, done = false }) => {
  const gid = `g-${color.replace("#", "")}-${done ? "d" : "n"}`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      style={{ transform: `rotate(${rotate}deg)`, display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={done ? 0.55 : 1} />
          <stop offset="100%" stopColor={color} stopOpacity={done ? 0.4 : 0.78} />
        </linearGradient>
      </defs>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 7.9 3.4 4 7.2 4c2 0 3.5 1 4.8 2.6C13.3 5 14.8 4 16.8 4c3.8 0 6.3 3.9 4.8 7.8C19.5 16.4 12 21 12 21z"
        fill={`url(#${gid})`} stroke="rgba(80,30,10,0.4)" strokeWidth="0.6" />
      <path d="M8 8.5c0.8-1.4 2.2-1.9 3.2-1.2"
        stroke="rgba(255,255,255,0.7)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      {done && (
        <path d="M8 12.5 l3 3 l5-6" stroke="white" strokeWidth="2.2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

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
          <span key={i} className="petal" style={{
            left: `${left}%`,
            animationDuration: `${dur}s`,
            animationDelay: `${delay}s`,
            background: colors[i % colors.length],
            transform: `rotate(${i * 27}deg)`,
          }} />
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
  const [catFilter, setCatFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Heart count from localStorage with default
  const [heartCount, setHeartCount] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem(STORAGE_KEY) || "", 10);
      if (!isNaN(v) && v >= MIN_HEARTS && v <= MAX_HEARTS) return v;
    } catch {}
    return DEFAULT_HEARTS;
  });

  const fileInputRef = useRef(null);

  // Build placed hearts based on current count
  const placedHearts = useMemo(() => {
    const positions = generatePositions(heartCount);
    return positions.map((pos, i) => {
      const idea = DATE_IDEAS[i % DATE_IDEAS.length];
      return { ...pos, idea, colorCat: pickColorCategory(idea) };
    });
  }, [heartCount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(heartCount));
  }, [heartCount]);

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
  const activeColor = active ? CATEGORIES[pickColorCategory(active)].color : "#c44141";

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

  const matchesFilter = (idea) => {
    if (catFilter && !idea.categories.includes(catFilter)) return false;
    const isDone = !!states[idea.id]?.done;
    if (statusFilter === "done" && !isDone) return false;
    if (statusFilter === "notdone" && isDone) return false;
    return true;
  };

  const adjustHearts = (delta) => {
    setHeartCount((c) => Math.min(MAX_HEARTS, Math.max(MIN_HEARTS, c + delta)));
  };

  return (
    <div className="tree-page relative">
      <Petals />

      {/* settings button (top left) */}
      <button className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Ustawienia">
        <Settings className="w-4 h-4" />
      </button>

      {/* counter */}
      <div className="counter-pill">
        <Heart className="w-4 h-4 text-[#c44141]" fill="#c44141" />
        <span>{doneCount} / {heartCount}</span>
      </div>

      {/* tree */}
      <div className="tree-stage">
        <div className="tree-canvas">
          <TreeSVG />
          {placedHearts.map((h, i) => {
            const cat = CATEGORIES[h.colorCat];
            const isDone = states[h.idea.id]?.done;
            const visible = matchesFilter(h.idea);
            return (
              <div
                key={`${heartCount}-${i}`}
                className="heart-wrap absolute"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: visible ? 1 : 0.12,
                  filter: visible ? "none" : "grayscale(0.6)",
                  transition: "opacity 350ms ease, filter 350ms ease",
                  pointerEvents: visible ? "auto" : "none",
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

      {/* Bottom filter bar */}
      <div className="legend-bar">
        <div className="legend-inner">
          <div className="status-group">
            <button
              onClick={() => setStatusFilter("all")}
              className={`legend-pill ${statusFilter === "all" ? "active-dark" : ""}`}
            >
              <Heart className="w-3.5 h-3.5" fill="#4a2f23" stroke="#4a2f23" />
              Wszystkie
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "done" ? "all" : "done")}
              className="legend-pill"
              style={statusFilter === "done"
                ? { background: "#2a9d8f", borderColor: "#2a9d8f", color: "white" } : {}}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zaliczone
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "notdone" ? "all" : "notdone")}
              className={`legend-pill ${statusFilter === "notdone" ? "active-dark" : ""}`}
            >
              <Circle className="w-3.5 h-3.5" />
              Niezaliczone
            </button>
          </div>

          <span className="legend-sep" aria-hidden="true" />

          <div className="cat-group">
            {Object.entries(CATEGORIES).map(([key, c]) => {
              const isActive = catFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setCatFilter(isActive ? null : key)}
                  className="legend-pill"
                  title={c.desc}
                  style={isActive ? { background: c.color, borderColor: c.color, color: "white" } : {}}
                >
                  <span className="legend-dot" style={{ background: c.color }} />
                  {c.label}
                </button>
              );
            })}
            {catFilter && (
              <button onClick={() => setCatFilter(null)} className="legend-clear">Wyczyść</button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Date modal ===== */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="idea-card modal-responsive border-0">
          {active && (
            <div className="relative">
              <div className="modal-head"
                style={{ background: `linear-gradient(180deg, ${activeColor}33 0%, transparent 100%)` }}>
                <div className="modal-heart" style={{ background: activeColor }}>
                  <Heart className="w-7 h-7 text-white" fill="white" />
                </div>
              </div>

              <div className="modal-body">
                <div className="text-center">
                  <div className="flex justify-center flex-wrap gap-1.5 mb-2">
                    {active.categories.map((k) => {
                      const c = CATEGORIES[k];
                      return (
                        <span key={k} className="cat-tag"
                          style={{ background: `${c.color}24`, color: c.color }}>
                          {c.label}
                        </span>
                      );
                    })}
                  </div>
                  <DialogTitle className="serif modal-title">{active.title}</DialogTitle>
                  <p className="modal-desc">{active.desc}</p>
                </div>

                <button
                  onClick={toggleDone}
                  className={`done-toggle ${activeState?.done ? "is-done" : ""}`}
                >
                  <span className={`done-box ${activeState?.done ? "is-done" : ""}`}>
                    {activeState?.done && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-[#3a2418] font-medium">
                    {activeState?.done ? "Zaliczone " : "Oznacz jako zaliczone"}
                  </span>
                </button>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="serif text-lg font-semibold text-[#3a2418]">Wasze zdjęcia</h4>
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
                    className="upload-btn"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Wgrywanie…</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Wgraj zdjęcie</>
                    )}
                  </button>

                  {activeState?.photos?.length > 0 && (
                    <div className="photo-grid">
                      {activeState.photos.map((p) => (
                        <div key={p.public_id} className="photo-thumb">
                          <img src={p.url} alt="" />
                          <button
                            onClick={() => deletePhoto(p.public_id)}
                            className="photo-del"
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

      {/* ===== Settings modal ===== */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="idea-card modal-responsive border-0">
          <div className="modal-body" style={{ padding: "26px 22px 22px" }}>
            <DialogTitle className="serif modal-title text-center">Ustawienia</DialogTitle>
            <p className="text-center text-sm text-[#4a2f23]/70 mt-1">
              Ile serc ma mieć Wasze drzewko?
            </p>

            <div className="settings-counter">
              <button onClick={() => adjustHearts(-10)} className="settings-step" aria-label="-10">
                <Minus className="w-4 h-4" />
                <span className="settings-step-num">10</span>
              </button>
              <button onClick={() => adjustHearts(-1)} className="settings-step" aria-label="-1">
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={MIN_HEARTS}
                max={MAX_HEARTS}
                value={heartCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value || "0", 10);
                  if (!isNaN(v)) setHeartCount(Math.min(MAX_HEARTS, Math.max(MIN_HEARTS, v)));
                }}
                className="settings-input"
              />
              <button onClick={() => adjustHearts(1)} className="settings-step" aria-label="+1">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => adjustHearts(10)} className="settings-step" aria-label="+10">
                <Plus className="w-4 h-4" />
                <span className="settings-step-num">10</span>
              </button>
            </div>
            <p className="text-center text-xs text-[#4a2f23]/55 mt-2">
              od {MIN_HEARTS} do {MAX_HEARTS}
            </p>

            <div className="settings-presets">
              {[10, 25, 50, 100, 150, 200].map((n) => (
                <button
                  key={n}
                  onClick={() => setHeartCount(n)}
                  className={`legend-pill ${heartCount === n ? "active-dark" : ""}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#4a2f23]/60 mt-5 leading-relaxed text-center">
              Mała wskazówka: przy mniejszej liczbie serca są większe i bardziej rzucają się w oczy.
              Stan „zaliczone" i zdjęcia są zapisywane per randka, więc zmiana liczby serc nic nie traci.
            </p>

            <button
              onClick={() => setSettingsOpen(false)}
              className="cta-close"
            >
              Gotowe
            </button>
          </div>
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

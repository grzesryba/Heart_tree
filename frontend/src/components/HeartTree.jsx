import React, { useMemo, useState, useEffect } from "react";
import { Heart, X, Sparkles, ArrowRight, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DATE_IDEAS, CATEGORIES } from "../data/dateIdeas";
import "./HeartTree.css";

/* ---------- Tree SVG (trunk + branches) ---------- */
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

    {/* soft canopy shadow */}
    <ellipse cx="500" cy="430" rx="430" ry="320" fill="url(#canopyShadow)" />

    {/* ground / shadow */}
    <ellipse cx="500" cy="1170" rx="320" ry="20" fill="url(#ground)" />

    {/* roots */}
    <path
      d="M430,1150 C460,1140 470,1120 500,1115 C530,1120 540,1140 575,1150"
      stroke="url(#bark)"
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
    />

    {/* trunk */}
    <path
      d="M500,1150
         C 480,1050 530,950 495,840
         C 478,780 520,720 500,650"
      stroke="url(#bark)"
      strokeWidth="62"
      strokeLinecap="round"
      fill="none"
    />

    {/* trunk highlight */}
    <path
      d="M488,1140 C 478,1040 520,940 488,830 C 472,775 510,715 492,655"
      stroke="#8b5a3c"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />

    {/* Main branches */}
    {/* Left big branch */}
    <path
      d="M500,760 C 420,720 320,700 220,640 C 170,610 130,560 105,500"
      stroke="url(#bark)"
      strokeWidth="34"
      strokeLinecap="round"
      fill="none"
    />
    {/* Left sub */}
    <path
      d="M300,700 C 250,660 220,600 170,560"
      stroke="url(#bark)"
      strokeWidth="20"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M220,640 C 200,580 180,520 200,440"
      stroke="url(#bark)"
      strokeWidth="18"
      strokeLinecap="round"
      fill="none"
    />

    {/* Right big branch */}
    <path
      d="M500,760 C 580,720 680,700 780,640 C 830,610 870,560 895,500"
      stroke="url(#bark)"
      strokeWidth="34"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right sub */}
    <path
      d="M700,700 C 750,660 780,600 830,560"
      stroke="url(#bark)"
      strokeWidth="20"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M780,640 C 800,580 820,520 800,440"
      stroke="url(#bark)"
      strokeWidth="18"
      strokeLinecap="round"
      fill="none"
    />

    {/* Center upper branches */}
    <path
      d="M500,700 C 470,620 460,540 440,460 C 425,400 430,340 460,290"
      stroke="url(#bark)"
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M500,700 C 530,620 540,540 560,460 C 575,400 570,340 540,290"
      stroke="url(#bark)"
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M500,700 C 500,600 505,500 500,380 C 498,330 500,280 500,240"
      stroke="url(#bark)"
      strokeWidth="20"
      strokeLinecap="round"
      fill="none"
    />

    {/* Small twigs */}
    <path d="M460,460 C 410,440 380,400 360,360" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
    <path d="M540,460 C 590,440 620,400 640,360" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
    <path d="M440,360 C 400,330 380,290 390,250" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M560,360 C 600,330 620,290 610,250" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />

    {/* Swing ropes hanging from right branch */}
    <line x1="650" y1="700" x2="640" y2="900" stroke="#6b4a30" strokeWidth="2" />
    <line x1="730" y1="700" x2="740" y2="900" stroke="#6b4a30" strokeWidth="2" />
    {/* Swing seat */}
    <g className="swing" style={{ transformOrigin: "690px 700px" }}>
      <line x1="650" y1="700" x2="640" y2="900" stroke="#6b4a30" strokeWidth="2" />
      <line x1="730" y1="700" x2="740" y2="900" stroke="#6b4a30" strokeWidth="2" />
      <rect x="620" y="900" width="140" height="14" rx="3" fill="#7a4e34" />
      <rect x="620" y="900" width="140" height="4" rx="2" fill="#a0704d" />
      {/* photo frame on swing */}
      <rect x="640" y="820" width="100" height="78" rx="4" fill="#fff8ef" stroke="#4a2f23" strokeWidth="2" />
      <text
        x="690"
        y="868"
        textAnchor="middle"
        fill="#a0704d"
        fontFamily="Caveat, cursive"
        fontSize="18"
      >
        Wasze zdjęcie
      </text>
      <Camera x="675" y="830" />
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

/* ---------- Heart positions (in % of container) ---------- */
/* Distributed in canopy clusters along branches. */
const HEART_POSITIONS = (() => {
  const positions = [];
  // Cluster definition: each cluster has center + spread + count
  const clusters = [
    // Top center crown
    { cx: 50, cy: 16, rx: 9, ry: 7, count: 10 },
    { cx: 44, cy: 24, rx: 9, ry: 7, count: 8 },
    { cx: 56, cy: 24, rx: 9, ry: 7, count: 8 },
    // Left big arm
    { cx: 22, cy: 32, rx: 11, ry: 9, count: 12 },
    { cx: 12, cy: 40, rx: 9, ry: 8, count: 9 },
    { cx: 30, cy: 42, rx: 8, ry: 7, count: 7 },
    // Right big arm
    { cx: 78, cy: 32, rx: 11, ry: 9, count: 12 },
    { cx: 88, cy: 40, rx: 9, ry: 8, count: 9 },
    { cx: 70, cy: 42, rx: 8, ry: 7, count: 7 },
    // Mid filler clusters
    { cx: 40, cy: 36, rx: 7, ry: 6, count: 7 },
    { cx: 60, cy: 36, rx: 7, ry: 6, count: 7 },
    { cx: 50, cy: 44, rx: 8, ry: 5, count: 4 },
  ];

  // deterministic pseudo random
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
      const size = 22 + Math.floor(seedRand(idx * 2 + 3) * 12); // 22-34px
      const rot = (seedRand(idx * 2 + 4) - 0.5) * 50; // -25..25 deg
      positions.push({ x, y, size, rot });
      idx++;
    }
  });
  return positions.slice(0, 100);
})();

/* ---------- Heart SVG ---------- */
const HeartIcon = ({ color, size = 24, rotate = 0 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    <defs>
      <linearGradient id={`g-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="1" />
        <stop offset="100%" stopColor={color} stopOpacity="0.78" />
      </linearGradient>
    </defs>
    <path
      d="M12 21s-7.5-4.6-9.6-9.2C.9 7.9 3.4 4 7.2 4c2 0 3.5 1 4.8 2.6C13.3 5 14.8 4 16.8 4c3.8 0 6.3 3.9 4.8 7.8C19.5 16.4 12 21 12 21z"
      fill={`url(#g-${color.replace("#", "")})`}
      stroke="rgba(80,30,10,0.35)"
      strokeWidth="0.6"
    />
    {/* shine */}
    <path
      d="M8 8.5c0.8-1.4 2.2-1.9 3.2-1.2"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="0.9"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/* ---------- Petals floating in the background ---------- */
const Petals = () => {
  const petals = Array.from({ length: 14 });
  return (
    <>
      {petals.map((_, i) => {
        const left = (i * 7 + 5) % 100;
        const dur = 14 + (i % 6) * 2;
        const delay = -((i * 1.7) % 12);
        const colors = ["#f4a89a", "#e8a09a", "#f4b89a", "#e89aa9", "#ffd1c1"];
        return (
          <span
            key={i}
            className="petal"
            style={{
              left: `${left}%`,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              background: colors[i % colors.length],
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

/* ---------- Main Component ---------- */
const HeartTree = () => {
  const [active, setActive] = useState(null); // active idea
  const [scratched, setScratched] = useState(() => {
    try {
      const raw = localStorage.getItem("scratched_dates");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    localStorage.setItem("scratched_dates", JSON.stringify(scratched));
  }, [scratched]);

  // Map each heart slot to a date idea
  const placedHearts = useMemo(() => {
    return HEART_POSITIONS.map((pos, i) => {
      const idea = DATE_IDEAS[i % DATE_IDEAS.length];
      return { ...pos, idea };
    });
  }, []);

  const handleHeartClick = (idea) => {
    setActive(idea);
    if (!scratched.includes(idea.id)) {
      setScratched((prev) => [...prev, idea.id]);
    }
  };

  const resetScratches = () => setScratched([]);

  const progressPercent = Math.round((scratched.length / 100) * 100);

  return (
    <div className="tree-page relative">
      <Petals />

      {/* ----- Top bar ----- */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#c44141]" fill="#c44141" />
          <span className="serif text-2xl font-semibold tracking-tight text-[#4a2f23]">
            Drzewko Randek
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-[#4a2f23]/80">
          <a href="#tree" className="hover:text-[#c44141] transition-colors">Drzewko</a>
          <a href="#how" className="hover:text-[#c44141] transition-colors">Jak to działa</a>
          <a href="#cats" className="hover:text-[#c44141] transition-colors">Kategorie</a>
        </nav>
        <button className="cta-btn text-sm hidden sm:inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Wylosuj randkę
        </button>
      </header>

      {/* ----- Hero ----- */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-6 pb-2 text-center">
        <span className="handwritten text-3xl text-[#c44141]">dla Was dwojga</span>
        <h1 className="serif text-5xl md:text-7xl font-semibold leading-[1.05] mt-2 text-[#3a2418]">
          Drzewko ze <span className="italic">100 sekretnymi</span>
          <br />
          randkami pod sercami
        </h1>
        <p className="mt-5 text-[#4a2f23]/80 max-w-2xl mx-auto text-lg leading-relaxed">
          Każde serce-listek to inny pomysł na wspólny czas.
          Wybierzcie, kliknijcie, odkryjcie randkę — i ruszajcie razem.
          Bez planowania. Bez „może kiedyś".
        </p>

        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => {
              const idea = DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)];
              handleHeartClick(idea);
            }}
            className="cta-btn inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Wylosuj sekretną randkę
          </button>
          <a href="#tree" className="text-[#4a2f23] underline-offset-4 hover:underline text-sm">
            albo przewiń do drzewka ↓
          </a>
        </div>

        {/* Progress */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1.5 text-sm text-[#4a2f23]/80">
            <span>Odkryte randki</span>
            <span className="handwritten text-lg text-[#c44141]">{scratched.length} / 100</span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          {scratched.length > 0 && (
            <button
              onClick={resetScratches}
              className="mt-2 text-xs text-[#4a2f23]/60 hover:text-[#c44141]"
            >
              Zacznij od nowa
            </button>
          )}
        </div>
      </section>

      {/* ----- Categories pills ----- */}
      <section id="cats" className="relative z-10 max-w-5xl mx-auto px-6 pt-10">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`cat-pill ${filter === null ? "active" : ""}`}
          >
            <span className="cat-dot" style={{ background: "#4a2f23" }} />
            Wszystkie
          </button>
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? null : key)}
              className={`cat-pill ${filter === key ? "active" : ""}`}
              title={c.desc}
            >
              <span className="cat-dot" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* ----- The tree ----- */}
      <section id="tree" className="relative z-10 max-w-6xl mx-auto px-2 sm:px-6 mt-10 pb-24">
        <div
          className="relative mx-auto"
          style={{
            aspectRatio: "1000 / 1200",
            maxWidth: "1000px",
            width: "100%",
          }}
        >
          {/* The tree drawing */}
          <TreeSVG />

          {/* Hearts overlay */}
          {placedHearts.map((h, i) => {
            const cat = CATEGORIES[h.idea.category];
            const isScratched = scratched.includes(h.idea.id);
            const dimmed = filter && filter !== h.idea.category;
            return (
              <div
                key={i}
                className="heart-wrap absolute"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: dimmed ? 0.18 : 1,
                  transition: "opacity 300ms ease",
                }}
              >
                <button
                  onClick={() => handleHeartClick(h.idea)}
                  aria-label={`Odkryj randkę: ${h.idea.title}`}
                  className={`heart-leaf ${isScratched ? "scratched" : ""}`}
                  style={{ background: "transparent", border: "none", padding: 0 }}
                >
                  <HeartIcon
                    color={cat.color}
                    size={h.size}
                    rotate={h.rot}
                  />
                </button>
              </div>
            );
          })}

          {/* tagline under tree */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[2%] text-center">
            <p className="handwritten text-2xl text-[#4a2f23]/70">
              kliknij dowolne serce ↑
            </p>
          </div>
        </div>
      </section>

      {/* ----- How it works ----- */}
      <section id="how" className="relative z-10 bg-[#fff8ef]/70 backdrop-blur border-y border-[#e8c9a5]/60 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="handwritten text-3xl text-[#c44141]">prosto i intymnie</span>
            <h2 className="serif text-4xl md:text-5xl font-semibold text-[#3a2418] mt-1">
              Jak to działa?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Wybierzcie serduszko",
                desc: "Możecie kierować się kategorią albo kliknąć na chybił trafił. Każde serce to inna randka.",
              },
              {
                step: "02",
                title: "Odkryjcie randkę",
                desc: "Po kliknięciu zobaczycie pomysł na wspólny czas — od kameralnych wieczorów po szalone wyzwania.",
              },
              {
                step: "03",
                title: "Przeżyjcie to razem",
                desc: "I wracajcie po kolejne serce, kiedy tylko chcecie. Drzewko zapamięta Wasze wybory.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white/80 rounded-2xl p-7 border border-[#e8c9a5]/60 shadow-[0_8px_24px_-12px_rgba(80,30,10,0.25)]"
              >
                <div className="handwritten text-5xl text-[#c44141]/80 leading-none">
                  {s.step}
                </div>
                <h3 className="serif text-2xl font-semibold mt-3 text-[#3a2418]">{s.title}</h3>
                <p className="mt-2 text-[#4a2f23]/80 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Categories grid ----- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="handwritten text-3xl text-[#c44141]">8 kategorii</span>
          <h2 className="serif text-4xl md:text-5xl font-semibold text-[#3a2418] mt-1">
            Każde serce ma swój nastrój
          </h2>
          <p className="text-[#4a2f23]/75 mt-3 max-w-2xl mx-auto">
            Dzięki kategoriom unikniecie nietrafionych zdrapek — każda randka jest dopasowana do pogody, nastroju i portfela.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Object.entries(CATEGORIES).map(([key, c]) => {
            const count = DATE_IDEAS.filter((d) => d.category === key).length;
            return (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  document.getElementById("tree")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-left bg-white/80 hover:bg-white rounded-2xl p-5 border border-[#e8c9a5]/60 shadow-[0_8px_24px_-16px_rgba(80,30,10,0.25)] hover:shadow-[0_12px_28px_-12px_rgba(80,30,10,0.3)] transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center"
                    style={{ background: c.color }}
                  >
                    <Heart className="w-4 h-4 text-white" fill="white" />
                  </span>
                  <div>
                    <h3 className="serif text-xl font-semibold text-[#3a2418]">{c.label}</h3>
                    <p className="text-xs text-[#4a2f23]/60">{count} pomysłów</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#4a2f23]/75">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ----- Footer ----- */}
      <footer className="relative z-10 border-t border-[#e8c9a5]/60 bg-[#fff8ef]/60 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#4a2f23]/70">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#c44141]" fill="#c44141" />
            <span className="serif text-lg">Drzewko Randek</span>
          </div>
          <p className="handwritten text-xl text-[#4a2f23]/70">
            najlepsze chwile jeszcze przed Wami
          </p>
        </div>
      </footer>

      {/* ----- Idea modal ----- */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="idea-card max-w-md p-0 overflow-hidden border-0">
          {active && (
            <div className="relative">
              {/* top decoration */}
              <div
                className="h-28 flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(180deg, ${CATEGORIES[active.category].color}22 0%, transparent 100%)`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: CATEGORIES[active.category].color }}
                >
                  <Heart className="w-10 h-10 text-white" fill="white" />
                </div>
              </div>

              <div className="px-7 pb-7 pt-2 text-center">
                <span
                  className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-3"
                  style={{
                    background: `${CATEGORIES[active.category].color}1f`,
                    color: CATEGORIES[active.category].color,
                  }}
                >
                  {CATEGORIES[active.category].label}
                </span>
                <DialogHeader>
                  <DialogTitle className="serif text-3xl font-semibold text-[#3a2418] text-center">
                    {active.title}
                  </DialogTitle>
                  <DialogDescription className="text-[#4a2f23]/80 text-base leading-relaxed mt-2 text-center">
                    {active.desc}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    className="w-full bg-[#c44141] hover:bg-[#a83838] text-white rounded-full py-6 text-base"
                    onClick={() => {
                      // Placeholder for future page navigation
                      // eg: navigate(`/randka/${active.id}`)
                      alert(`Tutaj przekierowanie do strony randki #${active.id} (do zaimplementowania)`);
                    }}
                  >
                    Otwórz pełną randkę
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <button
                    onClick={() => setActive(null)}
                    className="text-sm text-[#4a2f23]/60 hover:text-[#c44141] py-2"
                  >
                    Wróć do drzewka
                  </button>
                </div>

                <p className="handwritten text-lg text-[#4a2f23]/55 mt-4">
                  randka #{active.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeartTree;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Heart, Plus, Pencil, Trash2, Save, X, Search, ArrowLeft, Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES } from "../data/dateIdeas";
import "./HeartTree.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyDraft = { id: null, title: "", description: "", categories: [] };

const AdminPage = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(null);   // null | { id, title, description, categories }
  const [error, setError] = useState(null);

  const fetchIdeas = async () => {
    try {
      const { data } = await axios.get(`${API}/ideas`);
      setIdeas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIdeas(); }, []);

  const openNew = () => setDraft({ ...emptyDraft });
  const openEdit = (idea) => setDraft({ ...idea });
  const closeDraft = () => { setDraft(null); setError(null); };

  const toggleCat = (key) => {
    if (!draft) return;
    setDraft((d) => {
      const has = d.categories.includes(key);
      return { ...d, categories: has ? d.categories.filter((c) => c !== key) : [...d.categories, key] };
    });
  };

  const save = async () => {
    if (!draft) return;
    setError(null);
    if (!draft.title.trim()) { setError("Tytuł jest wymagany"); return; }
    if (draft.categories.length === 0) { setError("Wybierz przynajmniej jedną kategorię"); return; }
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        categories: draft.categories,
      };
      if (draft.id) {
        await axios.patch(`${API}/ideas/${draft.id}`, payload);
      } else {
        await axios.post(`${API}/ideas`, payload);
      }
      await fetchIdeas();
      closeDraft();
    } catch (e) {
      setError(e.response?.data?.detail || "Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (idea) => {
    if (!window.confirm(`Usunąć randkę „${idea.title}"? Wraz ze stanem i zdjęciami.`)) return;
    try {
      await axios.delete(`${API}/ideas/${idea.id}`);
      await fetchIdeas();
    } catch (e) {
      alert("Nie udało się usunąć: " + (e.response?.data?.detail || e.message));
    }
  };

  const filtered = ideas.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.categories.some((c) => CATEGORIES[c]?.label.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link to="/" className="admin-back">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Powrót do drzewka</span>
          </Link>
          <div className="admin-title">
            <Heart className="w-5 h-5 text-[#c44141]" fill="#c44141" />
            <h1 className="serif">Panel randek</h1>
          </div>
          <button onClick={openNew} className="admin-add-btn">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Dodaj randkę</span>
          </button>
        </div>
      </header>

      <main className="admin-main">
        {/* Search */}
        <div className="admin-search">
          <Search className="w-4 h-4 text-[#4a2f23]/60" />
          <input
            type="text"
            placeholder="Szukaj po tytule, opisie, kategorii…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="admin-search-count">
            {filtered.length} / {ideas.length}
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-[#c44141]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <p>Brak wyników.</p>
            {ideas.length === 0 && (
              <button onClick={openNew} className="cta-close" style={{ width: "auto", padding: "10px 24px", marginTop: 12 }}>
                Dodaj pierwszą randkę
              </button>
            )}
          </div>
        ) : (
          <ul className="admin-list">
            {filtered.map((idea) => (
              <li key={idea.id} className="admin-row">
                <div className="admin-row-id">#{idea.id}</div>
                <div className="admin-row-main">
                  <h3 className="serif admin-row-title">{idea.title}</h3>
                  <p className="admin-row-desc">{idea.description}</p>
                  <div className="admin-row-cats">
                    {idea.categories.map((k) => {
                      const c = CATEGORIES[k];
                      if (!c) return null;
                      return (
                        <span key={k} className="cat-tag" style={{ background: `${c.color}24`, color: c.color }}>
                          {c.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => openEdit(idea)} className="admin-icon-btn" aria-label="Edytuj">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(idea)} className="admin-icon-btn danger" aria-label="Usuń">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Draft modal */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && closeDraft()}>
        <DialogContent className="idea-card modal-responsive border-0">
          {draft && (
            <div className="modal-body" style={{ padding: "22px 22px 22px" }}>
              <DialogTitle className="serif modal-title text-center">
                {draft.id ? `Edytuj randkę #${draft.id}` : "Nowa randka"}
              </DialogTitle>

              <div className="admin-field">
                <label>Tytuł</label>
                <input
                  type="text"
                  value={draft.title}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="np. Wieczór przy świecach"
                />
              </div>

              <div className="admin-field">
                <label>Opis</label>
                <textarea
                  value={draft.description}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Krótki opis tej randki…"
                />
              </div>

              <div className="admin-field">
                <label>Kategorie ({draft.categories.length})</label>
                <div className="admin-cat-grid">
                  {Object.entries(CATEGORIES).map(([key, c]) => {
                    const on = draft.categories.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCat(key)}
                        className={`admin-cat-chip ${on ? "on" : ""}`}
                        style={on ? { background: c.color, borderColor: c.color, color: "white" } : {}}
                      >
                        <span className="legend-dot" style={{ background: c.color, boxShadow: "0 0 0 2px white" }} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p className="admin-error">{error}</p>}

              <div className="admin-modal-actions">
                <button onClick={closeDraft} className="admin-btn-secondary">
                  <X className="w-4 h-4" />
                  Anuluj
                </button>
                <button onClick={save} disabled={saving} className="admin-btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Zapisz
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;

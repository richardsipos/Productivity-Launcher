import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  Gauge,
  CheckSquare,
  NotebookPen,
  FolderKanban,
  ListTodo,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Paintbrush,
} from "lucide-react";
import { motion } from "framer-motion";

// ---------- Types ----------
type Tile = {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon: keyof typeof ICONS;
  color: string; // tailwind gradient e.g. "from-indigo-500 to-blue-500"
  tags?: string[];
};

type ThemeName = "light" | "dark" | "grafit" | "surprise";

// ---------- Icon registry ----------
const ICONS = {
  CalendarClock,
  Gauge,
  CheckSquare,
  NotebookPen,
  FolderKanban,
  ListTodo,
} as const;

// ---------- Defaults ----------
const DEFAULT_TILES: Tile[] = [
  {
    id: "calendar",
    title: "Calendar App",
    subtitle: "Plan & collaborate",
    url: "https://richardsipos.github.io/Calendar-App/",
    icon: "CalendarClock",
    color: "from-indigo-500 to-blue-500",
    tags: ["work", "planning"],
  },
  {
    id: "dashboard",
    title: "Daily Dashboard",
    subtitle: "Track your day",
    url: "https://example.com/dashboard",
    icon: "Gauge",
    color: "from-emerald-500 to-teal-500",
    tags: ["habits", "health"],
  },
  {
    id: "todo",
    title: "Todo HQ",
    subtitle: "Capture & do",
    url: "https://richardsipos.github.io/Tick-And-Top",
    icon: "CheckSquare",
    color: "from-amber-500 to-orange-500",
    tags: ["tasks"],
  },
];

const QUOTES = [
  "Little steps compound into big wins.",
  "Plan the day, then own it.",
  "Momentum beats motivation.",
  "Do the next right thing.",
  "Focus. Finish. Feel good.",
  "What gets scheduled gets done.",
];

// ---------- Theming ----------
interface ThemeTokens {
  bg: string;
  fg: string;
  card: string;
  muted: string;
  accent: string;
  ring: string;
}

const SURPRISE_PALETTES: Record<string, ThemeTokens> = {
  ocean: {
    bg: "#0b1220",
    fg: "#e7f5ff",
    card: "#0f1a2b",
    muted: "#8fb7e1",
    accent: "#3ba3ff",
    ring: "#79b8ff",
  },
  forest: {
    bg: "#0f1512",
    fg: "#e8ffef",
    card: "#112019",
    muted: "#86c19b",
    accent: "#2fd477",
    ring: "#7ce9a6",
  },
  sunset: {
    bg: "#1b1312",
    fg: "#fff0e6",
    card: "#221817",
    muted: "#ffb199",
    accent: "#ff7a59",
    ring: "#ffbfa8",
  },
};

const THEMES: Record<Exclude<ThemeName, "surprise">, ThemeTokens> = {
  light: {
    bg: "#f7f7fb",
    fg: "#0f1222",
    card: "#ffffff",
    muted: "#6b7280",
    accent: "#6366f1",
    ring: "#a5b4fc",
  },
  dark: {
    bg: "#0c0f16",
    fg: "#e5e7eb",
    card: "#111827",
    muted: "#9ca3af",
    accent: "#22d3ee",
    ring: "#67e8f9",
  },
  grafit: {
    bg: "#0e0e10",
    fg: "#e8e8ea",
    card: "#151518",
    muted: "#9a9aa2",
    accent: "#c0c0c8",
    ring: "#d6d6de",
  },
};

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  const savedSurprise = localStorage.getItem("launcher.surpriseName");
  let tokens: ThemeTokens;
  if (theme === "surprise") {
    const names = Object.keys(SURPRISE_PALETTES);
    const pick =
      savedSurprise && SURPRISE_PALETTES[savedSurprise]
        ? savedSurprise
        : names[Math.floor(Math.random() * names.length)];
    localStorage.setItem("launcher.surpriseName", pick);
    tokens = SURPRISE_PALETTES[pick];
  } else {
    tokens = THEMES[theme];
  }
  root.style.setProperty("--bg", tokens.bg);
  root.style.setProperty("--fg", tokens.fg);
  root.style.setProperty("--card", tokens.card);
  root.style.setProperty("--muted", tokens.muted);
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--ring", tokens.ring);
}

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

// ---------- Helpers ----------
function dayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function openTile(url: string, newTab: boolean) {
  if (newTab) window.open(url, "_blank", "noopener,noreferrer");
  else window.location.href = url;
}

// ---------- Component ----------
export default function ProductivityLauncher() {
  const [theme, setTheme] = usePersistentState<ThemeName>(
    "launcher.theme",
    "dark"
  );
  const [tiles, setTiles] = usePersistentState<Tile[]>(
    "launcher.tiles",
    DEFAULT_TILES
  );
  const [query, setQuery] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<Tile | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "t") {
        setTheme((prev) =>
          prev === "light" ? "dark" : prev === "dark" ? "grafit" : prev === "grafit" ? "surprise" : "light"
        );
      } else if (e.key === "?") {
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return tiles;
    const q = query.toLowerCase();
    return tiles.filter((t) =>
      [t.title, t.subtitle, ...(t.tags || [])]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q))
    );
  }, [tiles, query]);

  const today = useMemo(() => new Date(), []);
  const dateStr = today.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const quote = useMemo(() => {
    const idx = Math.abs(hash(dayKey())) % QUOTES.length;
    return QUOTES[idx];
  }, []);

  return (
    <div className="min-h-screen" style={{
      background: "var(--bg)",
      color: "var(--fg)",
    }}>
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {greeting()} — {dateStr}
            </h1>
            <p className="text-sm md:text-base mt-1 opacity-80">
              {quote}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--ring)]/30 px-3 py-2 text-sm hover:bg-[var(--card)]/60"
              onClick={() => setManageOpen(true)}
              aria-label="Manage tiles"
            >
              <SettingsIcon className="h-4 w-4" /> Manage Tiles
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--ring)]/30 px-3 py-2 text-sm hover:bg-[var(--card)]/60"
              onClick={() => setHelpOpen(true)}
              aria-label="Keyboard & help"
            >
              <HelpCircle className="h-4 w-4" /> Help
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="mt-6">
          <div
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[var(--card)]/60 px-4 py-3 shadow-lg ring-1 ring-[var(--ring)]/10 backdrop-blur-md"
          >
            <SearchIcon className="h-5 w-5 opacity-70" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps by name or tag… ( / to focus )"
              className="w-full bg-transparent outline-none placeholder:opacity-60"
              aria-label="Search apps"
            />
          </div>
        </div>

        {/* Grid */}
        <main className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
          {filtered.length === 0 && (
            <p className="opacity-70">No tiles match “{query}”. Try another keyword or add a tile.</p>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm opacity-70">
          <div>
            Shortcut keys: <kbd className="kbd">/</kbd> focus search · <kbd className="kbd">T</kbd> toggle theme · <kbd className="kbd">?</kbd> help
          </div>
          <div>Launcher v1.0 • Theme: {theme}</div>
        </footer>
      </div>

      {manageOpen && (
        <ManageTilesModal
          tiles={tiles}
          onClose={() => {
            setEditing(null);
            setManageOpen(false);
          }}
          onSave={(next) => setTiles(next)}
          onEdit={(t) => setEditing(t)}
        />
      )}

      {editing && (
        <EditTileModal
          tile={editing}
          onCancel={() => setEditing(null)}
          onSave={(updated) => {
            setTiles((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditing(null);
          }}
        />
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* Global styles */}
      <style>{globalStyles}</style>
    </div>
  );
}

// ---------- Components ----------
function TileCard({ tile }: { tile: Tile }) {
  const Icon = ICONS[tile.icon] ?? ListTodo;
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    const newTab = ("metaKey" in e && e.metaKey) || ("ctrlKey" in e && e.ctrlKey) || ("button" in e && e.button === 1);
    openTile(tile.url, newTab);
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => handleClick(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleClick(e);
      }}
      role="link"
      aria-label={`${tile.title} — ${tile.subtitle ?? "Open app"}`}
      className={`group relative w-full rounded-2xl border border-white/5 bg-[var(--card)]/70 p-5 text-left shadow-lg ring-1 ring-[var(--ring)]/10 backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
    >
      {/* Accent gradient */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${tile.color} opacity-0 transition-opacity duration-300 group-hover:opacity-20`} />

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="rounded-xl p-2 ring-1 ring-[var(--ring)]/20 bg-black/10">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            {tile.title}
            <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
          </h2>
          {tile.subtitle && (
            <p className="mt-1 text-sm opacity-80">{tile.subtitle}</p>
          )}
          {tile.tags && tile.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tile.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-black/10 px-2 py-0.5 text-xs opacity-80">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function ManageTilesModal({
  tiles,
  onSave,
  onEdit,
  onClose,
}: {
  tiles: Tile[];
  onSave: (tiles: Tile[]) => void;
  onEdit: (tile: Tile) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Tile[]>(tiles);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [icon, setIcon] = useState<keyof typeof ICONS>("ListTodo");
  const [color, setColor] = useState("from-sky-500 to-cyan-500");
  const [tags, setTags] = useState("");

  const addTile = () => {
    const id = slugify(title || "tile-") + "-" + Math.random().toString(36).slice(2, 6);
    const t: Tile = {
      id,
      title: title || "Untitled",
      subtitle: subtitle || undefined,
      url: url || "https://example.com",
      icon,
      color,
      tags: tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    setLocal((prev) => [t, ...prev]);
    setTitle("");
    setUrl("");
    setSubtitle("");
    setTags("");
  };

  const remove = (id: string) => setLocal((prev) => prev.filter((t) => t.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    setLocal((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <Modal onClose={onClose} title="Manage Tiles">
      {/* Add form */}
      <div className="rounded-xl border border-white/10 bg-[var(--card)]/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <LabeledInput label="Title" value={title} onChange={setTitle} placeholder="e.g., Team Calendar" />
          <LabeledInput label="Subtitle" value={subtitle} onChange={setSubtitle} placeholder="Short description" />
          <LabeledInput label="URL" value={url} onChange={setUrl} placeholder="https://your-app.com" type="url" />
          <LabeledSelect
            label="Icon"
            value={icon}
            onChange={(v) => setIcon(v as keyof typeof ICONS)}
            options={Object.keys(ICONS).map((k) => ({ value: k, label: k }))}
          />
          <LabeledSelect
            label="Accent gradient"
            value={color}
            onChange={setColor}
            options={[
              "from-indigo-500 to-blue-500",
              "from-emerald-500 to-teal-500",
              "from-amber-500 to-orange-500",
              "from-fuchsia-500 to-pink-500",
              "from-sky-500 to-cyan-500",
              "from-violet-500 to-purple-500",
              "from-rose-500 to-red-500",
            ].map((c) => ({ value: c, label: c }))}
          />
          <LabeledInput label="Tags (comma-separated)" value={tags} onChange={setTags} placeholder="work, planning" />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={addTile} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[var(--accent)] text-black font-medium">
            <Plus className="h-4 w-4" /> Add tile
          </button>
        </div>
      </div>

      {/* List */}
      <ul className="mt-5 space-y-3">
        {local.map((t, i) => (
          <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[var(--card)]/50 p-3">
            <div className="flex items-center gap-3">
              <span className={`inline-block h-6 w-6 rounded-full bg-gradient-to-br ${t.color}`} />
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs opacity-70">{t.url}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="chip" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="chip" onClick={() => move(i, +1)} aria-label="Move down">↓</button>
              <button className="chip" onClick={() => onEdit(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button className="chip" onClick={() => remove(t.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-end gap-2">
        <button className="px-4 py-2 rounded-xl border border-white/10" onClick={onClose}>Cancel</button>
        <button
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-medium"
          onClick={() => {
            onSave(local);
            onClose();
          }}
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}

function EditTileModal({ tile, onCancel, onSave }: { tile: Tile; onCancel: () => void; onSave: (t: Tile) => void }) {
  const [draft, setDraft] = useState<Tile>({ ...tile });

  return (
    <Modal onClose={onCancel} title="Edit Tile">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabeledInput label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
        <LabeledInput label="Subtitle" value={draft.subtitle || ""} onChange={(v) => setDraft({ ...draft, subtitle: v })} />
        <LabeledInput label="URL" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} />
        <LabeledSelect
          label="Icon"
          value={draft.icon}
          onChange={(v) => setDraft({ ...draft, icon: v as keyof typeof ICONS })}
          options={Object.keys(ICONS).map((k) => ({ value: k, label: k }))}
        />
        <LabeledSelect
          label="Accent gradient"
          value={draft.color}
          onChange={(v) => setDraft({ ...draft, color: v })}
          options={[
            "from-indigo-500 to-blue-500",
            "from-emerald-500 to-teal-500",
            "from-amber-500 to-orange-500",
            "from-fuchsia-500 to-pink-500",
            "from-sky-500 to-cyan-500",
            "from-violet-500 to-purple-500",
            "from-rose-500 to-red-500",
          ].map((c) => ({ value: c, label: c }))}
        />
        <LabeledInput
          label="Tags (comma-separated)"
          value={(draft.tags || []).join(", ")}
          onChange={(v) => setDraft({ ...draft, tags: v.split(",").map((x) => x.trim()).filter(Boolean) })}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="px-4 py-2 rounded-xl border border-white/10" onClick={onCancel}>Cancel</button>
        <button className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-medium" onClick={() => onSave(draft)}>
          Save
        </button>
      </div>
    </Modal>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: ThemeName; setTheme: (t: ThemeName | ((p: ThemeName) => ThemeName)) => void }) {
  const next = () => setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "grafit" : prev === "grafit" ? "surprise" : "light"));
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : theme === "grafit" ? "Grafit" : "Surprise";
  const icon = theme === "light" ? <Sparkles className="h-4 w-4" /> : theme === "dark" ? <Sparkles className="h-4 w-4" /> : theme === "grafit" ? <Paintbrush className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
  return (
    <button onClick={next} className="inline-flex items-center gap-2 rounded-xl border border-[var(--ring)]/30 px-3 py-2 text-sm hover:bg-[var(--card)]/60" aria-label="Toggle theme">
      {icon}
      Theme: {label}
    </button>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="Keyboard & Help">
      <ul className="space-y-2 text-sm">
        <li><kbd className="kbd">/</kbd> Focus search</li>
        <li><kbd className="kbd">T</kbd> Cycle theme (Light → Dark → Grafit → Surprise)</li>
        <li><kbd className="kbd">Enter</kbd> Open focused tile</li>
        <li><kbd className="kbd">Ctrl/Cmd + Enter</kbd> Open tile in new tab</li>
        <li><kbd className="kbd">?</kbd> Open this help</li>
      </ul>
      <p className="mt-4 text-sm opacity-80">Pro tip: Use tags in your tile config (e.g., <code>work, planning</code>) to make search instantly filter your tools.</p>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[var(--card)]/90 p-5 shadow-2xl ring-1 ring-[var(--ring)]/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="chip" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="opacity-80">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 outline-none ring-1 ring-transparent focus:ring-[var(--ring)]/60"
      />
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="opacity-80">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 outline-none ring-1 ring-transparent focus:ring-[var(--ring)]/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ---------- Styles ----------
const globalStyles = `
:root {
  --bg: #0c0f16;
  --fg: #e5e7eb;
  --card: #111827;
  --muted: #9ca3af;
  --accent: #22d3ee;
  --ring: #67e8f9;
}

.kbd {
  background: color-mix(in oklab, var(--fg) 10%, transparent);
  border: 1px solid color-mix(in oklab, var(--ring) 35%, transparent);
  border-radius: 0.5rem;
  padding: 0.1rem 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

/* Subtle animated backdrop */
body { background: var(--bg); }

/* Support for focus styles */
:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--ring); }

/* Utility chip button */
.chip { 
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.65rem; border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--ring) 25%, transparent);
  background: color-mix(in oklab, var(--card) 93%, transparent);
}
.chip:hover { background: color-mix(in oklab, var(--card) 80%, transparent); }
`;

// ---------- Utils ----------
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

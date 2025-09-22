# Productivity Launcher

A motivating start page that launches your productivity apps via animated, keyboard-friendly tiles.
Built with Vite + React + TypeScript + Tailwind + Framer Motion + Lucide.

## Quickstart

```bash
# 1) Install deps
npm install

# 2) Start dev server
npm run dev

# 3) Build for production
npm run build
npm run preview
```

## Customizing tiles

- Click **Manage Tiles** to add/edit/remove tiles.
- All data persists to `localStorage`.
- Hotkeys: `/` to focus search, `T` to toggle theme, `?` for help.

## Notes

- The **Surprise** theme picks a curated palette and saves it in `localStorage` (`launcher.surpriseName`).
- Open a tile in a new tab with **Ctrl/Cmd + Enter** or middle-click.

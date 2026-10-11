# NatureLens

NatureLens is an offline-first AI nature companion built for the Hacktoberfest 2026 Open-Source AI Challenge: Touch Grass. The project helps people discover outdoor activities, learn about the natural world, record observations in a local journal, and stay engaged with nature without needing a constant internet connection.

## Features

- Landing page and mission explorer with filters for time, activity type, difficulty, and environment
- Offline mission generation using a local library and graceful AI fallback behavior
- AI nature guide with safe, practical guidance and clear offline messaging
- Mission detail flow with checklists, reflection prompts, completion tracking, and streak updates
- IndexedDB-backed journal with add, edit, delete, search, and category filtering
- Dashboard with real local progress metrics and a reset-data confirmation
- Service worker and manifest for offline shell caching

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Testing

```bash
npm run test
```

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Use the default Vite project settings.
4. Deploy with the repository root as the app directory.
5. The included `vercel.json` rewrite keeps direct visits to `/missions`,
   `/guide`, `/journal`, `/dashboard`, and `/mission/:id` working.

## Hacktoberfest 2026 submission checklist

NatureLens was built for the Hacktoberfest 2026 Open-Source AI Challenge:
Touch Grass. Before submitting on DEV, verify:

- The repository is public and includes the MIT license in `LICENSE`.
- A public live demo URL is added to the DEV submission post.
- The DEV post uses the challenge's required tag and submission template.
- The post explains the local-first architecture, offline fallback behavior,
  and how judges can test the app.
- AI assistance is disclosed accurately in the DEV post.
- The submission is published before the challenge deadline shown on the
  official challenge page.

## Offline and AI notes

- NatureLens attempts to lazy-load a browser-compatible local model through Transformers.js when supported by the device.
- If the model is unavailable, the app falls back to curated, deterministic missions and guidance instead of pretending the AI generated the result.
- The app shell is cached to support offline use after the first online visit.

## Privacy

- No account is required.
- Journal entries, saved missions, and completions live in IndexedDB on the device.
- No private journal entries are uploaded without explicit user consent.

## Limitations

- Local AI inference depends on browser support, memory, and device compatibility.
- Some browsers do not support local model loading or WebGPU acceleration.
- The project is intentionally built as a client-side MVP and does not rely on a backend service.

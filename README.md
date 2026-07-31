# Nepal Tourism Blog Platform — Phase 1 Scaffold

This is the foundation scaffold for the full platform described in the spec. It is intentionally
minimal: one working model (Destination) wired end-to-end through backend, database, and frontend,
using the exact folder structure and tech stack requested, so every future module (Auth, Blogs,
Reviews, Weather, Maps, Admin, SEO) can be dropped in without refactoring.

## What's included in this phase
- Express + Mongoose backend with security middleware (Helmet, CORS, rate limiting, mongo-sanitize)
- Destination model + full CRUD API (`/api/v1/destinations`)
- Centralized error handling
- Seed script with 3 real sample destinations
- React 19 + Vite + Tailwind frontend styled in a Google/Material aesthetic
- React Query data fetching, Home page listing destinations from the live API
- Enterprise folder structure for both client and server (matches your spec)

## What's NOT built yet (next phases)
Auth (Google/Facebook OAuth, JWT, RBAC), Blogs, Categories, Reviews/Comments, Weather (Open-Meteo),
Maps (Leaflet), Admin Dashboard, SEO schemas/sitemap — these plug into this same structure.

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI (use MongoDB Atlas free tier), JWT secrets
npm install
npm run seed   # inserts 3 sample destinations
npm run dev    # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev    # starts on http://localhost:5173
```

Vite is configured to proxy `/api` requests to `http://localhost:5000`, so the frontend and backend
talk to each other with no CORS config needed in dev.

### 3. Verify
- Open http://localhost:5000/api/v1/health → should return `{ success: true, ... }`
- Open http://localhost:5173 → Home page should show 3 destination cards (Pokhara, Chitwan, Everest Base Camp)

## Getting a free MongoDB database
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Add a database user + allow access from anywhere (0.0.0.0/0) for dev
3. Copy the connection string into `MONGO_URI` in `server/.env`

## Recommended next step
Once this runs locally, tell me to build **Phase 2: Authentication (Google/Facebook OAuth + JWT + RBAC)**
and I'll add it directly on top of this structure — controllers, models, middleware, and the frontend
auth context/hooks.

## Deployment targets (for later phases)
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

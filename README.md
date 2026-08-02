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

## Phase 2 — Authentication & RBAC (added)
- `User` model (`server/src/models/User.js`) — OAuth users (google/facebook) + local staff accounts
- `passport.js` config — Google & Facebook strategies, stateless (no sessions), find-or-create by (provider, providerId)
- JWT access token (15 min) + refresh token (30 days) in **httpOnly cookies** (`server/src/utils/generateTokens.js`)
- Refresh token is hashed in the DB and **rotated on every use** (`authController.refresh`)
- RBAC middleware: `protect` (must be logged in) and `authorize(...roles)` (must have role) — see `server/src/middlewares/authMiddleware.js`
- Roles: `user` (default, OAuth), `editor`, `admin`, `superadmin`
- Destination write routes (`POST /`, `PUT/DELETE /id/:id`) are now staff-only
- Frontend: `AuthContext` + `useAuth()` hook, `ProtectedRoute` component (supports role restriction), `Login` page (Google/Facebook buttons + staff email/password form), axios interceptor that **silently refreshes expired access tokens and retries the request**

### New setup steps
1. Get OAuth credentials:
   - Google: https://console.cloud.google.com/apis/credentials → OAuth client ID → set authorized redirect URI to `http://localhost:5000/api/v1/auth/google/callback`
   - Facebook: https://developers.facebook.com/apps → add Facebook Login product → redirect URI `http://localhost:5000/api/v1/auth/facebook/callback`
2. Fill in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` in `server/.env`
3. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`, then run:
   ```bash
   npm run seed:admin
   ```
4. `npm install` again in `server/` (adds passport packages) and restart `npm run dev`
5. Visit http://localhost:5173/login
   - "Continue with Google/Facebook" → real OAuth flow → redirects back to Home, logged in
   - "Staff login" → use your seeded admin email/password → visit `/admin` to confirm RBAC blocks non-staff and allows staff

## Phase 2.1 — Security fix: OAuth accounts can no longer inherit staff roles
An earlier version of this scaffold linked OAuth logins to existing users **by email**. If your
Google/Facebook account shares an email with a seeded staff account, that meant logging in with
Google could silently attach to (and inherit the role of) that staff account — a real privilege
escalation risk. Fixed:

- OAuth users are now matched **only** by `(provider, providerId)` — never by email — and are
  always created with `role: "user"`. There is no path from OAuth login to an elevated role.
- Local (staff) and OAuth accounts are intentionally allowed to share the same email address as
  two completely separate documents — email uniqueness is now scoped **per provider**
  (`{ provider, email }` unique index) instead of globally unique.
- The stored user is intentionally minimal — this is standard practice for OAuth: you always
  persist a user record (id, name, email, avatar, role) so future features like comments/reviews
  can reference a stable user id. You never receive or store the person's Google/Facebook password.
- Public OAuth users have no dashboard — after login they land back on the Home page. This account
  currently exists only so a future phase (Reviews/Comments on destinations and blogs) has a real
  user to attach content to; there's nothing else for a plain "user" role to do yet.

### ⚠️ Required one-time DB cleanup
If you tested login before this fix, your seeded admin's `provider` field was likely overwritten
from `"local"` to `"google"`, which breaks staff email/password login. Easiest fix — wipe and reseed:

```bash
# In MongoDB Atlas → Collections, or via mongosh connected to your MONGO_URI:
db.users.deleteMany({})
```
```bash
# Then, from server/:
npm run seed:admin
```

If you'd rather not delete data, you can instead manually edit that one document in Atlas and set
`provider` back to `"local"` and remove the `providerId` field.

## What's NOT built yet (next phases)
Blogs, Categories, Reviews/Comments, Weather (Open-Meteo), Maps (Leaflet), full Admin CRUD panels,
SEO schemas/sitemap, production security hardening (CSRF, etc.) — these plug into this same structure.

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
Once Phase 2 is verified locally, tell me to build **Phase 3: Blog System + Categories (full CRUD)**
and I'll add it directly on top of this structure, reusing the same auth/RBAC layer.

## Deployment targets (for later phases)
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas
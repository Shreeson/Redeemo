# 🎟️ Redeemo

A full-stack gamified rewards app — complete quests to earn tickets, then redeem them for gift cards, in-game currency, or charity donations.

This is a rebuild of an earlier static prototype. The first version stored coin balances in the browser's `localStorage`, which meant anyone could open devtools and grant themselves unlimited rewards. This version fixes that: **all balances, cooldowns, and redemption logic are enforced server-side**, backed by a real database.

## Why this project exists

To demonstrate a complete request lifecycle end to end:

- Password hashing (bcrypt) and JWT-based session auth
- A relational schema (users, quests, quest completions, rewards, redemptions, feedback)
- Authenticated REST API routes with proper status codes (401, 404, 409, 429)
- Server-side business rules that can't be bypassed from the client (ticket balances, per-quest cooldowns, insufficient-balance checks)
- A frontend that only ever *displays* state it fetched from the API — it never mutates its own coin count

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| Auth | bcryptjs + jsonwebtoken |
| Frontend | Vanilla HTML/CSS/JS (fetch-based API client) |

No framework build step — clone it and it runs.

## Project structure

```
redeemo-v2/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js               # SQLite schema + seed data
│   ├── middleware/auth.js  # JWT verification middleware
│   └── routes/
│       ├── auth.js         # signup, login, /me
│       ├── quests.js       # list quests, complete a quest
│       ├── rewards.js      # list rewards, redeem, history
│       └── feedback.js     # submit feedback
└── frontend/
    ├── index.html           # login
    ├── signup.html
    ├── dashboard.html       # ticket balance + redemption history
    ├── earn.html            # quest board
    ├── redeem.html          # reward catalog
    ├── about.html
    ├── feedback.html
    ├── css/style.css
    └── js/api.js            # fetch wrapper + auth/session handling
```

## Running it locally

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # then edit JWT_SECRET to any long random string
npm start
```
The API runs on `http://localhost:3001`.

**Frontend**

The frontend is static — no build step. Just open `frontend/index.html` in a browser,
or serve it with any static file server, e.g.:
```bash
cd frontend
npx serve .
```

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create an account |
| POST | `/api/auth/login` | — | Log in, returns a JWT |
| GET | `/api/auth/me` | ✅ | Current user + coin balance |
| GET | `/api/quests` | ✅ | List quests with per-user availability |
| POST | `/api/quests/:id/complete` | ✅ | Complete a quest (cooldown enforced) |
| GET | `/api/rewards` | ✅ | List redeemable rewards |
| POST | `/api/rewards/:id/redeem` | ✅ | Redeem a reward (balance checked) |
| GET | `/api/rewards/history` | ✅ | Past redemptions |
| POST | `/api/feedback` | ✅ | Submit feedback |

## Deploying

- **Backend:** [Render](https://render.com) free tier works well for an Express + SQLite app like this — just set `JWT_SECRET` as an environment variable there.
- **Frontend:** GitHub Pages, Netlify, or Vercel. Set `window.REDEEMO_API_BASE` (see `frontend/js/api.js`) to your deployed backend's URL before deploying.

## Known limitations

This is a portfolio project, not a production system:
- SQLite is fine for a demo but isn't built for concurrent writes at scale — a real deployment would use Postgres.
- No email verification or password reset flow.
- No rate limiting on the API (would add `express-rate-limit` for a production version).
- Clarify that the project is a portfolio example and not production-ready.
## License

MIT

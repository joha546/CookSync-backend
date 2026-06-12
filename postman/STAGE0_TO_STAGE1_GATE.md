# Stage 0 → Stage 1 Gate (CookSync)

Use this after importing:

- `postman/CookSync-API.postman_collection.json`
- `postman/CookSync-Local.postman_environment.json`

## Before you start

```bash
npm run dev
```

1. Set `baseUrl` in the environment (`http://localhost:5000` unless your `.env` `PORT` differs).
2. Set `adminEmail` to match `ADMIN_EMAIL` in `.env`.
3. Use real inboxes for `userEmail`, `chefEmail`, and `adminEmail` (or the same inbox with different accounts if you only have one).

---

## Part A — Automated gate (Postman)

Run folder **00 Stage 0 Gate (run in order)** with the Collection Runner.

| Step | Request | Pass criteria |
|------|---------|---------------|
| G1 | Health check | `200`, `"API is running."` |
| G2 | Send OTP | `200` — copy OTP from email into `{{otp}}` |
| G3 | Verify OTP | `200`, `jwt` auto-saved |
| G4 | Add comment | `200` `"Comment added."` (not 500) — needs `{{recipeId}}` set first |
| G5 | Sort by likes | `200`, array returned |
| G6 | Invalid JSON create | `400` with `ingredients` in error (chef JWT required) |

**Tip:** Before G4, run **03 Recipes → List recipes** or **Create recipe** so `{{recipeId}}` is set.

Also run:

```bash
npm test
```

All **34 tests** should pass.

---

## Part B — Manual REST flows (correctness bugs we fixed)

### B1 — Admin approve chef (Notification import)

1. Login as normal user → `POST /api/users/request-chef`
2. Login as admin (`adminEmail` OTP) → `PATCH /api/users/admin/approve-chef/{{userId}}`
3. **Pass:** `200` `"Chef approved successfully"` — not 500
4. Chef user: `GET /api/notifications` — approval notification present

### B2 — Comment stores real userId

1. Login as user → `POST /api/recipes/{{recipeId}}/comment` with `{ "text": "test" }`
2. **Pass:** `200`
3. In MongoDB Atlas (or Compass): open recipe → last comment has valid `userId` (not `null`/missing)

### B3 — OTP email actually sends

1. `POST /api/auth/send-otp` with your email
2. **Pass:** email arrives within ~30s (check spam)
3. If no email: verify `.env` has `EMAIL_USER`/`EMAIL_PASS` or legacy `MAIL_USER`/`MAIL_PASS`

### B4 — Sort by likes is real

1. Like the same recipe from 2 different users
2. `GET /api/recipes?sortBy=likes&limit=5`
3. **Pass:** recipe with more likes appears before recipes with fewer

### B5 — Create recipe validation

1. As chef, `POST /api/recipes` with `ingredients: not-json`
2. **Pass:** `400` with clear message — not `500`

---

## Part C — Socket.IO (Postman Socket.IO tab)

Postman **does not** use the `[Doc]` REST items for sockets — those are instructions. Create a **Socket.IO** request:

| Setting | Value |
|---------|-------|
| URL | `{{baseUrl}}` |
| Header | `Authorization: Bearer {{jwt}}` |

### C1 — Connect

- **Pass:** connects without `Authentication error`

### C2 — Join live session

1. Chef: `POST /api/cooking/{{recipeId}}/start-session`
2. User socket: emit `join-recipe` → payload `{{recipeId}}`
3. **Pass:** receive `room-users` array; no `Session is not active` if session started

### C3 — Cooking step (chef)

1. Connect with `{{chefJwt}}`
2. Emit `cooking-step`:

```json
{ "recipeId": "<recipeId>", "step": "Preheat oven to 180C" }
```

3. Second client (user JWT) in same room listens for `step-update`
4. **Pass:** exactly **one** event with `{ "step", "by", "at" }`

### C4 — Postman fallback (`message` event)

Emit `message`:

```json
{
  "event": "cooking-step",
  "data": { "recipeId": "<recipeId>", "step": "Via fallback" }
}
```

**Pass:** same `step-update` as C3 — no server crash

### C5 — Chat with @mention

Emit `chat-message`:

```json
{ "recipeId": "<recipeId>", "message": "Hey @someone" }
```

**Pass:** no disconnect / error; chat saved (`GET /api/chat/{{recipeId}}`)

---

## You are ready for Stage 1 when ALL are true

### Stage 0 complete (functionality)

- [ ] `npm test` — 34/34 green
- [ ] Collection Runner **00 Stage 0 Gate** — all tests green
- [ ] B1–B5 manual REST checks pass
- [ ] C1–C5 socket checks pass (at least C1–C3)
- [ ] No `500` on happy paths you exercised
- [ ] OTP email received in real inbox

### Stage 1 not started yet (intentionally missing)

You should **not** have these yet — that is correct:

- Sentry / structured logging (pino)
- Rate limiting on `/send-otp`
- `helmet`, locked-down CORS
- DB indexes documented
- Daily backups / separate DB host

---

## What to build in Stage 1 (next sprint)

Once the gate above is green:

1. **Sentry** — know when production breaks
2. **pino** logger — replace `console.log`
3. **express-rate-limit** — protect OTP endpoints
4. **helmet** + restrict CORS origins
5. **MongoDB indexes** — `Recipe.chefId`, `OTP.email`, etc.
6. **Integration tests** — supertest hitting real routes (not only mocks)
7. **HTTPS** — via Cloudflare or reverse proxy

---

## Quick troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Server won't start | `validateEnv()` — missing `MONGO_URI`, `JWT_SECRET`, or email creds |
| Socket auth error | Missing `Authorization: Bearer` header on Socket.IO request |
| `join-recipe` → Session not active | Chef must call `start-session` first |
| `cooking-step` → Only chefs | Use `{{chefJwt}}`, not user JWT |
| OTP 200 but no email | Wrong Gmail app password or `EMAIL_*` / `MAIL_*` mismatch |
| Port mismatch | `baseUrl` must match `.env` `PORT` (5000 vs 8000) |

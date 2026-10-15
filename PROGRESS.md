# Enju build progress

Read this file first, every session. It's the single source of truth for where the build stands — don't rely on chat history to know what's done.

## Stack
- React 19 + Vite + TypeScript, Tailwind CSS, react-router-dom
- Supabase project: `enju-app` (ref `mbechxwgkvwriuainefl`, org `AmanaWeb Uganda's eco`, region eu-west-1)
- Auth: email magic link (Supabase native, free, no Twilio/SMS provider needed)
- Supabase creds are in `.env.local` (gitignored, not in this repo — if a fresh clone is missing them, pull from Supabase project settings or ask Titus)

## Done
- Supabase schema (migrations `core_schema`, `email_auth_support`, `tenant_join_flow_rls`, `payment_evidence_and_audit`, `payment_evidence_storage`): full RLS-scoped data model plus:
  - `payments.evidence_path` — tenant attaches a proof-of-payment photo, stored in a private `payment-evidence` Storage bucket (tenant can only write to their own folder; landlord/manager can only read evidence tied to a payment on one of their own units)
  - `audit_log` table — append-only, records who confirmed what payment, when
  - `confirm_payment(payment_id, confirmer)` — a `security definer` Postgres function that atomically flips a payment from pending→confirmed exactly once (loses the race safely if two people tap confirm at the same moment) and writes the audit row in the same transaction
- Email magic link login + first-time profile setup (name + role)
- Role-aware root redirect: landlord/manager → `/landlord`, tenant → `/tenant`
- **Landlord side**: responsive dashboard (desktop table + sidebar, mobile cards + bottom tabs), buildings screen (create fences/units, auto block-ID code), three-state payment badge (Paid / Awaiting confirm / Not paid), "View proof" opens the tenant's uploaded evidence via a short-lived signed URL, confirm action calls the atomic `confirm_payment` RPC instead of a raw update, "View receipt" link once confirmed
- **Tenant side** (Airbnb-style, mobile-only): `/join-building` (block ID → claims a vacant unit), Home with the single bold status hero card, "I've paid" now opens a bottom sheet requiring a photo of the payment confirmation before it submits (camera capture on mobile), "View receipt" link once confirmed
- **Receipt page** (`/receipt/:paymentId`, shared by both roles via RLS): an actual rendered, shareable receipt — not just a database row — with a share button (native share sheet on mobile, clipboard fallback)
- Design approach: followed the `frontend-design` skill throughout — kept Enju's existing blue rather than defaulting to Airbnb's literal coral, one bold hero element per screen, no decorative eyebrows/numbered steps where the content isn't actually a sequence

## Known pattern: this sandbox's network allowlist blocks management APIs
Netlify's API/CLI, GitHub's Pages-settings API, and now the Supabase Management API have all
turned out to be unreachable from inside this Claude session (confirmed via direct connect
attempts, each refused by the proxy — not transient, don't bother retrying). The project's own
*data* APIs (Supabase Postgres/Storage/Auth via the Supabase MCP tools, git push to GitHub) work
fine — it's specifically each platform's *account/dashboard-settings* API that's walled off. So:
anything that's "flip a setting in the provider's dashboard" (enable Pages, set Auth redirect
URLs, link a Git repo to Netlify, etc.) needs Titus to click it once himself; anything that's
"change the app or its data" I can do directly. Check this list before spending time retrying one
of these from inside the session.

- **Supabase Auth redirect URLs still point at `localhost:3000`** (the project default) — magic
  links will 404/unreachable until Titus sets this once: Supabase dashboard →
  supabase.com/dashboard/project/mbechxwgkvwriuainefl/auth/url-configuration → Site URL =
  `https://titusmuwonge.github.io/enju-app/`, add `https://titusmuwonge.github.io/enju-app/**` to
  Redirect URLs, save. One-time; not needed again unless the domain changes (e.g. moving to
  Netlify or a custom domain later).

## Deploy status
- **Netlify is a dead end from this Claude session**: the sandbox's network policy blocks every `netlify.com`/`netlify.app` host outright (confirmed via proxy status, not a transient error) — the `deploy-site` MCP tool only ever returns a CLI command, and that CLI can't reach Netlify's servers from here. Don't keep retrying this path from inside the session.
- **Switched to GitHub Pages instead**, since `github.com` is already reachable: built the production bundle (`vite build` with `base: '/enju-app/'` in `vite.config.ts`, and `basename={import.meta.env.BASE_URL}` on `BrowserRouter` in `App.tsx` so routing works from the `/enju-app/` subpath), pushed it to a `gh-pages` branch (orphan branch, just the built `dist/` contents plus a `404.html` copy of `index.html` for SPA deep-link fallback and `.nojekyll`).
- GitHub's Pages-settings API is also blocked from this session (403 through the proxy, both read and write) — enabling Pages itself needs ONE manual click from Titus: github.com/Titusmuwonge/enju-app/settings/pages → Source: "Deploy from a branch" → Branch: `gh-pages`, folder `/` → Save. After that it's live at `https://titusmuwonge.github.io/enju-app/` within ~1 minute, and every future push to `gh-pages` auto-updates it (no further clicks needed).
- To redeploy after new changes: `npm run build`, copy `dist/` contents into a fresh `gh-pages` branch, push. (Should be scripted into a one-liner once this becomes routine — not done yet.)
- Netlify site `enju-app` (ID `1ed13227-f508-4eed-98f2-e94ecbba69d5`) still exists with env vars set, in case Titus wants to link it to the GitHub repo himself via the Netlify dashboard later (Netlify's "New site from Git" flow auto-deploys on every push and doesn't need any API access from this session at all) — that's actually the more robust long-term option since it includes the SPA redirect rule already in `netlify.toml`, GH Pages does not.

## Deploy status — confirmed live
GitHub Pages settings page confirmed: "Your site is live at https://titusmuwonge.github.io/enju-app/", source = `gh-pages` branch / root. An earlier 404 was just propagation lag right after first enabling it — resolved on its own.

## Known gap: Supabase's default mailer rate-limits fast (deferred on purpose)
Supabase's built-in email sender (used for magic links until custom SMTP is configured) allows only
a handful of sends per hour — it's meant for development, not real users. Titus hit it while
retesting the redirect-URL fix. **Decision: leave this as-is for now** (not worth setting up SMTP
yet while still solo-testing) — but this is a real pre-launch blocker, not just an annoyance: with
real tenants requesting magic links to pay rent, this limit will lock people out constantly.
**Before onboarding any real landlord/tenant**, set up custom SMTP in Supabase (Project Settings →
Authentication → SMTP Settings) — fastest option is Gmail SMTP with an App Password using
titusmuwonge@gmail.com (5 min, no new signup, ~500/day cap, plenty for early users); cleaner
long-term option is Resend with a verified branded domain (e.g. `amanawebug.com`) for a
professional `no-reply@` sender. Revisit this before real-user launch, not during casual testing.

## Payment-API-readiness & admin dashboard (new this round)
- `profiles.role` now allows `'admin'` — a 4th role, separate from landlord/manager/tenant, not selectable in the self-signup CompleteProfile screen (only landlord/manager/tenant are). **Titus's own profile is not yet flagged admin** — once he signs in once with titusmuwonge@gmail.com and completes profile (pick anything, it doesn't matter), run: `update profiles set role='admin' where email='titusmuwonge@gmail.com';` to flip it. Do this next session if he hasn't asked for it by then.
- `is_admin()` security-definer SQL function + read-only admin policies on every table (fences/units/tenancies/payments/receipts/profiles/fence_managers/audit_log) — Titus can see everything platform-wide, but can't edit a landlord's tenants/units directly (that stays the landlord's).
- New `payment_integrations` table: one row per (fence, provider), `status` (`not_configured`/`connected`/`disabled`), `public_config` jsonb (merchant display name, short code — **no secrets**, ever — real merchant API keys go in Supabase Edge Function secrets/Vault once an actual provider is wired up, not in this table). `payments.integration_id` added (nullable, null = manual, which is 100% of payments today) so the data model already distinguishes manual vs. API-settled payments before any real API exists.
- Bank transfer and cash are intentionally **not** represented in `payment_integrations` at all — they stay permanently manual (tenant evidence photo + manager confirm + manager releases receipt), cash specifically because it requires physical handoff before a receipt can honestly exist. Only mobile money (MTN/Airtel) is a candidate for API routing.
- New `/admin` route (`AdminLayout`, dark sidebar so it's never visually confused with a landlord's dashboard): Overview (platform-wide stats), Buildings (every fence across every landlord), Payments (configure `payment_integrations` per building — provider, status, merchant name/code).
- Landlord dashboard now reads `payment_integrations` (read-only, RLS-scoped to their own fences) and shows a green banner when mobile money is connected for one of their buildings — this is the "shows up in the manager's dashboard too" behavior Titus asked for.
- **Honesty note on scope**: configuring a provider as "connected" right now only sets status/display info — it does NOT yet move real money, because there's no live merchant API key wired in anywhere. The schema and UI are deliberately built so that when Titus has a real MTN/Airtel merchant key, only the actual submit/confirm logic needs to change (read `integration_id`/status, call the real API instead of the manual evidence flow) — nothing structural. Didn't fake a working payment gateway to make this look more finished than it is.

## Not done yet (in order)
1. Tenant Calendar: real payment history view (data's there, just needs a screen)
2. Tenant Discover: cross-building vacancy marketplace (needs more than one live building to mean anything)
3. Manager role support in UI (schema supports it via `fence_managers`, no screens yet)
4. Rent due reminders — the actual core "stop chasing people" value prop, nothing proactive exists yet (would need a scheduled job + a notification channel: email is free and already wired via Supabase/auth, push/SMS would cost money)
5. Terms of Service / Privacy Policy acceptance in the signup flow (DPPA compliance — currently assumed, not enforced)
6. Error observability (Sentry or similar) — right now a production bug is invisible unless a user reports it
7. Pagination on the landlord dashboard (fine at a handful of tenants, won't scale to hundreds without it)
8. Separate dev vs. prod Supabase projects before real money moves through this
9. PWA installability ("Add to Home Screen"), offline tolerance, loading skeletons/empty states on every screen
10. Deploy to Netlify, connect a domain
11. WhatsApp click-to-chat phone verification — parked, zero per-message cost but needs something always-on watching the business number (Meta's paid Cloud API, or a fragile unofficial gateway). Not blocking anything since magic link already solved the real auth cost problem for free.

## Decisions made
- Airbnb-style UI/UX and flow for the tenant app, confirmed over uxpeak.com reference (shelved for now)
- Full connected build, not a stripped MVP — built in layers (data model → auth → core screens → trust/integrity layer → full feature set)
- Auth: email magic link over phone/SMS OTP, specifically to avoid a Twilio dependency and keep cost at $0
- Admin/landlord side is responsive (desktop table + sidebar / mobile cards + bottom tabs); tenant side is mobile-only by design, no desktop variant planned
- Brand colors/fonts carry over from the campaign graphics: `#1F5BFF` / `#143ea8` blue, system font stack
- Payment trust model: tenant's "I've paid" is a claim with photo evidence attached, not proof by itself — landlord confirmation is still the thing that actually marks it paid and generates the receipt. This was flagged explicitly as a production-blocking gap before it was built (see chat: "your queue sounds like an MVP build" → led to this whole chunk)

## Working agreement
- Push after every meaningful chunk, update this file in the same commit
- A session hitting a usage limit mid-build: type "continue", don't hit "try again" on a turn that touched code (see chat for why)

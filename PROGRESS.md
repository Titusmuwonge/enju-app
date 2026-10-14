# Enju build progress

Read this file first, every session. It's the single source of truth for where the build stands — don't rely on chat history to know what's done.

## Stack
- React 19 + Vite + TypeScript, Tailwind CSS, react-router-dom
- Supabase project: `enju-app` (ref `mbechxwgkvwriuainefl`, org `AmanaWeb Uganda's eco`, region eu-west-1)
- Auth: email magic link (Supabase native, free, no Twilio/SMS provider needed)
- Supabase creds are in `.env.local` (gitignored, not in this repo — if a fresh clone is missing them, pull from Supabase project settings or ask Titus)

## Done
- Supabase schema (migrations `core_schema`, `email_auth_support`, `tenant_join_flow_rls`): `profiles`, `fences`, `fence_managers`, `units`, `tenancies`, `payments`, `receipts`, all RLS-scoped by role, including the policies needed for a tenant to self-join a building (read a fence by code, read vacant units, insert their own tenancy, flip their own unit to occupied)
- Email magic link login + first-time profile setup (name + role)
- Role-aware root redirect (`/`): landlord/manager → `/landlord`, tenant → `/tenant`
- **Landlord side**: responsive dashboard (desktop table + sidebar, mobile cards + bottom tabs, same data), buildings screen to create fences/units with an auto-generated block ID code, three-state payment badge (Paid / Awaiting confirm / Not paid) with a real confirm action — landlord can either confirm a tenant's self-reported payment or mark one paid directly (cash-in-hand case)
- **Tenant side** (Airbnb-style, mobile-only, no desktop variant by design): `/join-building` screen (enter a block ID, claims a vacant unit), Home screen with a single bold status hero card (rent due / payment sent awaiting confirmation / paid this month), "I've paid" writes a real pending payment Supabase row, bottom tab bar (Home / Calendar / Discover)
- Calendar and Discover tabs are routed and real pages, but intentionally honest placeholders, not fake data — they say plainly what's coming
- Design approach: followed the `frontend-design` skill — kept Enju's existing blue (already out in the field on campaign graphics) rather than defaulting to Airbnb's literal coral, borrowed Airbnb's UX grammar instead (one bold hero card per screen, card-based browsing, bottom tabs, quiet supporting content)

## Not done yet (in order)
1. Tenant Calendar: real payment history view (data already being written, just needs a screen)
2. Tenant Discover: cross-building vacancy marketplace (needs more than one live building first to mean anything)
3. Manager role support in UI (schema supports it via `fence_managers`, no screens yet — a manager would see the same landlord dashboard scoped to assigned fences only)
4. Receipt detail view / shareable receipt rendering
5. Deploy to Netlify, connect a domain
6. WhatsApp click-to-chat phone verification — floated as a zero-per-message alternative to SMS OTP, needs something always-on watching the business WhatsApp number (Meta's paid Cloud API, or a fragile unofficial gateway that brushes against WhatsApp's terms). Parked, not blocking anything since magic link already solved the real blocker for free.

## Decisions made
- Airbnb-style UI/UX and flow for the tenant app, confirmed over uxpeak.com reference (shelved for now)
- Full connected build, not a stripped MVP — built in layers (data model → auth → core screens → full feature set)
- Auth: email magic link over phone/SMS OTP, specifically to avoid a Twilio dependency and keep cost at $0
- Admin/landlord side is responsive (desktop table + sidebar / mobile cards + bottom tabs); tenant side is mobile-only by design, no desktop variant planned
- Brand colors/fonts carry over from the campaign graphics: `#1F5BFF` / `#143ea8` blue, system font stack — kept deliberately instead of defaulting to Airbnb's own coral, since tenants will have already seen this blue in outreach materials

## Working agreement
- Push after every meaningful chunk, update this file in the same commit
- A session hitting a usage limit mid-build: type "continue", don't hit "try again" on a turn that touched code (see chat for why)

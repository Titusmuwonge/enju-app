# Enju build progress

Read this file first, every session. It's the single source of truth for where the build stands — don't rely on chat history to know what's done.

## Stack
- React 19 + Vite + TypeScript, Tailwind CSS, react-router-dom
- Supabase project: `enju-app` (ref `mbechxwgkvwriuainefl`, org `AmanaWeb Uganda's eco`, region eu-west-1)
- Auth: email magic link (Supabase native, free, no Twilio/SMS provider needed)
- Supabase creds are in `.env.local` (gitignored, not in this repo — if a fresh clone is missing them, pull from Supabase project settings or ask Titus)

## Done
- Supabase project created, core schema applied (migrations `core_schema`, `email_auth_support`): `profiles` (phone optional, email unique), `fences`, `fence_managers`, `units`, `tenancies`, `payments`, `receipts` — all with RLS policies scoping landlord/manager/tenant access correctly
- Email magic link login (`src/pages/Login.tsx`) via `supabase.auth.signInWithOtp({ email })` — zero cost, no SMS provider dependency
- First-time profile setup (`src/pages/CompleteProfile.tsx`) — name + role picker, inserts the `profiles` row after first magic-link sign-in
- Landlord dashboard (`src/pages/landlord/Dashboard.tsx`) — live tenant list from Supabase (tenancy → unit → fence → tenant join), "Mark paid" writes a real payment + auto-generated receipt. Responsive: dense table on desktop (`md:` breakpoint), stacked cards on mobile — same data, same component, confirmed by a rendered mockup at both widths
- Landlord buildings screen (`src/pages/landlord/Fences.tsx`) — create a building (auto-generates a block ID code), add units with label + rent
- `LandlordLayout` (`src/components/LandlordLayout.tsx`) — desktop sidebar nav, mobile bottom tab bar, same routes
- Router shell with auth gate: no session → `/login`, session but no profile row → `/complete-profile`, otherwise → `/landlord`

## Not done yet (in order)
1. Tenant app: Home, Calendar, Discover tabs, Airbnb-style UI/UX and flow, fully mobile-optimized (confirmed direction, not started)
2. Onboarding flow proper: country → block-ID code entry → join a building as tenant (currently only the landlord side can create fences/units; nothing lets a tenant attach to one yet)
3. Manager role support in UI (schema supports it via `fence_managers`, no screens yet — managers would see the same dashboard scoped to assigned fences only)
4. Receipt detail view / shareable receipt rendering
5. Deploy to Netlify, connect a domain
6. WhatsApp click-to-chat phone verification — floated as a zero-per-message-cost alternative to SMS OTP, but it needs something always-on watching the business WhatsApp number for inbound messages (either Meta's paid Cloud API, or an unofficial device-automation gateway that's fragile and brushes against WhatsApp's terms). Not zero cost to build or run, just zero per message. Parked as a phase-2 idea, not blocking anything right now since magic link already solved the actual blocker for free.

## Decisions made
- Airbnb-style UI/UX and flow for the tenant app, confirmed over uxpeak.com reference (shelved for now)
- Full connected build, not a stripped MVP — built in layers (data model → auth → core screens → full feature set), same as any real app gets built
- Auth: email magic link over phone/SMS OTP, specifically to avoid a Twilio dependency and keep cost at $0
- Admin/landlord side: responsive single-page layout — desktop gets a dense table + sidebar nav (built for working at a desk), mobile gets stacked cards + bottom tab bar. Tenant side stays mobile-first/mobile-only in spirit (Airbnb-style), not responsive-desktop
- Brand colors/fonts carry over from the campaign graphics: `#1F5BFF` / `#143ea8` blue, system font stack

## Working agreement
- Push after every meaningful chunk, update this file in the same commit
- A session hitting a usage limit mid-build: type "continue", don't hit "try again" on a turn that touched code (see chat for why)

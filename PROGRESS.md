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

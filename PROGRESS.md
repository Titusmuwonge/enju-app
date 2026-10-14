# Enju build progress

Read this file first, every session. It's the single source of truth for where the build stands — don't rely on chat history to know what's done.

## Stack
- React 19 + Vite + TypeScript, Tailwind CSS, react-router-dom
- Supabase project: `enju-app` (ref `mbechxwgkvwriuainefl`, org `AmanaWeb Uganda's eco`, region eu-west-1)
- Supabase creds are in `.env.local` (gitignored, not in this repo — if a fresh clone is missing them, pull from Supabase project settings or ask Titus)

## Done
- Supabase project created, core schema applied (migration `core_schema`): `profiles`, `fences`, `fence_managers`, `units`, `tenancies`, `payments`, `receipts` — all with RLS policies scoping landlord/manager/tenant access correctly
- Vite scaffold cleaned of template boilerplate
- Supabase client (`src/lib/supabase.ts`) and Auth context (`src/lib/AuthContext.tsx`) — session + profile loading
- Phone/OTP login screen (`src/pages/Login.tsx`) — Supabase `signInWithOtp` / `verifyOtp`, Enju brand styling
- Landlord dashboard (`src/pages/landlord/Dashboard.tsx`) — live tenant list pulled from Supabase (tenancy → unit → fence → tenant join), "Mark paid" button that writes a real payment row and auto-generates a receipt row. This is the actual working loop, not a mockup.
- Router shell (`src/App.tsx`) — auth gate, redirects to `/login` when no session

## Not done yet (in order)
1. SMS OTP needs a provider configured in Supabase Auth settings (Twilio or similar) before phone login actually sends codes — currently will error until that's set up
2. Onboarding flow: country → fence block-ID code entry → OTP, per the original spec (not built, login currently assumes the profile row already exists)
3. Landlord fence/unit management screens (create a fence, add units, assign a block-ID code)
4. Tenant app: Home, Calendar, Discover tabs, Airbnb-style UI/UX and flow (confirmed direction, not started)
5. Receipt detail view / PDF-style receipt rendering
6. Manager role support in UI (schema supports it via `fence_managers`, no screens yet)
7. Deploy to Netlify, connect a domain

## Decisions made
- Airbnb-style UI/UX and flow, confirmed over uxpeak.com reference (shelved for now)
- Full connected build, not a stripped MVP — built in layers (data model → auth → core screens → full feature set), same as any real app gets built
- Brand colors/fonts carry over from the campaign graphics: `#1F5BFF` / `#143ea8` blue, system font stack

## Working agreement
- Push after every meaningful chunk, update this file in the same commit
- A session hitting a usage limit mid-build: type "continue", don't hit "try again" on a turn that touched code (see chat for why)

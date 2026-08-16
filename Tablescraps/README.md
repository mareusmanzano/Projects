# Tablescraps

A polished React recipe library inspired by the provided product brief.

## Features
- Recipe card library with ingredient search and tags
- Recipe detail view
- Link/text and screenshot import UI
- Meal-planning view
- Supabase magic-link authentication
- Supabase Postgres persistence with Row Level Security
- Local demo mode when Supabase environment variables are not configured

## Run locally
1. Install Node.js 18+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and anon key.
5. Run `npm run dev`.

## Supabase setup
1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. Enable Email/Magic Link under Authentication providers.
4. Put the project URL and anon key in `.env.local`.

## Important: automatic parsing
The included demo has a local parser for pasted recipe text. Production-grade URL scraping and screenshot OCR should run server-side, e.g. in a Supabase Edge Function. Do not put private AI/API keys in the React client.

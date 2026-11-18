# Consolidator Fault Manager

A Vite + vanilla JavaScript + Supabase starter for managing the five fault classification groups centrally.

## Important scope

This repository implements fault-definition management only. It does **not** contain the original Consolidator file-processing/consolidation workflow. Add that existing source separately if you want both features in one application.

## Features

- Supabase email/password sign-in and account creation
- View master fault records and their category
- Search by code, fault message, recovery code/message
- Filter by Critical, Normal, Additional, Ignore, Repeated
- Add, edit, and delete fault records
- Shared database for signed-in users

## Requirements

- Node.js 20.19+ or 22.12+
- Existing Supabase project
- Existing `public.faults` and `public.fault_classifications` tables with CSV imports completed

## 1. Configure Supabase

In Supabase SQL Editor, run `supabase/schema.sql`.

This enables RLS and allows authenticated users to read and modify the fault tables. All authenticated users have equal permissions in this starter. Configure role-based policies before allowing untrusted users to sign up.

In Supabase Authentication settings, decide whether email confirmation should be enabled. If enabled, users must confirm their email before signing in.

## 2. Configure environment

Copy `.env.example` to `.env` and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Use the Project URL and publishable key from Supabase. Never use a service-role/secret key in this browser app.

## 3. Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## 4. Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. Import the repository into Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
7. Deploy.

## Database expectations

`faults` columns:
- `code` (primary key)
- `sl_no`
- `message`
- `recovery_code`
- `recovery_message`

`fault_classifications` columns:
- `code` (foreign key to faults.code)
- `category` (Critical, Normal, Additional, Ignore, Repeated)

The frontend reads the related `fault_classifications(category)` relationship. If your Supabase Data API does not expose these tables, enable the `public` schema/tables in the Data API settings and verify grants/RLS.

## Notes

- A fault can have zero or one category in the UI. The schema's `(code, category)` primary key technically permits multiple category rows per code; keep one assignment per code for predictable UI results.
- Deleting a fault cascades to its classification rows.
- This is a starter, not a replacement for reviewing your organization's access-control requirements.

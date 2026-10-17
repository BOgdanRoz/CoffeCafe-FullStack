# Morrow Coffee

A modern café website with an interactive table availability system and a protected admin dashboard.

Morrow Coffee combines a warm, carefully designed public-facing website with a Supabase-powered backend that allows the café owner to manage table availability and operational settings.

## AI-Assisted Development

This project was developed with the assistance of **Claude Code**, an AI-powered coding assistant.

Claude Code was used to support implementation, code organization, database integration, debugging, and development workflow tasks. The project architecture, feature requirements, technical decisions, and final implementation were reviewed iteratively throughout development.

The goal was to use AI as a development tool while building a functional full-stack application with React, TypeScript, and Supabase.

## Features

### Public Website

- Responsive layout for desktop, tablet, and mobile devices.
- Café information, menu, gallery, and contact sections.
- Interactive table availability interface.
- Date and time slot selection.
- Live availability data retrieved from Supabase.
- Automatic availability refresh when changing the selected date or time, returning to the page, and periodically while the page is open.
- Loading and error states for availability requests.

### Admin Dashboard

- Protected admin area at `/admin`.
- Owner authentication through Supabase Auth.
- Table management and activation controls.
- Table availability management for specific dates and time slots.
- Opening hours management.
- Booking and time-slot settings.
- Database-backed updates that are reflected on the public website.

### Database and Security

- PostgreSQL database hosted on Supabase.
- Row Level Security (RLS) policies.
- Owner role management through the `profiles` table.
- Database function for retrieving public table availability.
- SQL migrations and seed data for initial setup.
- Database-level protection against overlapping availability blocks where applicable.

## Tech Stack

**Frontend**

- React
- TypeScript
- Vite
- React Router
- CSS Modules

**Backend and Database**

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- PostgreSQL functions and constraints

**Development and Testing**

- Git and GitHub
- ESLint
- TypeScript
- PGlite for database migration and logic tests

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- A Supabase project

### 1. Clone the repository

```bash
git clone <https://github.com/BOgdanRoz/CoffeCafe-FullStack>
cd <CoffeCafe-Fullstack>
```

Replace the placeholders with your repository URL and project directory name.

### 2. Install dependencies

```bash
npm install
```

If `package.json` is located in the repository root, run `npm install` there.

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Replace the placeholder values with the URL and publishable key from your Supabase project.

**Security:** Never expose Supabase secret keys or the `service_role` key in frontend code or client-side environment variables.

### 4. Configure Supabase

The repository includes SQL files for database setup:

- `supabase/migrations/20261017120000_table_availability.sql` — database schema, policies, and functions.
- `supabase/seed.sql` — initial café data.
- `supabase/manual/assign-owner.sql` — assigns the owner role to an existing authentication user.
- `supabase/README.md` — additional database setup instructions.

To configure a new Supabase project:

1. Review the migration and execute it in the Supabase SQL Editor.
2. Run the seed script after the migration succeeds.
3. Create the owner account in Supabase Authentication.
4. Configure and execute the owner role assignment script.
5. Verify that the environment variables point to the correct Supabase project.

Review the SQL files before executing them. Run the owner assignment script only after creating the intended account and verifying the email address.

### 5. Start the development server

From the application directory, run:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

The admin dashboard is available at:

```text
/admin
```

## Testing and Quality Checks

The project includes database tests and standard quality checks.

Run the following commands if they are defined in the application's `package.json`:

```bash
npm run test:db
npm run lint
npx tsc -b
npm run build
```

The database test suite was previously reported to pass 29 tests using PGlite. Run the tests locally to verify the current version.

## Project Structure

```
.
├── src/
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── features/
│   │   └── admin/
│   │   └── tables/
│   ├── lib/
│   │   └── supabase/
│   ├── pages/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   ├── manual/
│   ├── tests/
│   ├── seed.sql
│   └── README.md
├── .env.example
├── package.json
└── README.md
```

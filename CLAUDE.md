# Morrow Coffee — Project Instructions

## 1. Project Overview

## 0. Language Requirements (Important)
- **Communicate with the user in Ukrainian.** All questions, explanations, planning discussions, progress updates, and summaries addressed to the user must be written in Ukrainian.
- **The website UI must be in Ukrainian.** All visitor-facing content, navigation labels, buttons, forms, validation messages, reservation states, admin dashboard labels, and user-facing errors must be Ukrainian. Do not create an English-language interface unless the user explicitly requests it.
- Keep this `CLAUDE.md`, code identifiers, database identifiers, branch names, and commit messages in English.
- If the user writes in Ukrainian, continue the conversation in Ukrainian.


Build **Morrow Coffee**, a polished, responsive website and reservation-management MVP for a fictional specialty coffee shop. This is a portfolio project for **WebWay**, demonstrating visual design and practical full-stack functionality.

The public website should communicate the café's atmosphere, showcase its menu and space, and make it easy to submit a table reservation request. A separate, protected admin area lets the owner manage reservation requests and table availability.

**Design references:** All design references, screenshots, moodboards, and visual inspiration will be placed in the repository's `references/` directory. Inspect that directory before making design decisions. Treat these references as the primary visual guidance. Do not ignore them or replace them with a generic design.

If references are missing or ambiguous, use the design direction below and document assumptions.

### Image Sourcing
- Use relevant images from **open/publicly accessible sources** for café interiors, coffee, drinks, pastries, and other website visuals when suitable assets are not supplied in `references/`.
- Prefer reputable sources that clearly permit reuse, such as Unsplash, Pexels, or Pixabay, and follow each source's current license and attribution requirements. Do not assume that any image found through a search is automatically free to use.
- Prefer stable image URLs or download permitted assets into the project when appropriate; avoid fragile hotlinks when a reliable local asset is practical.
- Do not use copyrighted images without permission, watermarked previews, or images that misrepresent the fictional café as a real business.
- Keep image choices consistent with the visual references and the Morrow Coffee brand.
- If external images are used, document their source and any attribution/license requirements in a small asset credits file or the project README.

## 2. Design Direction

### Brand
- Name: **Morrow Coffee**
- Type: fictional specialty coffee shop
- Brand personality: warm, modern, welcoming, refined, calm, quality-focused
- Visual direction: contemporary specialty coffee editorial design; tactile and atmospheric, but clean and usable
- Suggested palette: warm cream / off-white backgrounds, espresso brown typography, muted coffee and caramel accents, restrained dark sections
- Use generous but intentional whitespace, strong typography, high-quality café / coffee / pastry photography, subtle borders, and clear visual hierarchy.
- Avoid generic SaaS styling, excessive gradients, overused glassmorphism, clutter, excessive rounded cards, and unnecessary animations.
- The site must look excellent on desktop and mobile.
- Use a consistent design system: CSS variables for colors, spacing, typography, radii, and transitions where appropriate.
- If a logo or other asset is supplied in `references/`, use it as visual guidance rather than inventing an unrelated identity.

### Public Website Sections
Create a one-page café website with these sections:
1. **Header / Navigation** — Morrow Coffee wordmark or logo treatment, navigation links, prominent “Reserve a table” CTA, accessible mobile navigation.
2. **Hero** — strong brand headline, short supporting copy, high-quality café/coffee visual, clear CTA leading to reservations.
3. **About** — short fictional story / café concept, editorial image and concise text.
4. **Menu** — coffee, non-coffee drinks, and pastries, with realistic fictional items and prices.
5. **Gallery** — carefully composed café interior, drinks, and pastry imagery.
6. **Reservation** — date, time, party size, guest name, phone, clear availability / request feedback. Explain that requests remain pending until confirmed by the owner.
7. **Contact / Footer** — fictional address and opening hours, Instagram profile link (placeholder until a real profile is provided), page navigation and contact information.

All business details are fictional portfolio content. Do not create fake reviews, fabricated awards, or claims of real customers.

## 3. Core Technology

Use the following stack unless the repository already contains a justified, working alternative:
- React
- TypeScript
- Vite
- CSS Modules for component and page styles
- React Router for public and admin routes
- Supabase PostgreSQL, Auth, Realtime, and Row Level Security (RLS)
- Supabase JavaScript client
- SQL migrations checked into the repository for schema, constraints, policies, indexes, and functions

Do not use Tailwind CSS. Avoid adding a component library or large dependency without a clear reason. Prefer semantic HTML, reusable React components, and straightforward TypeScript.

A separate Node.js/Express server is not required for the initial MVP. Business-critical validation and reservation/table assignment operations must run in PostgreSQL functions or another trusted server-side environment, never only in the browser.

## 4. Recommended Project Structure

Adapt to the existing repository instead of blindly replacing it. This is a suggested structure, not a requirement to create every directory immediately.

```text
morrow-coffee/
├── CLAUDE.md
├── references/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   └── Container/
│   │   ├── ui/
│   │   └── sections/
│   │       ├── Hero/
│   │       ├── About/
│   │       ├── Menu/
│   │       ├── Gallery/
│   │       ├── Reservation/
│   │       └── Contact/
│   ├── pages/
│   │   ├── HomePage/
│   │   ├── AdminLoginPage/
│   │   └── AdminDashboardPage/
│   ├── features/
│   │   ├── reservations/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── validation/
│   │   ├── tables/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── types/
│   │   └── auth/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── hooks/
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

Keep files focused and avoid overengineering. Follow existing conventions where sensible. Each component/page should have its own `.module.css` when it needs component-specific styling. Keep global CSS limited to resets, base typography, and design tokens.

## 5. Reservation Workflow

The visitor does not need to create an account.

1. Visitor selects date, time, and party size, then enters their name and phone.
2. The client submits the request through a controlled database function.
3. The request is stored with `pending` status and no table assigned yet.
4. The UI clearly explains that the reservation is not confirmed until the owner confirms it.
5. The owner sees pending requests in the admin dashboard.
6. The owner assigns an appropriate table and confirms or declines/cancels the request.
7. The system checks table capacity, café opening hours, valid time ranges, and overlapping reservations before confirming.
8. The UI reports success or a useful error. Never report a reservation as confirmed before the database transaction succeeds.

The owner manually assigns tables in the MVP. Do not implement automatic table assignment unless explicitly requested later.

## 6. Suggested Database Model

Implement the final schema through SQL migrations. Review and refine this model before implementation if needed.

### `profiles`
- `id` — UUID primary key, references `auth.users(id)`
- `display_name` — optional text
- `role` — constrained role; owner/admin provisioning must be controlled securely

### `cafe_tables`
- `id` — UUID primary key
- `name` — unique human-readable label (e.g. “Table 01”)
- `capacity` — positive integer
- `is_active` — boolean for whether the table is in service
- `status` — current operational status such as `available`, `occupied`, or `unavailable`

### `reservations`
- `id` — UUID primary key
- `customer_name` — required text with length limits
- `phone` — required text with length limits
- `party_size` — positive integer with a sensible upper bound
- `starts_at` and `ends_at` — `timestamptz`, with `ends_at > starts_at`
- `table_id` — nullable foreign key to `cafe_tables(id)` until assigned
- `status` — constrained values: `pending`, `confirmed`, `cancelled`, `completed`
- `created_at` — timestamp
- optional `notes` only if clearly needed

Important distinctions:
- A pending request has not reserved a specific table.
- A confirmed reservation has a table and a time interval.
- A table's current operational state is distinct from future reservations.
- Do not store a permanent “reserved” table status that incorrectly blocks the table for all future times.

Use indexes for common admin queries, such as reservation start time, status, and assigned table. Add foreign keys and appropriate `CHECK` constraints.

## 7. Preventing Double Booking (Critical)

Client-side availability checks are only for user experience and are not a concurrency guarantee.

The database must enforce that confirmed reservations for the same table cannot overlap:
- Use a PostgreSQL exclusion constraint based on `table_id` and a `tstzrange(starts_at, ends_at, '[)')` expression, with `btree_gist` if required.
- Apply the constraint to confirmed reservations only, e.g. a partial exclusion constraint where `status = 'confirmed'` and `table_id IS NOT NULL`.
- Confirm and assign a table within one transaction, preferably through a PostgreSQL function called via Supabase RPC.
- Validate table capacity, table availability, reservation status, café hours, and time interval in the trusted database operation.
- If concurrent requests attempt to assign overlapping reservations, the database must reject one operation. Return a controlled error and refresh dashboard state.
- Cancellation must free the interval transactionally.
- Consider how an “occupied” table interacts with reservations. Operational status must not bypass the overlap constraint.

A pending request does not block a table unless a temporary hold mechanism is deliberately added later. Temporary holds, expiration jobs, and automatic assignment are out of scope for the initial MVP.

## 8. Admin Dashboard

The admin area should be practical and visually consistent with the brand, but optimized for managing reservations rather than marketing.

Include:
- Secure login page
- Daily reservations overview
- Filters by date and status
- Pending requests list
- Reservation details: guest name, phone, party size, time, and status
- Manual table assignment
- Confirm, cancel, and complete actions
- Table status controls: available, occupied, unavailable
- Realtime updates for authorized admin sessions
- Loading, empty, success, and error states
- Sign-out action

Use React Router to protect admin routes at the UI level, but remember that route guards alone do not provide security. Database RLS and trusted database functions must enforce permissions.

## 9. Security and Supabase Rules

- Enable RLS on every table exposed through the Supabase API.
- The public browser client may use only the publishable/anon key intended for frontend use.
- Never expose the `service_role` key, database passwords, or privileged secrets in client code or committed environment files.
- Provide `.env.example` with placeholder variable names, not real credentials.
- Restrict profile reads and writes to appropriate authenticated users/owner policies.
- Public visitors must not be able to query all reservations or read guest contact details.
- Public reservation creation must use a narrowly scoped PostgreSQL function with validation and controlled privileges, not broad table insert permissions.
- Admin operations must verify the authenticated user and owner role server-side.
- Ensure Realtime subscriptions do not leak personal data to public clients.
- Validate all data in PostgreSQL functions, even if the form also validates it in React.
- Consider abuse prevention such as rate limiting or CAPTCHA without overcomplicating the initial portfolio MVP.

Never assume hiding the admin route or using an obscure URL is security.

## 10. Realtime Behavior

Use Supabase Realtime for authorized admin sessions to reflect new requests and updates without a page refresh.

- Subscribe only to required tables and events.
- Enforce access through RLS and appropriate Realtime authorization.
- Do not broadcast guest names or phone numbers to the public website.
- Handle subscription setup and cleanup correctly in React effects.
- Refresh or reconcile relevant query state after realtime events rather than assuming each event contains all needed data.
- Handle reconnects and stale state gracefully.

## 11. Code Quality and UX Requirements

- Respect TypeScript strictness; avoid `any` unless documented.
- Use reusable components and feature-based separation.
- Use CSS Modules, not Tailwind.
- Use semantic HTML, accessible form labels, keyboard navigation, visible focus states, and sufficient color contrast.
- Ensure responsive layouts on mobile, tablet, and desktop.
- Respect `prefers-reduced-motion`.
- Add polished loading, error, success, empty, and disabled states.
- Do not fake backend behavior with `localStorage` or hardcoded success messages.
- Keep business content and menu data easy to edit.
- Do not use fake reviews, testimonials, or claims that imply the fictional café is a real operating business.
- Prioritize assets supplied in `references/`. For additional images, use appropriately licensed sources or clearly documented temporary placeholders.
- Avoid unnecessary dependencies and complexity.

## 12. Testing and Definition of Done

Before considering the MVP complete, verify:
- Public site sections render and navigation works.
- Booking form validates required fields and invalid time ranges.
- Visitor can submit a pending request without an account.
- Public users cannot read personal reservation details or change reservation statuses.
- Unauthenticated users cannot use admin functionality.
- Non-owner accounts cannot perform owner actions.
- Owner can view requests, assign tables, confirm, cancel, and complete reservations.
- A table cannot be assigned to overlapping confirmed reservations, including under concurrent requests.
- Table capacity and opening-hour rules are enforced server-side.
- Realtime updates appear in a second authorized admin session.
- No privileged keys are exposed in the frontend bundle or repository.
- Production build and lint/type checks pass, where configured.
- UI is usable on mobile and desktop.

Write automated tests for critical business rules and concurrency behavior where feasible. If a behavior cannot be tested automatically, document manual test steps.

## 13. Git and Implementation Workflow

- Inspect current Git status before modifying files.
- Preserve existing user work, untracked files, and the `references/` directory.
- Do not overwrite or delete existing work without explicit permission.
- Work in focused feature branches when the repository's existing workflow supports them.
- Use clear English branch names, commit messages, and code identifiers.
- Never force-push.
- Do not commit `.env` files or credentials.
- Run relevant lint, type-check, test, and build commands before declaring a feature complete.
- If asked only to plan or review, do not modify files or install dependencies.
- If a Git operation, deployment, or Supabase configuration requires user authentication or manual action, explain the required step rather than claiming it was completed.

## 14. Recommended Implementation Phases

Implement in small, reviewable phases:

1. **Repository review and design plan** — inspect the codebase and `references/`, propose architecture, identify unanswered decisions.
2. **Design system and public site** — tokens, responsive layout, content sections, images, navigation.
3. **Supabase setup and migrations** — schema, seed data, constraints, indexes, RLS, database functions.
4. **Public reservation flow** — validation, request creation, pending state, error handling.
5. **Owner authentication and admin dashboard** — protected UI and server-enforced permissions.
6. **Manual table assignment and reservation management** — atomic confirmation and conflict prevention.
7. **Realtime integration** — authorized subscriptions and stale-state handling.
8. **Testing and deployment preparation** — security review, responsive review, build, environment documentation.

Do not implement every phase in one uncontrolled change. First inspect the repository and references, then present a concise plan and unresolved decisions before implementation.

## 15. Final Instruction

Treat this file as the project-level source of truth. Follow it alongside the user's current request and repository-specific instructions. When requirements conflict or an important decision is missing, explain the conflict and ask before making a destructive or high-impact choice.

**First action:** inspect the repository, read this `CLAUDE.md`, and examine relevant design references in `references/`. Do not start implementation until the user explicitly asks to proceed.

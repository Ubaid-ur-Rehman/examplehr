# ExampleHR — Time-Off Management System

A frontend application for managing employee time-off requests. Built with Next.js 14, TanStack Query, and Zustand. The HCM system (mocked via Next.js route handlers) is the source of truth for all balance data.

---

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/examplehr.git
cd examplehr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Employee view: [http://localhost:3000/employee](http://localhost:3000/employee)
- Manager view: [http://localhost:3000/manager](http://localhost:3000/manager)

---

## Running Storybook

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to browse all component stories.

Storybook covers every meaningful UI state including: loading, fresh, stale, optimistic-pending, optimistic-rolled-back, HCM-rejected, HCM-silently-wrong, and balance-refreshed-mid-session.

---

## Running Tests

```bash
npx vitest run
```

This runs 31 component tests across all four components using Vitest and React Testing Library.

---

## Project Structure

```
src/
  app/
    employee/         # Employee dashboard page
    manager/          # Manager dashboard page
    api/hcm/          # Mock HCM route handlers
  components/
    BalanceCard/      # Displays a single balance with all states
    RequestForm/      # Form for submitting time-off requests
    RequestList/      # List of requests with status badges
    ManagerRequestCard/ # Manager approval/denial card
    Notifications/    # Global toast notification stack
  hooks/              # TanStack Query hooks for data fetching
  lib/
    mockHcmStore.ts   # Shared in-memory mock HCM data store
    queryClient.ts    # TanStack Query client configuration
    store.ts          # Zustand store for UI state
  types/              # Shared TypeScript types
```

---

## Mock HCM Behavior

The mock HCM endpoints simulate real-world behaviors:

| Behavior | How It Works |
|---|---|
| Normal balance read | Returns seeded balance data for Alice and Bob |
| Slow response | 10% of single-balance GETs add a 2 second delay |
| Silent failure | 5% of valid POST requests return 200 but don't save |
| Insufficient balance | Returns error if days requested exceed available |
| Anniversary bonus | POST to `/api/hcm/trigger-anniversary` adds 5 days |
| Approval conflict | 10% of approvals return BALANCE_CHANGED error |

### Seeded Test Data

- **Alice (emp-1):** New York — 12 days, San Francisco — 8 days
- **Bob (emp-2):** New York — 5 days, Chicago — 10 days

---

## Key Features

- **Optimistic updates** — balance deducts instantly on request submission, rolls back on failure
- **Silent failure detection** — verifies HCM actually processed the request by reading back the balance
- **Stale balance detection** — shows amber warning when data is older than 30 seconds
- **Background reconciliation** — polls HCM every 60 seconds to catch mid-session balance changes
- **Mid-session refresh** — anniversary bonus trigger demonstrates live balance reconciliation
- **Manager balance context** — managers see live balance freshness at decision time

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Data fetching | TanStack Query v5 |
| Client state | Zustand |
| Styling | Tailwind CSS |
| Component docs | Storybook 8 |
| Testing | Vitest + React Testing Library |

See `TRD.md` for full architectural decisions and reasoning.

---

## Deployed Links

- **App:** https://YOUR_APP_URL.vercel.app
- **Storybook:** https://YOUR_STORYBOOK_URL.vercel.app

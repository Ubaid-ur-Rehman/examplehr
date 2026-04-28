# Technical Requirements Document
## ExampleHR — Time-Off Management Frontend

**Author:** Ubaid  
**Date:** April 2026  
**Stack:** Next.js 14 (App Router), TanStack Query v5, Zustand, Tailwind CSS, Storybook 8

---

## 1. The Problem Worth Solving

Most time-off UIs are deceptively simple on the surface — show a number, let someone click submit. The hard part is that the number doesn't belong to you. In ExampleHR's case, the HCM system (think Workday or SAP) owns every balance. We're just a consumer.

That creates a specific class of bugs that are easy to miss during happy-path development:

- An employee opens the app at 9am with 10 days available. At 9:01am their work anniversary fires in HCM and they now have 15. The app still shows 10.
- The same employee submits a 3-day request. The UI says "submitted." HCM quietly drops it because of an internal validation rule we didn't know about.
- A manager approves a request at 10am. But the balance they're looking at was fetched at 9:45am. The employee had already submitted another request at 9:50am through a different system.

These aren't edge cases. They're predictable failure modes of any system where you don't own the source of truth. The goal of this document is to explain how I designed around them.

---

## 2. What I Built

A Next.js 14 frontend with two views:

**Employee view** — see your balances per location, submit a time-off request, track your request history.

**Manager view** — review pending requests with live balance context at decision time, approve or deny.

Behind both views is a data layer that handles optimistic updates, detects silent HCM failures, reconciles stale balances in the background, and never tells a user something is approved until HCM has actually confirmed it.

The mock HCM endpoints live as Next.js route handlers in the same repo. They simulate the real behaviors: slow responses, silent failures, anniversary bonuses, balance conflicts on approval.

---

## 3. Architecture Decisions

### 3.1 Data Fetching — TanStack Query v5

This was the easiest decision. TanStack Query gives you optimistic updates with automatic rollback, per-query staleness configuration, background refetching, and query invalidation — exactly the primitives this problem needs.

The alternative I considered was SWR. I've used both. SWR is simpler but its optimistic update story requires more manual work, and its cache invalidation is less granular. When you're dealing with a data model that has multiple dimensions (per-employee, per-location), being able to invalidate a specific `['balance', employeeId, locationId]` key without blowing up the rest of the cache matters.

I also considered building a custom fetch layer with `useState` and `useEffect`. I've seen this pattern on smaller projects and it always grows into something that reinvents half of what React Query already does. Not worth it here.

**Configuration decisions:**
- `staleTime: 30_000` — balances are considered fresh for 30 seconds. After that, any component mounting or window focus triggers a refetch.
- `refetchInterval: 60_000` — balance queries poll every 60 seconds regardless of user activity. This catches anniversary bonuses and year-start resets for users who have the app open all day.
- `refetchOnWindowFocus: true` — when a manager switches back to the approval tab, they get fresh data immediately.

### 3.2 Client State — Zustand

There's a clear separation between server state (what HCM says) and UI state (what the user is currently doing). TanStack Query owns the former. Zustand owns the latter.

The UI state I needed to track globally:
- Which requests are currently in an optimistic-pending state
- Which requests were rolled back and need a visible error indicator
- The notification queue (success/error/warning toasts)

I considered React Context for this. The problem is that Context re-renders every consumer on every state change. With a notification queue that auto-dismisses on a timer, that's a lot of unnecessary renders. Zustand's selector-based subscriptions are more precise.

Redux was overkill. The slice of UI state here is small and doesn't need the full Redux DevTools story.

### 3.3 Optimistic Updates vs Pessimistic Updates

This was the most interesting design decision.

**Pessimistic** means you wait for HCM to confirm before updating the UI. The user clicks submit and stares at a spinner. Safe, but feels slow. More importantly, it doesn't solve the problem — HCM can still return a 200 that isn't actually correct (see silent failures below).

**Optimistic** means you update the UI immediately, assume success, and roll back if HCM disagrees. Feels instant. The risk is telling the user something is done when it isn't.

I went optimistic with a verification step. Here's the exact flow:

1. User submits a request
2. Before the API call lands, the balance cache is updated immediately (days deducted)
3. The request appears in the list with a "Submitting..." badge
4. The POST fires to `/api/hcm/request`
5. HCM returns 200 (or an error)
6. **If error:** roll back the cache update, show the original balance, display an error notification
7. **If 200:** don't trust it yet. Fire a follow-up GET to `/api/hcm/balance` for that specific employee/location
8. Compare the balance before and after. If it didn't change, HCM silently dropped the request
9. **If silent failure detected:** roll back, show a warning "Request may not have saved — please verify"
10. **If balance changed as expected:** invalidate the cache, let the fresh data replace the optimistic update

The silent failure detection in step 8 is the key insight. HCM returning 200 is not a contract. The only way to know a write actually landed is to read back the value you wrote.

### 3.4 Cache Invalidation Strategy

There are two HCM endpoints: a batch endpoint that returns all balances, and a single-cell endpoint for one employee/location pair.

I use them differently:

**Batch endpoint** — used once, on initial page load, to hydrate the full balance grid. It's expensive so I don't call it repeatedly.

**Single-cell endpoint** — used for targeted reads after mutations. When someone submits a request for `emp-1` at `loc-nyc`, I only need to verify and refresh that one cell. Invalidating `['balance', 'emp-1', 'loc-nyc']` triggers a refetch of just that query.

Background polling uses the same single-cell queries that are already mounted. Every 60 seconds, any mounted `useBalance` hook refetches its specific cell. The batch endpoint is not involved in ongoing reconciliation.

### 3.5 Reconciling Background Refreshes With In-Flight User Actions

This is where it gets subtle. What happens if a background refetch lands while the user has an optimistic update in progress?

The sequence:

1. User submits request — optimistic update applied, balance shows 8 (was 10, requested 2)
2. Background poll fires — fetches fresh balance from HCM, gets back 10 (HCM hasn't processed the request yet)
3. Cache updates to 10 — optimistic update is overwritten

This is a real problem. My solution is to check whether a request is in-flight before applying a background refetch to the UI. The Zustand store tracks pending request IDs. When a background refetch arrives for a balance that has a pending optimistic update, the UI continues showing the optimistic value until the mutation resolves.

In practice this means the `BalanceCard` component reads both the React Query cache and the Zustand pending state, and the Zustand state takes priority during the window between submission and HCM confirmation.

---

## 4. Component Architecture

```
app/
  employee/page.tsx     — orchestrates data hooks, passes props down
  manager/page.tsx      — orchestrates data hooks, passes props down

components/
  BalanceCard           — pure display, all state passed via props
  RequestForm           — controlled form, calls onSubmit callback
  RequestList           — pure display, list of requests with status
  ManagerRequestCard    — pure display, shows request + balance context
  Notifications         — reads from Zustand, renders toast stack
```

The pages own data fetching. Components are dumb — they receive props and render. This makes Storybook trivial: every component state is just a different set of props. No mocking of hooks needed.

The one exception is `Notifications`, which reads directly from Zustand. This is intentional — notifications are a global concern that can be triggered from anywhere (a hook, a mutation, a background event), so they need global state rather than prop drilling.

---

## 5. Mock HCM Endpoints

All mock endpoints live at `/api/hcm/` as Next.js route handlers. They share a single in-memory store (`src/lib/mockHcmStore.ts`) so state is consistent across all routes during a dev session.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/hcm/balances` | GET | Batch corpus — all balances |
| `/api/hcm/balance` | GET | Single cell — authoritative read |
| `/api/hcm/request` | POST | Submit a request |
| `/api/hcm/request/[id]/approve` | POST | Manager approval |
| `/api/hcm/request/[id]/deny` | POST | Manager denial |
| `/api/hcm/requests` | GET | All requests |
| `/api/hcm/trigger-anniversary` | POST | Dev trigger for balance bonus |

**Simulated behaviors:**
- 5% of valid POST requests silently succeed (200 OK but balance unchanged)
- 10% of single-cell GETs add a 2 second delay
- 10% of approvals return a `BALANCE_CHANGED` conflict
- Anniversary trigger adds 5 days to a specified balance immediately

---

## 6. Storybook State Coverage

Storybook is the proof that I've thought through the states, not just the happy path. Every component has stories for:

**BalanceCard:** Loading, Fresh, Stale, Optimistic Pending, Optimistic Rolled Back, Error, Balance Refreshed Mid Session, HCM Silently Wrong

**RequestForm:** Default, Submitting, Validation Error, Submit Error, No Balances

**RequestList:** Loading, Empty, Pending Requests, Approved, Denied, Optimistic Submitting, Optimistic Rolled Back, Mixed

**ManagerRequestCard:** Loading Balance, Fresh Sufficient, Fresh Insufficient, Stale Balance, Balance Unavailable, Approving, Denying, Already Approved, Already Denied

**Notifications:** Single Success, Single Error, Single Warning, Single Info, Multiple

Key stories have `play()` functions that use `@storybook/test` to interact with the component and assert the expected output. These serve as living documentation and catch visual regressions that unit tests miss.

---

## 7. Test Strategy

I made deliberate choices about what each test layer guards:

**Component tests (Vitest + React Testing Library) — 31 tests**
Guard the logic inside components: does the stale warning appear at the right time, does the pending badge render when optimisticStatus is submitting, does the form block submission when days exceed available balance. These tests run in milliseconds and catch regressions in component logic without needing a browser.

**Storybook interaction tests (play functions)**
Guard the visual states themselves. A component test tells you a class was applied; a Storybook interaction test tells you the user can actually see the right thing. These are harder to write but catch a different class of bug — layout issues, z-index problems, animation states that unit tests can't see.

**What I deliberately didn't build: Playwright end-to-end tests**
The honest reason is time. The more considered reason is that with mock HCM endpoints co-located in the same Next.js app, the integration surface is already covered by the component tests plus the mock logic itself. A Playwright test that exercises the full stack would be valuable for a production system but adds significant CI complexity for marginal gain at this stage. I'd add them as the first priority after shipping.

---

## 8. Known Limitations and Future Work

- **No real authentication.** Employee and manager identities are hardcoded. In production these would come from a session/JWT.
- **In-memory mock store resets on server restart.** Fine for development, not for staging.
- **No Playwright tests.** Covered above.
- **No WebSocket support.** Background polling every 60 seconds is a pragmatic approximation of real-time. A proper implementation would use Server-Sent Events or WebSockets to push HCM balance changes instantly.
- **Silent failure detection is heuristic.** Comparing balance before and after a write works in most cases but could produce a false positive if HCM changes the balance for a different reason in the same window.

---

## 9. Running the Project

```bash
npm install
npm run dev        # app on localhost:3000
npm run storybook  # storybook on localhost:6006
npx vitest run     # 31 component tests
```

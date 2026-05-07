# Programme Approval Workflow — Design Spec
Date: 2026-05-07

## Overview

Redesign the programme submission and approval flow to introduce:
1. Advisor assignment at submission time (student picks a specific admin)
2. Two-stage approval: Admin → Superadmin
3. Per-round updated paperwork upload (replaces student's original)
4. Auto-generated Approval Letter PDF for fully approved programmes

---

## Status Flow

```
Pending → Under Review → Approved
              ↘ Rejected (either stage)
```

| Status | Meaning |
|---|---|
| `Pending` | Submitted by student, waiting for assigned admin |
| `Under Review` | Admin approved + uploaded updated paperwork, waiting for superadmin |
| `Approved` | Superadmin approved, student can download approval letter |
| `Rejected` | Rejected at either stage (with rejection reason) |

---

## Database Changes

### `programmes` table — new columns
- `advisor_id uuid references users(id)` — the admin assigned at submission time
- `approved_by_admin_name text` — populated when admin approves
- `approved_by_superadmin_name text` — populated when superadmin approves
- `approved_at timestamptz` — set when superadmin gives final approval

### `programme_documents` — no schema change
The updated paperwork upload (`phase: pre`, `doc_type: paperwork`) is upserted, replacing the student's original file in storage and the DB row.

### Constants (`lib/constants.ts`)
- `APPROVAL_CHECKLIST`: remove `approval_letter`, keep only `updated_paperwork`
- `statusConfig` in all dashboards and programme detail: add `Under Review` (cyan/blue styling)

---

## API Changes

### New: `GET /api/admins`
- Auth required
- Returns all users with `role = 'admin'`: `[{ id, full_name }]`
- Used by create-programme form for advisor dropdown

### Modified: `POST /api/programmes`
- New required field: `advisor_id`
- Inserted into `programmes` row alongside existing fields

### Modified: `GET /api/programmes`
- Admin caller: filter `advisor_id = caller_id`
- Superadmin caller: filter `status IN ('Under Review', 'Approved', 'Rejected')`
- Student caller: unchanged (own programmes by `programme_director_id`)

### Modified: `POST /api/programmes/[id]/approve`
The review modal continues to use the existing `/api/upload` endpoint to store the signed paperwork as `phase=approval, doc_type=updated_paperwork` (upsert — each round overwrites the previous version).

**Admin stage:**
- Caller role must be `admin`
- Validates `programme.advisor_id === caller_id`
- Validates `programme.status === 'Pending'`
- Validates a doc exists: `phase=approval, doc_type=updated_paperwork`
- Atomically replaces the pre-phase paperwork: upserts `programme_documents` with `phase=pre, doc_type=paperwork` pointing to the same file path as the approval doc
- Sets `status = 'Under Review'`, `approved_by_admin_name = caller full_name`

**Superadmin stage:**
- Caller role must be `superadmin`
- Validates `programme.status === 'Under Review'`
- Validates a doc exists: `phase=approval, doc_type=updated_paperwork` (superadmin's upload overwrites admin's in this slot)
- Atomically replaces the pre-phase paperwork again (now superadmin-signed version)
- Sets `status = 'Approved'`, `approved_by_superadmin_name = caller full_name`, `approved_at = now()`

### New: `DELETE /api/programmes/[id]/documents/[docId]`
- Auth required; caller must be admin (assigned advisor) or superadmin
- Deletes the doc record from DB and removes the file from storage
- Used by the review modal "Remove" button to clear an uploaded updated_paperwork doc

---

## UI Changes

### Create Programme Form (`app/create-programme-form/page.tsx`)
- New **Advisor** `<select>` field, fetched from `GET /api/admins` on mount
- Placed between Category and Start Date
- Required — submit button disabled until selected
- `advisor_id` sent in POST body

### Admin Dashboard (`app/admin/page.tsx`)
- `GET /api/programmes` already returns only assigned programmes (server-filtered)
- Add `Under Review` to `getStatusConfig`: color `#38bdf8` (cyan), matching the lifecycle badge style
- **Review Modal changes:**
  - Remove Approval Letter upload row entirely
  - Keep Updated Paperwork row; add **×** button to deselect a chosen file before uploading
  - After upload: show filename + green check + a **Remove** button (calls DELETE upload-paperwork endpoint)
  - Approve button gated on updated paperwork being uploaded
  - On approve: status badge updates to `Under Review`; modal closes

### Superadmin Dashboard (`app/superadmin/page.tsx`)
- Programme list filtered to `Under Review`, `Approved`, `Rejected` only
- Add `Under Review` to `getStatusConfig` (same cyan styling)
- **Review Modal**: identical to admin modal — Updated Paperwork upload row, remove button, approve gated on upload
- On approve: status → `Approved`

### Programme Detail Page (`app/programmes/[id]/page.tsx`)
- Add `Under Review` to `statusConfig`
- When `programme.status === 'Approved'` and `isOwner`:
  - Show small **"Download Approval Letter"** button in the header row, next to the status badge
  - On click: generate PDF client-side using `jsPDF`
  - PDF contents:
    - Institution header (hardcoded: "Universiti Malaysia Kelantan" or similar constant)
    - Title: "Programme Approval Letter"
    - Programme: name, category, dates, venue, budget
    - Director: full name + matric number (fetched from `users` table)
    - Approved by Admin: `approved_by_admin_name`
    - Approved by Superadmin: `approved_by_superadmin_name`
    - Date of Approval: `approved_at` formatted
  - File saved as `approval-letter-<programme-name>.pdf`

---

## Key Constraints

- A student cannot submit without selecting an advisor
- An admin can only review/approve programmes where they are the assigned advisor
- Superadmin only sees programmes that have passed the admin stage (`Under Review` or beyond)
- Approval at each stage requires the updated paperwork to be uploaded first
- The paperwork replacement is destructive — the student's original is overwritten
- The approval letter is generated on-demand client-side, not stored

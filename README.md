# Online Equipment Borrowing and Return Monitoring System

**Course:** Systems Analysis and Design
**Student:** Luie
**Front End:** HTML, CSS, JavaScript
**Backend:** Supabase (PostgreSQL + Authentication)
**Hosting:** GitHub Pages

## 1. Problem Statement

The College currently records equipment borrowing manually, making it hard to track which
items are borrowed, who holds them, when they are due, and whether they have been returned.
This affects the equipment custodian and every student, faculty member, or staff who needs to
borrow equipment. The manual process causes lost records, unnoticed overdue items, and
uncertainty about equipment availability. The proposed system centralizes borrowing records in
a database, automatically updates equipment availability, flags overdue transactions, and lets
authenticated staff manage records online, replacing the paper log with a searchable, real-time
system.

## 2. Actors

- **System User / Equipment Custodian** — logs in, manages equipment records, records
  borrowing and return transactions, monitors overdue items.
- **Borrower** — student, faculty, or staff member who borrows equipment (does not interact
  with the system directly; represented as data recorded by the System User).

## 3. Use Case Diagram (textual)

```
User
 ├── Login
 ├── View Dashboard
 ├── Manage Equipment
 │    ├── Add Equipment
 │    ├── View Equipment
 │    ├── Edit Equipment
 │    └── Delete Equipment
 ├── Record Borrowing
 ├── View Transactions
 ├── Return Equipment
 ├── Search Equipment / Transactions
 ├── Filter Equipment / Transactions
 └── Logout
```

## 4. Entity Relationship Diagram

```
EQUIPMENT (1) ────< (M) BORROW_TRANSACTIONS
  PK id                    PK id
  equipment_name           FK equipment_id
  category                 borrower_name
  asset_code               borrower_type
  condition                department
  availability             date_borrowed
  created_at               due_date
                           date_returned
                           status
                           user_id
                           created_at
```

One equipment item may appear in multiple borrowing transactions over time (its full borrowing
history), but each borrowing transaction refers to exactly one equipment item — a one-to-many
relationship from `equipment` to `borrow_transactions`.

## 5. Database Setup

Run `documentation/schema.sql` in the Supabase SQL Editor. It creates the `equipment` and
`borrow_transactions` tables, enables Row Level Security, adds policies restricting access to
authenticated users, and inserts sample equipment rows.

After running the schema, create at least one user in **Supabase Dashboard → Authentication →
Users** to log in with.

## 6. Configuration

Edit `js/supabase.js` and replace the placeholders with your Supabase project's URL and anon
public key (found in **Project Settings → API**):

```js
const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

## 7. Business Rules Implemented

| ID | Rule | Where enforced |
|----|------|-----------------|
| BR-01 | Equipment name cannot be empty | `equipment.js` form validation |
| BR-02 | Asset code must be unique | `equipment.js` check + DB `UNIQUE` constraint |
| BR-03 | Only available equipment may be borrowed | dropdown only lists Available items |
| BR-04 | Borrower name must be provided | `transactions.js` form validation |
| BR-05 | Due date cannot be earlier than borrow date | `transactions.js` form validation |
| BR-06 | New borrowing gets Borrowed status | insert default in `transactions.js` |
| BR-07 | Borrowed equipment becomes unavailable | update on transaction insert |
| BR-08 | Returned equipment becomes available | update on Return Equipment |
| BR-09 | Past-due items flagged Overdue | `applyOverdueStatus()` in `transactions.js` |
| BR-10 | Deletion requires confirmation | `confirm()` dialog in `equipment.js` |
| BR-11 | Only authenticated users may manage records | `requireSession()` + Supabase RLS |
| BR-12 | A returned transaction cannot be returned again | status check in `returnEquipment()` |

## 8. Requirements Traceability Matrix

| Requirement | Feature | Test |
|---|---|---|
| FR-01 | User Login | TC-01 |
| FR-02 | Add Equipment | TC-02 |
| FR-03 | Edit Equipment | TC-03 |
| FR-04 | Delete Equipment | TC-04 |
| FR-05 | Record Borrowing | TC-05 |
| FR-06 | Return Equipment | TC-06 |
| FR-07 | Detect Overdue | TC-07 |
| FR-08 | Search Records | TC-08 |
| FR-09 | Filter Records | TC-09 |
| FR-10 | Dashboard Summary | TC-10 |

## 9. Functional Testing

| Test ID | Scenario | Expected Result | Result |
|---|---|---|---|
| TC-01 | Login with valid account | Dashboard displayed | |
| TC-02 | Add equipment | Record successfully saved | |
| TC-03 | Edit equipment | Changes displayed | |
| TC-04 | Delete equipment | Confirmation shown before deletion | |
| TC-05 | Borrow available equipment | Transaction saved, equipment becomes Borrowed | |
| TC-06 | Return equipment | Transaction becomes Returned, equipment becomes Available | |
| TC-07 | View late borrowing | Record displayed as Overdue | |
| TC-08 | Search borrower | Matching transactions displayed | |
| TC-09 | Filter Borrowed status | Only Borrowed transactions displayed | |
| TC-10 | Open deployment URL | System accessible online | |

Fill in **PASS/FAIL** in the Result column after testing your deployed system.

## 10. Project Structure

```
SAD-EquipmentBorrowing-Luie/
├── index.html
├── login.html
├── css/style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── equipment.js
│   └── transactions.js
├── documentation/
│   └── schema.sql
└── README.md
```

## 11. Deployment (GitHub Pages)

1. Create a repository named `SAD-EquipmentBorrowing-Luie`.
2. Push this project with at least four meaningful commits, e.g.:
   - `Initial equipment borrowing system structure`
   - `Create Supabase equipment database integration`
   - `Implement borrowing and return transaction logic`
   - `Add overdue detection and deploy application`
3. In repository **Settings → Pages**, set the source to the `main` branch, root folder.
4. Your live system will be available at:
   `https://<your-username>.github.io/SAD-EquipmentBorrowing-Luie/`

## 12. Optional Challenge — Equipment Borrowing History

Not implemented in this base version. To add it: on clicking an equipment row, query
`borrow_transactions` filtered by that `equipment_id` and render the list of past borrowers,
their borrow/return dates, and current status, pulled live from Supabase.

Account Log-in
    email: luiejay07@gmail.com
    password: luie123

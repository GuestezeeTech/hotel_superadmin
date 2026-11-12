# Superadmin Dashboard & Reports — Plan

Source sheet: `~/Downloads/Guestezee Superadmin Dashboard and report.docx`  
App: `hotel_superadmin/` (isolated from hotel admin)  
Rule from sheet: **all filters country + city wise**

---

## 1. What the sheet asks for

| # | Report / KPI | Meaning (working definition) |
|---|---|---|
| 1 | Total hotels signed | Count of onboarded / signed hotels |
| 2 | Lock wise hotel signed | Hotels grouped by lock/integration type |
| 3 | PMS wise hotel signed | Hotels grouped by PMS (e.g. WinHMS) |
| 4 | Only key hotel signed | Hotels that are mobile-key-only (no full stack) |
| 5 | Sub fee report | Subscription fees charged / collected per hotel |
| 6 | Sub validity report | Subscription end / remaining validity |
| 7 | q / h / full / custom sub report | Breakdown by plan cadence: quarterly / half-yearly / full(year) / custom |
| 8 | Platform revenue hotel report | Guestezee platform revenue by hotel |
| 9 | Payment settlement report | Settlements / payouts vs collections |
| 10 | Total guest downloaded | Guest app download / install count |
| 11 | Frequent traveller report | Guests with repeat stays / high visit frequency |

Global UX: **Country → City** filters on every report (plus period where relevant).

---

## 2. What we will build in Superadmin

### Phase A — Shell (reuse hotel-admin dashboard UX patterns)
- Shared period controls + refresh (from hotel admin)
- Country / City filter bar (superadmin-specific)
- KPI cards + listing tables (centered tables, INR format, scroll-to-top)
- Progress tracker file (like hotel admin sheet progress)

### Phase B — Hotel signed KPIs (1–4)
- Total signed hotels
- Breakdown cards / charts: Lock-wise, PMS-wise, Only-key
- Drill-down hotel lists per bucket

### Phase C — Subscription reports (5–7)
- Sub fee listing + totals
- Sub validity / expiry-oriented listing
- Plan type report: Quarterly / Half / Full / Custom

### Phase D — Money reports (8–9)
- Platform revenue by hotel
- Payment settlement report

### Phase E — Guest platform reports (10–11)
- Total guest downloads
- Frequent traveller report

### Phase F — Wire into menu / routes
- New Superadmin “Reports / Overview” section without breaking existing `dashboard/` charts

---

## 3. Services already in Superadmin (usable)

| Area | Service / module | Endpoints / role |
|---|---|---|
| Hotels (tenants) | `hotel-list.service.ts` | `customer/getall`, getbyid, update — **primary source for signed hotels** |
| Dashboard (existing) | `dashboard.service.ts` | Thin `postApiCall`; uses `GET_PROPERTY_SIZE`, `GET_PROPERTY_SIZE_ANALYTICS` for visits/reviews/expiry cards |
| Subscription plans | `payment-details.service.ts` + `payment-subscription-management` | `paymentsubscription/getall` create/update — **plan catalog + fees** |
| Expiry | `expiry-details` | Expiry cards (2/7/30 days) — **seed for sub validity** |
| Payments | `payment-list`, `payment-summary-list`, `payment-tab-view`, `payment-activation` | Hotel payment history / activation |
| Enrollment / tech | `hotel-enrollment-tabview`, `technical-info` | Property + technical fields (likely lock / PMS / key flags) |
| Orders | `payment-details` → `order/getall` | May feed platform revenue if SaaS orders live there |
| Reviews / ratings | `hotel-reviews`, `rating` | Not in sheet list; already on home dashboard |
| Bookings | `bookings`, `bookings-management` | Possible input for frequent traveller |
| Hierarchy | `hierarchy` | Org structure; optional for grouping |
| Auth / storage | `auth-token`, `local-storage` | Same pattern as hotel admin |

**Existing home dashboard already shows:** property-size summary, guest visit chart, guest review chart, expiry snippets — keep it; **new sheet reports are additive**.

---

## 4. What we can take from Hotel Admin (do not copy hotel-ops reports)

Reuse **patterns / shared UI**, not F&B/FO/HK operational dashboards (those are single-hotel).

| From hotel admin | Use in superadmin for |
|---|---|
| `shared/dashboard-period/` + state service | Global Today / Week / Month / For Date / Date Range |
| `shared/dashboard-refresh/` | Manual + 1‑min soft refresh |
| `shared/inr-format.util.ts` | Safe INR / compact labels |
| `shared/scroll-to-top.util.ts` | In-screen navigation |
| `assets/scss/dashboard-tables.scss` + shimmer | Centered listing tables, loading shimmer |
| KPI card / panel layout conventions | Overview KPI row + report screens |
| Progress tracker style (`DASHBOARD_REPORT_SHEET_PROGRESS.txt`) | Superadmin progress file |
| `DASHBOARD_API_COLLECTIONS.md` style | Doc which collections each report hits |

**Do not port as-is:** Overview staff-wise, IRD payments, FO mobile-key hotel reports, HK task board — wrong scope (single `member_id`). Superadmin is **cross-hotel**.

---

## 5. What else we still need (gaps)

| Need | Why | Likely source |
|---|---|---|
| Confirm customer fields: lock type, PMS, only-key | Sheet KPIs 2–4 | Sample `customer/getall` doc / enrollment technical-info payload |
| Country + city field paths on customer | Global filter | e.g. `property_details.property_address.country/city` — verify |
| Plan cadence flags (q/h/full/custom) | Report 7 | `paymentsubscription` docs or order `payment_split` |
| Settlement definition | Report 9 | Clarify with product: HDFC settlement vs internal paid status — may need new API |
| Guest download metric | Report 10 | **Likely missing** — need analytics/Firebase/app-store API or new backend field |
| Frequent traveller definition + API | Report 11 | Bookings/reservations across hotels — may need new aggregate API |
| Platform revenue formula | Report 8 | Sub fees only vs sub + commission — confirm |
| Optional single dashboard aggregate API | Perf across all hotels | Same idea as hotel admin `DASHBOARD_API_COLLECTIONS.md` |

---

## 6. Suggested data map (per report)

| Report | Read first (existing) | Extra if missing |
|---|---|---|
| Total / Lock / PMS / Only-key | `customer/getall` (+ technical/property fields) | Field dictionary if flags missing |
| Sub fee / validity / q-h-full-custom | `paymentsubscription/getall` + customer + expiry | Cadence field |
| Platform revenue | Subscription payments / orders by hotel | Revenue rules |
| Payment settlement | Payment list / HDFC-related endpoints | Settlement API if not present |
| Guest downloaded | — | **New data source** |
| Frequent traveller | Bookings / reservations / loyalty members | Aggregate + threshold rules |

---

## 7. Build order (recommended)

1. Country/City + period shell on a new Superadmin Reports overview  
2. Hotels signed KPIs (1–4) from `customer/getall`  
3. Sub fee + validity (5–6) using subscription + expiry services  
4. q/h/full/custom (7) once plan fields confirmed  
5. Platform revenue (8)  
6. Settlement (9) — after product clarifies  
7. Guest download + frequent traveller (10–11) — after APIs exist  

---

## 8. Separation rule

- Work only under `hotel_superadmin/`  
- Hotel admin stays source of **UI/dashboard patterns** to copy carefully  
- Do not merge the two apps; gitignore already keeps `hotel_superadmin/` out of hotel admin commits  

---

*Sheet text is short (title + 11 bullets). Column-level detail may live only as images in the docx — if you export clearer column lists, we refine listings next.*

# Hotel Superadmin — Code Architecture

**Path:** `hotel_superadmin/hotel_superadmin`
**Stack:** Angular **18.2**, standalone bootstrap (`app.config.ts` + `app.routes.ts`), same overall pattern as `hotel_admin` — classic `NgModule` feature modules with their own `*-routing.module.ts`.
**Purpose:** Platform-level super-admin console — multi-tenant/back-office management sitting above individual `hotel_admin` instances.

## 1. Key Dependencies (`package.json`)

Nearly identical to `hotel_admin`: Angular 18.2, Bootstrap 5.3.3 + Font Awesome 6.7.2 (no Material/PrimeNG), Chart.js 4.4.8 (`chart.js/auto`), Firebase 9.22 + @angular/fire 7.6, html2pdf.js, crypto-js, js-base64. Additionally uses **ngx-pagination** (client-side pagination on the payment list) and **js-beautify**. No NgRx/state library. Package name: `guestezee-admin`.

## 2. `src/app/` Structure

Also a flat feature-folder layout, no `core/`/`models/` directory:

```
src/app/
├── app.component.ts, app.config.ts, app.routes.ts   (standalone bootstrap, no AppModule)
├── auth-services/                (auth-token, set-new-token, local-storage)
├── services/                     (push.service.ts)
├── firestore-listener.service.ts
├── shared/                       (header, menu-bar, loader, alerts, page-not-found,
│                                   constants, shared-data.service)
├── login/
├── dashboard/, admin-dashboard/
├── hotel-list/, hotel-details/
├── hotel-enrollment-tabview/       (+ hierarchy-details, office-details, property-details,
│                                     service-details, settings, technical-info, service-tab-list)
├── hierarchy/                      (hierarchy-form/-list/-view, hierarchy-customer-view)
├── hotel-reviews/, rating/
├── bookings/, bookings-management/, late-checkout/
├── task-management/                (+ asap-cart, delivered, escalated, processing, scheduled, timeline)
├── staff/
├── service-settings/, technical-info/
├── payment-details/, payment-list/, payment-summary-list/, payment-tab-view/, payment-activation/
├── payment-subscription-management/, payment-subscription-management-customer/
├── user-access/                    (role, role-listing, user, user-listing)
├── expiry-details/, member-view/, notification/, email-template/, report1/, profile/
```

Also under `src/`: `email-template/` and a legacy `email-template(old)/`. **Cleanup note:** stray archives left in source control — `dashboard(before updating endpoints).zip`, `hierarchy.rar`, `notification.zip`, `technical-info(before updating enabled).zip`.

## 3. Routing

- Angular 18 standalone bootstrap (`app.routes.ts` + `app.config.ts`, no root `AppModule`).
- Nearly all features lazy-loaded via `loadChildren`; two exceptions (`payment-summary-list/:id`, `payment-activation`) use the newer `loadComponent` with standalone components.
- Each lazy module owns its own path segment via its own `*-routing.module.ts` (mounted at `path: ''` in the root table).
- Wildcard `**` → `PageNotFoundComponent`.
- **`user-access` routes (`role`, `role-listing`, `user`, `user-listing`) are commented out in `app.routes.ts`**, even though the sidebar menu still links to `/role-list` and `/user-list` — a likely bug/incomplete toggle worth flagging to the client.
- No `CanActivate` guards, no `HTTP_INTERCEPTORS` anywhere in the project.

## 4. Major Feature Areas

| Area | Folder(s) | Notes |
|---|---|---|
| Dashboards | `dashboard/`, `admin-dashboard/` | Platform-wide analytics (Chart.js) |
| Hotel/tenant directory | `hotel-list/`, `hotel-details/` | Cross-tenant hotel records |
| **Hotel onboarding** | `hotel-enrollment-tabview/` | Multi-step wizard to onboard new hotel tenants |
| **Org hierarchy** | `hierarchy/` | Brand → group → property structure across tenants |
| Reviews & ratings | `hotel-reviews/`, `rating/` | |
| Bookings | `bookings/`, `bookings-management/`, `late-checkout/` | |
| Task pipeline | `task-management/` (+ `timeline/`) | |
| Staff | `staff/` | |
| Service catalog | `service-settings/`, `technical-info/` | Platform-wide, offered to hotels |
| **Payments/subscriptions** | `payment-details/`, `payment-list/`, `payment-summary-list/`, `payment-tab-view/`, `payment-activation/`, `payment-subscription-management/`, `payment-subscription-management-customer/` | SaaS subscription plans sold to hotel tenants |
| Platform RBAC | `user-access/` | Super-admin users/roles (routes currently disabled — see §3) |
| Expiry tracking | `expiry-details/` | Subscription/license expiry across tenants |
| Email templates | `email-template/` | Platform-wide email templates |
| Members, notifications, reports, profile | `member-view/`, `notification/`, `report1/`, `profile/` | |

## 5. Services, Shared Architecture, State & Auth

Structurally identical pattern to `hotel_admin`:
- One `*.service.ts` per feature, `HttpClient`-based, endpoints centralized in a large `ENDPOINTS` map in `app.config.ts` built from `API_URL`/`API_URL1` — dozens of independently-versioned microservices addressed by port (e.g. `:5200/login`, `:9430/variables/getbyid`, `:8839/paymentsubscription/create`).
- **No guards, no interceptors, no `models/` folder** — same manual-auth pattern as `hotel_admin`: `AppComponent` subscribes to `router.events` and checks `localStorage` (`UserId`/`loggedOut`) to redirect to `/login`.
- `AuthTokenService` / `SetNewTokenService` / `LocalStorageService` mirror `hotel_admin`'s implementations almost exactly.
- Shared UI: `shared/header/`, `shared/menu-bar/`, `shared/loader/`, `shared/alerts/`, `shared/page-not-found/`, `shared/shared-data.service.ts`.
- State: RxJS `BehaviorSubject`s in services (`NotificationService`, `FirestoreListenerService`, `LoaderService`, `AlertsService`) + `localStorage` — no NgRx, no Signals.

**Config quirk worth flagging:** `app.config.ts` imports `environment.prod` directly (rather than relying on Angular's file-replacement mechanism), meaning dev builds pull production environment values — worth confirming with the client whether this is intentional.

## 6. Environment & Integrations

- `src/environments/environment.ts` / `environment.prod.ts` — `devURL` (dev: `https://www.guestezee.com`, prod: `http://40.192.104.15`), Firebase Web SDK config, FCM VAPID key.
- **Firebase**: Firestore realtime listener (`firestore-listener.service.ts` watches `authorities/1`) + FCM push notifications (`services/push.service.ts`).
- **Charts**: Chart.js (`chart.js/auto`) in `dashboard/` and `admin-dashboard/`.
- **PDF**: html2pdf.js — hotel enrollment preview export and `report1/` exports.
- **Pagination**: ngx-pagination on `payment-list/`.
- **Payments**: HDFC payment gateway referenced via `ENDPOINTS.HDFC_PAYMENT` — server-side, no client SDK.
- No maps library, no Socket.io, no NgRx.

## 7. How This Differs From `hotel_admin`

`hotel_superadmin` is the **multi-tenant back-office console** that sits above the single-property `hotel_admin` app:

- **Tenant onboarding** — `hotel-enrollment-tabview/` here onboards *new hotel tenants* onto the platform (a capability `hotel_admin` doesn't need, even though it also has a hotel-enrollment folder scoped to its own property's setup).
- **Cross-tenant directory** — `hotel-list/` + `hotel-details/` manage *all* onboarded hotels, not one property.
- **Org hierarchy across tenants** — `hierarchy/` models brand/group/property structure spanning many hotels.
- **Platform-wide catalog & settings** — `service-settings/`, `technical-info/`, `email-template/` define master configuration pushed down to hotels, rather than one hotel's own settings.
- **SaaS subscription/billing** — `payment-subscription-management*/` and `expiry-details/` manage the subscription plans hotels pay for and their renewal/expiry — a platform billing concern absent from `hotel_admin`.
- **Platform admin RBAC** — `user-access/` here governs super-admin operators, distinct from `hotel_admin`'s staff-level RBAC.
- **Aggregated analytics** — dashboards summarize metrics across all tenant hotels rather than a single property.

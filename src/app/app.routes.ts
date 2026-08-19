import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login.module').then(m => m.LoginModule),  // Lazy-load LoginModule
  },

  {
    path: '',
    loadChildren: () => import('./hotel-list/hotel-list.module').then(m => m.HotelListModule),  // Lazy-load LoginModule
  },
  {
    path: '',
    loadChildren: () => import('./hotel-enrollment-tabview/hotel-enrollment-tabview.module').then(m => m.HotelEnrollmentTabviewModule),  // Lazy-load LoginModule
  },
  {
    path: '',
    loadChildren: () => import('./member-view/member-view-routing.module').then(m => m.MemberViewRoutingModule),  // Lazy-load LoginModule
  },
  {
    path: '',
    loadChildren: () => import('./service-settings/service-settings.module').then(m => m.ServiceSettingsModule),  // Lazy-load LoginModule
  },
  /* {
    path: '',
    loadChildren: () => import('./user-access/user/user.module').then(m => m.UserModule),  // Lazy-load LoginModule
  }, */
  {
    path: '',
    loadChildren: () => import('./payment-details/payment-details.module').then(m => m.PaymentDetailsModule),  // Lazy-load LoginModule
  },
  /* {
    path: '',
    loadChildren: () => import('./payment-list/payment-list.module').then(m => m.PaymentListModule),  // Lazy-load LoginModule
  }, */
  {
    path: '',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),  // Lazy-load LoginModule
  },
  /* {
    path: '',
    loadChildren: () => import('./user-access/user/user.module').then(m => m.UserModule),  // Lazy-load LoginModule
  },
  {
    path: '',
    loadChildren: () => import('./user-access/role/role.module').then(m => m.RoleModule),
  },
  {
    path: '',
    loadChildren: () => import('./user-access/role-listing/role-listing.module').then(m => m.RoleListingModule),
  },
  {
    path: '',
    loadChildren: () => import('./user-access/user-listing/user-listing.module').then(m => m.UserListingModule),
  }, */
  {
    path: '',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    path: '',
    loadChildren: () => import('./hotel-reviews/hotel-reviews.module').then(m => m.HotelReviewsModule),
  },
  {
    path: '',
    loadChildren: () => import('./expiry-details/expiry-details.module').then(m => m.ExpiryDetailsModule),
  },
  {
    path: '',
    loadChildren: () => import('./hotel-details/hotel-details.module').then(m => m.HotelDetailsModule),
  },
  {
    path: '',
    loadChildren: () => import('./rating/rating.module').then(m => m.RatingModule),
  },
  {
    path: '',
    loadChildren: () => import('./task-management/task-management.module').then(m => m.TaskManagementModule),
  },
  {
    path: '',
    loadChildren: () => import('./payment-tab-view/payment-tab-view.module').then(m => m.PaymentTabViewModule),
  },
  {
    path: '',
    loadChildren: () => import('./technical-info/technical-info.module').then(m => m.TechnicalInfoModule),
  },
  {
    path: '',
    loadChildren: () => import('./hierarchy/hierarchy.module').then(m => m.HierarchyModule),
  },

  {
    path: '',
    loadChildren: () => import('./task-management/task-management.module').then(m => m.TaskManagementModule),
  },
  {
    path: '',
    loadChildren: () => import('././task-management/timeline/timeline.module').then(m => m.TimelineModule),
  },
  {
    path: '',
    loadChildren: () => import('./bookings/bookings.module').then(m => m.BookingsModule),
  },
  {
    path: '',
    loadChildren: () => import('./bookings-management/bookings-management.module').then(m => m.BookingsManagementModule),
  },
  {
    path: '',
    loadChildren: () => import('./staff/staff.module').then(m => m.StaffModule),
  },
  {
    path: '',
    loadChildren: () => import('./late-checkout/late-checkout.module').then(m => m.LateCheckoutModule),
  },
  {
    path: '',
    loadChildren: () => import('./admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboarModule),
  },

  {
    path: '',
    loadChildren: () => import('./payment-subscription-management/payment-subscription-management.module').then(m => m.PaymentSubscriptionManagementModule),
  },
  {
    path: '',
    loadChildren: () => import('./email-template/email-template-routing.module').then(m => m.EmailTemplateRoutingModule),
  },
  {
    path: 'payment-summary-list/:id',
    loadComponent: () => import('./payment-summary-list/payment-summary-list.component').then(m => m.PaymentSummaryListComponent)
  },
  {
    path: 'payment-activation',
    loadComponent: () => import('./payment-activation/payment-activation.component').then(m => m.PaymentActivationComponent)
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

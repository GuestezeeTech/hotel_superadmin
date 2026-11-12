import { KotDashboardComponent } from '../kot-dashboard/kot-dashboard.component';
import { FbDashboardComponent } from '../fb-dashboard/fb-dashboard.component';
import { FoDashboardComponent } from '../fo-dashboard/fo-dashboard.component';
import { HkDashboardComponent } from '../hk-dashboard/hk-dashboard.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/** Hotel-ops dashboards scoped by the global approved-hotel selector. */
const routes: Routes = [
  { path: 'kot-dashboard', redirectTo: 'overview-dashboard', pathMatch: 'full' },
  { path: 'overview-dashboard', component: KotDashboardComponent },
  { path: 'fb/dashboard', component: FbDashboardComponent },
  { path: 'fo/dashboard', component: FoDashboardComponent },
  { path: 'hk/dashboard', component: HkDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboardRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HotelEnrollmentTabviewComponent } from './hotel-enrollment-tabview.component';


const routes: Routes = [
  { path: 'add-new-hotel', component: HotelEnrollmentTabviewComponent }, // Default route for this module
  { path: 'edit-new-hotel/:id', component: HotelEnrollmentTabviewComponent },
  { path: 'hotel-preview/:id', component: HotelEnrollmentTabviewComponent },
  {  path:'confirmation', component: HotelEnrollmentTabviewComponent },
  // Default route for this module
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HotelEnrollmentTabviewRoutingModule { }

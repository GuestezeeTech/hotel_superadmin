import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PaymentListComponent } from './payment-list.component';
const routes: Routes = [
  { path: 'payment-list', component: PaymentListComponent }, // Default route for this module
   // Default route for this module
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentListRoutingModule { }

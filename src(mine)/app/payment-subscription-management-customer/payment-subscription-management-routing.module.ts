import { PaymentSubscriptionManagementCustomerComponent } from './payment-subscription-management.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  { path: 'payment-subscription-customer', component:PaymentSubscriptionManagementCustomerComponent },
  // { path: 'payment-details/:id', component: PaymentDetailsComponent }, // Default route for this module
];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentSubscriptionManagementRoutingModule { }

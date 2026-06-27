import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentTabViewComponent } from './payment-tab-view.component';

const routes: Routes = [
    { path: 'payment-tab-view', component: PaymentTabViewComponent }, // Default route for this module
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentTabViewRoutingModule { }

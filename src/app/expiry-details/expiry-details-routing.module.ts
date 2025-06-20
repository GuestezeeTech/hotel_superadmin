import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpiryDetailsComponent } from './expiry-details.component';

const routes: Routes = [
    { path: 'expiry-details', component: ExpiryDetailsComponent }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class ExpiryDetailsRoutingModule { }
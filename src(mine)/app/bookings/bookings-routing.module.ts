import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingsComponent } from './bookings.component';
import { Report1Component } from '../report1/report1.component';


const routes: Routes = [
    { path: 'bookings', component: BookingsComponent }, // Default route for this module
    { path: 'reports-data', component: Report1Component }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class BookingsRoutingModule { }
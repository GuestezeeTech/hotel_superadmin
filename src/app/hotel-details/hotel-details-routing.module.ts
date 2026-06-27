import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HotelDetailsComponent } from './hotel-details.component';

const routes: Routes = [
    { path: 'hotel-details/:id', component: HotelDetailsComponent }, // Default route for this module
    { path: 'hotel-details', component: HotelDetailsComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class HotelDetailsRoutingModule { }
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HotelDetailsComponent } from './hotel-details.component';

const routes: Routes = [
    { path: 'hotel-details', component: HotelDetailsComponent }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class HotelDetailsRoutingModule { }
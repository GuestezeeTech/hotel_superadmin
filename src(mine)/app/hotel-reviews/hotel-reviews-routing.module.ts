import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HotelReviewsComponent } from './hotel-reviews.component';

const routes: Routes = [
    { path: 'hotel-reviews', component: HotelReviewsComponent }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class HotelReviewsRoutingModule { }
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RatingComponent } from './rating.component';

const routes: Routes = [
    { path: 'rating', component: RatingComponent }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class RatingRoutingModule { }
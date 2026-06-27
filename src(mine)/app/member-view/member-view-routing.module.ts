import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MemberViewComponent } from './member-view.component';
const routes: Routes = [
  { path: 'member-view', component: MemberViewComponent }, // Default route for this module
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberViewRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechnicalInfoComponent } from './technical-info.component';
import { TechInfoListComponent } from './tech-info-list/tech-info-list.component';

const routes: Routes = [
    { path: 'add-technical-info', component: TechnicalInfoComponent }, // Default route for this module
    { path: 'tech-info-list', component: TechInfoListComponent }, // Default route for this module
      { path: 'edit-tech-info/:id', component: TechnicalInfoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TechnicalInfoRoutingModule { }

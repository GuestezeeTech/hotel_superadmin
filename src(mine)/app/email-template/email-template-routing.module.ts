import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateComponent } from '../email-template/email-template.component';

const routes: Routes = [
    { path: 'email-template-list', component: EmailTemplateComponent }, // Default route for this module
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class EmailTemplateRoutingModule { }
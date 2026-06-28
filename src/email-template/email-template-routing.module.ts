import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateComponent } from '../email-template/email-template.component';

const routes: Routes = [
    { path: 'email-template/email-preview', component: EmailTemplateComponent }, // matches the menu-bar nav + legacy route
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class EmailTemplateRoutingModule { }
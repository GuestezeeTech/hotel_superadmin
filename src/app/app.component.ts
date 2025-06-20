import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuBarComponent } from './shared/menu-bar/menu-bar.component';
import { HeaderComponent } from './shared/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,LoginComponent,MenuBarComponent,HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  showSidebar = true;
  title = 'GUESTEZEE_ADMIN';
  private routesWithSidebar = ['/login','/','/view']; // Add routes where sidebar is required
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showSidebar = this.routesWithSidebar.some(route => {
          
          return (route === event.url || event.url.startsWith("/view-hierarchy" + '/'));
        });
        
        //console.log( this.showSidebar," this.showSidebar",event.url);
        if(event.url=='/hotel-list' || event.url=='/add-new-hotel'){
          this.selectedMenuItem="Hotels"

        }
        if(event.url=='/user-list'){
          this.selectedMenuItem="Users"

        }
        if(event.url=='/service-settings'){
          this.selectedMenuItem="System Settings - Service Settings"

        }
         if(event.url=='/service-settings'){
          this.selectedMenuItem="System Settings - Service Settings"

        }
          
      }
    });
}
selectedMenuItem: string = '';

updateMenu(value: string) {
  this.selectedMenuItem = value; // Update selected menu value
  //console.log(this.selectedMenuItem,"tt");
  
  
}
}
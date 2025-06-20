import { Component ,OnInit} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import {  EventEmitter, Output } from '@angular/core';
import { filter } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { UserAccessService } from '../../user-access/user-access.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss'
})
export class MenuBarComponent implements OnInit{
  private currentRoute$ = new BehaviorSubject<string>('');
  @Output() menuSelected = new EventEmitter<string>();
  isSubmenuOpen: boolean = false; // Track submenu state
  currentRoute: string = '';


  showSidebar = false;
  isUserAccessOpen: boolean = false;
  isSettingsOpen: boolean = false;
  userAccess: any;
  // private routesWithSidebar = ['/hotel-list', '/add-new-hotel']; 
  constructor(private route: ActivatedRoute, private router: Router, private userAccessService: UserAccessService) {
    this.currentRoute$ = new BehaviorSubject<string>(this.router.url); // ✅
     
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.showSidebar = this.routesWithSidebar.some(route => {
    //       return route.includes(':id') ? event.url.startsWith(route.split('/:id')[0]) : route === event.url;
    //     });
    //     //console.log( this.showSidebar," this.showSidebar")
    //   }
    // });
}

ngOnInit(): void {
  this.router.events
          .pipe(filter(event => event instanceof NavigationEnd))
          .subscribe((event: NavigationEnd) => {
            this.currentRoute$.next(event.urlAfterRedirects); // ✅ Update BehaviorSubject
            //console.log("Current Route Updated:", event.urlAfterRedirects);
          });




          this.userAccessService.userAccess$.subscribe((access) => {
            if (access) {
              this.userAccess = access;
              //console.log(this.userAccess, '🔁 Updated user access from service');
            }
          });
          // this.userAccess = this.userAccessService.userAccessList;
          this.userAccess = this.userAccessService.getUserAccess();
          
          //console.log(this.userAccess, "this.userAccess");
           const currentRoute = this.currentRoute$.value;
           const targetElement = document.getElementById("sys_settings");
           //console.log("log12",targetElement,currentRoute)
          if ((currentRoute.includes('service') || currentRoute.includes('hierar')  || currentRoute.includes('tech')) && targetElement) {

            targetElement.className = 'sub-menu collapse show';
          } 

}
sendValue(value: string) {
  this.menuSelected.emit(value); // Emit value to parent
  this.toggleSubmenu();
}
toggleSubmenu() {
  this.isSubmenuOpen = !this.isSubmenuOpen; // Toggle submenu open/close
  //console.log("123456")
}
isHotelActive(): boolean {
  const currentRoute = this.currentRoute$.value;
  //console.log("hotel", this.currentRoute.includes('hotel'));
  return currentRoute.includes('hotel');
}
isPaymentActive(): boolean {
  const currentRoute = this.currentRoute$.value;
  //console.log("payment",this.currentRoute.includes('payment'));
  return currentRoute.includes('payment');
}
isDashboardActive(): boolean {
  const currentRoute = this.currentRoute$.value;
  //console.log("dashboard",this.currentRoute.includes('dashboard'));
  return currentRoute.includes('dashboard');
}
isUserAccessActive(): boolean {
  const currentRoute = this.currentRoute$.value;
  //console.log("user",this.currentRoute.includes('user'));
  return (currentRoute.includes('user')|| currentRoute.includes('role'));
}
isSystemSettingsActive(): boolean {
  const currentRoute = this.currentRoute$.value;
  
  return (currentRoute.includes('service')|| currentRoute.includes('technical') || currentRoute.includes('hierarchy'));
}
toggleSubmenu1() {
  this.isUserAccessOpen = !this.isUserAccessOpen;
}

toggleSettingsMenu() {
  this.isSettingsOpen = !this.isSettingsOpen;
}
}

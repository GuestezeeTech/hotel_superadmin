import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuBarComponent } from './shared/menu-bar/menu-bar.component';
import { HeaderComponent } from './shared/header/header.component';
// import { PushService } from './services/push.service';
import { NotificationService } from './notification/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,LoginComponent,MenuBarComponent,HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit  {
  showSidebar = true;
  notifications:any=[];
  showNotification=false;
  title = 'GUESTEZEE_ADMIN';
  private routesWithSidebar = ['/login','/','/view']; // Add routes where sidebar is required
  constructor(private router: Router,
    // private pushService:PushService,private notificationService:NotificationService
  ) {
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
ngOnInit(): void {
  // Push service listener
  // this.pushService.onMessageListener(payload => {
  //   console.log('📩 Foreground message received:', payload);
  //   this.notificationService.addNotification({
  //     initials: payload.data?.['initials'] || 'N',
  //     name: payload.notification?.title || 'New Notification',
  //     time: new Date().toLocaleTimeString(),
  //     body: payload.notification?.body
  //   });
  // });

  // Subscribe to notifications list
  // this.notificationService.notifications$.subscribe(list => this.notifications = list);
  // Subscribe to panel visibility
  // this.notificationService.showPanel$.subscribe(show => this.showNotification = show);

  // ✅ Only add service worker event listener if available
  if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event: any) => {
      if (event.data?.type === 'notification-click') {
        console.log('Notification clicked payload:', event.data.payload);
        this.router.navigate(['/task-management']);
      }
    });
  } else {
    console.warn('⚠️ Service Worker not available. Messaging disabled.');
  }
}

// ngOnInit(): void {
//   this.pushService.onMessageListener(payload => {
//       console.log('📩 Foreground message received:', payload);
//       // Push notification into service
//       this.notificationService.addNotification({
//         initials: payload.data?.['initials'] || 'N',
//         name: payload.notification?.title || 'New Notification',
//         time: new Date().toLocaleTimeString(),
//         body: payload.notification?.body
//       });
//     });
//     // Subscribe to notifications list
//     this.notificationService.notifications$.subscribe(list => this.notifications = list);
//     // Subscribe to panel visibility
//     this.notificationService.showPanel$.subscribe(show => this.showNotification = show);
//     navigator.serviceWorker.addEventListener('message', (event: any) => {
//       if (event.data?.type === 'notification-click') {
//         console.log('Notification clicked payload:', event.data.payload);
//         // Navigate if needed
//         this.router.navigate(['/task-management']);
//       }
//     });
// }
updateMenu(value: string) {
  this.selectedMenuItem = value; // Update selected menu value
  //console.log(this.selectedMenuItem,"tt");
  
  
}
}
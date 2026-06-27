import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, NavigationCancel, NavigationError, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { MenuBarComponent } from './shared/menu-bar/menu-bar.component';
import { HeaderComponent } from './shared/header/header.component';
// import { PushService } from './services/push.service';
import { NotificationService } from './notification/notification.service';
import { LocalStorageService } from './auth-services/local-storage.service';
import { LoaderComponent } from './shared/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, MenuBarComponent, HeaderComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit, OnDestroy {
  showSidebar = true;
  notifications: any = [];
  showNotification = false;
  title = 'GUESTEZEE_ADMIN';
  private routesWithSidebar = ['/login', '/', '/view']; // Add routes where sidebar is required
  selectedMenuItem: string = '';
  isRouteLoading = false;
  private isInitialNavigation = true;

  // Checks whether the given input element is an email/mail field
  private isEmailInputField(target: HTMLInputElement): boolean {
    const type = (target.getAttribute('type') || 'text').toLowerCase();
    const name = (target.getAttribute('name') || '').toLowerCase();
    const id = (target.id || '').toLowerCase();
    const fcn = (target.getAttribute('formcontrolname') || '').toLowerCase();
    const ph = (target.getAttribute('placeholder') || '').toLowerCase();
    return (
      type === 'email' ||
      name === 'email' || name === 'mail' || name.includes('email') ||
      (name.includes('mail') && !name.includes('address')) ||
      id === 'email' || id === 'mail' || id.includes('email') ||
      (id.includes('mail') && !id.includes('address')) ||
      fcn === 'email' || fcn === 'mail' || fcn.includes('email') ||
      (fcn.includes('mail') && !fcn.includes('address')) ||
      ph.includes('email') ||
      (ph.includes('mail') && !ph.includes('address'))
    );
  }

  // Flag to suppress handleGlobalInput for the synthetic event we dispatch ourselves
  private _suppressInput = false;

  showNotFoundModal = false;

  // Keydown handler: intercepts uppercase characters BEFORE browser inserts them.
  // This avoids Angular's reactive form writeValue() resetting the cursor to end.
  handleGlobalKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    const tag = target.tagName;
    const type = (target.getAttribute('type') || 'text').toLowerCase();
    const isTextEntry = tag === 'TEXTAREA' || (tag === 'INPUT' && ['text', 'email', 'search', 'url', 'tel'].includes(type));
    if (!isTextEntry) return;
    if (!this.isEmailInputField(target)) return;

    // Only intercept single uppercase letters (A-Z), skip shortcuts like Ctrl+C
    if (
      event.key.length === 1 &&
      event.key >= 'A' && event.key <= 'Z' &&
      !event.ctrlKey && !event.metaKey && !event.altKey
    ) {
      event.preventDefault();
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const cursorAfter = start + 1; // where cursor should land after inserting 1 char

      // Manually insert the lowercase character at the current cursor position
      const lower = event.key.toLowerCase();
      target.value = target.value.slice(0, start) + lower + target.value.slice(end);

      // Notify Angular's reactive form / ngModel that the value changed.
      // Suppress our own handleGlobalInput from reacting to this synthetic event.
      // Angular's (input)="clearError('email')" may call markAsPristine() → CD → writeValue()
      // which resets cursor to end. So we restore AFTER via microtask.
      this._suppressInput = true;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      this._suppressInput = false;

      // Restore cursor AFTER Angular's synchronous markAsPristine/writeValue pipeline
      Promise.resolve().then(() => {
        target.setSelectionRange(cursorAfter, cursorAfter);
      });
    }
  };

  // Input handler: handles paste / autofill / IME — no cursor issue in those cases
  handleGlobalInput = (event: Event) => {
    if (this._suppressInput) return; // ignore our own synthetic event
    const target = event.target as HTMLInputElement;
    if (!target) return;
    const tag = target.tagName;
    const type = (target.getAttribute('type') || 'text').toLowerCase();
    const isTextEntry = tag === 'TEXTAREA' || (tag === 'INPUT' && ['text', 'email', 'search', 'url', 'tel'].includes(type));
    if (!isTextEntry) return;
    if (!this.isEmailInputField(target)) return;
    if (target.value && target.value !== target.value.toLowerCase()) {
      target.value = target.value.toLowerCase();
    }
  };

  constructor(private router: Router, private localservice: LocalStorageService
    // private pushService:PushService,private notificationService:NotificationService
  ) {
    this.router.events.subscribe(event => {
      if (
        event instanceof NavigationStart ||
        event instanceof RouteConfigLoadStart
      ) {
        const targetUrl = ('url' in event ? (event as any).url : '').toLowerCase();
        const isBypassLoader = targetUrl.includes('/login') ||
          targetUrl === '/';

        if (!this.isInitialNavigation && !isBypassLoader) {
          this.isRouteLoading = true;
        }

        if (event instanceof NavigationStart) {
          const isLoggedIn = !!this.localservice.get('UserId') && this.localservice.get('loggedOut') !== 'true';
          const url = event.url.split('?')[0];
          const cleanUrl = url.toLowerCase().replace(/\/+$/, '');
          const isBypassRoute = cleanUrl === '/' || cleanUrl === '/login' || cleanUrl.startsWith('/login');

          // Global Guard: If not logged in and not accessing bypass routes, prevent access and redirect to login immediately
          if (!isLoggedIn && !isBypassRoute) {
            this.router.navigate(['/login'], { replaceUrl: true });
            return;
          }
        }
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof RouteConfigLoadEnd
      ) {
        this.isRouteLoading = false;
        this.isInitialNavigation = false;
      }

      if (event instanceof NavigationEnd) {
        const isLoggedIn = !!this.localservice.get('UserId') && this.localservice.get('loggedOut') !== 'true';
        const url = event.urlAfterRedirects.split('?')[0]; //newly added Ignore query params
        const cleanUrl = url.toLowerCase().replace(/\/+$/, '');
        const isBypassRoute = cleanUrl === '/' || cleanUrl === '/login' || cleanUrl.startsWith('/login');

        // Global Guard: If not logged in and not accessing bypass routes, prevent access and redirect to login
        if (!isLoggedIn && !isBypassRoute) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return;
        }

        this.showSidebar = this.routesWithSidebar.some(route => {
          // return (route === event.url || event.url.startsWith("/view-hierarchy" + '/')); //newly removed for refresh issue
          return (route === url || url.startsWith("/view-hierarchy/"));
        }) || url.includes('email-template') || url.includes('emailtemplate');

        // Wildcard Check: check if matched route configuration path is '**'
        let activeRoute = this.router.routerState.root;
        while (activeRoute.firstChild) {
          activeRoute = activeRoute.firstChild;
        }
        const isWildcard = activeRoute.routeConfig?.path === '**';

        // Store valid internal routes as the last valid URL
        if (isLoggedIn && !isBypassRoute && !isWildcard) {
          this.localservice.set('lastValidUrl', url);
        }

        // Update selected menu item based on current URL
        if (url === '/hotel-list' || url === '/add-new-hotel') {
          this.selectedMenuItem = "Hotels";
        } else if (url === '/user-list') {
          this.selectedMenuItem = "Users";
        } else if (url === '/service-settings') {
          this.selectedMenuItem = "System Settings - Service Settings";
        } else if (url === '/profile') {
          this.selectedMenuItem = "Profile";
        }
      }
    });
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.handleGlobalKeydown, true);
    document.addEventListener('input', this.handleGlobalInput, true);
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

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleGlobalKeydown, true);
    document.removeEventListener('input', this.handleGlobalInput, true);
  }

  updateMenu(value: string) {
    this.selectedMenuItem = value; // Update selected menu value
    //console.log(this.selectedMenuItem,"tt");
  }
}
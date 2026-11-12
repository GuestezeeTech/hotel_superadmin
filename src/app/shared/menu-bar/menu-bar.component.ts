import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { EventEmitter, Output } from '@angular/core';
import { filter } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { UserAccessService } from '../../user-access/user-access.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss'
})
export class MenuBarComponent implements OnInit {
  private currentRoute$ = new BehaviorSubject<string>('');
  @Output() menuSelected = new EventEmitter<string>();
  isSubmenuOpen = false;
  isSettingsSubmenuOpen = false;
  isHotelsOverviewSubmenuOpen = false;
  /** Skip one route-driven submenu close after intentionally opening Settings. */
  private keepSettingsOpenOnce = false;
  /** Skip one route-driven submenu close after intentionally opening Hotels Overview. */
  private keepHotelsOverviewOpenOnce = false;
  currentRoute = '';

  showSidebar = false;
  isUserAccessOpen = false;
  isSettingsOpen = false;
  userAccess: any;

  constructor(
    private router: Router,
    private userAccessService: UserAccessService
  ) {
    this.currentRoute$ = new BehaviorSubject<string>(this.router.url);
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute$.next(event.urlAfterRedirects);
        if (this.keepSettingsOpenOnce) {
          this.keepSettingsOpenOnce = false;
          return;
        }
        if (this.keepHotelsOverviewOpenOnce) {
          this.keepHotelsOverviewOpenOnce = false;
          return;
        }
        // Close flyout after real navigation away from opening click
        if (!this.isSystemSettingsRoute(event.urlAfterRedirects)) {
          this.isSettingsSubmenuOpen = false;
        }
        if (!this.isHotelsOverviewRoute(event.urlAfterRedirects)) {
          this.isHotelsOverviewSubmenuOpen = false;
        }
      });

    this.userAccessService.userAccess$.subscribe((access) => {
      if (access) {
        this.userAccess = access;
      }
    });
    this.userAccess = this.userAccessService.getUserAccess();

    const currentRoute = this.currentRoute$.value;
    if (this.isSystemSettingsRoute(currentRoute)) {
      this.isSettingsSubmenuOpen = true;
    }
    if (this.isHotelsOverviewRoute(currentRoute)) {
      this.isHotelsOverviewSubmenuOpen = true;
    }
  }

  sendValue(value: string) {
    this.menuSelected.emit(value);
    this.isSettingsSubmenuOpen = false;
    this.isHotelsOverviewSubmenuOpen = false;
  }

  sendValue1(_value: string) {
    this.toggleSubmenu();
  }

  toggleSubmenu() {
    this.isSubmenuOpen = !this.isSubmenuOpen;
  }

  toggleSettingsSubmenu(event?: Event) {
    this.setSubmenuFlyoutTop(event);
    this.isSettingsSubmenuOpen = !this.isSettingsSubmenuOpen;
    if (this.isSettingsSubmenuOpen) {
      this.keepSettingsOpenOnce = true;
      this.isHotelsOverviewSubmenuOpen = false;
    }
  }

  selectSettingsLeaf(label: string, event?: Event) {
    event?.stopPropagation();
    this.menuSelected.emit(label);
    this.isHotelsOverviewSubmenuOpen = false;
    // Desktop: keep open. Mobile flyout: close after choosing.
    this.isSettingsSubmenuOpen = !this.isMobileMenu();
  }

  toggleHotelsOverviewSubmenu(event?: Event) {
    this.setSubmenuFlyoutTop(event);
    this.isHotelsOverviewSubmenuOpen = !this.isHotelsOverviewSubmenuOpen;
    if (this.isHotelsOverviewSubmenuOpen) {
      this.keepHotelsOverviewOpenOnce = true;
      this.isSettingsSubmenuOpen = false;
    }
  }

  selectHotelsOverviewLeaf(label: string, event?: Event) {
    event?.stopPropagation();
    this.menuSelected.emit(label);
    this.isSettingsSubmenuOpen = false;
    // Desktop: keep open. Mobile flyout: close after choosing.
    this.isHotelsOverviewSubmenuOpen = !this.isMobileMenu();
  }

  goToEmailTemplate() {
    this.isSettingsSubmenuOpen = false;
    this.isHotelsOverviewSubmenuOpen = false;
    this.menuSelected.emit('Email Template');
    window.location.href = '/email-template/email-preview/';
  }

  isHotelActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    return (
      currentRoute.includes('hotel-list') ||
      currentRoute.includes('add-new-hotel') ||
      currentRoute.includes('edit-new-hotel') ||
      currentRoute.includes('hotel-preview')
    );
  }

  isDashboardActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    if (
      currentRoute.includes('platform-overview') ||
      this.isHotelsOverviewRoute(currentRoute)
    ) {
      return false;
    }
    return (
      currentRoute.includes('dashboard') ||
      currentRoute.includes('hotel-reviews') ||
      currentRoute.includes('hotel-details') ||
      currentRoute.includes('expiry-details') ||
      currentRoute.includes('rating')
    );
  }

  isPlatformOverviewActive(): boolean {
    return this.currentRoute$.value.includes('platform-overview');
  }

  isHotelsOverviewMenuActive(): boolean {
    return this.isHotelsOverviewRoute(this.currentRoute$.value) || this.isHotelsOverviewSubmenuOpen;
  }

  isHotelOverviewActive(): boolean {
    const r = this.currentRoute$.value;
    return r.includes('overview-dashboard') || r.includes('kot-dashboard');
  }

  isFbDashboardActive(): boolean {
    return this.currentRoute$.value.includes('/fb/dashboard') || this.currentRoute$.value.includes('fb/dashboard');
  }

  isFoDashboardActive(): boolean {
    return this.currentRoute$.value.includes('/fo/dashboard') || this.currentRoute$.value.includes('fo/dashboard');
  }

  isHkDashboardActive(): boolean {
    return this.currentRoute$.value.includes('/hk/dashboard') || this.currentRoute$.value.includes('hk/dashboard');
  }

  private isHotelsOverviewRoute(route: string): boolean {
    const r = String(route || '').toLowerCase();
    return (
      r.includes('overview-dashboard') ||
      r.includes('kot-dashboard') ||
      r.includes('/fb/dashboard') ||
      r.includes('fb/dashboard') ||
      r.includes('/fo/dashboard') ||
      r.includes('fo/dashboard') ||
      r.includes('/hk/dashboard') ||
      r.includes('hk/dashboard')
    );
  }

  isEmailTemplateActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    return currentRoute.includes('email-template') || currentRoute.includes('emailtemplate');
  }

  isUserAccessActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    return currentRoute.includes('user') || currentRoute.includes('role');
  }

  isSystemSettingsActive(): boolean {
    return this.isSystemSettingsRoute(this.currentRoute$.value);
  }

  isSystemSettingsMenuActive(): boolean {
    return this.isSystemSettingsActive() || this.isSettingsSubmenuOpen;
  }

  ispaymentActivationActive(): boolean {
    return this.currentRoute$.value.includes('payment-activation');
  }

  isserviceSettingsActive(): boolean {
    return this.currentRoute$.value.includes('service');
  }

  istechnicalSettingsActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    return currentRoute.includes('technical') || currentRoute.includes('tech');
  }

  isthierarchySettingsActive(): boolean {
    return this.currentRoute$.value.includes('hierarchy');
  }

  toggleSubmenu1() {
    this.isUserAccessOpen = !this.isUserAccessOpen;
  }

  toggleSettingsMenu() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  isPaymentActive(): boolean {
    const currentRoute = this.currentRoute$.value;
    return (
      currentRoute.includes('payment-tab-view') ||
      currentRoute.includes('payment-details') ||
      currentRoute.includes('payment-summary')
    );
  }

  issubscriptionSettingsActive(): boolean {
    return this.currentRoute$.value.includes('payment-subscription');
  }

  private isSystemSettingsRoute(route: string): boolean {
    const r = String(route || '').toLowerCase();
    return (
      r.includes('service') ||
      r.includes('technical') ||
      r.includes('tech-info') ||
      r.includes('hierarchy') ||
      r.includes('subscription') ||
      r.includes('payment-subscription') ||
      r.includes('payment-activation')
    );
  }

  private isMobileMenu(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 1280;
  }

  private setSubmenuFlyoutTop(event?: Event): void {
    const el = event?.currentTarget as HTMLElement | undefined;
    if (!el || !this.isMobileMenu()) {
      return;
    }
    const rectTop = Math.round(el.getBoundingClientRect().top);
    const maxTop = Math.max(8, window.innerHeight - 220);
    const top = Math.min(Math.max(8, rectTop), maxTop);
    document.documentElement.style.setProperty('--submenu-flyout-top', `${top}px`);
  }
}

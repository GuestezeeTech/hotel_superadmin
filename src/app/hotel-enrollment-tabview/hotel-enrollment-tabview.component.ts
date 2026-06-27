import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { MenuBarComponent } from '../shared/menu-bar/menu-bar.component';
import { OfficeDetailsComponent } from './office-details/office-details.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';
// import { ServiceDetailsComponent } from './service-details/service-details.component';
import { ServiceTabListComponent } from './service-tab-list/service-tab-list.component';
import { HierarchyDetailsComponent } from './hierarchy-details/hierarchy-details.component';
import { HotelTechnicalInfoComponent } from './technical-info/technical-info.component';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { HotelEnrollmentTabviewService } from './hotel-enrollment-tabview.service';
import { PaymentSubscriptionManagementCustomerComponent } from '../payment-subscription-management-customer/payment-subscription-management.component';
// import { PaymentSubscriptionManagementCustomerComponent } from '../payment-subscription-management/payment-subscription-management.component';
import { LoaderService } from '../shared/loader/loader.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ENDPOINTS } from '../app.config';
import html2pdf from 'html2pdf.js';



@Component({
  selector: 'app-hotel-enrollment-tabview',
  standalone: true,
  imports: [HeaderComponent, MenuBarComponent, OfficeDetailsComponent, PropertyDetailsComponent, ServiceTabListComponent, PaymentSubscriptionManagementCustomerComponent, HierarchyDetailsComponent, HotelTechnicalInfoComponent, CommonModule],
  templateUrl: './hotel-enrollment-tabview.component.html',
  styleUrl: './hotel-enrollment-tabview.component.scss'
})
export class HotelEnrollmentTabviewComponent implements OnInit {
  @ViewChild('pdfContent') pdfContent!: ElementRef;
  private currentRoute$ = new BehaviorSubject<string>('');
  hotelId: Number | null = null;
  customerdata: any
  idlistToDelete: any = []
  // Newly added: flag to detect view-only mode (hotel-preview route)
  isViewMode: boolean = false;
  isPaymentDone: boolean = false;
  requestedTab: string | null = null;
  tabSetFromQuery: boolean = false;
  options = {
    autoClose: true,
    keepAfterRouteChange: false

  };
  ngOnInit(): void {
    // Newly added: detect view-only mode
    this.isViewMode = this.router.url.includes('hotel-preview');

    this.hotelenrollmentservice.currentData.subscribe(event => {
      if (event === 'refreshCustomer') {
        if (this.hotelId && this.hotelId !== 0) {
          this.getCustomerById(false);
        }
      }
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute$.next(event.urlAfterRedirects); // ✅ Update BehaviorSubject
        //console.log("Current Route Updated:", event.urlAfterRedirects);
      });


    this.route.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);
      //console.log('Hotel ID:', this.hotelId);
      if (this.hotelId != 0) {
        this.getCustomerById(true)// Debugging

      }
      // if (this.router.url.includes('preview')) {
      //   //console.log("inside preview")
      //   setTimeout(() => this.downloadPDF(), 700); // Give time to render
      // }
    });

    this.route.queryParams.subscribe(params => {
      const tabId = params['tab'];
      if (tabId) {
        this.requestedTab = tabId;
        this.tabSetFromQuery = true;
        const tab = document.getElementById(tabId);
        if (tab) {
          (tab as HTMLAnchorElement).click();
        }
      }
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: null },
        queryParamsHandling: 'merge'
      });
    });
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authTokenService: AuthTokenService,
    private hotelenrollmentservice: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private alertService: AlertsService, private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.currentRoute$ = new BehaviorSubject<string>(this.router.url); // ✅
  }


  get shouldHideTabs(): boolean {
    //console.log("Checking shouldHideTabs:", this.currentRoute$ );
    const currentRoute = this.currentRoute$.value;
    //console.log(currentRoute.includes('add-new-hotel'),"this.currentRoute.includes('add-new-hotel')");

    return currentRoute.includes('add-new-hotel');
  }

  // ── Edit mode: sequential unlock (each tab unlocks when previous is saved) ──

  /** Tab 2 (Property Details): unlocked once Office Details is saved */
  get isTab2Accessible(): boolean {
    return this.hotelId !== 0 && !!this.customerdata?.is_office_details_exists;
  }

  /** Tab 3 (Technical Info): unlocked once both Office + Property Details are saved */
  get isTab3Accessible(): boolean {
    return this.isTab2Accessible && !!this.customerdata?.is_property_details_exists;
  }

  /** All three core tabs (Office, Property, Technical) are filled */
  get isAllThreeTabsFilled(): boolean {
    return this.isTab3Accessible && !!this.customerdata?.is_technical_info_exists;
  }

  /** Customer status is approved (case-insensitive) */
  get isCustomerApproved(): boolean {
    return this.customerdata?.status?.toLowerCase() === 'approved';
  }

  /** Tabs 4 & 5 (Services & Hierarchy): requires all 3 tabs filled AND status approved */
  get isServicesAndHierarchyAccessible(): boolean {
    return this.isAllThreeTabsFilled && this.isCustomerApproved;
  }

  // ── View mode: each tab accessible only if IT ITSELF has data ───────────────

  /** Tab 2 in VIEW mode: accessible only if Property Details data exists */
  get isTab2ViewAccessible(): boolean {
    return !!this.customerdata?.is_property_details_exists;
  }

  /** Tab 3 in VIEW mode: accessible only if Technical Info data exists */
  get isTab3ViewAccessible(): boolean {
    return !!this.customerdata?.is_technical_info_exists;
  }

  // Services, Hierarchy & Payment use the same conditions in both modes
  // (isServicesAndHierarchyAccessible & isAllThreeTabsFilled) since
  // they inherently require all 3 tabs to have data.

  // ── Tab click guard ───────────────────────────────────────────────────────────

  /**
   * Returns a specific alert message pointing to exactly which tab is blocking.
   * Checks each condition in order so the user knows precisely what to fill next.
   */
  private getTabBlockMessage(tab: 'property' | 'technical' | 'services' | 'hierarchy' | 'payment'): string {
    const d = this.customerdata;
    switch (tab) {

      case 'property':
        // Can only be blocked because Office Details is not filled
        return 'Please fill the Registered Office Details.';

      case 'technical':
        // Walk conditions in order to find the first missing step
        if (!d?.is_office_details_exists) {
          return 'Please fill the Registered Office Details.';
        }
        return 'Please fill the Property Details.';

      case 'services':
      case 'hierarchy':
        /* if (!d?.is_office_details_exists) {
          return 'Please fill the Registered Office Details.';
        }
        if (!d?.is_property_details_exists) {
          return 'Please fill the Property Details.';
        }
        if (!d?.is_technical_info_exists) {
          return 'Please fill the Technical Info.';
        } */
        // All 3 filled but not approved
        return 'Hotel status must be Approved to access the Services & Hierarchy tabs.';

      case 'payment':
        /*  if (!d?.is_office_details_exists) {
           return 'Please fill the Registered Office Details.';
         }
         if (!d?.is_property_details_exists) {
           return 'Please fill the Property Details.';
         }
         return 'Please fill the Technical Info.'; */
        return 'Registration Process Not Completed - Please fill all required details first.';

      default:
        return 'This tab is not accessible yet.';
    }
  }


  /**
   * Called on every tab anchor click (edit mode only — view mode uses pointer-events:none).
   * Prevents navigation and shows a contextual alert if the tab is locked.
   *
   * NOTE: event.isTrusted is true for genuine user clicks and false for
   * programmatic .click() calls (e.g. from "Save & Continue" in child tabs).
   * We skip the guard for programmatic clicks so they always pass through.
   */
  onTabClick(event: Event, isAccessible: boolean, tab: 'property' | 'technical' | 'services' | 'hierarchy' | 'payment'): void {
    // Programmatic clicks (Save & Continue) must never be blocked
    if (!event.isTrusted) return;

    if (!isAccessible) {
      event.preventDefault();
      event.stopPropagation();
      this.alertService.error(this.getTabBlockMessage(tab), this.options);
    }
  }

  /**
   * Returns a short tooltip string for locked tabs in VIEW mode.
   */
  getTabTooltip(tab: 'property' | 'technical' | 'services' | 'hierarchy' | 'payment'): string {
    switch (tab) {

      case 'property':
        return 'No data available — Property Details not filled.';

      case 'technical':
        // Technical Info is toggle/configuration-based, not a standard form
        return 'No data available — Technical Info not configured.';

      case 'services':
      case 'hierarchy':
        // Services & Hierarchy are gated by approval; always show the approval message
        return 'Access restricted until hotel is approved.';

      case 'payment':
        return 'Registration Process Not Completed';

      default:
        return 'No data available.';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  downloadPDF() {
    const element = this.pdfContent.nativeElement;

    // 1. Find all tab panes inside the container
    const tabPanes = element.querySelectorAll('.tab-pane');

    // 2. Store current classes so you can revert later
    const originalClasses: string[] = [];
    tabPanes.forEach((pane: HTMLElement, i: number) => {
      originalClasses[i] = pane.className;
      // Add show and active classes to make all tabs visible
      pane.classList.add('show', 'active');
    });

    // 3. Temporarily display the container if hidden
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    const options = {
      margin: 0.5,
      filename: 'all-tabs.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // 4. Generate PDF
    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        // 5. Revert all tab panes classes back to original (hide non-active tabs again)
        tabPanes.forEach((pane: HTMLElement, i: number) => {
          pane.className = originalClasses[i];
        });

        // 6. Revert container display
        element.style.display = originalDisplay;
      });
  }
  replaceInputsWithText(container: HTMLElement) {
    const fields = container.querySelectorAll('input, textarea, select');

    fields.forEach((field) => {
      const span = document.createElement('span');

      if (field instanceof HTMLInputElement) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          span.textContent = field.checked ? 'Yes' : 'No';
        } else {
          span.textContent = field.value;
        }
      } else if (field instanceof HTMLTextAreaElement) {
        span.textContent = field.value;
      } else if (field instanceof HTMLSelectElement) {
        span.textContent = field.options[field.selectedIndex]?.text || '';
      }

      span.style.display = 'inline-block';
      span.style.minWidth = '100px';
      span.style.borderBottom = '1px solid #ccc';

      field.replaceWith(span);
    });
  }



  getCustomerById(autoNavigate: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.hotelId
          }
        }
      };

      this.hotelenrollmentservice.getCustomerById(requestBody).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            this.customerdata = resp.result.data[0];

            // Check order details to see if payment is confirmed
            let orderRequest = {
              domain_name: this.authTokenService.getDomain(),
              user_id: this.authTokenService.getUserId(),
              extras: {
                find: {
                  customer_id: Number(this.hotelId)
                }
              },
              pagination: false
            };
            this.hotelenrollmentservice.orderDetailsGetById(orderRequest).subscribe(
              orderResp => {
                const confirmedOrders = orderResp?.result?.data?.filter(
                  (order: any) => order.status === "Order Confirmed" || order.status === "Confirmed"
                ) || [];

                this.isPaymentDone = confirmedOrders.length > 0;

                // Newly added: auto-navigate to last filled tab (only for edit mode)
                if (autoNavigate && this.router.url.includes('edit-new-hotel')) {
                  setTimeout(() => this.checkAndActivateLastTab(), 300);
                }
                resolve();
              },
              err => {
                this.isPaymentDone = false;
                if (autoNavigate && this.router.url.includes('edit-new-hotel')) {
                  setTimeout(() => this.checkAndActivateLastTab(), 300);
                }
                resolve();
              }
            );
          }
        },
        err => {
          this.loaderService.emitComplete();
          if (err.error.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertService.error(err.error.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }

  // Navigate to the last filled (or next pending) tab on load
  checkAndActivateLastTab() {
    console.log('checkAndActivateLastTab started');
    if (this.tabSetFromQuery) {
      if (this.requestedTab) {
        const tab = document.getElementById(this.requestedTab);
        if (tab) {
          (tab as HTMLAnchorElement).click();
          this.requestedTab = null;
        }
      }
      return;
    }
    // Stay on the 1st tab (Office Details) initially when opening the edit page
    return;
  }


}

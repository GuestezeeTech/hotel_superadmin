import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { MenuBarComponent } from '../shared/menu-bar/menu-bar.component';
import { OfficeDetailsComponent } from './office-details/office-details.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';
import { ServiceDetailsComponent } from './service-details/service-details.component';
import { HierarchyDetailsComponent } from './hierarchy-details/hierarchy-details.component';
import { TechnicalInfoComponent } from './technical-info/technical-info.component';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { HotelEnrollmentTabviewService } from './hotel-enrollment-tabview.service';
import { LoaderService } from '../shared/loader/loader.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import html2pdf from 'html2pdf.js';



@Component({
  selector: 'app-hotel-enrollment-tabview',
  standalone: true,
  imports: [HeaderComponent, MenuBarComponent, OfficeDetailsComponent, PropertyDetailsComponent, ServiceDetailsComponent, HierarchyDetailsComponent, TechnicalInfoComponent, CommonModule],
  templateUrl: './hotel-enrollment-tabview.component.html',
  styleUrl: './hotel-enrollment-tabview.component.scss'
})
export class HotelEnrollmentTabviewComponent implements OnInit {
  @ViewChild('pdfContent') pdfContent!: ElementRef;
  private currentRoute$ = new BehaviorSubject<string>('');
  hotelId: Number | null = null;
  customerdata: any
  idlistToDelete: any = []
  options = {
    autoClose: true,
    keepAfterRouteChange: false

  };
  ngOnInit(): void {
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
        this.getCustomerById()// Debugging

      }
      if (this.router.url.includes('preview')) {
        //console.log("inside preview")
        setTimeout(() => this.downloadPDF(), 700); // Give time to render
      }
    });

    this.route.queryParams.subscribe(params => {
      const tabId = params['tab'];
      if (tabId) {
        const tab = document.getElementById(tabId);
        if (tab) {
          (tab as HTMLAnchorElement).click();
        }
        // setTimeout(() => {
        //   const tab = document.getElementById(tabId);
        //   if (tab) {
        //     (tab as HTMLAnchorElement).click();
        //   }
        // }, 100); // Delay to ensure DOM is ready
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

  ) {
    this.currentRoute$ = new BehaviorSubject<string>(this.router.url); // ✅
  }


  get shouldHideTabs(): boolean {
    //console.log("Checking shouldHideTabs:", this.currentRoute$ );
    const currentRoute = this.currentRoute$.value;
    //console.log(currentRoute.includes('add-new-hotel'),"this.currentRoute.includes('add-new-hotel')");

    return currentRoute.includes('add-new-hotel');
  }

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



  getCustomerById(): Promise<void> {
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
            //console.log(this.customerdata, "RESPDATA");
            //console.log(Array.isArray(this.customerdata)); 

            resolve();  // Resolve promise when data is set
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

}

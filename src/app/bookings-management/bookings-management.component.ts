import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { AlertsService } from '../shared/alerts/alerts.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../auth-services/local-storage.service';
import { HotelListService } from '../hotel-list/hotel-list.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { ENDPOINTS } from '../app.config';
import { LoaderService } from '../shared/loader/loader.service';

@Component({
  selector: 'app-bookings-management',
  standalone: true,
  imports: [AlertsComponent, CommonModule],
  templateUrl: './bookings-management.component.html',
  styleUrl: './bookings-management.component.scss'
})

export class BookingsManagementComponent {
  currentStatus: string | null = null;
  customerlist: any = []

  constructor(
    private route: ActivatedRoute,
    private alerts: AlertsService,
    private routeUrl: Router,
    private localStorageService: LocalStorageService,
    private hotellistservice: HotelListService,
    private authTokenService: AuthTokenService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    // Reset scroll position to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    this.route.paramMap.subscribe(params => {
      let status = params.get('status');
      this.currentStatus = status; // Store the current status for use in the template
      if (status) {
        this.getMembersByStatus(status);
      }
    });
  }

  getMembersByStatus(status: string) {
    this.loaderService.emitLoading();
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        // find: {
        status: status
        // }
      }
    };
    this.hotellistservice
      .postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE)
      .subscribe({
        next: (resp: any) => {
          this.loaderService.emitComplete();
          if (
            resp.success === 1 &&
            resp.status_code === 200 &&
            resp.result?.data?.length
          ) {
            const dashboardData = resp.result.data[0];
            const statusData =
              dashboardData.hotel_member_status?.find(
                (item: any) => item.status === status
              );
            this.customerlist = statusData?.members || [];
            console.log(this.customerlist);
          }
          else {
            this.customerlist = [];
            console.log("No members found for the status: " + status);
            console.log("Message:" + resp.message);
          }
        },
        error: (err) => {
          this.loaderService.emitComplete();
          console.error(err);
        }
      });
  }

  // Add this method to get the status title
  getStatusTitle(): string {
    const status = this.route.snapshot.paramMap.get('status');
    switch (status) {
      case 'active':
        return 'Active Members';
      case 'inactive':
        return 'Inactive Members';
      case 'pending':
        return 'Pending Members';
      default:
        return 'Members';
    }
  }

  // Add this method to handle back navigation
  goBack(): void {
    this.routeUrl.navigate(['/dashboard']);
  }

}

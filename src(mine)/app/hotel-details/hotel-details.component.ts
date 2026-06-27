import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { LoaderService } from '../shared/loader/loader.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { ENDPOINTS } from '../app.config';

@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-details.component.html',
  styleUrl: './hotel-details.component.scss'
})
export class HotelDetailsComponent implements OnInit {
  hotels: any[] = [];
  hotelId: string | null = null;
  
  // Default values for percentages if API lacks them
  ratingPercentages = [
    { star: 5, percentage: 0 },
    { star: 4, percentage: 0 },
    { star: 3, percentage: 0 },
    { star: 2, percentage: 0 },
    { star: 1, percentage: 0 }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private authTokenService: AuthTokenService,
    private dashboardService: DashboardService,
    private loaderService: LoaderService,
    private alertService: AlertsService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.hotelId = params.get('id');
      if (this.hotelId) {
        this.getHotelReviewData();
      }
    });
  }

  getStarColor(star: number): string {
    switch (star) {
      case 5: return '#27AE60';
      case 4: return '#27AE60';
      case 3: return '#FFB52D';
      case 2: return '#F2994A';
      case 1: return '#FA3434';
      default: return '#ccc';
    }
  }

  getHotelReviewData() {
    this.loaderService.emitLoading();

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {
          "id": Number(this.hotelId)
        }
      }
    };

    // First call: GET_PROPERTY_SIZE for reviews and ratings
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE).subscribe({
      next: (res: any) => {
        if (res.success === 1 && res.status_code === 200) {
          // Initialize hotels array with review data
          this.hotels = res.result.data || [];
          
          if (this.hotels[0]?.ratingPercentages) {
             this.ratingPercentages = this.hotels[0].ratingPercentages;
          }

          // Second call: getHotelHeaderData for the logo and basic info
          this.getHotelData();
        } else {
          this.loaderService.emitComplete();
          this.alertService.error(res.message || 'Failed to fetch review data');
        }
      },
      error: (err) => {
        this.loaderService.emitComplete();
        this.handleError(err);
      }
    });
  }

  getHotelData() {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {
          id: Number(this.hotelId)
        }
      }
    };

    // Second call: GETALLCUSTOMER for the header details and logo
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GETALLCUSTOMER).subscribe({
      next: (res: any) => {
        this.loaderService.emitComplete();
        if (res.success === 1 && res.result?.data?.[0]) {
          const hotel = res.result.data[0];
          console.log('[hotel-details] Header Data:', hotel);
          
          // Merge header details into the first hotel object
          if (this.hotels[0]) {
            this.hotels[0] = {
              ...this.hotels[0],
              name: hotel.name,
              hotelData_id: hotel.customer_member_id,
              brand: hotel.property_details?.contact_details?.brand,
              property_size: hotel.property_details?.property_address?.property_size,
              location: hotel.property_details?.property_address?.property_location || hotel.property_details?.property_address?.property_city,
              hotel_logo: hotel.property_details?.hotel_logo,
              panDetails: hotel.property_details?.property_address?.property_pan
            };
          }
        }
      },
      error: (err) => {
        this.loaderService.emitComplete();
        this.handleError(err);
      }
    });
  }

  handleError(err: any) {
    if (err.error && err.error.statusCode === 403) {
      this.alertService.error('Session Time Out! Please login Again');
      this.router.navigate([`/login`], { skipLocationChange: false });
    } else if (err.error && err.error.message) {
      this.alertService.error(err.error.message);
    } else {
      this.alertService.error('Something bad happened. Please try again!');
    }
  }

  goBack() {
    this.location.back();
  }

  navigateToRating() {
    this.router.navigate(['/rating']);
  }

  getCategoryLabel(propertySize: string | undefined): string {
    switch (propertySize) {
      case '01-50 Rooms': return 'Bronze';
      case '51-101 Rooms': return 'Silver';
      case '101-150 Rooms': return 'Gold';
      case '150 and above Rooms': return 'Platinum';
      default: return propertySize || 'N/A';
    }
  }
}

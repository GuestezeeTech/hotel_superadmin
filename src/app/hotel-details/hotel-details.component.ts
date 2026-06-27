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
  memberId: string = '';
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
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.memberId = navigation.extras.state['memberId'];
    }
    // Fallback for page refresh
    if (!this.memberId) {
      this.memberId = history.state?.memberId;
    }
    this.getHotelReviewData();
  }

  getHotelReviewData() {
    this.loaderService.emitLoading();
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        // "find": {
        "member_id": this.memberId
        // }
      }
    };
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE_ANALYTICS).subscribe({
      next: (res: any) => {
        this.loaderService.emitComplete();
        if (res.success === 1 && res.status_code === 200) {
          const summary = res.result?.hotel_review_summary;
          if (summary) {
            const hotelInfo = summary.hotel_info || {};
            const reviewsSummary = summary.reviews_summary || {};
            const breakdown = reviewsSummary.rating_breakdown || {};
            const feedbacks = summary.feedbacks || [];
            const ratingPercentages = [
              { star: 5, percentage: breakdown['5_star']?.percentage },
              { star: 4, percentage: breakdown['4_star']?.percentage },
              { star: 3, percentage: breakdown['3_star']?.percentage },
              { star: 2, percentage: breakdown['2_star']?.percentage },
              { star: 1, percentage: breakdown['1_star']?.percentage }
            ];
            const guestReviews = feedbacks.map((f: any) => ({
              roomNo: f.room_no,
              guestName: f.guest_name,
              checkedOut: f.checked_out == true ? 'Checked Out' : 'Checked In',
              guestId: f.guest_id,
              // overallRating: f.rating,
              // remarks: f.feedback_text
            }));
            const taxLabel = hotelInfo.pan_details
              ? 'PAN Details'
              : hotelInfo.vat_details
                ? 'VAT Details'
                : 'Tax Details';
            const taxDetails =
              hotelInfo.pan_details ||
              hotelInfo.vat_details ||
              '-';
            this.hotels = [{
              hotel_logo: hotelInfo.hotel_logo,
              name: hotelInfo.hotel_name,
              customer_member_id: hotelInfo.hotel_code,
              brand: hotelInfo.brand,
              property_size: hotelInfo.category,
              location: hotelInfo.location,
              reviewedOn: hotelInfo.latest_review_date,
              taxLabel,
              taxDetails,
              todayAvgRating: reviewsSummary.today_average_rating,
              overallAvgRating: reviewsSummary.overall_rating_average,
              todayReviewCount: reviewsSummary.today_review_count,
              overallReviewCount: reviewsSummary.overall_reviews_count,
              totalRatingsCount: reviewsSummary.overall_reviews_count,
              ratingPercentages: ratingPercentages,
              guestReviews: guestReviews
            }];
            this.ratingPercentages = ratingPercentages;
          } else {
            this.hotels = [];
          }
        } else {
          this.alertService.error(res.message || 'Failed to fetch review data');
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

  /*  goBack() {
     this.location.back();
   } */

  goBack() {
    this.router.navigate(['/hotel-reviews']);
  }

  /* navigateToRating(guestId: number) {
    this.router.navigate(['/rating']);
  } */

  navigateToRating(guestId: number, memberId: string) {
    this.router.navigate(['/rating'], {
      state: {
        guestId: guestId,
        memberId: memberId
      }
    });
  }

  getCategoryLabel(propertySize: string | undefined): string {
    switch (propertySize) {
      case '01-50 Rooms': return 'Bronze';
      case '51-100 Rooms': return 'Silver';
      case '101-150 Rooms': return 'Gold';
      case '150 and above Rooms': return 'Platinum';
      default: return propertySize || 'N/A';
    }
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
}

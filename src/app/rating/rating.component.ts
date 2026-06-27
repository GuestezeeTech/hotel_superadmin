import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { ENDPOINTS } from '../app.config';
import { LoaderService } from '../shared/loader/loader.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss'
})

export class RatingComponent implements OnInit {
  guestId!: number;
  memberId!: string;
  guestDetails: any = {};
  hotelDetails: any = {};
  taskReviews: any[] = [];

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authTokenService: AuthTokenService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.guestId = navigation.extras.state['guestId'];
      this.memberId = navigation.extras.state['memberId'];
    }
    if (!this.guestId) {
      this.guestId = history.state?.guestId;
    }
    if (!this.memberId) {
      this.memberId = history.state?.memberId;
    }
    this.getRatingDetails();
  }

  getRatingDetails() {
    this.loaderService.emitLoading();
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        member_id: this.memberId,
        guest_id: this.guestId
      }
    };
    this.dashboardService
      .postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE_ANALYTICS)
      .subscribe({
        next: (res: any) => {
          this.loaderService.emitComplete();
          if (res.success === 1 && res.status_code === 200) {
            const summary = res.result?.hotel_review_summary;
            if (!summary) {
              console.warn('No hotel review summary found');
              return;
            }
            this.hotelDetails = summary.hotel_info || {};
            const feedbacks = summary.feedbacks || [];
            const guest = feedbacks.find(
              (x: any) => x.guest_id === this.guestId
            );
            if (!guest) {
              console.warn(`Guest with ID ${this.guestId} not found`);
              return;
            }
            this.guestDetails = guest;
            this.taskReviews = guest.task_reviews || [];
          } else {
            console.warn(res.message || 'No data found');
          }
        },
        error: (err) => {
          this.loaderService.emitComplete();
          console.error('Error while fetching rating details:', err);
          if (err.error?.statusCode === 403) {
            console.error('Session Timeout! Please login again.');
            this.router.navigate(['/login']);
          } else if (err.error?.message) {
            console.error('API Error:', err.error.message);
          } else {
            console.error('Something went wrong while fetching rating details.');
          }
        }
      });
  }

  getStarArray(rating: number): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < rating);
  }

  goBack() {
    this.router.navigate(['/hotel-details'], {
      state: {
        memberId: this.memberId
      }
    });
  }
}
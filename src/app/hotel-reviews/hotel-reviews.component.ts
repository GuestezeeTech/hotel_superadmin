import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { LoaderService } from '../shared/loader/loader.service';

@Component({
  selector: 'app-hotel-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-reviews.component.html',
  styleUrl: './hotel-reviews.component.scss'
})

export class HotelReviewsComponent {
  hotelReviews: any[] = [];
  originalHotelReviews: any[] = [];
  isDropdownOpen = false;

  constructor(private routeUrl: Router,
    private authTokenService: AuthTokenService,
    private dashboardService: DashboardService,
    private loaderService: LoaderService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.filter-container') &&
      !target.closest('.filter-icon')
    ) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.gethotelReviews();
  }

  gethotelReviews() {
    this.loaderService.emitLoading();
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {}
      }
    }
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE).subscribe({
      next: (resp) => {
        this.loaderService.emitComplete();
        if (resp.success === 1 && resp.status_code === 200) {
          // hotel_reviews is inside data[0] 
          this.hotelReviews = resp.result.data[0]?.hotel_reviews || [];
          this.originalHotelReviews = [...this.hotelReviews];
        } else {
          console.error('Failed to fetch hotel reviews:', resp.message || 'Unknown error');
        }
      },
      error: (err) => {
        this.loaderService.emitComplete();
        console.error(err);
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(type: string) {
    this.isDropdownOpen = false;
    switch (type) {
      case 'reviewsDesc':
        this.hotelReviews = [...this.hotelReviews].sort(
          (a, b) => Number(b.reviews) - Number(a.reviews)
        );
        break;
      case 'reviewsAsc':
        this.hotelReviews = [...this.hotelReviews].sort(
          (a, b) => Number(a.reviews) - Number(b.reviews)
        );
        break;
      case 'reset':
        this.hotelReviews = [...this.originalHotelReviews];
        break;
    }
  }

  goBack() {
    this.routeUrl.navigate(['/dashboard']);
  }

  // hotel_reviews items only have hotelname - look up GETALLCUSTOMER by name to get customer_member_id
  /*  navigateToDetails(hotelname: string) {
     if (!hotelname) return;
     const requestBody = {
       domain_name: this.authTokenService.getDomain(),
       user_id: this.authTokenService.getUserId(),
       "extras": {
         "find": { "name": hotelname }
       }
     };
     this.dashboardService.postApiCall(requestBody, ENDPOINTS.GETALLCUSTOMER).subscribe(resp => {
       if (resp.success === 1 && resp.result?.data?.[0]) {
         const numericId = resp.result.data[0].id;
         this.routeUrl.navigate([`/hotel-details/${numericId}`]);
       } else {
         console.error('Hotel not found for name:', hotelname);
       }
     });
   } */

  /*  navigateToDetails(memberId: string) {
     if (!memberId) return;
     const requestBody = {
       domain_name: this.authTokenService.getDomain(),
       user_id: this.authTokenService.getUserId(),
       // "extras": {
       // "find": { 
       // "member_id": memberId
       //  }
       // }
     };
     this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE_ANALYTICS).subscribe(resp => {
       if (resp.success === 1) {
         this.routeUrl.navigate([`hotel-details`]);
       } else {
         console.error('Member Id not found for name:', memberId);
       }
     });
   } */

  navigateToDetails(memberId: string) {
    if (!memberId) return;
    this.routeUrl.navigate(['hotel-details'], {
      state: {
        memberId: memberId
      }
    });
  }
}

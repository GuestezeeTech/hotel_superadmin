import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from '../dashboard/dashboard.service';


@Component({
  selector: 'app-hotel-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-reviews.component.html',
  styleUrl: './hotel-reviews.component.scss'
})
export class HotelReviewsComponent {
  // hotelReviews = [
  //   { name: 'Taj Coromandel (Chennai)', date: '12/Feb/2024', rating: 4.5, reviews: '30 Review' },
  //   { name: 'Novotel', date: '12/Feb/2024', rating: 5.0, reviews: '30 Review' },
  //   { name: 'Pullman', date: '12/Feb/2024', rating: 3.8, reviews: '30 Review' },
  //   { name: 'Novotel (OMR)', date: '12/Feb/2024', rating: 4.8, reviews: '30 Review' },
  //   { name: 'The Leela Palace', date: '10/Feb/2024', rating: 4.9, reviews: '45 Review' },
  //   { name: 'Park Hyatt', date: '08/Feb/2024', rating: 4.3, reviews: '28 Review' },
  //   { name: 'Radisson Blu', date: '11/Feb/2024', rating: 4.7, reviews: '33 Review' },
  //   { name: 'ITC Grand Chola', date: '09/Feb/2024', rating: 4.6, reviews: '50 Review' },
  //   { name: 'The Oberoi', date: '13/Feb/2024', rating: 5.0, reviews: '60 Review' },
  //   { name: 'The Westin', date: '07/Feb/2024', rating: 4.4, reviews: '38 Review' },
  //   { name: 'Trident Hotel', date: '06/Feb/2024', rating: 4.2, reviews: '22 Review' },
  //   { name: 'Hyatt Regency', date: '05/Feb/2024', rating: 4.1, reviews: '29 Review' },
  //   { name: 'JW Marriott', date: '04/Feb/2024', rating: 4.9, reviews: '55 Review' },
  //   { name: 'Sheraton Grand', date: '03/Feb/2024', rating: 4.5, reviews: '40 Review' },
  //   { name: 'Le Meridien', date: '02/Feb/2024', rating: 4.0, reviews: '35 Review' },
  //   { name: 'Fairmont Hotel', date: '01/Feb/2024', rating: 3.9, reviews: '20 Review' },
  //   { name: 'St. Regis', date: '31/Jan/2024', rating: 4.8, reviews: '42 Review' },
  //   { name: 'Conrad Hotel', date: '30/Jan/2024', rating: 4.7, reviews: '37 Review' },
  //   { name: 'Shangri-La', date: '29/Jan/2024', rating: 4.6, reviews: '45 Review' }
  // ];

  hotelReviews: any[] = [];
  isDropdownOpen = false;

  constructor(private routeUrl: Router,
    private authTokenService: AuthTokenService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.gethotelReviews();
  }

  gethotelReviews() {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": { }
        }
    }
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE).subscribe(resp => {
      if (resp.success === 1 && resp.status_code === 200) {
        // hotel_reviews is inside data[0] - it's the aggregated hotel review summary list
        this.hotelReviews = resp.result.data[0]?.hotel_reviews || [];
      } else {
        console.error('Failed to fetch hotel reviews:', resp.message || 'Unknown error');
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(title: string) {
    this.isDropdownOpen = false;
  }

  // hotel_reviews items only have hotelname - look up GETALLCUSTOMER by name to get customer_member_id
  navigateToDetails(hotelname: string) {
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
  }

  goBack() {
    this.routeUrl.navigate(['/dashboard']);
  }
}

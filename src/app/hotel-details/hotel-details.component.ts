import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-details.component.html',
  styleUrl: './hotel-details.component.scss'
})
export class HotelDetailsComponent {
  ratingPercentages = [
    { star: 5, percentage: 75, color: '#27AE60' },
    { star: 4, percentage: 50, color: '#27AE60' },
    { star: 3, percentage: 30, color: '#FFB52D' },
    { star: 2, percentage: 20, color: '#F2994A' },
    { star: 1, percentage: 10, color: '#FA3434' }
  ];

  constructor(private routeUrl: Router,
  ) {}

  navigateToRating() {
    this.routeUrl.navigate(['/rating']);
  }

}

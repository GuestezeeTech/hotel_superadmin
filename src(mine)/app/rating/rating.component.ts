import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss'
})
export class RatingComponent {
  constructor(private router: Router) { }
  reviews = [
    {
      icon: "../../assets/images/guestezee/soap.png",
      service: "Soap",
      room: "Room No 123",
      time: "30 min ago",
      rating: 4,
      reviewText: "Good Fragrance"
    },
    {
      icon: "../../assets/images/guestezee/spray.png",
      service: "Room upgrade service",
      room: "Room No 123",
      time: "30 min ago",
      rating: 4,
      reviewText: "Smooth onboard"
    },
    {
      icon: "../../assets/images/guestezee/services.png",
      service: "Concierge Services",
      room: "Room No 123",
      time: "30 min ago",
      rating: 4,
      reviewText: "Good"
    }
  ];

  // Function to generate an array for star ratings
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  goBack() {
    this.router.navigate(['/hotel-details']);
  }
}

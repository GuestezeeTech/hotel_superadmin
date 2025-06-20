import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expiry-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expiry-details.component.html',
  styleUrl: './expiry-details.component.scss'
})
export class ExpiryDetailsComponent {
  expiryDetails = [
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Novotel (OMR)', date: '10/Feb/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Novotel (ECR)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Delhi)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Pullman (Chennai)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Mumbai)', date: '15/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'The Leela Palace', date: '18/Feb/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Park Hyatt', date: '20/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Radisson Blu', date: '22/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'ITC Grand Chola', date: '24/Feb/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'The Oberoi', date: '26/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'The Westin', date: '28/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Trident Hotel', date: '02/Mar/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Hyatt Regency', date: '04/Mar/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'JW Marriott', date: '06/Mar/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Sheraton Grand', date: '08/Mar/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Le Meridien', date: '10/Mar/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Fairmont Hotel', date: '12/Mar/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'St. Regis', date: '14/Mar/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Conrad Hotel', date: '16/Mar/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Shangri-La', date: '18/Mar/25', isUrgent: true }
  ];

  isDropdownOpen = false;

  constructor(private router: Router) { }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(days: number) {
    //console.log(`Filter selected: ${days} days`);
    this.isDropdownOpen = false; // Close dropdown after selection
  }

  
}

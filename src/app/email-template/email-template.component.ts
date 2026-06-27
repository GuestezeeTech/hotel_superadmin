import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-template.component.html',
  // styleUrl: './email-template.component.scss'
})
export class EmailTemplateComponent {
  hotel_name: string = '';
  admin_name: string = '';
  login_url: string = '';
  support_email: string = '';
  subscription_plan: string = '';
  guest_name: string = '';
  room_number: string = '';
  check_in_date: string = '';
  renewal_date: string = '';
  invoice_id: string = '';
  amount: string = '';
  constructor(private router: Router) { }
  
}

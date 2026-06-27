import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ENDPOINTS } from '../app.config';
import { Location } from '@angular/common';
import { LoaderService } from '../shared/loader/loader.service';

@Component({
  selector: 'app-expiry-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expiry-details.component.html',
  styleUrl: './expiry-details.component.scss'
})

export class ExpiryDetailsComponent implements OnInit {
  filterbyDays: any = [];
  expiryDetails: any = [];
  isDropdownOpen = false;

  constructor(private router: Router,
    private location: Location,
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

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  ngOnInit(): void {
    this.getexpiryDetails();
  }

  selectFilter(days: number) {
    //console.log(`Filter selected: ${days} days`);
    this.isDropdownOpen = false; // Close dropdown after selection
    if (days == 2) {
      this.twoDays();
    }
    else if (days == 7) {
      this.sevenDays();
    }
    else if (days == 30) {
      this.thirtyDays();
    }
  }

  getexpiryDetails() {
    this.isDropdownOpen = false;
    this.loaderService.emitLoading();
    // MAKE A SERVICE CALL HERE...
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {
        }
      }
    }
    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE).subscribe({
      next: (resp) => {
        this.loaderService.emitComplete();
        if (resp.success === 1 && resp.status_code === 200) {
          this.expiryDetails = resp.result.data[0].expiry_details;
          this.filterbyDays = resp.result.data[0].filterby_days;
          // this.expiryDetails =resp.result.data[0].expiry_details;
          // this.adminUserData = resp.result.data[0];
          // alert(`Hi ${guestName}, your request has been escalated to ${this.adminUserData.first_name}`);
        }
        else {
          //console.warn('Failed to fetch updated profile data.');
        }
      },
      error: (err) => {
        this.loaderService.emitComplete();
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  twoDays() {
    this.expiryDetails = this.filterbyDays.two_days
    if (this.expiryDetails) {
      this.expiryDetails = [{ "name": "No data found" }]
    }
  }

  sevenDays() {
    this.expiryDetails = this.filterbyDays.seven_days
    if (this.expiryDetails) {
      this.expiryDetails = [{ "name": "No data found" }]
    }
  }

  thirtyDays() {
    this.expiryDetails = this.filterbyDays.thirty_days
    if (this.expiryDetails) {
      this.expiryDetails = [{ "name": "No data found" }]
    }
  }

  //   sevenDays(){
  //   this. propertySize.expiry_details = this. propertySize.filterby_days.seven_days
  //   if(this.propertySize.filterby_days.seven_days.length==0){
  //      this. propertySize.expiry_details =[{"name":"No data found"}]
  //   }
  // }

  // thirtyDays(){
  //   this. propertySize.expiry_details = this. propertySize.filterby_days.thirty_days
  //   if(this.propertySize.filterby_days.thirty_days.length==0){
  //      this. propertySize.expiry_details =[{"name":"No data found"}]
  //   }
  // }
}

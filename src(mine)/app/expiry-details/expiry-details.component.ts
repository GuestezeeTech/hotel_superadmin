import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ENDPOINTS } from '../app.config';
import { Location } from '@angular/common';

@Component({
  selector: 'app-expiry-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expiry-details.component.html',
  styleUrl: './expiry-details.component.scss'
})
export class ExpiryDetailsComponent implements OnInit {
  filterbyDays:any=[];
  expiryDetails:any = [
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Novotel (OMR)', date: '10/Feb/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Novotel (ECR)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Delhi)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Pullman (Chennai)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Mumbai)', date: '15/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'The Leela Palace', date: '18/Feb/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Park Hyatt', date: '20/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Radisson Blu', date: '22/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'ITC Grand Chola', date: '24/Feb/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'The Oberoi', date: '26/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'The Westin', date: '28/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Trident Hotel', date: '02/Mar/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Hyatt Regency', date: '04/Mar/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'JW Marriott', date: '06/Mar/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Sheraton Grand', date: '08/Mar/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Le Meridien', date: '10/Mar/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Fairmont Hotel', date: '12/Mar/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'St. Regis', date: '14/Mar/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Conrad Hotel', date: '16/Mar/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Shangri-La', date: '18/Mar/25', isUrgent: true }
  ];

  isDropdownOpen = false;

  constructor(private router: Router,
    private location: Location,
    private authTokenService:AuthTokenService,
    private dashboardService:DashboardService
  ) { }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
ngOnInit(): void {
  
  this.getexpiryDetails();
}
  selectFilter(days: number) {
    //console.log(`Filter selected: ${days} days`);
    this.isDropdownOpen = false; // Close dropdown after selection
    
    if(days==2){
      this.twoDays();

    }
    else if (days==7){
      this.sevenDays();
      

    }
    else if (days==30){
      this.thirtyDays();

    }
    
    
    
    
  }

   getexpiryDetails() {
     this.isDropdownOpen = false;
      // this.loaderService.emitLoading();
      // MAKE A SERVICE CALL HERE...
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        "extras": {
          "find": {
  
          }
        }
      }
       this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE).subscribe(resp => {
            if (resp.success === 1 && resp.status_code === 200) {
              this.expiryDetails = resp.result.data[0].expiry_details;
              this.filterbyDays =  resp.result.data[0].filterby_days;

             
  
              // this.expiryDetails =resp.result.data[0].expiry_details;
            
              // this.adminUserData = resp.result.data[0];
              // alert(`Hi ${guestName}, your request has been escalated to ${this.adminUserData.first_name}`);
            } else {
              //console.warn('Failed to fetch updated profile data.');
            }
          });
    }


  goBack(): void {
    this.location.back();
  }



    twoDays(){
     this.expiryDetails =  this.filterbyDays.two_days
    if( this.expiryDetails){
       this.expiryDetails =[{"name":"No data found"}]

    }

  }
  
    sevenDays(){
     this.expiryDetails =  this.filterbyDays.seven_days
    if( this.expiryDetails){
       this.expiryDetails =[{"name":"No data found"}]

    }

  }
  thirtyDays(){
     this.expiryDetails =  this.filterbyDays.thirty_days
    if( this.expiryDetails){
       this.expiryDetails =[{"name":"No data found"}]

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

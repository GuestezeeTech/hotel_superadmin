import { Component, AfterViewInit ,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // For validating forms
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from './dashboard.service';
import { ENDPOINTS } from '../app.config';
import { HotelReviewsComponent } from '../hotel-reviews/hotel-reviews.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HotelReviewsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit {
  propertySize:any=[];
  // label:any= ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // visitdata:any=[20, 400, 900, 250, 310, 390, 240];
  label:any= [];
  visitdata:any= [];
  guestReviews: any[] = [];
  // hotelReviews = [
  //   { name: 'Taj Coromandel (Chennai)', date: '12/Feb/2024', rating: 4.5, reviews: '30 Review' },
  //   { name: 'Novotel', date: '12/Feb/2024', rating: 5.0, reviews: '30 Review' },
  //   { name: 'Pullman', date: '12/Feb/2024', rating: 3.8, reviews: '30 Review' },
  //   { name: 'Novotel (OMR)', date: '12/Feb/2024', rating: 4.8, reviews: '30 Review' }
  // ];

  expiryDetails:any = [
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Novotel (OMR)', date: '10/Feb/25', isUrgent: true },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Novotel (ECR)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Delhi)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Pullman (Chennai)', date: '14/Feb/25', isUrgent: false },
    // { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Mumbai)', date: '15/Feb/25', isUrgent: false }
  ];

  // memberStatus = [
  //   { status: 'Active', count: 400, revenue: '$450000' },
  //   { status: 'In Active', count: 300, revenue: '$350000' },
  //   { status: 'Pending', count: 100, revenue: '0' }
  // ];

  isDropdownOpen = false;

  selectedPeriod: string = 'Month';

  chart!: Chart;

  // guestReviews = [
  //   { day: 'Sun', count: 50, color: '#B77586' },
  //   { day: 'Mon', count: 100, color: '#75C896' },
  //   { day: 'Tue', count: 150, color: '#64C0F4' },
  //   { day: 'Wed', count: 38, color: '#DDD58E' },
  //   { day: 'Thu', count: 60, color: '#FAB899' },
  //   { day: 'Fri', count: 59, color: '#BC745B' },
  //   { day: 'Sat', count: 58, color: '#D7BEF6' }
  // ];

  constructor(private router: Router,
    private authTokenService:AuthTokenService,
    private dashboardService:DashboardService
  ) { }


  ngAfterViewInit() {
    //  this.renderChart();
    // this.createChart();
  }
ngOnInit(): void {
  this.getPropertySize();
  
}
renderChart() {
  console.log(this.visitdata, 'this.visitdata');
  const canvas = document.getElementById('guestVisitChart') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  let maxValue = 100;
  const yMax = Math.ceil(maxValue / 10) * 10;

  if (ctx) {
    // 🔴 Destroy existing chart if already created
    if (this.chart) {
      this.chart.destroy();
    }

    // Creating gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#D98E16'); // Dark Orange at top
    gradient.addColorStop(1, '#D98E16'); // Light Cream

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.label,
        datasets: [{
          label: 'Guest Visits',
          data: this.visitdata,
          borderColor: '#D98E16',
          backgroundColor: gradient,
          fill: true,
          borderWidth: 0,
          pointRadius: 0,
          borderJoinStyle: 'miter',
          tension: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { align: 'center', color: '#1C1C1C' }
          },
          y: {
            min: 0,
            max: yMax,
            ticks: { stepSize: 10, color: '#000' },
            grid: { color: 'rgba(0,0,0,0.1)' },
            border: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}


  getTotalCount(): number {
    return this.guestReviews.reduce((sum, review) => sum + review.count, 0);
  }

  createChart() {
    const ctx = document.getElementById('guestReviewChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.guestReviews.map(r => r.day),
        datasets: [{
          data: this.guestReviews.map(r => r.count),
          backgroundColor: this.guestReviews.map(r => r.color),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        cutout: '70%'
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
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
    else if(days==30){
       this.thirtyDays();

    }
   

  }

  navigateToReviews() {
    this.router.navigate(['/hotel-reviews']);
  }

  navigateToExpiry() {
    this.router.navigate(['/expiry-details']);
  }


  isExpanded = false;

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    setTimeout(() => {
      if (this.isExpanded) {
        this.renderChart(); // Reinitialize after expanding
      }
      if (!this.isExpanded) {
        this.renderChart(); // Reinitialize after and before(back button) expanding
        this.createChart();
      }
    }, 100);
  }
   getPropertySize() {
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
            this.propertySize = resp.result.data[0];
             if (this.propertySize.expiry_details) {
    this.propertySize.expiry_details = this.propertySize.expiry_details.slice(0, 6);
  }
            this.guestReviews= resp.result.data[0].review_activity;
            this.createChart();
            this.label= resp.result.data[0].guest_visit.labels;
            this.visitdata =  resp.result.data[0].guest_visit.data;
            this.renderChart();

            // this.expiryDetails =resp.result.data[0].expiry_details;
            console.log( this.propertySize," this.propertySize")
            // this.adminUserData = resp.result.data[0];
            // alert(`Hi ${guestName}, your request has been escalated to ${this.adminUserData.first_name}`);
          } else {
            //console.warn('Failed to fetch updated profile data.');
          }
        });
  }

 getPropertySizeClear() {
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
            this.propertySize = resp.result.data[0];
            this.guestReviews= resp.result.data[0].review_activity;
            this.createChart();
            this.label= resp.result.data[0].guest_visit.labels;
            this.visitdata =  resp.result.data[0].guest_visit.data;
            this.renderChart();

            // this.expiryDetails =resp.result.data[0].expiry_details;
            console.log( this.propertySize," this.propertySize")
            // this.adminUserData = resp.result.data[0];
            // alert(`Hi ${guestName}, your request has been escalated to ${this.adminUserData.first_name}`);
          } else {
            //console.warn('Failed to fetch updated profile data.');
          }
        });
  }

  twoDays(){
    this. propertySize.expiry_details = this. propertySize.filterby_days.two_days
    if(this.propertySize.filterby_days.two_days.length==0){
       this. propertySize.expiry_details =[{"name":"No data found"}]

    }

  }
    sevenDays(){
    this. propertySize.expiry_details = this. propertySize.filterby_days.seven_days
    if(this.propertySize.filterby_days.seven_days.length==0){
       this. propertySize.expiry_details =[{"name":"No data found"}]

    }

  }
  thirtyDays(){
    this. propertySize.expiry_details = this. propertySize.filterby_days.thirty_days
    if(this.propertySize.filterby_days.thirty_days.length==0){
       this. propertySize.expiry_details =[{"name":"No data found"}]

    }

  }
routeTo(status: string){
 let statusParam = encodeURIComponent(status.trim());
 if(statusParam=="active"){
  statusParam ="approved"

 }
 if(statusParam=="inactive"){
    statusParam ="unapproved"

 }
  this.router.navigate([`/customer-details/${statusParam}`]);
}

  goToHotelReviews() {
    this.router.navigate(['/hotel-reviews']);
  }
}

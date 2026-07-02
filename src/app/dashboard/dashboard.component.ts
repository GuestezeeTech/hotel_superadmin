import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // For validating forms
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { DashboardService } from './dashboard.service';
import { ENDPOINTS } from '../app.config';
import { HotelReviewsComponent } from '../hotel-reviews/hotel-reviews.component';
import { LoaderService } from '../shared/loader/loader.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HotelReviewsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit {
  propertySize: any = [];
  label: any = [];
  visitdata: any = [];
  guestReviews: any[] = [];
  expiryDetails: any = [];

  isDropdownOpen = false;
  selectedPeriod: string = 'Month';
  chart!: Chart;

  // New variables for Guest Visit & Guest Review filters
  visitYear: number = new Date().getFullYear();
  visitMonth: string = '';
  reviewYear: number = new Date().getFullYear();
  reviewMonth: string = '';
  allMonths: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  visitMonthsList: string[] = [];
  reviewMonthsList: string[] = [];
  yearsList: number[] = [];
  guestReviewChartInstance!: Chart;

  activeLoaders: number = 0;

  constructor(private router: Router,
    private authTokenService: AuthTokenService,
    private dashboardService: DashboardService,
    private loaderService: LoaderService
  ) { }

  showLoader() {
    if (this.activeLoaders === 0) {
      this.loaderService.emitLoading();
    }
    this.activeLoaders++;
  }

  hideLoader() {
    this.activeLoaders = Math.max(0, this.activeLoaders - 1);
    if (this.activeLoaders === 0) {
      this.loaderService.emitComplete();
    }
  }

  ngAfterViewInit() {
  }

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    this.visitYear = currentYear;
    this.reviewYear = currentYear;
    this.visitMonth = this.allMonths[currentMonthIndex];
    this.reviewMonth = this.allMonths[currentMonthIndex];

    this.yearsList = [];
    for (let y = 2026; y <= currentYear; y++) {
      this.yearsList.push(y);
    }

    this.updateVisitMonths();
    this.updateReviewMonths();

    this.getPropertySize();
  }

  updateVisitMonths() {
    const now = new Date();
    if (Number(this.visitYear) === now.getFullYear()) {
      this.visitMonthsList = this.allMonths.slice(0, now.getMonth() + 1);
    } else {
      this.visitMonthsList = [...this.allMonths];
    }
    if (this.visitMonth && !this.visitMonthsList.includes(this.visitMonth)) {
      this.visitMonth = '';
    }
  }

  updateReviewMonths() {
    const now = new Date();
    if (Number(this.reviewYear) === now.getFullYear()) {
      this.reviewMonthsList = this.allMonths.slice(0, now.getMonth() + 1);
    } else {
      this.reviewMonthsList = [...this.allMonths];
    }
    if (this.reviewMonth && !this.reviewMonthsList.includes(this.reviewMonth)) {
      this.reviewMonth = '';
    }
  }

  onVisitYearChange() {
    this.updateVisitMonths();
    this.getGuestVisitData();
  }

  onReviewYearChange() {
    this.updateReviewMonths();
    this.getGuestReviewData();
  }

  renderChart() {
    console.log(this.visitdata, 'this.visitdata');
    const canvas = document.getElementById('guestVisitChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let maxValue = this.visitdata && this.visitdata.length > 0 ? Math.max(...this.visitdata) : 100;
    if (maxValue < 100) maxValue = 100;
    const yMax = Math.ceil(maxValue / 10) * 10;

    if (ctx) {
      if (this.chart) {
        this.chart.destroy();
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 250);
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
    if (!this.guestReviews) return 0;
    return this.guestReviews.reduce((sum, review) => sum + (review.count || 0), 0);
  }

  createChart() {
    const canvas = document.getElementById('guestReviewChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (this.guestReviewChartInstance) {
        this.guestReviewChartInstance.destroy();
      }

      const total = this.getTotalCount();
      let labels: string[] = [];
      let data: number[] = [];
      let colors: string[] = [];

      if (total === 0) {
        labels = ['No Reviews'];
        data = [1];
        colors = ['#E0E0E0']; // light grey
      } else {
        const activeReviews = (this.guestReviews || []).filter(r => r.count > 0);
        labels = activeReviews.map(r => r.day || r.month);
        data = activeReviews.map(r => r.count);
        colors = activeReviews.map(r => r.color);
      }

      this.guestReviewChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
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
  }

  getFilteredReviews() {
    if (!this.guestReviews) return [];
    return this.guestReviews.filter(r => r.count > 0);
  }

  getGuestVisitData() {
    this.showLoader();
    const extras: any = {
      year: Number(this.visitYear)
    };
    if (this.visitMonth) {
      extras.month = this.visitMonth;
    }

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: extras
    };

    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE_ANALYTICS).subscribe({
      next: (resp) => {
        if (resp.success === 1 && resp.status_code === 200 && resp.result && resp.result.guest_visit) {
          const yearKey = String(this.visitYear);
          const dataForYear = resp.result.guest_visit[yearKey];
          if (dataForYear) {
            this.label = dataForYear.labels || [];
            this.visitdata = dataForYear.data || [];
          } else {
            this.label = [];
            this.visitdata = [];
          }
          this.renderChart();
        }
        this.hideLoader();
      },
      error: (err) => {
        this.hideLoader();
        console.error(err);
      }
    });
  }

  getGuestReviewData() {
    this.showLoader();
    const extras: any = {
      year: Number(this.reviewYear)
    };
    if (this.reviewMonth) {
      extras.month = this.reviewMonth;
    }

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: extras
    };

    this.dashboardService.postApiCall(requestBody, ENDPOINTS.GET_PROPERTY_SIZE_ANALYTICS).subscribe({
      next: (resp) => {
        if (resp.success === 1 && resp.status_code === 200 && resp.result && resp.result.review_activity) {
          const yearKey = String(this.reviewYear);
          // const data = resp.result.review_activity[yearKey] || [];
          const data = (resp.result.review_activity[yearKey] || []).slice(0, 15);
          this.guestReviews = data.map((item: any, index: number) => {
            const hue = (index * 137.5) % 360;
            return {
              ...item,
              color: `hsl(${hue}, 65%, 60%)`
            };
          });
          this.createChart();
        }
        this.hideLoader();
      },
      error: (err) => {
        this.hideLoader();
        console.error(err);
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
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

  navigateToReviews() {
    this.router.navigate(['/hotel-reviews']);
  }

  navigateToExpiry() {
    this.router.navigate(['/expiry-details']);
  }


  isExpanded = false;

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
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
    this.showLoader();
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
        if (resp.success === 1 && resp.status_code === 200) {
          this.propertySize = resp.result.data[0];
          if (this.propertySize.expiry_details) {
            this.propertySize.expiry_details = this.propertySize.expiry_details.slice(0, 6);
          }
          if (this.propertySize.hotel_reviews) {
            this.propertySize.hotel_reviews = this.propertySize.hotel_reviews.slice(0, 6);
          }
          this.getGuestVisitData();
          this.getGuestReviewData();
          console.log(this.propertySize, " this.propertySize")
          if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
          }
        } else {
          //console.warn('Failed to fetch updated profile data.');
        }
        this.hideLoader();
      },
      error: (err) => {
        this.hideLoader();
        console.error(err);
      }
    });
  }

  getPropertySizeClear() {
    this.isDropdownOpen = false;
    this.showLoader();
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
        if (resp.success === 1 && resp.status_code === 200) {
          this.propertySize = resp.result.data[0];
          if (this.propertySize.expiry_details) {
            this.propertySize.expiry_details = this.propertySize.expiry_details.slice(0, 6);
          }
          if (this.propertySize.hotel_reviews) {
            this.propertySize.hotel_reviews = this.propertySize.hotel_reviews.slice(0, 6);
          }
          console.log(this.propertySize, " this.propertySize")
        } else {
          //console.warn('Failed to fetch updated profile data.');
        }
        this.hideLoader();
      },
      error: (err) => {
        this.hideLoader();
        console.error(err);
      }
    });
  }

  twoDays() {
    this.propertySize.expiry_details = this.propertySize.filterby_days.two_days
    if (this.propertySize.filterby_days.two_days.length == 0) {
      this.propertySize.expiry_details = [{ "name": "No data found" }]
    }
  }

  sevenDays() {
    this.propertySize.expiry_details = this.propertySize.filterby_days.seven_days
    if (this.propertySize.filterby_days.seven_days.length == 0) {
      this.propertySize.expiry_details = [{ "name": "No data found" }]
    }
  }

  thirtyDays() {
    this.propertySize.expiry_details = this.propertySize.filterby_days.thirty_days
    if (this.propertySize.filterby_days.thirty_days.length == 0) {
      this.propertySize.expiry_details = [{ "name": "No data found" }]
    }
  }

  routeTo(status: string) {
    let statusParam = encodeURIComponent(status.trim());
    this.router.navigate([`/customer-details/${statusParam}`]);
  }

  goToHotelReviews() {
    this.router.navigate(['/hotel-reviews']);
  }
}

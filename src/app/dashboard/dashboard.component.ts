import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // For validating forms
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  hotelReviews = [
    { name: 'Taj Coromandel (Chennai)', date: '12/Feb/2024', rating: 4.5, reviews: '30 Review' },
    { name: 'Novotel', date: '12/Feb/2024', rating: 5.0, reviews: '30 Review' },
    { name: 'Pullman', date: '12/Feb/2024', rating: 3.8, reviews: '30 Review' },
    { name: 'Novotel (OMR)', date: '12/Feb/2024', rating: 4.8, reviews: '30 Review' }
  ];

  expiryDetails = [
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Novotel (OMR)', date: '10/Feb/25', isUrgent: true },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Novotel (ECR)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Delhi)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel2.png', hotel: 'Pullman (Chennai)', date: '14/Feb/25', isUrgent: false },
    { image: '../../assets/images/guestezee/hotel1.png', hotel: 'Pullman (Mumbai)', date: '15/Feb/25', isUrgent: false }
  ];

  memberStatus = [
    { status: 'Active', count: 400, revenue: '$450000' },
    { status: 'In Active', count: 300, revenue: '$350000' },
    { status: 'Pending', count: 100, revenue: '0' }
  ];

  isDropdownOpen = false;

  selectedPeriod: string = 'Week';

  chart!: Chart;

  guestReviews = [
    { day: 'Sun', count: 50, color: '#B77586' },
    { day: 'Mon', count: 100, color: '#75C896' },
    { day: 'Tue', count: 150, color: '#64C0F4' },
    { day: 'Wed', count: 38, color: '#DDD58E' },
    { day: 'Thu', count: 60, color: '#FAB899' },
    { day: 'Fri', count: 59, color: '#BC745B' },
    { day: 'Sat', count: 58, color: '#D7BEF6' }
  ];

  constructor(private router: Router) { }


  ngAfterViewInit() {
    this.renderChart();
    this.createChart();
  }

  renderChart() {
    const canvas = document.getElementById('guestVisitChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Creating gradient fill (No transparency at bottom)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#D98E16'); // Dark Orange at top
      gradient.addColorStop(1, '#FFFAF0'); // Light Cream (Not transparent)

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          datasets: [{
            label: 'Guest Visits',
            data: [20, 400, 900, 250, 310, 390, 240], // Adjusted dataset
            borderColor: '#D98E16', // Line color
            backgroundColor: gradient, // Fixed gradient
            fill: true, // Enable fill area
            borderWidth: 0, // Ensures sharp edges
            pointRadius: 0, // Remove circle points
            borderJoinStyle: 'miter', // Ensures sharp edges
            tension: 0, // No curve, keeps edges sharp
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false }, // Hides x-axis grid
              border: { display: false }, // Hides x-axis border line
              ticks: { align: 'center', color: '#1C1C1C' } // Keeps text aligned properly
            },
            y: {
              min: 0, // Starts from 0
              max: 1000, // Matches reference image scale
              ticks: { stepSize: 200, color: '#000' }, // Y-axis increments of 200
              grid: { color: 'rgba(0,0,0,0.1)' }, // Light y-axis grid lines
              border: { display: false } // Hides y-axis border line
            }
          },
          plugins: {
            legend: { display: false },

          } // Hide legend
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

}

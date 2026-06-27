import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { ENDPOINTS } from '../../app.config';
import { ProfileService } from '../../profile/profile.service';
import { AlertsService } from '../../shared/alerts/alerts.service';
// import { FirestoreService } from '../task-management.service';
// import { FirebaseMessagingService } from '../../firestore-listener.service';

@Component({
  selector: 'app-asap-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asap-cart.component.html',
  styleUrls: ['./asap-cart.component.scss']
})
export class AsapCartComponent implements OnInit, OnDestroy {
  @Output() openAssigneeModal = new EventEmitter<any>();

  private intervalId: any;
  // authorities: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthTokenService,
    private profileService: ProfileService,
    private alertsService: AlertsService,
    // private firestoreListenerService: FirestoreListenerService
    // private firestoreService: FirestoreService
  ) { }

  orders = [
    {
      name: 'Ethan Hunt',
      roomNo: '201',
      service: 'Room Cleaning',
      department: 'Housekeeping',
      orderTime: '09:00 AM',
      escalateTime: '5 sec',
      countingUp: false,
      action: 'Add Assignee',
      isAssigned: true
    },
    {
      name: 'Emily Rose',
      roomNo: '305',
      service: 'Laundry',
      department: 'Laundry',
      orderTime: '09:15 AM',
      escalateTime: '1 min',
      countingUp: false,
      action: 'Add Assignee',
      isAssigned: true
    },
    {
      name: 'Daniel Craig',
      roomNo: '408',
      service: 'Food Delivery',
      department: 'Kitchen',
      orderTime: '09:25 AM',
      escalateTime: '2 mins',
      countingUp: false,
      action: 'Add Assignee',
      isAssigned: true
    },
    {
      name: 'Sophia Turner',
      roomNo: '512',
      service: 'Mini Bar Restock',
      department: 'Housekeeping',
      orderTime: '09:30 AM',
      escalateTime: '9 secs',
      countingUp: false,
      action: 'Add Assignee',
      isAssigned: true
    }
  ];

  escalateSecondsMap: Map<string, number> = new Map();
  adminUserData: any = {};

  ngOnInit() {
    // Initial escalation time mapping
    this.orders.forEach(order => {
      const seconds = this.parseTimeToSeconds(order.escalateTime);
      this.escalateSecondsMap.set(order.name, seconds);
    });


    // this.firestoreListenerService.listenToHitServiceChange();
    // this.firestoreListenerService.hitServiceChanged$.subscribe((changed) => {
    //   if (changed) {
    //     alert("HitService has been updated to true for authority ID 1!");
       
    //   }
    // });


    // Escalation timer setup
    this.intervalId = setInterval(() => {
      this.orders.forEach(order => {
        let currentSeconds = this.escalateSecondsMap.get(order.name) || 0;

        if (currentSeconds > 0 && !order.countingUp) {
          currentSeconds--;
        } else if (currentSeconds === 0 && !order.countingUp) {
          order.countingUp = true;
          this.getUserDetails(this.authService.getUserId(), order.name);
        } else {
          currentSeconds++;
        }

        this.escalateSecondsMap.set(order.name, currentSeconds);
      });
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  parseTimeToSeconds(timeStr: string): number {
    const time = timeStr.toLowerCase();
    if (time.includes('min')) {
      return parseInt(time.split(' ')[0], 10) * 60;
    } else if (time.includes('sec')) {
      return parseInt(time.split(' ')[0], 10);
    }
    return 0;
  }

  formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.abs(seconds % 60);
    if (seconds <= 59) {
      return `00:${secs.toString().padStart(2, '0')} secs`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  }

  getEscalateStyles(order: any) {
    const seconds = this.escalateSecondsMap.get(order.name) || 0;
    if (order.countingUp) {
      return 'escalation';
    } else if (seconds < 30) {
      return 'blink-orange';
    } else {
      return 'not-escalated';
    }
  }

  getUserDetails(userId: number, guestName: string) {
    const payload = {
      domain_name: this.authService.getDomain(),
      user_id: this.authService.getUserId(),
      extras: { find: { id: userId } }
    };

    this.profileService.postApiCall(payload, ENDPOINTS.GETBYID_ADMINUSERS).subscribe(resp => {
      if (resp.success === 1 && resp.status_code === 200) {
        this.adminUserData = resp.result.data[0];
        alert(`Hi ${guestName}, your request has been escalated to ${this.adminUserData.first_name}`);
      } else {
        //console.warn('Failed to fetch updated profile data.');
      }
    });
  }

  onAddAssignee(order: any) {
    this.openAssigneeModal.emit(order);
  }

  navigateToTimeline() {
    this.router.navigate(['/timeline']);
  }
}

import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../shared/alerts/alerts.service';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { Input } from '@angular/core';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [AlertsComponent, CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})

export class NotificationComponent {
  notifications: any[] = [];

  constructor(
    private alertService: AlertsService,
    private notificationService: NotificationService
  ) { 
      // Subscribe to live notifications from the service
    this.notificationService.notifications$.subscribe(list => {
      this.notifications = this.groupNotificationsByDay(list);
    
     
      // console.log('Notifications in component:', this.notifications);
    });
    // console.log(this.notifications, "notifications in notification component")
  }

   private groupNotificationsByDay(flatList: any[]): any[] {
    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
    const todayGroup = { day: 'Today', list: [] as any[] };
    const yesterdayGroup = { day: 'Yesterday', list: [] as any[] };
    const olderGroup = { day: 'Earlier', list: [] as any[] };
    flatList.forEach((n: any) => {
      const notifDate = new Date(n.time).toDateString();
      if (notifDate === todayStr) todayGroup.list.push(n);
      else if (notifDate === yesterdayStr) yesterdayGroup.list.push(n);
      else olderGroup.list.push(n);
    });
    const grouped: any[] = [];
    if (todayGroup.list.length) grouped.push(todayGroup);
    if (yesterdayGroup.list.length) grouped.push(yesterdayGroup);
    if (olderGroup.list.length) grouped.push(olderGroup);
    return grouped;
  }

  // Notification data
  // @Output() close = new EventEmitter<void>();
  // notifications = [
  //   {
  //     day: 'Today',
  //     list: [
  //       { initials: 'ST', name: 'Steve John', time: '11:50' },
  //       { initials: 'VI', name: 'Victor', time: '10:00' },
  //       { initials: 'VI', name: 'Vimal', time: '09:00' }
  //     ]
  //   },
  //   {
  //     day: 'Yesterday',
  //     list: [
  //       { initials: 'JH', name: 'John', time: '12:00' },
  //       { initials: 'KU', name: 'Kumar', time: '10:00' },
  //       { initials: 'VA', name: 'Varshini', time: '09:40' },
  //       { initials: 'AE', name: 'Elakkiya', time: '08:14' },
  //       { initials: 'AT', name: 'Thirishul', time: '06:08' }
  //     ]
  //   }
  // ];

  // Receives the list of notifications from a parent component (like HeaderComponent).
  // @Input() notifications: any[] = [];
  
  // Emits an event when the user closes the notification panel.
  @Output() close = new EventEmitter<void>();
}

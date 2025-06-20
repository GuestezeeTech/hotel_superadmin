import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalated',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './escalated.component.html',
  styleUrl: './escalated.component.scss'
})
export class EscalatedComponent {
  escalatedOrders = [
    {
      name: 'Sophia Blake',
      roomNo: '120',
      service: 'Room Cleaning',
      orderTime: '08:00 AM',
      assignedStaff: 'Liam'
    },
    {
      name: 'Jackson Miller',
      roomNo: '305',
      service: 'Food Delivery',
      orderTime: '08:10 AM',
      assignedStaff: 'Emma'
    },
    {
      name: 'Grace Parker',
      roomNo: '412',
      service: 'Laundry',
      orderTime: '08:25 AM',
      assignedStaff: 'Noah'
    },
    {
      name: 'Mason Rivera',
      roomNo: '510',
      service: 'Towel Replacement',
      orderTime: '08:40 AM',
      assignedStaff: 'Ava'
    },
    {
      name: 'Ella Bennett',
      roomNo: '621',
      service: 'Mini Bar Restock',
      orderTime: '08:50 AM',
      assignedStaff: 'Oliver'
    },
    {
      name: 'Lucas Hayes',
      roomNo: '708',
      service: 'Room Cleaning',
      orderTime: '09:00 AM',
      assignedStaff: 'Mia'
    },
    {
      name: 'Harper Scott',
      roomNo: '803',
      service: 'Food Delivery',
      orderTime: '09:15 AM',
      assignedStaff: 'Ethan'
    },
    {
      name: 'Benjamin Reed',
      roomNo: '914',
      service: 'Laundry',
      orderTime: '09:25 AM',
      assignedStaff: 'Isabella'
    },
    {
      name: 'Lily Walker',
      roomNo: '1005',
      service: 'Mini Bar Restock',
      orderTime: '09:30 AM',
      assignedStaff: 'James'
    },
    {
      name: 'Alexander Brooks',
      roomNo: '1112',
      service: 'Towel Replacement',
      orderTime: '09:45 AM',
      assignedStaff: 'Zoe'
    }
  ];
  

  // For modal in task component
  @Output() openAssigneeModal = new EventEmitter<any>();

  onAddAssignee(order: any) {
    this.openAssigneeModal.emit(order);
  }
}

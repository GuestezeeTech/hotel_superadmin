import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-scheduled',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scheduled.component.html',
  styleUrl: './scheduled.component.scss'
})
export class ScheduledComponent {
  scheduledOrders = [
    {
      name: 'Lucas Gray',
      roomNo: '101',
      service: 'Room Cleaning',
      department: 'Housekeeping',
      orderTime: '07:00 AM',
      escalateTime: '08:00 AM',
      isAssigned: true,
      assignee: 'David Miller',
      action: 'Add Assignee'
    },
    {
      name: 'Ella Watson',
      roomNo: '204',
      service: 'Laundry',
      department: 'Housekeeping',
      orderTime: '07:15 AM',
      escalateTime: '08:15 AM',
      isAssigned: false,
      assignee: '',
      action: 'Add Assignee'
    },
    {
      name: 'Noah Lee',
      roomNo: '309',
      service: 'Food Delivery',
      department: 'F&B',
      orderTime: '07:30 AM',
      escalateTime: '08:30 AM',
      isAssigned: true,
      assignee: 'Priya Singh',
      action: 'Add Assignee'
    },
    {
      name: 'Ava Patel',
      roomNo: '410',
      service: 'Towel Replacement',
      department: 'Housekeeping',
      orderTime: '07:45 AM',
      escalateTime: '08:45 AM',
      isAssigned: false,
      assignee: '',
      action: 'Add Assignee'
    },
    {
      name: 'Ethan Sharma',
      roomNo: '512',
      service: 'Room Cleaning',
      department: 'Housekeeping',
      orderTime: '08:00 AM',
      escalateTime: '09:00 AM',
      isAssigned: true,
      assignee: 'Sarah Johnson',
      action: 'Add Assignee'
    },
    {
      name: 'Mia Wilson',
      roomNo: '618',
      service: 'Mini Bar Restock',
      department: 'F&B',
      orderTime: '08:15 AM',
      escalateTime: '09:15 AM',
      isAssigned: false,
      assignee: '',
      action: 'Add Assignee'
    },
    {
      name: 'Liam Turner',
      roomNo: '722',
      service: 'Food Delivery',
      department: 'F&B',
      orderTime: '08:30 AM',
      escalateTime: '09:30 AM',
      isAssigned: true,
      assignee: 'Ravi Kumar',
      action: 'Add Assignee'
    },
    {
      name: 'Charlotte Adams',
      roomNo: '825',
      service: 'Laundry',
      department: 'Housekeeping',
      orderTime: '08:45 AM',
      escalateTime: '09:45 AM',
      isAssigned: false,
      assignee: '',
      action: 'Add Assignee'
    },
    {
      name: 'William Cox',
      roomNo: '930',
      service: 'Towel Replacement',
      department: 'Housekeeping',
      orderTime: '09:00 AM',
      escalateTime: '10:00 AM',
      isAssigned: true,
      assignee: 'Anjali Verma',
      action: 'Add Assignee'
    },
    {
      name: 'Amelia Hughes',
      roomNo: '1033',
      service: 'Room Cleaning',
      department: 'Housekeeping',
      orderTime: '09:15 AM',
      escalateTime: '10:15 AM',
      isAssigned: false,
      assignee: '',
      action: 'Add Assignee'
    }
  ];


  // For modal in task component
  @Output() openAssigneeModal = new EventEmitter<any>();

  onAddAssignee(order: any) {
    this.openAssigneeModal.emit(order);
  }
}

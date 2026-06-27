import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.scss'
})
export class ProcessingComponent {
  // Processed orders data
  processedOrders = [
    {
      name: 'Ava Green',
      roomNo: '101',
      service: 'Room Cleaning',
      orderTime: '10:00 AM',
      deliveredTime: '10:30 AM',
      assignedStaff: 'Elena'
    },
    {
      name: 'Liam Smith',
      roomNo: '202',
      service: 'Laundry',
      orderTime: '10:15 AM',
      deliveredTime: '10:45 AM',
      assignedStaff: 'Nathan'
    },
    {
      name: 'Isabella Brown',
      roomNo: '303',
      service: 'Food Delivery',
      orderTime: '10:40 AM',
      deliveredTime: '11:00 AM',
      assignedStaff: 'Sophia'
    },
    {
      name: 'Noah Wilson',
      roomNo: '404',
      service: 'Mini Bar Restock',
      orderTime: '11:00 AM',
      deliveredTime: '11:25 AM',
      assignedStaff: 'Lucas'
    },
    {
      name: 'Mia Taylor',
      roomNo: '505',
      service: 'Towel Replacement',
      orderTime: '11:20 AM',
      deliveredTime: '11:50 AM',
      assignedStaff: 'Grace'
    },
    {
      name: 'Oliver Johnson',
      roomNo: '606',
      service: 'Laundry',
      orderTime: '11:45 AM',
      deliveredTime: '12:10 PM',
      assignedStaff: 'Ethan'
    },
    {
      name: 'Emma Davis',
      roomNo: '707',
      service: 'Food Delivery',
      orderTime: '12:00 PM',
      deliveredTime: '12:30 PM',
      assignedStaff: 'Chloe'
    },
    {
      name: 'Jackson Lee',
      roomNo: '808',
      service: 'Room Cleaning',
      orderTime: '12:20 PM',
      deliveredTime: '12:50 PM',
      assignedStaff: 'Aiden'
    },
    {
      name: 'Amelia White',
      roomNo: '909',
      service: 'Laundry',
      orderTime: '12:40 PM',
      deliveredTime: '01:00 PM',
      assignedStaff: 'Zoe'
    },
    {
      name: 'Lucas Martin',
      roomNo: '1001',
      service: 'Food Delivery',
      orderTime: '01:00 PM',
      deliveredTime: '01:20 PM',
      assignedStaff: 'Lily'
    }
  ];
  
}

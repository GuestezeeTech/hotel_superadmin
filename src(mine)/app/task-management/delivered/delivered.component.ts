import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-delivered',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivered.component.html',
  styleUrl: './delivered.component.scss'
})
export class DeliveredComponent {
  // Delivered orders data
  deliveredOrders = [
    {
      name: 'John Doe',
      roomNo: '101',
      service: 'Room Cleaning',
      orderTime: '10:30 AM',
      deliveredTime: '10:40 AM',
      assignedStaff: 'Alice',
      rating: 5
    },
    {
      name: 'Emily Smith',
      roomNo: '203',
      service: 'Laundry',
      orderTime: '11:15 AM',
      deliveredTime: '11:25 AM',
      assignedStaff: 'Bob',
      rating: 4
    },
    {
      name: 'Michael Johnson',
      roomNo: '305',
      service: 'Food Delivery',
      orderTime: '12:00 PM',
      deliveredTime: '12:10 PM',
      assignedStaff: 'Charlie',
      rating: 3
    },
    {
      name: 'Sarah Williams',
      roomNo: '110',
      service: 'Towel Replacement',
      orderTime: '09:45 AM',
      deliveredTime: '09:55 AM',
      assignedStaff: 'Diana',
      rating: 4
    },
    {
      name: 'David Brown',
      roomNo: '409',
      service: 'Room Cleaning',
      orderTime: '01:10 PM',
      deliveredTime: '01:25 PM',
      assignedStaff: 'Ethan',
      rating: 2
    },
    {
      name: 'Laura Garcia',
      roomNo: '512',
      service: 'Mini Bar Restock',
      orderTime: '02:30 PM',
      deliveredTime: '02:40 PM',
      assignedStaff: 'Fiona',
      rating: 3
    },
    {
      name: 'James Martinez',
      roomNo: '603',
      service: 'Food Delivery',
      orderTime: '03:00 PM',
      deliveredTime: '03:10 PM',
      assignedStaff: 'George',
      rating: 1
    },
    {
      name: 'Olivia Davis',
      roomNo: '707',
      service: 'Laundry',
      orderTime: '04:25 PM',
      deliveredTime: '04:35 PM',
      assignedStaff: 'Hannah',
      rating: 5
    },
    {
      name: 'William Wilson',
      roomNo: '808',
      service: 'Towel Replacement',
      orderTime: '05:15 PM',
      deliveredTime: '05:25 PM',
      assignedStaff: 'Ian',
      rating: 4
    },
    {
      name: 'Sophia Taylor',
      roomNo: '909',
      service: 'Room Cleaning',
      orderTime: '06:05 PM',
      deliveredTime: '06:15 PM',
      assignedStaff: 'Julia',
      rating: 3
    }
  ];

  // Ratings function
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }
}

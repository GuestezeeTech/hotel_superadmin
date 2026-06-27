import { Component } from '@angular/core';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { AlertsService } from '../shared/alerts/alerts.service';
import { CommonModule } from '@angular/common';
import { AsapCartComponent } from './asap-cart/asap-cart.component';
import { ProcessingComponent } from "./processing/processing.component";
import { DeliveredComponent } from './delivered/delivered.component';
import { EscalatedComponent } from './escalated/escalated.component';
import { ScheduledComponent } from './scheduled/scheduled.component';
import { TimelineComponent } from './timeline/timeline.component';


@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [AlertsComponent, CommonModule, AsapCartComponent, ProcessingComponent, DeliveredComponent, EscalatedComponent, ScheduledComponent, TimelineComponent],
  templateUrl: './task-management.component.html',
  styleUrl: './task-management.component.scss'
})

export class TaskManagementComponent {
  constructor(private alertService: AlertsService,) { }

  // Tab contents
  tabs = ['ASAP Cart', 'Schedule', 'Processing', 'Escalated', 'Delivered'];
  selectedTab = this.tabs[0]; // Default tab

  // For tab sleection
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  // For showing filter
  showFilterDropdown: boolean = false;
  toggleFilterDropdown() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  // Orders data
  orders = [
    {
      name: 'John Doe',
      roomNo: '101',
      service: 'Pet Service',
      department: 'Pet Service',
      orderTime: '08:30 AM',
      escalateTime: '15secs',
      action: 'Add Assignee',
      isAssigned: true,
    },
    {
      name: 'Emily Smith',
      roomNo: '202',
      service: 'Bath Soap',
      department: 'House Keeping',
      orderTime: '07:45 AM',
      escalateTime: '15secs',
      action: 'Add Assignee',
      isAssigned: true,
    },
    {
      name: 'Michael Brown',
      roomNo: '303',
      service: 'Nail Polish',
      department: 'House Keeping',
      orderTime: '09:20 AM',
      escalateTime: '15secs',
      action: 'Add Assignee',
      isAssigned: true,
    },
    {
      name: 'Sarah Johnson',
      roomNo: '104',
      service: 'Talcum Powder',
      department: 'House Keeping',
      orderTime: '06:30 AM',
      escalateTime: '15secs',
      action: 'Add Assignee',
      isAssigned: true,
    },
    {
      name: 'David Lee',
      roomNo: '305',
      service: 'Mobile Charger',
      department: 'Electronic',
      orderTime: '10:10 AM',
      escalateTime: '15secs',
      action: 'Add Assignee',
      isAssigned: true,
    }
  ];


  // Selected order
  selectedOrder: any = null;


  // Service staves
  serviceStaves: any = {
    'Pet Service': [
      { name: 'Vivek', status: 'available' },
      { name: 'Vijay', status: 'assigned' },
      { name: 'Aswin', status: 'unavailable' },
      { name: 'Ramesh', status: 'available' },
      { name: 'Suresh', status: 'assigned' },
      { name: 'Dinesh', status: 'unavailable' }
    ],
    'Bath Soap': [
      { name: 'Diwakar', status: 'available' },
      { name: 'Aravind', status: 'unavailable' },
      { name: 'Ajay', status: 'assigned' },
      { name: 'Naveen', status: 'available' },
      { name: 'Lokesh', status: 'assigned' },
      { name: 'Jeeva', status: 'unavailable' }
    ],
    'Nail Polish': [
      { name: 'Priya', status: 'assigned' },
      { name: 'Meena', status: 'available' },
      { name: 'Kavya', status: 'unavailable' },
      { name: 'Divya', status: 'available' },
      { name: 'Aishwarya', status: 'assigned' },
      { name: 'Sneha', status: 'unavailable' }
    ],
    'Talcum Powder': [
      { name: 'Ravi', status: 'unavailable' },
      { name: 'Sathish', status: 'available' },
      { name: 'Manoj', status: 'assigned' },
      { name: 'Hari', status: 'available' },
      { name: 'Surya', status: 'assigned' },
      { name: 'Prakash', status: 'unavailable' }
    ],
    'Mobile Charger': [
      { name: 'Rahul', status: 'available' },
      { name: 'Kiran', status: 'assigned' },
      { name: 'Vinoth', status: 'unavailable' },
      { name: 'Arjun', status: 'available' },
      { name: 'Yogesh', status: 'assigned' },
      { name: 'Deepak', status: 'unavailable' }
    ]
  };


  // Get avaiable and total staves count
  getAssignableCount(): number {
    const staffList = this.serviceStaves[this.selectedService];
    if (!staffList) return 0;
    return staffList.filter((s: any) => s.status === 'assigned' || s.status === 'available').length;
  }
  getTotalStaffCount(): number {
    const staffList = this.serviceStaves[this.selectedService];
    return staffList ? staffList.length : 0;
  }


  // Staff status button style
  getCompleteStaffStyle(staff: any): any {
    let style: any = {};

    if (staff.status === 'assigned') {
      style.backgroundColor = '#FFF7D1';
      style.color = '#B99900';
      style.cursor = 'not-allowed';
    } else if (staff.status === 'available') {
      style.backgroundColor = '#D0FFC6';
      style.color = '#078338';
      style.cursor = 'pointer';
    } else if (staff.status === 'unavailable') {
      style.backgroundColor = '#FFC6C7';
      style.color = '#E70909';
      style.cursor = 'not-allowed';
    }

    // Adds border if selected
    if (this.selectedStaff === staff.name) {
      style.border = '2px solid #078338';
      style.fontWeight = 600;
    }

    return style;
  }


  // For staff modal
  isModalOpen = false;
  selectedService: string = '';  //For service 
  selectedRoom: string = ''; //For room no 

  openModal(order: any) {
    // this.selectedOrder = order;
    // this.selectedService = order.service;
    // this.selectedRoom = order.roomNo;
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }


  // For storing assigned orders & staves
  assignedOrders: any[] = [];
  // For assigning staff 
  selectedStaff: string | null = null;

  getStaffNameBorder(staff: any) {
    this.selectedStaff = staff;
    //console.log('Selected Staff:', this.selectedStaff);
    return {
      border: this.selectedStaff === staff.name ? '1px solid #078338' : 'none'
    };
  }




  assignDuty() {
    // if (this.selectedStaff) {
    //   // //console.log('Selected Orders:', this.selectedOrder);
    //   // const orderIndex = this.orders.findIndex(order => order.roomNo === this.selectedOrder.roomo);
    //   //console.log('Function called')
    //   if (orderIndex !== -1) {/
    //     // Updates and push to assignedOrders
    //     if (orderIndex !== -1) {
    //       // Updating the original order in the orders array
    //       this.orders[orderIndex].action = 'Assigned';
    //       this.orders[orderIndex].isAssigned = false;

    //       // Pushed updated order to assignedOrders
    //       this.assignedOrders.push({ ...this.orders[orderIndex], assignedStaff: this.selectedStaff });
    //     }
    //   }

    // }
    this.closeModal();
    // For navigating to processing tab
    this.selectedTab = 'Processing';
    this.selectedStaff = null; // reset selection
  }


}

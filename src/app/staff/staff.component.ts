import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../shared/alerts/alerts.service';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, AlertsComponent, ReactiveFormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss'
})
export class StaffComponent implements OnInit {
  staffForm !: FormGroup;
  validateForm: boolean = false;
  constructor(
    private alertsService: AlertsService,
    private formBuilder: FormBuilder,
    private routerUrl: Router
  ) { }

  ngOnInit(): void {
    // Initialize the form with validation rules
    this.staffForm = new FormGroup({
      email: this.formBuilder.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.control('', [Validators.required, Validators.minLength(6)]),
      full_name: this.formBuilder.control('', [Validators.required]),
      phone_number: this.formBuilder.control('', [Validators.required, Validators.maxLength(10), Validators.pattern("^[+]*[(]{0,1}[0-9]{10}[)]{0,1}[-\s\./0-9]*$")]),
      employee_id: this.formBuilder.control('', [Validators.required]),
      department_name: this.formBuilder.control('', [Validators.required]),
      supervisor_name: this.formBuilder.control('', [Validators.required]),
      created_by_name: this.formBuilder.control(''),
      last_login: this.formBuilder.control(''),
      is_active: this.formBuilder.control(true)
    })

  }

  // For throwing error
  get f() { return this.staffForm.controls; }

  // Department data's
  departmentList = [
    "Sales",
    "Marketing",
    "IT",
    "Finance",
    "HR",
    "Operations",
    "Customer Service",
    "Research and Development",
    "Procurement",
    "Logistics"
  ];

  // Supervisor data's
  supervisorList = [
    "John Smith",
    "Jane Doe",
    "Michael Brown",
    "Emily Chen",
    "David Lee",
    "Sarah Taylor",
    "Kevin White",
    "Rebecca Hall",
    "James Davis",
    "Lisa Nguyen"
  ];

  // For modal
  isExitModalOpen: boolean = false;
  openExitModal() {
    this.isExitModalOpen = true;
  }

  closeExitModal() {
    this.isExitModalOpen = false;
  }

  navigateToBookings() {
    this.isExitModalOpen = false;
    this.routerUrl.navigate(['/user-list']);
  }

  // For room no
  roomDropdownOpen = false;

  roomRanges: string[] = ['101-150', '151-200', '201-250', '251-300'];
  selectedRooms: string[] = [];

  onRoomSelect(room: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      this.selectedRooms.push(room);
    } else {
      this.selectedRooms = this.selectedRooms.filter(r => r !== room);
    }
  }
}

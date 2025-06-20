import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListingService } from './user-listing.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ENDPOINTS } from '../../app.config';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { Alert } from '../../shared/alerts/alerts.model';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
 
@Component({
  selector: 'app-usering',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertsComponent],
  templateUrl: './user-listing.component.html',
  styleUrl: './user-listing.component.scss'
})
export class UserListingComponent {
  users: any = [];
  showAddUserForm = false;
  enableEdit = false;
  editScreen: boolean = false;
  userId: any;
  selectedUserIds: number[] = [];
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  isDeleteModalOpen: boolean = false;
 
 
 
  constructor(
    private userListingService: UserListingService,
    private alertService: AlertsService,
    private routeUrl: Router,
    private authTokenService: AuthTokenService) {
 
  }
 
  ngOnInit(): void {
    // To initially load all user data's
    this.getAllUsers();
  }
 
  // To navigate to role page with id
  toggleAddUser() {
    this.routeUrl.navigate(['/user']);
  }
 
  // To navigate to role page with id
  setInitialValues(userId: any) {
    this.routeUrl.navigate(['/user', userId]);
  }
 
  // To get all role data's
  getAllUsers() {
    this.userListingService.getAllUsers().subscribe({
      next: (response) => {
        if (response?.success) {
          this.users = response.result.data;
        } else {
          //console.error('No users found:', response?.message);
        }
      },
      error: (err) => {
        //console.error('API Error:', err);
      }
    });
  }
 
 
  toggleSelection(event: any, userId: number) {
    if (event.target.checked) {
      this.selectedUserIds.push(userId);
    } else {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    }
  }
 
  // This function opens the delete modal
  openDeleteModal() {
    if(this.selectedUserIds.length == 0) {
      this.alertService.error("Please select at least one user to delete.", this.options);
    }
    else {
      this.isDeleteModalOpen = true;
    }
  }
 
  // This function closes the delete modal
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }
 
  deleteSelectedUsers() {
    this.isDeleteModalOpen = false;
    // if (this.selectedUserIds.length === 0) {
    //   this.alertService.error("Please select at least one user to delete.", this.options);
    //   return;
    // }
 
    let jsonObj = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        delete_data: {},
        variants: []
      },
      extras: {
        find: {
          id: this.selectedUserIds
        }
      }
    };
 
    this.userListingService.deleteUser(jsonObj).subscribe(
      resp => {
        if (resp.success === 1) {
          this.alertService.success("Users deleted successfully!", this.options);
          this.selectedUserIds = []; // Clear selected IDs after successful deletion
          this.getAllUsers(); // Refresh the user list
        } else {
          this.alertService.error("Something went wrong. Please try again!", this.options);
        }
      },
      err => {
        if (err.error.statusCode === 403) {
          this.alertService.error("Session Time Out! Please login Again", this.options);
          this.routeUrl.navigate([`/login`], { skipLocationChange: false });
        } else if (err.error.message) {
          this.alertService.error(err.error.message, this.options);
        } else {
          this.alertService.error("Something bad happened. Please try again!", this.options);
        }
      }
    );
  }
 
 
 
}
 
 
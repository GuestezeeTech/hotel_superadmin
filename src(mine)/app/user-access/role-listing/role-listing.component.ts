import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleListingService } from './role-listing.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { Alert } from '../../shared/alerts/alerts.model';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
 
@Component({
  selector: 'app-role-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertsComponent],
  templateUrl: './role-listing.component.html',
  styleUrl: './role-listing.component.scss'
})
export class RoleListingComponent implements OnInit {
  roles: any = [];
  isStandardRole: boolean = true;
  isActive: boolean = true;
  showAddRoleForm = false;
  enableEdit = false;
  editScreen: boolean = false;
  roleId: any;
  selectedRoleIds: number[] = [];
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  isDeleteModalOpen: boolean = false;
 
 
  constructor(
    private roleListingService: RoleListingService,
    private alertService: AlertsService,
    private routeUrl: Router,
    private authTokenService: AuthTokenService) {
 
  }
 
  ngOnInit(): void {
    // To initially load all role data's
    this.getAllRoles();
  }
 
  // To navigate to role page with id
  toggleAddRole() {
    this.routeUrl.navigate(['/role']);
  }
 
  // To navigate to role page with id
  setInitialValues(roleId: any) {
    this.routeUrl.navigate(['/role', roleId]);
  }
 
  // To get all role data's
  getAllRoles() {
    this.roleListingService.getAllRoles().subscribe({
      next: (response) => {
        if (response?.success) {
          this.roles = response.result.data;
        } else {
          //console.error('No roles found:', response?.message);
        }
      },
      error: (err) => {
        //console.error('API Error:', err);
      }
    });
  }
 
  toggleSelection(event: any, roleId: number) {
    if (event.target.checked) {
      this.selectedRoleIds.push(roleId);
    } else {
      this.selectedRoleIds = this.selectedRoleIds.filter(id => id !== roleId);
    }
  }
 
  // This function opens the delete modal
  openDeleteModal() {
    if(this.selectedRoleIds.length == 0) {
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
 
 
 
  deleteSelectedRoles() {
    this.isDeleteModalOpen = false;
    //console.log(this.selectedRoleIds,"this.selectedRoleIds")
    // if (this.selectedRoleIds.length === 0) {
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
          id: this.selectedRoleIds
        }
      }
    };
 
    this.roleListingService.deleteRole(jsonObj).subscribe(
      resp => {
        if (resp.success === 1) {
          this.alertService.success("Roles deleted successfully!", this.options);
          this.selectedRoleIds = []; // Clear selected IDs after successful deletion
          this.getAllRoles(); // Refreshes the role list
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
 
 
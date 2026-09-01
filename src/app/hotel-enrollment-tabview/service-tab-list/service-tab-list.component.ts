import { AlertsService } from '../../shared/alerts/alerts.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageService } from '../../auth-services/local-storage.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
// import { DOMAIN_NAME, USER_ID } from '../app.config';
import { ServiceTabListService } from './service-tab-list.service';
// import { AlertsComponent } from '../shared/alerts/alerts.component';
// import { ServiceSettingsService } from '../service-settings/service-settings.service';
// import { PermissionService, ModulePermission } from '../../services/permission.service';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { DOMAIN_NAME } from '../../app.config';
import { AuthTokenService } from '../../auth-services/auth-token.service';


interface ServiceTabs {
  id: number;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-service-tab-list',
  standalone: true,
  imports: [FormsModule, CommonModule, AlertsComponent],
  templateUrl: './service-tab-list.component.html',
  styleUrls: ['./service-tab-list.component.scss']
})

export class ServiceTabListComponent {
  alertOptions = {
    autoClose: true,
    keepAfterRouteChange: true
  };
  serviceTabs: ServiceTabs[] = [];
  // Add/Edit modal
  isModalOpen = false;
  isEditMode = false;
  newServiceTabName = '';
  newServiceTabDescription = '';
  editingIndex: number | null = null;
  nameError = false;
  // Delete modal
  isDeleteModalOpen = false;
  selectedServiceTab: ServiceTabs | null = null;
  deleteIndex: number | null = null;
  member_id: any;
  hotel_id: any;
  param_id: any;
  customer_member_id: any;
  activeTab: Number = 1;
  selectedTab: any = null;
  services: any[] = [];
  // Newly added for loader
  isLoading: boolean = false;
  isLoadingServices: boolean = false;
  // View-only mode for modal
  isViewMode: boolean = false;

  ngOnInit() {
    // Extract param_id from route (hotel-preview/450)
    this.route.paramMap.subscribe(params => {
      this.param_id = params.get('id'); // This will get '450' from hotel-preview/450
      // console.log('Extracted param_id:', this.param_id);

      // After getting param_id, call customer endpoint
      if (this.param_id) {
        this.getCustomerMemberId(this.param_id);
      } else {
        // Only use local storage ID if no param_id is present
        this.member_id = this.localService.get('MemberId');
        if (this.member_id) {
          this.getServiceTabById(this.member_id);
        }
      }
    });

    this.hotel_id = Number(this.localService.get('UserId'));

    // Reset to first tab whenever "Services" tab is clicked
    const serviceTabLink = document.getElementById('contact-tab');
    if (serviceTabLink) {
      serviceTabLink.addEventListener('click', () => {
        if (this.serviceTabs && this.serviceTabs.length > 0) {
          this.onSelectServiceTab(this.serviceTabs[0]);
        }
      });
    }
  
  }

  constructor(
    private localService: LocalStorageService,
    private serviceTabListService: ServiceTabListService,
    private alertsService: AlertsService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    // private serviceSettingsService: ServiceSettingsService,
    // private permissionService: PermissionService.
    private authTokenService: AuthTokenService,
    private route: ActivatedRoute
  ) { }

  // -------------
  // Permission helpers for template bindings
  // -------------
  /*   get canReadSystemSettings(): boolean {
      const permission = this.permissionService.getModulePermission('SYSTEM SETTINGS');
      return permission?.has_read_permission ?? false;
    }
  
    get canAddSystemSettings(): boolean {
      const permission = this.permissionService.getModulePermission('SYSTEM SETTINGS');
      return permission?.has_add_permission ?? false;
    }
  
    get canEditSystemSettings(): boolean {
      const permission = this.permissionService.getModulePermission('SYSTEM SETTINGS');
      return permission?.has_edit_permission ?? false;
    }
  
    get canDeleteSystemSettings(): boolean {
      const permission = this.permissionService.getModulePermission('SYSTEM SETTINGS');
      return permission?.has_delete_permission ?? false;
    } */

  //for service-tab-list
  getCustomerMemberId(paramId: string) {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: Number(paramId) // or whatever field the customer endpoint expects
        }
      }
    };

    this.serviceTabListService.getCustomerById(requestBody).subscribe(
      (resp: any) => {
        if (resp.success === 1 && resp.status_code === 200) {
          this.customer_member_id = resp.result.data[0].customer_member_id;
          // console.log('Retrieved customer_member_id:', this.customer_member_id);
          // Set member_id to the retrieved hotel's ID so that services use this ID
          this.member_id = this.customer_member_id;
          
          // Fetch the service tabs using the NEWLY retrieved ID
          if (this.member_id) {
            this.getServiceTabById(this.member_id);
          }
        } else {
          console.error('Failed to fetch customer data:', resp.message);
        }
      },
      (error: any) => {
        console.error('Error fetching customer data:', error);
      }
    );
  }

  getServiceTabById(memberId: any) {
    this.isLoading = true;
    const jsonObj = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          member_id: memberId
        }
      }
    };
    this.serviceTabListService.getAllServiceTabs(jsonObj).subscribe(
      (resp: any) => {
        if (resp.success === 1 && resp.status_code === 200) {
          // Assigns ServiceTabs data
          this.serviceTabs = resp.result.data;
          // console.log('Service Tab Data:', this.serviceTabs);
          // --- AUTO-SELECT FIRST TAB ---
          if (this.serviceTabs && this.serviceTabs.length > 0) {
            this.onSelectServiceTab(this.serviceTabs[0]);
          }
        }
        // else {
        //   console.error('Failed to fetch service tab details:', resp.message);
        //   this.serviceTabs = [];
        // }
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error fetching service tab details:', error);
        this.isLoading = false;
      }
    );
  }

  onSelectServiceTab(tab: any) {
    if (!tab) return;
    // If same tab clicked again → UNSELECT
    if (this.selectedTab && this.selectedTab.id === tab.id) {
      // this.selectedTab = null;
      // this.services = [];
      return;
    }
    // Else select new tab
    this.selectedTab = tab;
    this.getServicesByTab(tab.name);
  }

  getServicesByTab(serviceTabName: string): void {
    this.isLoadingServices = true;
    this.services = [];
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          member_id: this.member_id,
          service_tab: serviceTabName
        }
      }
    };
    this.serviceTabListService.getServiceByid(requestBody).subscribe(
      (resp: any) => {
        if (resp.success === 1 && resp.status_code === 200) {
          this.services = resp.result.data;
          // console.log('Services data based on selected Tab:', this.services);
          
        }
        else {
          this.services = [];
          this.alertsService.error(resp.message, this.alertOptions);
        }
        this.isLoadingServices = false;
      },
      (err: any) => {
        this.services = [];
        this.alertsService.error(
          err || 'Failed to load services',
          this.alertOptions
        );
        this.isLoadingServices = false;
      }
    );
  }

  saveServiceTab() {
    // In view-only mode, do not attempt to save
    if (this.isViewMode) {
      return;
    }
    const name = this.newServiceTabName.trim();
    const description = this.newServiceTabDescription.trim();
    if (!name) {
      this.nameError = true;
      return;
    }
    // if (this.isEditMode && this.editingIndex !== null) {
    //   this.updateServiceTabs(name, description);
    // }
    // else {
    //   this.createServiceTabs(name, description);
    // }
  }
  // Newly added function to navigate to the next tab
  // nextTab() {
  //   if (this.activeTab == 1) {
  //     var tab = document.getElementById("inroom-tab")
  //     if (tab != undefined) {
  //       tab.click();
  //     }
  //   }
  //   else if (this.activeTab == 2) {
  //     var tab = document.getElementById("other-tab")
  //     if (tab != undefined) {
  //       tab.click();
  //     }
  //   }
  //   else {
  //     let nextTab = document.getElementById('contact-tab2');
  //     if (nextTab) {
  //       (nextTab as HTMLAnchorElement).click();
  //     }
  //   }
  // }

  // previousTab() {
  //   if (this.activeTab == 1) {
  //     let nextTab = document.getElementById('profile-tab');
  //     if (nextTab) {
  //       (nextTab as HTMLAnchorElement).click();
  //     }
  //   }
  //   else if (this.activeTab == 2) {
  //     var tab = document.getElementById("general-tab")
  //     if (tab != undefined) {
  //       tab.click();
  //     }
  //   }
  //   else {
  //     let nextTab = document.getElementById('inroom-tab');
  //     if (nextTab) {
  //       (nextTab as HTMLAnchorElement).click();
  //     }
  //   }

  // }
  nextTab() {
    let nextTab = document.getElementById('hierarchy-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  previousTab() {
    let nextTab = document.getElementById('technical-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  // Creation methods
  openAddModal() {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.newServiceTabName = '';
    this.newServiceTabDescription = '';
    this.nameError = false;
  }

  /*  createServiceTabs(name: string, description: string) {
     const jsonObj = {
       domain_name: DOMAIN_NAME,
       user_id: this.authTokenService.getUserId(),
       payload: {
         creation: {
           customer_id: this.hotel_id,
           member_id: this.member_id,
           name: name,
           description,
         },
       },
     };
     this.serviceTabListService.createServiceTab(jsonObj).subscribe(
       (resp: any) => {
         if (resp.success === 1 && resp.status_code === 200) {
           this.alertsService.success('Service tab created successfully!', this.alertOptions);
           this.closeModal();
           this.getServiceTabById(this.member_id);
         }
         else if (resp.success === 0 && resp.status_code === 200) {
           this.alertsService.error(resp.message, this.alertOptions);
         }
         else {
           this.alertsService.error(resp.message, this.alertOptions);
         }
       },
       (error: any) => {
         this.alertsService.error('Error creating service tab!', this.alertOptions);
       }
     );
   } */

  // Update methods
  openEditModal(serviceTab: ServiceTabs, index: number) {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.isViewMode = false;
    this.newServiceTabName = serviceTab.name;
    this.newServiceTabDescription = serviceTab.description || '';
    this.editingIndex = index;
    // console.log('Editing index while opening editor modal:', this.editingIndex);
    this.nameError = false;
  }

  openViewModal(serviceTab: ServiceTabs, index: number) {
    // View-only mode: fields are readonly and save is disabled
    this.isModalOpen = true;
    this.isEditMode = false;
    this.isViewMode = true;
    this.newServiceTabName = serviceTab.name;
    this.newServiceTabDescription = serviceTab.description || '';
    this.editingIndex = index;
    this.nameError = false;
  }

  /* updateServiceTabs(name: string, description: string) {
    // console.log('Editing index while updating:', this.editingIndex);
    const jsonObj = {
      domain_name: DOMAIN_NAME,
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: this.editingIndex
        }
      },
      payload: {
        updation: {
          name: name,
          description,
          member_id: this.member_id,
          customer_id: this.hotel_id,
        },
      },
    };
    this.serviceTabListService.updateServiceTab(jsonObj).subscribe(
      (resp: any) => {
        if (resp.success === 1 && resp.status_code === 200) {
          this.alertsService.success('Service tab updated successfully!', this.alertOptions);
          this.closeModal();
          this.getServiceTabById(this.member_id); // Refresh ServiceTabs list from server();
        }
        else if (resp.success === 0 && resp.status_code === 200) {
          this.alertsService.error(resp.message, this.alertOptions);
        }
        else {
          this.alertsService.error(resp.message, this.alertOptions);
        }
      },
      (error: any) => {
        this.alertsService.error('Error updating service tab!', this.alertOptions);
      }
    );
  } */

  closeModal() {
    this.isModalOpen = false;
    this.newServiceTabName = '';
    this.newServiceTabDescription = '';
    this.editingIndex = null;
    this.nameError = false;
  }

  // Hide error message as soon as user types
  onNameInputChange() {
    if (this.newServiceTabName.trim()) {
      this.nameError = false;
    }
  }

  // Delete methods
  openDeleteModal(serviceTab: ServiceTabs, index: number) {
    this.selectedServiceTab = serviceTab;
    this.deleteIndex = index;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.selectedServiceTab = null;
    this.deleteIndex = null;
  }

  // confirmDelete() {
  //   if (this.deleteIndex !== null) {
  //     this.deleteServiceTabs(this.deleteIndex);
  //   }
  //   this.closeDeleteModal();
  // }
  /* 
    deleteServiceTabs(deleteIndex: number) {
      const jsonObj = {
        domain_name: DOMAIN_NAME,
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: deleteIndex
          }
        },
        payload: {}
      };
      this.serviceTabListService.deleteServiceTab(jsonObj).subscribe(
        (resp: any) => {
          if (resp.success === 1 && resp.status_code === 200) {
            this.alertsService.success('Service tab deleted successfully!', this.alertOptions);
            this.getServiceTabById(this.member_id);
          }
          else {
            this.alertsService.error('Failed to delete service tab!', this.alertOptions);
          }
        },
        (error: any) => {
          this.alertsService.error('Error deleting service tab!', this.alertOptions);
        }
      );
    } */
}

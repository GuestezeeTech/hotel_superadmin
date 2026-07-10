import { Component, OnInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { MenuBarComponent } from '../shared/menu-bar/menu-bar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../shared/loader/loader.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { HotelListService } from './hotel-list.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { ENDPOINTS } from '../app.config';
import { LocalStorageService } from '../auth-services/local-storage.service';
import { SharedDataService } from '../shared/shared-data.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [HeaderComponent, MenuBarComponent, CommonModule, FormsModule, AlertsComponent],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.scss'
})
export class HotelListComponent implements OnInit {
  @ViewChild('deleteModal') deleteModal!: ElementRef;
  @ViewChild('approvalModal') approvalModal!: ElementRef;

  private modalInstance!: Modal;
  customerList: any[] = [];
  isLoading: boolean = false;
  paginatedCustomers: any[] = [];
  data: any;
  userRoleName: string = "";
  adminUserData: any = {};
  selectedStatus: string = 'approved';
  unapprovalReason: string = '';
  reasonError: string = '';
  deletionReason: string = '';
  deletionReasonError: string = '';
  customerdata: any;
  deleteAllCustomerData: boolean = false;
  selectedIds = new Set<number>();//newly added
  idlistToDelete: any = []
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  alertOptions = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  isModalHidden: boolean = true;
  // Newly added for status button active/inactive based on payment done
  paidCustomerMemberIds = new Set<string>();
  // End of newly added for status button active/inactive based on payment done

  //pagination
  currentPage: number = 1;
  totalPages: number = 1; // Change this as per your data
  currentRemarks: string = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authTokenService: AuthTokenService,
    private hotellistservice: HotelListService,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private renderer: Renderer2, private el: ElementRef,
    private localStorageService: LocalStorageService,
    private sharedService: SharedDataService
  ) {

  }
  ngOnInit() {
    this.currentPage = this.sharedService.getHotelPage();
    this.getUserDetailById();
    // Newly added for status button active/inactive based on payment done
    this.fetchConfirmedOrders();
    // End of newly added for status button active/inactive based on payment done
    const selectAllCheckbox = document.getElementById('selectAll');

    (selectAllCheckbox as HTMLInputElement)
      .addEventListener('change', (event: Event) => {
        const checked = (event.target as HTMLInputElement).checked;
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        rowCheckboxes.forEach(cb =>
          (cb as HTMLInputElement).checked = checked
        );
      });
  }

  addNew() {
    this.router.navigate(["/add-new-hotel"]);
  }
  editCustomer(customerId: number) {
    this.router.navigate(["/edit-new-hotel", customerId]);
  }

  getAllCustomers() {
    this.isLoading = true;
    this.loaderService.emitLoading();
    // MAKE A SERVICE CALL HERE...
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {

        },
        "pagination": true,
        "paginationDetails": {
          "limit": 0,
          "pageSize": 10
        },
        "sorting": true,
        "sortingDetails": {
          "created_on": -1
        }
      }
    }
    this.hotellistservice.getAllCustomers(requestBody).subscribe(
      resp => {
        this.isLoading = false;
        this.loaderService.emitComplete();
        if (resp) {
          // Filter out records that contain 'staff_employee_number' key and require 'customer_member_id'
          this.customerList = resp.result.data.filter(
            // (item: any) => !('staff_employee_number' in item)
            //newly added to ignore user in the super admin
            (item: any) => !('staff_employee_number' in item) && ('customer_member_id' in item)
          ).sort((a: any, b: any) => {
            return new Date(b.created_on || 0).getTime() - new Date(a.created_on || 0).getTime();
          });
          const itemsPerPage = 10;
          this.totalPages = Math.ceil(this.customerList.length / itemsPerPage) || 1;
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
            this.sharedService.setHotelPage(this.currentPage);
          }
          const startIndex = (this.currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
          console.log(this.customerList, "this.customerList", this.totalPages)

        }
      },
      err => {
        this.isLoading = false;
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`], { skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertService.error(err.error.message, this.options)
        }
        else {
          this.alertService.error('Something bad happened. Please try again!', this.options);
        }
      }
    )
  }
  getCategoryLabel(propertySize: string | undefined): string {
    switch (propertySize) {
      case '01-50 Rooms': return 'Bronze';
      case '51-100 Rooms': return 'Silver';
      case '101-150 Rooms': return 'Gold';
      case '150 and above Rooms': return 'Platinum';
      default: return ''; // Empty string when no match
    }
  }

  getCategoryClass(propertySize: string | undefined): string {
    switch (propertySize) {
      case '01-50 Rooms': return 'bronze';
      case '51-100 Rooms': return 'silver';
      case '101-150 Rooms': return 'gold';
      case '150 and above Rooms': return 'platinum';
      default: return ''; // No class if no match
    }
  }
  // onsearch(text: any) {
  //   let data = text.target.value;


  //   {
  //     let searchBody = {
  //       "domain_name": this.authTokenService.getDomain(),
  //       "user_id": this.authTokenService.getUserId(),
  //       "extras": {
  //         "find": {
  //           "search": data
  //         }
  //       }
  //     }

  //     {
  //       this.hotellistservice.getCustomerByName(searchBody).subscribe(resp => {
  //         if (resp.status_code === 200) {
  //           // this.customerList = resp.result.data;
  //           this.customerList = resp.result.data.filter(
  //             (item: any) => !('staff_employee_number' in item)
  //           );
  //           //  this.paginatedCustomers= [];
  //           // this.paginatedCustomers =  this.customerList;

  //           const startIndex = (this.currentPage - 1) * 10; // 10 items per page
  //           const endIndex = startIndex + 10;
  //           this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
  //           // 10 items per page
  //           const itemsPerPage = 10;

  //           // Calculate total pages (round up for any remaining items)
  //           this.totalPages = Math.ceil(this.customerList.length / itemsPerPage);
  //           console.log(this.customerList, "this.customerList", this.totalPages)

  //           console.log(this.paginatedCustomers, "this.paginatedCustomers");
  //           console.log(this.customerList, "this.paginatedCustomers");
  //           this.totalPages = resp.result.total_count;
  //         }
  //         else {
  //           this.alertService.error('Sorry, No data avilable for this Product', this.alertOptions);
  //         }
  //       },
  //         err => {
  //           if (err.error.statusCode === 403) {
  //             this.alertService.error('Session Time Out! Please login Again', this.options)
  //             this.router.navigate([`/login`], { skipLocationChange: false });
  //           }
  //           else if (err.error.message) {

  //             this.alertService.error(err.error.message, this.alertOptions)
  //           }
  //           else {
  //             this.alertService.error('Something bad happened. Please try again!', this.alertOptions);
  //           }
  //         })
  //     }

  //   }
  // }
  onsearch(event: any) {
    const searchText = (event.target.value || '').trim().toLowerCase();
    this.currentPage = 1;
    this.sharedService.setHotelPage(1);

    if (!searchText) {
      this.getAllCustomers();
      return;
    }

    this.isLoading = true;
    this.loaderService.emitLoading();

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {},
        pagination: false,
        sorting: true,
        sortingDetails: {
          created_on: -1
        }
      }
    };

    this.hotellistservice.getAllCustomers(requestBody).subscribe(
      resp => {
        this.isLoading = false;
        this.loaderService.emitComplete();

        if (resp && resp.result && resp.result.data) {
          this.customerList = resp.result.data.filter((item: any) => {
            if ('staff_employee_number' in item) {
              return false;
            }
            //newly added to ignore user in the super admin
            if (!('customer_member_id' in item)) {
              return false;
            }

            const hotelName = (item.name || '').toLowerCase();
            const propertySize = (item?.property_details?.property_address?.property_size || '').toLowerCase();
            const categoryLabel = this.getCategoryLabel(
              item?.property_details?.property_address?.property_size
            ).toLowerCase();

            return (
              hotelName.includes(searchText) ||
              propertySize.includes(searchText) ||
              categoryLabel.includes(searchText)
            );
          }).sort((a: any, b: any) => {
            return new Date(b.created_on || 0).getTime() - new Date(a.created_on || 0).getTime();
          });

          const startIndex = 0;
          const endIndex = 10;
          this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
          this.totalPages = Math.ceil(this.customerList.length / 10) || 1;
        } else {
          this.customerList = [];
          this.paginatedCustomers = [];
          this.totalPages = 1;
        }
      },
      err => {
        this.isLoading = false;
        this.loaderService.emitComplete();

        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options);
          this.router.navigate([`/login`], { skipLocationChange: false });
        } else if (err.error.message) {
          this.alertService.error(err.error.message, this.alertOptions);
        } else {
          this.alertService.error('Something bad happened. Please try again!', this.alertOptions);
        }
      }
    );
  }





  // Helper to generate the array of page numbers [1, 2, 3...] — same pattern as payment-list
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number, event: Event) {
    event.preventDefault();
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.sharedService.setHotelPage(page);
      const startIndex = (this.currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
    }
  }

  nextPage(event: Event) {
    event.preventDefault(); // Prevent default link behavior
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.sharedService.setHotelPage(this.currentPage);
      const startIndex = (this.currentPage - 1) * 10; // 10 items per page
      const endIndex = startIndex + 10;
      this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
    }
    // if (this.currentPage < this.totalPages) {
    //   this.currentPage++;
    // }
  }

  previousPage(event: Event) {
    event.preventDefault(); // Prevent default link behavior
    if (this.currentPage > 1) {
      this.currentPage--;
      this.sharedService.setHotelPage(this.currentPage);
      const startIndex = (this.currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
    }
    // if (this.currentPage > 1) {
    //   this.currentPage--;
    // }
  }

  toggleSelection(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }
  deleteCustomer(id: number) {
    const index = this.idlistToDelete.indexOf(id);
    if (index === -1) {
      // Add ID if not already selected
      this.idlistToDelete.push(id);
      //console.log(this.idlistToDelete, "delete data");
    } else {
      // Remove ID if already selected
      this.idlistToDelete.splice(index, 1);
      //console.log(this.idlistToDelete, "delete data12");
    }
  }

  openModal() {
    //console.log("click");
    this.deleteModal.nativeElement.style.display = 'block';
    //console.log("click12333333");
  }

  closeModal() {
    const closeButton = document.getElementById("closedelete");
    if (closeButton) {
      closeButton.click();
    } else {
      var modal = document.getElementById("deleteModal"); // Get the element by its ID
      if (modal) { // Check if the element exists
        modal.style.display = 'none'; // Hide the modal
      }
    }
  }

  openDeleteModal(customer: any) {
    this.idlistToDelete = [customer.id];
    this.deletionReason = '';
    this.deletionReasonError = '';
  }

  async confirmDelete() {
    if (this.idlistToDelete.length === 0) {
      return;
    }
    if (!this.deletionReason || !this.deletionReason.trim()) {
      this.deletionReasonError = 'Reason for deletion is mandatory.';
      return;
    }

    this.isLoading = true;
    this.loaderService.emitLoading();

    try {
      // Fetch each customer document, update the deletion_reason, and save before deleting
      for (const id of this.idlistToDelete) {
        const customerDoc = await this.fetchCustomerDocumentById(id);
        
        delete customerDoc._id;
        delete customerDoc.password;
        delete customerDoc.password_to_customer;
        
        customerDoc.deletion_reason = this.deletionReason.trim();

        const requestBody = {
          domain_name: this.authTokenService.getDomain(),
          user_id: this.authTokenService.getUserId(),
          payload: {
            customer_updation: customerDoc
          },
          extras: {
            find: {
              id: id
            }
          }
        };

        await firstValueFrom(this.hotellistservice.updateCustomer(requestBody));
      }

      // Perform deletion
      const deleteRequestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          delete_data: {},
          variants: []
        },
        extras: {
          find: {
            id: this.idlistToDelete
          }
        }
      };

      const deleteResp = await firstValueFrom(this.hotellistservice.deleteCustomer(deleteRequestBody));
      this.isLoading = false;
      this.loaderService.emitComplete();

      if (deleteResp && deleteResp.status_code === 200) {
        this.closeModal();
        this.alertService.success(deleteResp.message || 'Hotel deleted successfully', this.options);
        this.getAllCustomers();
      } else {
        this.alertService.error('Sorry, No data available for this Product', this.alertOptions);
      }
    } catch (err: any) {
      this.isLoading = false;
      this.loaderService.emitComplete();
      
      if (err?.error?.statusCode === 403) {
        this.alertService.error('Session Time Out! Please login Again', this.options);
        this.router.navigate([`/login`], { skipLocationChange: false });
      } else if (err?.error?.message) {
        this.alertService.error(err.error.message, this.alertOptions);
      } else {
        this.alertService.error('Something bad happened. Please try again!', this.alertOptions);
      }
    }
  }
  openApprovalModal(data: any) {

    //console.log(data, "data")

    this.isModalHidden = false;

    this.data = data;
    this.unapprovalReason = this.data.status_remarks || '';
    this.reasonError = '';
    if (this.data.status === 'pending' || this.data.status === 'Pending') {
      this.selectedStatus = 'approved';
    } else {
      this.selectedStatus = this.data.status;
    }
  }

  selectstat(value: any) {
    this.selectedStatus = value;
    this.reasonError = '';
  }
  updateStatus() {
    //console.log(this.data.id, "this.data.id", this.selectedStatus)
    if ((this.selectedStatus === 'Unapproved' || this.selectedStatus === 'unapproved') && (!this.unapprovalReason || !this.unapprovalReason.trim())) {
      this.reasonError = 'Reason for unapproval is mandatory.';
      return;
    }
    this.getCustomerById(this.data.id)
      .then(() => {
        return this.customerUpdate(this.selectedStatus);  // Once function12 completes, call function1
      })
      .then(() => {
        // if (this.selectedStatus == "approved") {
        // this.sendEmail();
        // this.sendSms();

        // }


        //console.log("Both functions executed sequentially.");
      })
      .catch((error) => {
        //console.error("Error:", error);
      });

  }

  sendEmail() {
    const payload = {
      username: this.customerdata.first_name,
      email: this.customerdata.email,
      name: this.customerdata.first_name,
      domain_name: 'https://www.guestezee.com'
    };

    this.hotellistservice.sendWelcomeEmail(payload).subscribe({
      next: (res) => {
        console.log('Email API response:', res);
      },
      error: (err) => {
        console.error('Email API error:', err);
      }
    });
  }

  sendSms() {
    const payload = {
      "domain_name": "https://www.guestezee.com",
      "data": {
        "otp": {
          "countrycode": "+91",
          "mobile": this.customerdata.phone_number,
          "otppurpose": "Approval"
        }
      }
    }
    this.hotellistservice.sendApprovalSMS(payload).subscribe({
      next: (res) => {
        console.log('Email API response:', res);
      },
      error: (err) => {
        console.error('Email API error:', err);
      }
    });

  }



  ngAfterViewInit() {
    // You can safely access the DOM element after the view has been initialized
    if (this.deleteModal) {
      //console.log(this.deleteModal.nativeElement); // Logs the DOM element
    }
  }




  async customerUpdate(status: string) {

    delete this.customerdata._id;
    delete this.customerdata.password;
    delete this.customerdata.password_to_customer;
    //console.log(this.customerdata, "this.customerdata")
    this.customerdata.status = status;
    this.customerdata.status_remarks = (status || '').toLowerCase() === 'unapproved' ? this.unapprovalReason : '';

    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: this.customerdata
      },
      extras: {
        find: {
          id: this.customerdata.id
        }
      }
    }
    //console.log("123")
    this.hotellistservice.updateCustomer(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            const closeButton = document.getElementById("closeapproval");
            if (closeButton) {
              closeButton.click();  // Only call click if closeButton is not null
            } else {
              //console.error("Element with id 'closeapproval' not found.");
            }


            this.alertService.success(resp.message, this.options);
            this.getAllCustomers();

            // setTimeout(() => {
            //   this.router.navigate([`/all-customers`], { skipLocationChange: false });
            // }, 1000);
            // this.router.navigate(['/all-customers'], { state: { result: resp.message }, relativeTo: this.activatedRoute, skipLocationChange: false });

          }
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertService.error(resp.message, this.options);
            }
          }
          else if (resp.message && resp.status_code !== 200) {
            this.alertService.error(resp.message, this.options);
          }
          else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
        }
      },
      err => {
        this.loaderService.emitComplete();
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`], { skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertService.error(err.error.message, this.options)
        }
        else {
          this.alertService.error('Something bad happened. Please try again!', this.options);
        }
      }
    )
  }

  getCustomerById(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: Number(this.data.id)
          }
        }
      };

      this.hotellistservice.getCustomerById(requestBody).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            this.customerdata = resp.result.data[0];
            //console.log(this.customerdata, "RESPDATA");
            //console.log(Array.isArray(this.customerdata));
            resolve();  // Resolve promise when data is set
          }
        },
        err => {
          this.loaderService.emitComplete();
          if (err.error.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertService.error(err.error.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }

  fetchCustomerDocumentById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: Number(id)
          }
        }
      };
      this.hotellistservice.getCustomerById(requestBody).subscribe(
        resp => {
          if (resp && resp.result && resp.result.data && resp.result.data.length > 0) {
            resolve(resp.result.data[0]);
          } else {
            reject(new Error('Customer not found'));
          }
        },
        err => {
          reject(err);
        }
      );
    });
  }


  getUserDetailById() {

    let jsonObj = {
      "domain_name": this.authTokenService.getDomain(),
      "user_id": this.authTokenService.getUserId(),
      "extras": {
        "find": { "id": this.authTokenService.getUserId() }
      }
    };

    this.hotellistservice.postApiCall(jsonObj, ENDPOINTS.GETBYID_ADMINUSERS).subscribe(resp => {
      //console.log("Fetched Profile Data:", resp);

      if (resp.success === 1 && resp.status_code === 200) {
        this.adminUserData = resp.result.data[0];
        this.userRoleName = this.adminUserData.role_name;
        if (this.userRoleName == "Super Admin") {
          this.getAllCustomers();

        }
        else {
          let requestBody = {
            domain_name: this.authTokenService.getDomain(),
            user_id: this.authTokenService.getUserId(),
            extras: {
              find: {
                created_by: Number(this.localStorageService.get('UserId'))
              },
              sorting: true,
              sortingDetails: {
                created_on: -1
              }
            }
          };

          this.isLoading = true;
          this.hotellistservice.getCustomerById(requestBody).subscribe(
            resp => {
              this.isLoading = false;
              this.loaderService.emitComplete();
              if (resp) {
                // this.customerList = resp.result.data;
                //newly added to ignore user in the super admin
                this.customerList = resp.result.data.filter(
                  (item: any) => !('staff_employee_number' in item) && ('customer_member_id' in item)
                ).sort((a: any, b: any) => {
                  return new Date(b.created_on || 0).getTime() - new Date(a.created_on || 0).getTime();
                });
                const itemsPerPage = 10;
                this.totalPages = Math.ceil(this.customerList.length / itemsPerPage) || 1;
                if (this.currentPage > this.totalPages) {
                  this.currentPage = this.totalPages;
                  this.sharedService.setHotelPage(this.currentPage);
                }
                const startIndex = (this.currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                this.paginatedCustomers = this.customerList.slice(startIndex, endIndex);
                //console.log(this.customerdata, "RESPDATA");
                //console.log(Array.isArray(this.customerdata));
              }
            },
            err => {
              this.isLoading = false;
              this.loaderService.emitComplete();
              if (err.error.statusCode === 403) {
                this.alertService.error('Session Time Out! Please login Again', this.options);
                this.router.navigate([`/login`], { skipLocationChange: false });
              } else if (err.error.message) {
                this.alertService.error(err.error.message, this.options);
              } else {
                this.alertService.error('Something bad happened. Please try again!', this.options);
              }
            }
          );
        }

        // if (!this.adminUserData) {
        //   //console.error("No admin user data returned!");
        //   return;
        // }
      }
      else {
        //console.warn("Failed to fetch updated profile data.");
      }
    })
  }


  deleteAllCustomer() {
    this.idlistToDelete = [];
  }



  openTab1InNewPage() {

    const params = new URLSearchParams(window.location.search);
    const tabToShow = params.get('tab'); // e.g., "tab1"

    if (tabToShow) {
      const el = document.getElementById(tabToShow);
      if (el) {
        el.style.display = 'block';
      }
    }

  }
  openFullPreview(id: number) {
    const hotelId = this.route.snapshot.paramMap.get('id');
    this.router.navigate([`/hotel-preview/${id}`]);
  }

  // Newly added for status button active/inactive based on payment done
  fetchConfirmedOrders() {
    let requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {},
        "pagination": false
      }
    };
    this.hotellistservice.postApiCall(requestData, ENDPOINTS.GET_ALL_ORDER_DETAILS).subscribe(
      resp => {
        if (resp && resp.success === 1 && resp.status_code === 200 && resp.result && resp.result.data) {
          const confirmedOrders = resp.result.data.filter(
            (order: any) => (order.status === "Order Confirmed" || order.status === "Confirmed") && !('guest_id' in order)
          );
          this.paidCustomerMemberIds.clear();
          confirmedOrders.forEach((order: any) => {
            if (order.customer_member_id) {
              this.paidCustomerMemberIds.add(String(order.customer_member_id).trim());
            }
          });
        } else {
          this.paidCustomerMemberIds.clear();
        }
      },
      err => {
        console.error('Error fetching order details:', err);
        this.paidCustomerMemberIds.clear();
      }
    );
  }

  isPaymentDone(customerMemberId: any): boolean {
    if (!customerMemberId) return false;
    return this.paidCustomerMemberIds.has(String(customerMemberId).trim());
  }
  // End of newly added for status button active/inactive based on payment done

}




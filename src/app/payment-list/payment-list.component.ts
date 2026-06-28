import { Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OnInit } from '@angular/core';
import { LoaderService } from '../shared/loader/loader.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertsService } from '../shared/alerts/alerts.service';
import { PaymentListService } from './payment-list.service';
import { Input, OnChanges, SimpleChanges } from '@angular/core';
import { SharedDataService } from '../shared/shared-data.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { ENDPOINTS } from '../app.config';
import { FormsModule } from '@angular/forms';
import { AlertsComponent } from "../shared/alerts/alerts.component";

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FormsModule, AlertsComponent],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  orderData: Array<any> = [];
  customerOrderData: Array<any> = [];
  customerData: { [key: string]: any } = {};  // Map to store customer data by customer_id for toggle(active/inactive) status
  @Input() data: string = '';
  @Input() searchTerm: string = ''; //newly added for filtering
  isActive: boolean = true;
  remark: string = '';
  customerId: any;
  setCustomerStatus: boolean = true;
  tabName: string = 'Subscription';
  currentPage: number = 1;
  // itemsPerPage: number = 10; // For pagination
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  memberId: any;
  apiCallsCount: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authTokenService: AuthTokenService,

    private loaderService: LoaderService,
    private alertService: AlertsService,
    private paymentListService: PaymentListService,
    private sharedService: SharedDataService
  ) { }

  checkDataLoaded() {
    this.apiCallsCount--;
    if (this.apiCallsCount <= 0) {
      this.loaderService.emitComplete();
    }
  }

  ngOnInit(): void {
    //console.log(this.data, 'test');
    console.log('Alert options:', this.options);
    // setTimeout(() => {
    //   console.log('Testing alert service...');
    //   // this.alertService.success('Test message', this.options);
    // }, 1000);
    this.currentPage = this.sharedService.getPaymentPage();

    this.apiCallsCount = 2;
    this.loaderService.emitLoading();

    this.getOrderDetails();
    this.getCustomerData();  // Add this
    //console.log()
  }
  getOrderDetails() {
    var requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {

        },
        "pagination": false,
        "paginationDetails": {
          "limit": 0,
          "pageSize": 10
        },
        "sorting": true,
        "sortingDetails": {
          // "email": -1
          "id": -1
        }
      }
    }
    this.paymentListService.getAllOrderDetails(requestData).subscribe(
      resp => {
        if (resp) {
          this.orderData = resp.result.data.filter((order: any) => order.status === "Order Confirmed" && !('guest_id' in order));
          // console.log('this.orderData', this.orderData);
          // Create a Map to track the latest order per customer
          const latestOrdersMap = new Map();



          const latestOrders = Object.values(
            this.orderData.reduce((acc, order) => {
              const existing = acc[order.customer_id];
              // const existing = acc[order.customer_member_id]; //newly changed from customer_id to customer_member_id
              if (!existing || new Date(order.orderConfirmDate) > new Date(existing.orderConfirmDate)) {
                acc[order.customer_id] = order;
              }
              return acc;
            }, {})
          );

          // this.orderData = [];
          // this.orderData = latestOrders;

          this.orderData = latestOrders.sort((a: any, b: any) => b.id - a.id);
          //console.log(latestOrders,"latestOrders")


        }
        this.checkDataLoaded();
      },
      err => {
        this.checkDataLoaded();
      }
    )
  }

  // In PaymentListService
  // getCustomerDetails(requestData) {
  //   return this.http.post(ENDPOINTS.GET_ALL_CUSTOMERS, requestData);
  // }
  // ngOnInit(): void {
  //   this.getOrderDetails();
  //   this.getCustomerData();  // Add this
  // }

  getCustomerData() {
    var requestData: any = {  // Add type annotation
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {},
        "pagination": false
      }
    }

    // Use existing service method and correct endpoint
    this.paymentListService.apiCall(requestData, ENDPOINTS.GETALLCUSTOMER).subscribe(
      (resp: any) => {  // Add type annotation
        if (resp && resp.result && resp.result.data) {
          this.customerData = resp.result.data.reduce((map: any, customer: any) => {
            map[customer.id] = customer;
            if (customer.customer_member_id) {
              map[customer.customer_member_id] = customer;
            }
            if (customer.member_id) {
              map[customer.member_id] = customer;
            }
            return map;
          }, {});


          console.log('Customer data loaded:', Object.keys(this.customerData).length, 'customers');
        }
        this.checkDataLoaded();
      },
      (err: any) => {  // Add type annotation
        console.error('Error fetching customer data:', err);
        this.checkDataLoaded();
      }
    );
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

  //create a getter for the currently visible items
  paginatedOrderData(): any[] {
    //newly added for filtering
    const term = this.searchTerm.trim().toLowerCase();

    const filteredData = !term
      ? this.orderData
      : this.orderData.filter((data: any) =>
        (data?.customer?.hotel_name || '').toLowerCase().includes(term) ||
        (data?.customer_member_id || '').toLowerCase().includes(term) ||
        (data?.customer?.brand || '').toLowerCase().includes(term) ||
        this.getCategoryLabel(data?.customer?.property_size).toLowerCase().includes(term) ||
        (data?.subscription_end_date || '').toLowerCase().includes(term)
      );
    //end of newly added for filtering
    const startIndex = (this.currentPage - 1) * 10;
    return filteredData.slice(startIndex, startIndex + 10);
  }

  // Create a getter for the total number of pages
  get totalPages(): number {
    //newly added for filtering
    const term = this.searchTerm.trim().toLowerCase();

    const filteredCount = !term
      ? this.orderData.length
      : this.orderData.filter((data: any) =>
        (data?.customer?.hotel_name || '').toLowerCase().includes(term) ||
        (data?.customer_member_id || '').toLowerCase().includes(term) ||
        (data?.customer?.brand || '').toLowerCase().includes(term) ||
        this.getCategoryLabel(data?.customer?.property_size).toLowerCase().includes(term) ||
        (data?.subscription_end_date || '').toLowerCase().includes(term)
      ).length;
    return Math.ceil(filteredCount / 10) || 1;
    //end of newly added for filtering
    // return Math.ceil(this.orderData.length / 10) || 1;
  }

  // Create a helper to generate the array of page numbers[1, 2, 3...]
  get pages(): number[] {
    const pagesCount = this.totalPages;
    return Array.from({ length: pagesCount }, (_, i) => i + 1);
  }

  // Methods to handle button clicks
  goToPage(page: number, event: Event) {
    event.preventDefault();
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.sharedService.setPaymentPage(page);
    }
  }
  previousPage(event: Event) {
    event.preventDefault(); // Prevent default link behavior
    if (this.currentPage > 1) {
      this.currentPage--;
      this.sharedService.setPaymentPage(this.currentPage);
    }
  }
  nextPage(event: Event) {
    event.preventDefault(); // Prevent default link behavior
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.sharedService.setPaymentPage(this.currentPage);
    }
  }

  goToPaymentDetails(customer_id: number) {
    this.sendData("Subscription")
    this.router.navigate(["/payment-details", customer_id]);
  }
  goToCommisionPaymentDetails(customerId: number) {
    this.sendData("Commission")
    this.router.navigate(["/payment-details", customerId]);
  }


  isSubscriptionExpiring(subscriptionEndDate: string | null | undefined): boolean {
    //console.log(subscriptionEndDate, "subscriptionEndDate");

    if (!subscriptionEndDate) return false; // If date is missing, return false

    // Convert "dd-MM-yyyy" to "yyyy-MM-dd" (valid format for Date constructor)
    const parts = subscriptionEndDate.split("-");
    if (parts.length !== 3) return false; // Ensure valid date format

    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Rearranging to YYYY-MM-DD
    //console.log(formattedDate, "formattedDate");

    const expiryDate = new Date(formattedDate); // Now safe to parse
    const today = new Date();

    // Calculate the difference in days
    const differenceInDays = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    //console.log(`Subscription End Date: ${expiryDate}, Days Left: ${differenceInDays}`);

    return differenceInDays <= 7 && differenceInDays >= 0; // Show if expiring within 7 days
  }

  handleData(data: any) {
    var dataFromChild = data.message;
    //console.log(dataFromChild, "data from child");
  }
  sendData(data: string) {
    //console.log("dar",data)
    this.sharedService.shareData(data);
  }


  ngOnChanges(changes: SimpleChanges): void {
    //console.log("test")
    if (changes['data']) {
      //console.log('ngOnChanges - new data from parent:', this.data);
      this.tabName = this.data
      // Do something with this.data if needed
    }
    if (changes['searchTerm'] && !changes['searchTerm'].firstChange) {
      // Reset to first page when search term changes
      this.currentPage = 1;
      this.sharedService.setPaymentPage(1);
    }
  }
  // onToggle(data: any, inputdata: HTMLInputElement) { //undo

  // console.log('Full customer data:', data); // ADD THIS
  // console.log('Customer ID:', data.id);
  // console.log('Member ID:', data.customer_member_id);
  // console.log('Domain:', this.authTokenService.getDomain());

  // this.memberId = data.customer_member_id; //undo
  // this.setCustomerStatus = inputdata.checked; //undo
  //console.log(this.setCustomerStatus,"inputdata")
  //preventing the toggle from changing before confirmation
  // inputdata.checked = !inputdata.checked; //undo
  // this.customerId = data.customer_id; //undo
  // Immediately revert the checkbox to original state
  // setTimeout(() => { //undo
  // inputdata.checked = !this.setCustomerStatus;
  // }, 0);

  // Manually trigger the modal using existing Bootstrap pattern
  // const modal = document.getElementById("deleteModal"); //undo
  // if (modal) {
  //   (modal as any).style.display = 'block';
  //   (modal as any).classList.add('show');
  //   modal.removeAttribute('aria-hidden'); //undo
  // document.body.classList.add('modal-open');

  // Create backdrop if not exists
  // if (!document.querySelector('.modal-backdrop')) {
  //   const backdrop = document.createElement('div');
  //   backdrop.className = 'modal-backdrop fade show';
  //   document.body.appendChild(backdrop);
  // }
  // }

  // var modal = document.getElementById("deleteModal");
  // if (modal) {
  //   modal.style.display = 'block';
  //   modal.classList.add('show');
  // }
  //  }

  onToggle(customer: any, inputdata: HTMLInputElement) {
    console.log('Customer from lookup:', customer);
    console.log('Customer is_active:', customer?.is_active);
    if (!customer) {
      console.error('Customer not found');
      return;
    }

    // Store the NEW state (opposite of current)
    this.setCustomerStatus = !customer.is_active;
    this.customerId = customer.id;
    this.memberId = customer.customer_member_id || customer.member_id;

    // REMOVE these lines that prevent toggle:
    // inputdata.checked = !inputdata.checked;
    // setTimeout(() => {
    //   inputdata.checked = !this.setCustomerStatus;
    // }, 0);

    // Show modal
    const modal = document.getElementById("deleteModal");
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
      modal.removeAttribute('aria-hidden');
    }

    console.log('Customer is_active:', customer?.is_active);
  }

  closeModal() {
    var modal = document.getElementById("deleteModal"); // Get the element by its ID
    if (modal) { // Check if the element exists
      modal.style.display = 'none'; // Hide the modal
      modal.classList.remove('show'); // Remove the 'show' class
      document.body.classList.remove('modal-open'); // Remove the 'modal-open' class from body
      document.body.style.overflow = 'auto'; // Restore scrolling
      modal.setAttribute('aria-hidden', 'true');
    } else {
      //console.error("Element not found!");
    }
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    // if (backdrop) {
    //   backdrop.remove();
    // }

  }

  //original code for setCustomerInactive
  setCustomerInactive(id: number) { //undo --
    console.log('setCustomerInactive called with ID:', id);
    // Apply the toggle change now that user confirmed
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    // toggles.forEach((toggle: any) => { //undo
    //   const row = toggle.closest('tr');
    //   if (row && row.textContent.includes(this.memberId)) {
    //     toggle.checked = this.setCustomerStatus;
    //   }
    // });

    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        "customer_update": {
          is_active: this.setCustomerStatus

        }

      },
      extras: {
        find: {
          id: id
        }
      }
    }  //--undo

    // console.log('Full requestBody:', JSON.stringify(requestBody, null, 2)); // ADD THIS
    // console.log('API endpoint:', ENDPOINTS.UPDATE_CUSTOMER); // ADD THIS

    // console.log("123")
    this.paymentListService.apiCall(requestBody, ENDPOINTS.UPDATE_CUSTOMER).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          console.log('API Response:', resp); // DEBUG
          if (resp.success === 1 && resp.status_code === 200) {
            console.log('Showing success alert with message:', resp.message); // DEBUG
            if (this.customerData[id]) {
              this.customerData[id].is_active = this.setCustomerStatus;
              console.log('Updated customerData:', this.customerData[id]);
            }

            const closeButton = document.getElementById("closeapproval");
            if (closeButton) {
              closeButton.click();  // Only call click if closeButton is not null
            } else {
              //console.error("Element with id 'closeapproval' not found.");
              const modal = document.getElementById("deleteModal");
              if (modal) {
                modal.style.display = 'none';
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
              }
            }

            // this.getCustomerOrderData(id, this.setCustomerStatus);
            //  this.getOrderDetails();
            // this.alertService.success(resp.message, this.options);//undo
            // this.alertService.info('Info message', this.options);
            // this.alertService.warn('Warning message', this.options);
            // In payment-list.component.ts
            this.alertService.success(resp.message, {
              id: 'payment-list-alerts',
              autoClose: true,
              keepAfterRouteChange: false
            });


            this.closeModal();
            // setTimeout(() => {
            //   this.closeModal();
            // }, 2000); //undo

            // setTimeout(() => {
            //   this.router.navigate([`/all-customers`], { skipLocationChange: false });
            // }, 1000);
            // this.router.navigate(['/all-customers'], { state: { result: resp.message }, relativeTo: this.activatedRoute, skipLocationChange: false });

          } //undo --
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertService.error(resp.message, this.options);
              this.closeModal();
            }
          }
          else if (resp.message && resp.status_code !== 200) {
            this.alertService.error(resp.message, this.options);
            this.closeModal();
          }
          else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
            this.closeModal();
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


  } //--undo

  renewalCreate(data: any, status: boolean) {

    const subscription_end_date = data.subscription_end_date;
    const orderConfirmDate = data.orderConfirmDate;

    const startYear = new Date(orderConfirmDate).getFullYear();
    const [day, month, year] = subscription_end_date.split("-");
    const endYear = parseInt(year, 10);

    const output = `${startYear} - ${endYear}`;

    //console.log(output); 

    if (status == true) {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          "create_renewal": {

            customer_id: data.customer_id,
            // customer_member_id: data.customer_member_id, //newly changed from customer_id to customer_member_id
            member_id: data.customer_member_id,
            last_payment_date: data.orderConfirmDate,
            renewal_date: new Date(),
            amount: data.order_review.order_summary.order_total_amount,
            due_date: data.subscription_end_date,
            subscription_period: output,
            latest_order_id: data.id,
            cancel_date: " ",
            cancel_remark: ""

          }

        },
        extras: {
          find: {
            // id: id
          }
        }
      }
      //console.log("123")
      this.paymentListService.apiCall(requestBody, ENDPOINTS.ADD_RENEWAL).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {

              this.alertService.success(resp.message, this.options);


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
    else {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          "create_renewal": {

            customer_id: data.customer_id,
            // customer_member_id: data.customer_member_id, //newly changed from customer_id to customer_member_id 
            member_id: data.customer_member_id,
            last_payment_date: data.orderConfirmDate,
            renewal_date: " ",
            amount: data.order_review.order_summary.order_total_amount,
            due_date: data.subscription_end_date,
            subscription_period: output,
            latest_order_id: data.id,
            cancel_date: new Date(),
            cancel_remark: this.remark

          }

        },
        extras: {
          find: {
            // id: id
          }
        }
      }
      //console.log("123")
      this.paymentListService.apiCall(requestBody, ENDPOINTS.ADD_RENEWAL).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {




              this.alertService.success(resp.message, this.options);


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
              this.alertService.error('Something bad happened.Please try again!', this.options);
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





  }


  getCustomerOrderData(id: number, status: boolean) {
    var requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {
          // customer_id: id
          customer_member_id: id //newly changed from customer_id to customer_member_id

        },
        "pagination": false,
        "paginationDetails": {
          "limit": 0,
          "pageSize": 10
        },
        "sorting": true,
        "sortingDetails": {
          // "email": -1
          "id": -1
        }
      }
    }
    this.paymentListService.apiCall(requestData, ENDPOINTS.GET_ORDER_BY_ID).subscribe(
      resp => {
        if (resp) {
          this.customerOrderData = resp.result.data.filter((order: any) => order.status === "Order Confirmed");
          //console.log( this.customerOrderData,"this.customerOrderData");
          const latestOrder = this.customerOrderData.reduce((latest, order) =>
            new Date(order.orderConfirmDate) > new Date(latest.orderConfirmDate) ? order : latest
          );
          //console.log(latestOrder,'latestOrder');
          this.renewalCreate(latestOrder, status)
        }
      },
      err => {

      }
    )
  }




}

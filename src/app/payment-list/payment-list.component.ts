import { Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OnInit } from '@angular/core';
import { LoaderService } from '../shared/loader/loader.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,Router } from '@angular/router';
import { AlertsService } from '../shared/alerts/alerts.service';
import { PaymentListService } from './payment-list.service';
import { Input,OnChanges, SimpleChanges } from '@angular/core';
import { SharedDataService } from '../shared/shared-data.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { ENDPOINTS } from '../app.config';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule,FormsModule],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit{
  orderData: Array<any> = [];
  customerOrderData: Array<any> = [];
  @Input() data: string = '';
  isActive: boolean = true;
  remark: string = '';
  setCustomerStatus:boolean =true;
  tabName:string='Subscription';
  currentPage: number = 1;
    options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  memberId:any;
   constructor(
          private route: ActivatedRoute,
          private router: Router,
          private authTokenService: AuthTokenService,
         
           private loaderService:LoaderService,
           private alertService:AlertsService,
           private paymentListService:PaymentListService,
           private sharedService:SharedDataService
        ){}
        ngOnInit(): void {
          //console.log(this.data, 'test');
          this.getOrderDetails();
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
                "email": -1
              }
            }
          }
          this.paymentListService.getAllOrderDetails(requestData).subscribe(
            resp => {
              if (resp) {
                this.orderData = resp.result.data.filter((order:any) => order.status === "Confirmed");
                // Create a Map to track the latest order per customer
                const latestOrdersMap = new Map();



const latestOrders = Object.values(
   this.orderData.reduce((acc, order) => {
    const existing = acc[order.customer_id];
    if (!existing || new Date(order.orderConfirmDate) > new Date(existing.orderConfirmDate)) {
      acc[order.customer_id] = order;
    }
    return acc;
  }, {})
);
this.orderData=[];
this.orderData=latestOrders;
//console.log(latestOrders,"latestOrders")


              }
            },
            err => {
      
            }
          )
        }
        getCategoryLabel(propertySize: string | undefined): string {
          switch (propertySize) {
            case '01-50 Rooms': return 'Bronze';
            case '51-101 Rooms': return 'Silver';
            case '101-150 Rooms': return 'Gold';
            case '150 and above Rooms': return 'Platinum';
            default: return ''; // Empty string when no match
          }
        }
        
        getCategoryClass(propertySize: string | undefined): string {
          switch (propertySize) {
            case '01-50 Rooms': return 'bronze';
            case '51-101 Rooms': return 'silver';
            case '101-150 Rooms': return 'gold';
            case '150 and above Rooms': return 'platinum';
            default: return ''; // No class if no match
          }
        }
        goToPaymentDetails(customer_id:number){
          this.sendData("Subscription")
          this.router.navigate(["/payment-details", customer_id]);

        }
        goToCommisionPaymentDetails(customerId:number){
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
        sendData(data:string) {
         //console.log("dar",data)
          this.sharedService.shareData(data);
        }


        ngOnChanges(changes: SimpleChanges): void {
          //console.log("test")
          if (changes['data']) {
            //console.log('ngOnChanges - new data from parent:', this.data);
            this.tabName =this.data
            // Do something with this.data if needed
          }
        }
onToggle(data:any,inputdata: HTMLInputElement) {
  this.memberId=data.customer_member_id;
  this.setCustomerStatus = inputdata.checked;
  //console.log(this.setCustomerStatus,"inputdata")



}

closeModal() {
  var modal = document.getElementById("deleteModal"); // Get the element by its ID
  if (modal) { // Check if the element exists
      modal.style.display = 'none'; // Hide the modal
  } else {
      //console.error("Element not found!");
  }
}
setCustomerInactive(id:number){



   let requestBody = {
    domain_name: this.authTokenService.getDomain(),
    user_id: this.authTokenService.getUserId(),
    payload: {
      "update_customer":{ 
         is_active:this.setCustomerStatus

      }
   
    },
    extras: {
      find: {
        id: id
      }
    }
  }
//console.log("123")
  this.paymentListService.apiCall(requestBody,ENDPOINTS.UPDATE_CUSTOMER).subscribe(
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
         
         this.getCustomerOrderData(id,this.setCustomerStatus);
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



renewalCreate(data:any,status:boolean){



const subscription_end_date = data.subscription_end_date;
const orderConfirmDate = data.orderConfirmDate;

const startYear = new Date(orderConfirmDate).getFullYear();
const [day, month, year] = subscription_end_date.split("-");
const endYear = parseInt(year, 10);

const output = `${startYear} - ${endYear}`;

//console.log(output); 


  if(status==true){
       let requestBody = {
    domain_name: this.authTokenService.getDomain(),
    user_id: this.authTokenService.getUserId(),
    payload: {
      "create_renewal":{ 

        customer_id:data.customer_id,
        member_id:data.customer_member_id,
        last_payment_date:data.orderConfirmDate,
        renewal_date:new Date(),
        amount:data.order_review.order_summary.order_total_amount,
        due_date:data.subscription_end_date,
        subscription_period:output,
        latest_order_id:data.id,
        cancel_date:" ",
        cancel_remark:""

      }
   
    },
    extras: {
      find: {
        // id: id
      }
    }
  }
//console.log("123")
  this.paymentListService.apiCall(requestBody,ENDPOINTS.ADD_RENEWAL).subscribe(
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
  else{
           let requestBody = {
    domain_name: this.authTokenService.getDomain(),
    user_id: this.authTokenService.getUserId(),
    payload: {
      "create_renewal":{ 
        
        customer_id:data.customer_id,
        member_id:data.customer_member_id,
        last_payment_date:data.orderConfirmDate,
        renewal_date:" ",
        amount:data.order_review.order_summary.order_total_amount,
        due_date:data.subscription_end_date,
        subscription_period:output,
        latest_order_id:data.id,
        cancel_date:new Date(),
        cancel_remark:this.remark

      }
   
    },
    extras: {
      find: {
        // id: id
      }
    }
  }
//console.log("123")
  this.paymentListService.apiCall(requestBody,ENDPOINTS.ADD_RENEWAL).subscribe(
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


  getCustomerOrderData(id:number,status:boolean) {
          var requestData = {
            domain_name: this.authTokenService.getDomain(),
            user_id: this.authTokenService.getUserId(),
            "extras": {
              "find": {
                customer_id:id
                
              },
              "pagination": false,
              "paginationDetails": {
                "limit": 0,
                "pageSize": 10
              },
              "sorting": true,
              "sortingDetails": {
                "email": -1
              }
            }
          }
          this.paymentListService.apiCall(requestData,ENDPOINTS.GET_ORDER_BY_ID).subscribe(
            resp => {
              if (resp) {
                this.customerOrderData = resp.result.data.filter((order:any) => order.status === "Confirmed");
                //console.log( this.customerOrderData,"this.customerOrderData");
                const latestOrder =  this.customerOrderData.reduce((latest, order) => 
  new Date(order.orderConfirmDate) > new Date(latest.orderConfirmDate) ? order : latest
);
//console.log(latestOrder,'latestOrder');
this.renewalCreate(latestOrder,status)
              }
            },
            err => {
      
            }
          )
        }



        
      }
      
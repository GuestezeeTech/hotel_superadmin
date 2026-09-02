import { Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentDetailsService } from './payment-details.service';
import { OnInit } from '@angular/core';
import { LoaderService } from '../shared/loader/loader.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertsService } from '../shared/alerts/alerts.service';
import { SharedDataService } from '../shared/shared-data.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss'
})
export class PaymentDetailsComponent implements OnInit {
  orderData: Array<any> = [];
  customerId: string | null = null;
  hotel_Id: any = null;
  hotelId: Number | null = null;
  latestOrderId: any = null;



  receivedData: any
  customerdata: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authTokenService: AuthTokenService,
    private location: Location,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private paymentDetailsService: PaymentDetailsService,
    private sharedService: SharedDataService
  ) { }

  apiCallsCount = 0;

  checkDataLoaded() {
    this.apiCallsCount--;
    if (this.apiCallsCount <= 0) {
      this.loaderService.emitComplete();
    }
  }

  goBack(): void {
    this.router.navigate(['/payment-tab-view']);
  }

  ngOnInit(): void {


    this.route.paramMap.subscribe(params => {
      var temphotelid = params.get('id');
      if (temphotelid) {
        this.hotel_Id = temphotelid;
        this.apiCallsCount = 2;
        this.loaderService.emitLoading();
        this.getOrderDetails();
        this.getCustomerById();
      }
    });

    this.sharedService.currentData.subscribe(data => {
      //console.log("data")
      if (data) {
        this.receivedData = data;
        //console.log('Received data:', this.receivedData);
      }
      else {
        this.receivedData = this.sharedService.getStoredData();
      }
    });

  }
  getOrderDetails() {
    var requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "extras": {
        "find": {
          "customer_member_id": this.hotel_Id
        },

        "pagination": false,
        /* "paginationDetails": {
          "limit": 0,
          "pageSize": 10
        }, */
        "sorting": true,
        "sortingDetails": {
          "email": -1
        }
      }
    }
    this.paymentDetailsService.orderDetailsGetById(requestData).subscribe(
      resp => {
        if (resp) {
          this.orderData = resp.result.data.filter((order: any) => order.status === "Order Confirmed");
          if (this.orderData.length > 0) {
            this.latestOrderId = this.orderData[0].id;
          }

        }
        this.checkDataLoaded();
      },
      err => {
        this.checkDataLoaded();
      }
    )
  }
  getCustomerById() {

    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            customer_member_id: this.hotel_Id
          }
        }
      };

      this.paymentDetailsService.getCustomerById(requestBody).subscribe(
        resp => {
          this.checkDataLoaded();
          if (resp) {
            this.customerdata = resp.result.data[0];



            // console.log(this.customerdata, "RESPDATA");
            //console.log(Array.isArray(this.customerdata)); 

          }
        },
        err => {
          this.checkDataLoaded();
          if (err.error.statusCode === 403) {
            // this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            // this.alertService.error(err.error.message, this.options);
          } else {
            // this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }
  downloadInvoice(id: number) {
    // window.open("https://www.guestezee.com:5520/api/Email/DownloadEnrollmentInvoicePdf?domain_name=" + this.authTokenService.getDomain() + "&order_id=" + id + "", '_blank')
    window.open("https://www.guestezee.com:8010/attachments/invoice?domain_name=https://www.guestezee.com&order_id=" + id, '_blank')

  }

  viewPaymentSummary(id: any) {
    if (id) {
      this.router.navigate(['/payment-summary-list', id]);
    }
  }

}

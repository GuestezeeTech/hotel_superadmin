import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {AlertsComponent} from '../shared/alerts/alerts.component'
import { FormsModule } from '@angular/forms';
import { PaymentDetailsService } from '../payment-details/payment-details.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview/hotel-enrollment-tabview.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-payment-subscription-management-customer',
  standalone: true,
  imports: [CommonModule, FormsModule,AlertsComponent],
  templateUrl: './payment-subscription-management.component.html',
  styleUrls: ['./payment-subscription-management.component.scss']
})
export class PaymentSubscriptionManagementCustomerComponent implements OnInit {
  constructor(private routerUrl: Router,
    private PaymentDetailsService: PaymentDetailsService,
    private authTokenService: AuthTokenService,
    private alertService: AlertsService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }
  hotelId: Number | null = null;
  customerdata: any = [];
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  plans: any[] = [
    // {
    // name: 'Basic',
    // price: 450,
    // perRoomCost: 450,
    // roomCount: 1,
    // discountType: 'percentage', // 'percentage' or 'flat'
    // discountValue: 0,
    // finalPrice: 450,
    // isCurrent: true,
    // features: ['Feature 1', 'Feature 2']
    // }

  ];

  planName: string = "";

  billingDetails = {
    nextPaymentDate: '28 March 2025',
    nextPaymentAmount: 56.0,
    lastPayment: {
      status: 'Payment Successful',
      cardNumber: '**** **** **** 5714',
      cardType: 'VISA',
      amount: 56.0
    },
    lastBilling: {
      name: 'Aswin Kumar R',
      date: '28 Feb, 2025',
      address: '#46 Ambattur, Chennai, Tamil Nadu 600058'
    }
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);
      //console.log('Hotel ID:', this.hotelId);
      if (this.hotelId != 0) {
        this.getCustomerById()// Debugging
      }
      else {
        this.getAllSubscriptions();
      }

    });

  }

  calculateDiscount(plan: any) {
    // Ensure Room Cost is a whole integer
    if (plan.perRoomCost) {
      plan.perRoomCost = Math.floor(plan.perRoomCost);
    }
    const roomCount = Number(plan.roomCount) || 1;
    const discountType = plan.discountType || 'selected';
    const discountValue = Number(plan.discountValue) || 0;

    // If "SingleRoomPricing" → update all plans
    if (plan.name === 'SingleRoomPricing') {
      const newCost = Number(plan.perRoomCost) || 0;

      this.plans.forEach((p: any) => {
        p.perRoomCost = newCost;

        const roomCount = Number(p.roomCount) || 1;
        const total = newCost * roomCount; // ✅ total for all rooms

        let discount = 0;
        if (p.discountType === 'percentage') {
          discount = (total * (Number(p.discountValue) || 0)) / 100;
        } else if (p.discountType === 'flat') {
          discount = Number(p.discountValue) || 0;
        }

        const discountedTotal = total - discount;

        const yearlyTotal = discountedTotal * 12;

        // ✅ GST (18% of yearly total)
        p.gstAmount = +(discountedTotal * 0.18).toFixed(2);


        // ✅ Final price = yearly total + GST
        p.finalPrice = +(discountedTotal + p.gstAmount).toFixed(2);
        p.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
        p.peryearcost = +(yearlyTotal + p.gstAmount).toFixed(2);
      });

    }
    else {
      // For individual plan update
      const total = (Number(plan.perRoomCost) || 0) * roomCount;
      let discount = 0;

      if (discountType === 'percentage') {
        discount = (total * discountValue) / 100;
      } else if (discountType === 'flat') {
        discount = discountValue;
      }

      const discountedTotal = total - discount;

      const yearlyTotal = discountedTotal * 12;

      // ✅ GST (18% of yearly total)
      plan.gstAmount = +(discountedTotal * 0.18).toFixed(2);


      // ✅ Final price = yearly total + GST
      plan.finalPrice = +(discountedTotal + plan.gstAmount).toFixed(2);
      plan.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
      plan.peryearcost = +(yearlyTotal + plan.gstAmount).toFixed(2);


    }
  }



  // calculateDiscount(plan: any) {
  //   console.log(plan, "plan");

  //   const total = (plan.perRoomCost || 0) * (plan.roomCount || 1);
  //   let discount = 0;

  //   if (plan.discountType === 'percentage') {
  //     discount = (total * (plan.discountValue || 0)) / 100;
  //   } else if (plan.discountType === 'flat') {
  //     discount = plan.discountValue || 0;
  //   }

  //   const discountedTotal = total - discount;

  //   // GST 18%
  //   const gstRate = 18;
  //   const gstAmount = (discountedTotal * gstRate) / 100;

  //   plan.gstAmount = gstAmount;
  //   plan.finalPrice = discountedTotal + gstAmount;



  // console.log(plan,"plan");




  // }
  calculateDiscount1(plan: any) {
    // Ensure Room Cost is a whole integer
    if (plan.perRoomCost) {
      plan.perRoomCost = Math.floor(plan.perRoomCost);
    }

    const roomCount = Number(plan.roomCount) || 1;
    const discountType = plan.discountType || 'selected';
    const discountValue = Number(plan.discountValue) || 0;

    // If "SingleRoomPricing" → update all plans
    if (plan.name === 'SingleRoomPricing') {
      const newCost = Number(plan.perRoomCost) || 0;

      this.plans.forEach((p: any) => {
        p.perRoomCost = newCost;

        const roomCount = Number(p.roomCount) || 1;
        const total = newCost * roomCount; // ✅ total for all rooms

        let discount = 0;
        if (p.discountType === 'percentage') {
          discount = (total * (Number(p.discountValue) || 0)) / 100;
        } else if (p.discountType === 'flat') {
          discount = Number(p.discountValue) || 0;
        }

        const discountedTotal = total - discount;
        const yearlyTotal = discountedTotal * 12;

        // ✅ GST (18% of yearly total)
        p.gstAmount = +(yearlyTotal * 0.18).toFixed(2);

        // ✅ Final price = yearly total + GST
        p.finalPrice = +(yearlyTotal + p.gstAmount).toFixed(2);

        p.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
        p.peryearcost = +(yearlyTotal + p.gstAmount).toFixed(2);
      });
    }
    else {
      // For individual plan update
      const total = (Number(plan.perRoomCost) || 0) * roomCount;
      let discount = 0;

      if (discountType === 'percentage') {
        discount = (total * discountValue) / 100;
      } else if (discountType === 'flat') {
        discount = discountValue;
      }

      const discountedTotal = total - discount;

      const yearlyTotal = discountedTotal * 12;

      // ✅ GST (18% of yearly total)
      plan.gstAmount = +(discountedTotal * 0.18).toFixed(2);

      // ✅ Final price = yearly total + GST
      plan.finalPrice = +(discountedTotal + plan.gstAmount).toFixed(2);

      plan.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
      plan.peryearcost = +(yearlyTotal + plan.gstAmount).toFixed(2);

    }



    let subscription_creation = {
      // "per_room_cost":plan.perRoomCost,
      // "discount_type":plan.discountType,
      // "discount_amount":plan.discountValue,
      // "gst":plan.gstAmount,
      // "total_amount":plan.finalPrice

      name: plan.name,
      price: plan.perRoomCost,
      perRoomCost: plan.perRoomCost,
      roomCount: 1,
      discountType: plan.discountType, // 'percentage' or 'flat'
      discountValue: plan.discountValue,
      finalPrice: plan.finalPrice,
      gst_amount: plan.gstAmount,
      // features: ['Feature 1', 'Feature 2']

    }
    this.customerdata.subscription_detail = {
      name: plan.name,
      price: plan.perRoomCost,
      perRoomCost: plan.perRoomCost,
      roomCount: 1,
      discountType: plan.discountType,
      discountValue: plan.discountValue,
      finalPrice: plan.finalPrice,
      gst_amount: plan.gstAmount
    };


    delete this.customerdata._id;
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: this.customerdata
      },
      extras: {
        find: {
          id: this.hotelId
        }
      }
    }
    //console.log("123")
    this.hotelenrollmenttabviewService.updateCustomer(requestBody).subscribe(
      resp => {
        // this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // //console.log(resp);
            this.hotelenrollmenttabviewService.clearAdminFormEvent();
            //console.log("alerttttt")
            this.alertService.success(resp.message || "Record Successfully Updated", this.options);
            // this.payNow();
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
        // this.loaderService.emitComplete();
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

  goBack() {
    this.routerUrl.navigate(['/settings']);
  }

  preventDecimal(event: KeyboardEvent) {
    if (['.', 'e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  getAllSubscriptions() {
    // this.loaderService.emitLoading();
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
          "email": -1
        }
      }
    }
    this.PaymentDetailsService.getAllSubscriptionDetails(requestBody).subscribe(
      resp => {
        // this.loaderService.emitComplete();
        if (resp) {

          console.log("customer data", this.customerdata)
          if (this.customerdata?.property_details?.property_address?.property_size == "01-50 Rooms") {
            console.log("11");

            this.plans = [];
            this.plans.push(resp.result.data[1]);

          }
          else if (this.customerdata?.property_details?.property_address?.property_size == "51-100 Rooms") {
            console.log("12")
            this.plans = [];
            console.log("test test")
            this.plans.push(resp.result.data[2]);
            console.log(this.plans, "test")

          }
          else if (this.customerdata?.property_details?.property_address?.property_size == "101-150 Rooms") {
            console.log("13")
            this.plans = [];
            this.plans.push(resp.result.data[3]);

          }
          else if (this.customerdata?.property_details?.property_address?.property_size == "150 and above Rooms") {
            this.plans = [];
            console.log("14")
            this.plans.push(resp.result.data[4]);

          }
          else {
            console.log("15")
            this.plans = resp.result.data;

          }
          console.log(this.plans, "   ");
          // this.customerList = resp.result.data;
          // Filter out records that contain 'staff_employee_number' key


        }
      },
      err => {
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options)
          // this.router.navigate([`/login`], { skipLocationChange: false });
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

  ngonchanges() {

  }

  getCustomerById(): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.hotelId
          }
        }
      };

      this.hotelenrollmenttabviewService.getCustomerById(requestBody).subscribe(
        resp => {
          // this.loaderService.emitComplete();
          if (resp) {
            this.customerdata = resp.result.data[0];
            this.planName = this.customerdata?.property_details?.property_address?.property_size;
            if (this.customerdata?.property_details?.property_address?.property_size != undefined) {
              this.plans = [];
              if (this.customerdata.subscription_detail) {  //newly added
                this.plans.push(this.customerdata.subscription_detail);
              }
              console.log(this.plans, "plan")
              if (this.plans == undefined || this.plans.length == 0 || this.plans[0] == undefined) {
                console.log("ccchh")
                this.plans = []; // newly added
                this.getAllSubscriptions();

              }

            }

            console.log(this.plans, "555555555555555")
            //console.log(this.customerdata, "RESPDATA");
            //console.log(Array.isArray(this.customerdata)); 
            resolve();  // Resolve promise when data is set
          }
        },
        err => {
          // this.loaderService.emitComplete();
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
  updateCustomer() {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: this.customerdata
      },
      extras: {
        find: {
          id: this.hotelId
        }
      }
    }
    //console.log("123")
    this.hotelenrollmenttabviewService.updateCustomer(requestBody).subscribe(
      resp => {
        // this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // //console.log(resp);
            this.hotelenrollmenttabviewService.clearAdminFormEvent();
            //console.log("alerttttt")
            this.alertService.success(resp.message, this.options);
            // this.payNow();
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
        // this.loaderService.emitComplete();
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


  // nextTab() {
  //   this.alertService.success("Hotel Enrollment Completed Successfully", this.options);
  //   setTimeout(() => {
  //     this.router.navigate(['/hotel-list']);
  //   }, 1500);
  // }

  previousTab() {
    let nextTab = document.getElementById('hierarchy-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

}

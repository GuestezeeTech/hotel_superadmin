import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentDetailsService } from '../payment-details/payment-details.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { AlertsComponent } from '../shared/alerts/alerts.component';

@Component({
  selector: 'app-payment-subscription-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertsComponent],
  templateUrl: './payment-subscription-management.component.html',
  styleUrls: ['./payment-subscription-management.component.scss']
})
export class PaymentSubscriptionManagementComponent implements OnInit {
  constructor(private routerUrl: Router,
    private PaymentDetailsService: PaymentDetailsService,
    private authTokenService: AuthTokenService,
    private alertService: AlertsService
  ) { }

  finalPriceFor50Rooms: number = 0;
  finalPriceFor101Rooms: number = 0;
  finalPriceFor151Rooms: number = 0;
  finalPriceFor200Rooms: number = 0;




  gstFor50Rooms: number = 0;
  gstFor101Rooms: number = 0;
  gstFor151Rooms: number = 0;
  gstFor200Rooms: number = 0;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  plans: any = [
    {
      // name: 'Basic',
      // price: 450,
      // perRoomCost: 450,
      // roomCount: 1,
      // discountType: 'percentage', // 'percentage' or 'flat'
      // discountValue: 0,
      // finalPrice: 450,
      // isCurrent: true,
      // features: ['Feature 1', 'Feature 2']
    }

  ];

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
    this.getAllSubscriptions();
  }

  //  calculateDiscount(plan: any) {
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


  calculateDiscount(plan: any) {
    if (plan.discountType === 'selected') {
      plan.discountValue = 0;
    }

    // Ensure Room Cost is a whole integer
    if (plan.perRoomCost) {
      plan.perRoomCost = Math.floor(plan.perRoomCost);
    }

    const roomCount = Number(plan.roomCount) || 1;
    const discountType = plan.discountType || 'selected';
    let discountValue = Number(plan.discountValue) || 0;

    if (discountType === 'percentage' && discountValue > 100) {
      this.alertService.error(`Discount percentage cannot exceed 100% for ${plan.name}`, this.options);
      return;
    }
    if (discountType === 'flat' && discountValue > (Number(plan.perRoomCost) || 0)) {
      this.alertService.error(`Flat discount cannot be greater than the room cost for ${plan.name}`, this.options);
      return;
    }

    // If "SingleRoomPricing" → update all plans
    if (plan.name === 'SingleRoomPricing') {
      const newCost = Number(plan.perRoomCost) || 0;

      this.plans.forEach((p: any) => {
        p.perRoomCost = newCost;

        const roomCount = Number(p.roomCount) || 1;
        const total = newCost * roomCount; // ✅ total for all rooms

        let currentDiscountValue = Number(p.discountValue) || 0;
        let isInvalid = false;
        if (p.discountType === 'percentage' && currentDiscountValue > 100) {
          isInvalid = true;
          this.alertService.error(`Discount percentage cannot exceed 100% for ${p.name}`, this.options);
        }
        if (p.discountType === 'flat' && currentDiscountValue > newCost) {
          isInvalid = true;
          this.alertService.error(`Flat discount cannot be greater than the room cost for ${p.name}`, this.options);
        }

        let discount = 0;
        if (!isInvalid) {
          if (p.discountType === 'percentage') {
            discount = (total * currentDiscountValue) / 100;
          } else if (p.discountType === 'flat') {
            discount = currentDiscountValue;
          } else if (p.discountType === 'selected') {
            discount = 0;
          }
        }


        const discountedTotal = total - discount;
        // console.log('Discounted Total:', discountedTotal);

        // ✅ Calculate total for 12 months
        const yearlyTotal = discountedTotal * 12;
        // console.log('Yearly Total:', yearlyTotal);

        // ✅ GST (18% of yearly total)
        p.gstAmount = +(discountedTotal * 0.18).toFixed(2); //(250 * 0.18) = 45
        // p.gstAmount = +(yearlyTotal * 0.18).toFixed(2);
        // console.log('GST Amount:', p.gstAmount);

        // ✅ Final price = yearly total + GST
        p.finalPrice = +(discountedTotal + p.gstAmount).toFixed(2); // (250 + 45) = 295
        // console.log('Final Price:', p.finalPrice);
        // p.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
        p.peryeargstAmount = +(p.gstAmount * 12).toFixed(2);
        // console.log('Per Year GST Amount:', p.peryeargstAmount);
        // p.peryeargstAmount = +(yearlyTotal + (yearlyTotal * 0.18)).toFixed(2);
        // p.peryearcost = +(yearlyTotal + p.pergstAmount).toFixed(2);
        // p.peryearcost = +(yearlyTotal + p.peryeargstAmount).toFixed(2);
        p.peryearcost = +(p.finalPrice * 12).toFixed(2); // (295 * 12) = 3540
        // console.log('Per Year Cost:', p.peryearcost);
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
      } else if (discountType === 'selected') {
        discount = 0;
      }


      const discountedTotal = total - discount;

      // ✅ GST based on total (after discount)
      // ✅ Calculate total for 12 months
      const yearlyTotal = discountedTotal * 12;
      // console.log('Yearly Total:', yearlyTotal);

      // ✅ GST (18% of yearly total)
      plan.gstAmount = +(discountedTotal * 0.18).toFixed(2);
      // plan.gstAmount = +(yearlyTotal * 0.18).toFixed(2);
      // console.log('GST Amount:', plan.gstAmount);

      // ✅ Final price = yearly total + GST
      plan.finalPrice = +(discountedTotal + plan.gstAmount).toFixed(2);
      // console.log('Final Price:', plan.finalPrice);
      // plan.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
      plan.peryeargstAmount = +(plan.gstAmount * 12).toFixed(2);
      // console.log('Per Year GST Amount:', plan.peryeargstAmount);
      // plan.peryearcost = +(yearlyTotal + plan.gstAmount).toFixed(2);
      // plan.peryearcost = +(yearlyTotal + plan.peryeargstAmount).toFixed(2);
      plan.peryearcost = +(plan.finalPrice * 12).toFixed(2);
      // console.log('Per Year Cost:', plan.peryearcost);
    }
  }



  applyDiscountAndGST(plan: any) {
    const roomCount = Number(plan.roomCount) || 1;
    const total = (Number(plan.perRoomCost) || 0) * roomCount;
    const discountType = plan.discountType || 'selected';
    const discountValue = Number(plan.discountValue) || 0;

    let discount = 0;

    if (discountType === 'percentage') {
      discount = (total * discountValue) / 100;
    } else if (discountType === 'flat') {
      discount = discountValue;
    }

    const discountedTotal = total - discount;
    // ✅ Calculate total for 12 months
    const yearlyTotal = discountedTotal * 12;

    // ✅ GST (18% of yearly total)
    // plan.gstAmount = +(yearlyTotal * 0.18).toFixed(2);
    plan.gstAmount = +(discountedTotal * 0.18).toFixed(2);

    // ✅ Final price = yearly total + GST
    // plan.finalPrice = +(yearlyTotal + plan.gstAmount).toFixed(2);
    plan.finalPrice = +(discountedTotal + plan.gstAmount).toFixed(2);
    plan.peryeargstAmount = +(plan.gstAmount * 12).toFixed(2);
    plan.peryearcost = +(plan.finalPrice * 12).toFixed(2);
  }




  calculateDiscount1(plan: any) {
    if (plan.discountType === 'selected') {
      plan.discountValue = 0;
    }

    // Ensure Room Cost is a whole integer
    if (plan.perRoomCost) {
      plan.perRoomCost = Math.floor(plan.perRoomCost);
    }

    const discountType = plan.discountType || 'selected';
    // console.log('Discount Type:', discountType);

    let discountValue = Number(plan.discountValue) || 0;

    // Validation: Percentage should not be more than 100
    if (discountType === 'percentage' && discountValue > 100) {
      this.alertService.error(`Discount percentage cannot exceed 100% for ${plan.name}`, this.options);
      return;
    }

    // Validation: Flat Price should be less than or equal to Room Cost
    if (discountType === 'flat' && discountValue > (Number(plan.perRoomCost) || 0)) {
      this.alertService.error(`Flat discount cannot be greater than the room cost for ${plan.name}`, this.options);
      return;
    }

    // Determine which plans to update
    const plansToUpdate = plan.id === 18 ? this.plans : [plan]; // SingleRoomPricing updates all
    // console.log('Plans to Update:', plansToUpdate);
    plansToUpdate.forEach((p: any) => {
      const roomCount = Number(p.roomCount) || 1;
      // console.log('Room Count:', roomCount);
      const total = (Number(p.perRoomCost) || 0) * roomCount;
      // console.log('Total before discount:', total);

      let currentDiscountValue = Number(p.discountValue) || 0;
      let isInvalid = false;
      if (p.discountType === 'percentage' && currentDiscountValue > 100) {
        isInvalid = true;
        this.alertService.error(`Discount percentage cannot exceed 100% for ${p.name}`, this.options);
      }
      if (p.discountType === 'flat' && currentDiscountValue > (Number(p.perRoomCost) || 0)) {
        isInvalid = true;
        this.alertService.error(`Flat discount cannot be greater than the room cost for ${p.name}`, this.options);
      }

      let discount = 0;
      if (!isInvalid) {
        if (p.discountType === 'percentage') {
          discount = (total * currentDiscountValue) / 100;
        } else if (p.discountType === 'flat') {
          discount = currentDiscountValue;
        } else if (p.discountType === 'selected') {
          discount = 0;
        }
      }

      const discountedTotal = total - discount;
      // console.log('Discounted Total:', discountedTotal);
      // ✅ Calculate total for 12 months
      const yearlyTotal = discountedTotal * 12;
      // console.log('Yearly Total:', yearlyTotal);

      // ✅ GST (18% of yearly total)
      p.gstAmount = +(discountedTotal * 0.18).toFixed(2);
      // console.log('GST Amount:', p.gstAmount);

      // ✅ Final price = yearly total + GST
      p.finalPrice = +(discountedTotal + p.gstAmount).toFixed(2);
      // console.log('Final Price:', p.finalPrice);

      // p.peryeargstAmount = +(yearlyTotal * 0.18).toFixed(2);
      p.peryeargstAmount = +(p.gstAmount * 12).toFixed(2);
      // console.log('Per Year GST Amount:', p.peryeargstAmount);
      // p.peryearcost = +(yearlyTotal + p.gstAmount).toFixed(2);
      p.peryearcost = +(p.finalPrice * 12).toFixed(2);
      // console.log('Per Year Cost:', p.peryearcost);

    });

    // Prepare payload for API
    const subscription_creation = {
      name: plan.name,
      price: plan.perRoomCost,
      perRoomCost: plan.perRoomCost,
      roomCount: plan.roomCount,
      discountType: plan.discountType,
      discountValue: plan.discountValue,
      finalPrice: plan.finalPrice,
      gstAmount: plan.gstAmount,
      peryeargstAmount: plan.peryeargstAmount,
      peryearcost: plan.peryearcost
    };

    // API request body
    const requestBody: any = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: { subscription_creation }
    };

    // Update if SingleRoomPricing or any existing plan
    if (plan.id === 18 || this.plans.some((p: any) => p.id === plan.id)) {
      requestBody.extras = { find: { id: plan.id } };
      this.PaymentDetailsService.updateSubscription(requestBody).subscribe(
        resp => this.handleApiResponse(resp),
        err => this.handleApiError(err)
      );
    } else {
      // Create new subscription if plan not found (optional)
      this.PaymentDetailsService.createSubscription(requestBody).subscribe(
        resp => this.handleApiResponse(resp),
        err => this.handleApiError(err)
      );
    }
  }

  // Optional helper to handle API response
  handleApiResponse(resp: any) {
    if (resp?.success === 1 && resp?.status_code === 200) {
      this.alertService.success(resp.message, this.options);
    } else if (resp?.message) {
      this.alertService.error(resp.message, this.options);
    } else {
      this.alertService.error('Something bad happened. Please try again!', this.options);
    }
  }

  // Optional helper to handle API errors
  handleApiError(err: any) {
    if (err?.error?.statusCode === 403) {
      this.alertService.error('Session Time Out! Please login Again', this.options);
    } else if (err?.error?.message) {
      this.alertService.error(err.error.message, this.options);
    } else {
      this.alertService.error('Something bad happened. Please try again!', this.options);
    }
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
          this.plans = resp.result.data;
          this.finalPriceFor50Rooms = this.plans[0].finalPrice * 50;
          this.finalPriceFor101Rooms = this.plans[0].finalPrice * 101;
          this.finalPriceFor151Rooms = this.plans[0].finalPrice * 151;
          this.finalPriceFor200Rooms = this.plans[0].finalPrice * 200;


          this.gstFor50Rooms = this.plans[0].gst_amount * 50;
          this.gstFor101Rooms = this.plans[0].gst_amount * 101;
          this.gstFor151Rooms = this.plans[0].gst_amount * 151;
          this.gstFor200Rooms = this.plans[0].gst_amount * 200;
          // console.log(this.plans, " this.plans")
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

}

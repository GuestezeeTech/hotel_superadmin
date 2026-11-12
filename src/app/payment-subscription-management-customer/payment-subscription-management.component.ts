import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AlertsComponent } from '../shared/alerts/alerts.component'
import { currencySymbolOf, gstFor, gstPercentageOf, inrPerUsdOf } from '../shared/plan-pricing.util';
import { FormsModule } from '@angular/forms';
import { PaymentDetailsService } from '../payment-details/payment-details.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview/hotel-enrollment-tabview.service';
import { Router, ActivatedRoute } from '@angular/router';

export type PlanType = 'cost' | 'free';

/** Months with no payment when the plan type is Free */
export const FREE_MONTHS = 3;

/**
 * Payment Settings tab of one hotel. One price (per room cost, discount, GST) plus a
 * plan type:
 *  - Cost: the hotel pays this price from now on.
 *  - Free: no payment for the next three months (payment_plan.free_period), then this price.
 */
@Component({
  selector: 'app-payment-subscription-management-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertsComponent],
  templateUrl: './payment-subscription-management.component.html',
  styleUrls: ['./payment-subscription-management.component.scss']
})
export class PaymentSubscriptionManagementCustomerComponent implements OnInit {
  constructor(
    private PaymentDetailsService: PaymentDetailsService,
    private authTokenService: AuthTokenService,
    private alertService: AlertsService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  hotelId: number | null = null;
  customerdata: any = {};
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  planType: PlanType = 'cost';
  /** The price being edited (per room / month) */
  plan: any = null;
  saving = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.hotelId = Number(params.get('id'));
      if (this.hotelId) {
        this.load();
      }
    });
  }

  /** Customer's saved price when there is one, otherwise the general plan for the property */
  private async load(): Promise<void> {
    try {
      this.customerdata = await this.getCustomerById();
    } catch {
      return;
    }
    const saved = this.customerdata?.subscription_detail;
    const general = await this.getGeneralPlan();
    if (saved && (saved.perRoomCost !== undefined || saved.price !== undefined)) {
      // Older hotels saved the "Free" plan by name; its prices are now the after-free price
      this.planType = saved.plan_type === 'free' || saved.name === 'Free' ? 'free' : 'cost';
      this.plan = {
        ...saved,
        name: saved.name && saved.name !== 'Free' ? saved.name : (general?.name || 'RoomPricing'),
        perRoomCost: saved.perRoomCost ?? saved.price ?? 0,
        gstAmount: saved.gstAmount ?? saved.gst_amount
      };
    } else {
      this.planType = 'cost';
      this.plan = general ? { ...general } : {
        name: 'RoomPricing', perRoomCost: 0, discountType: 'percentage', discountValue: 0, currency_type: '$'
      };
    }
    this.plan.discountType = this.plan.discountType || 'percentage';
    this.plan.discountValue = this.plan.discountValue ?? 0;
    this.calculateDiscount();
  }

  /** The general (non-Free) plan for the property size, else the first one */
  private getGeneralPlan(): Promise<any | null> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {},
        pagination: true,
        paginationDetails: { limit: 0, pageSize: 100 },
        sorting: true,
        sortingDetails: { name: 1 }
      }
    };
    return new Promise((resolve) => {
      this.PaymentDetailsService.getAllSubscriptionDetails(requestBody).subscribe({
        next: (resp: any) => {
          const plans = (resp?.result?.data || []).filter((p: any) => p?.name !== 'Free');
          const size = this.customerdata?.property_details?.property_address?.property_size;
          resolve(plans.find((p: any) => p.name === size) || plans[0] || null);
        },
        error: () => resolve(null)
      });
    });
  }

  /** Validation message for the current values, or '' when they are fine */
  private validationError(): string {
    const plan = this.plan;
    const discountValue = Number(plan.discountValue) || 0;
    if (plan.discountType === 'percentage' && discountValue > 100) {
      return 'Discount percentage cannot exceed 100%';
    }
    if (plan.discountType === 'flat' && discountValue > (Number(plan.perRoomCost) || 0)) {
      return 'Flat discount cannot be greater than the room cost';
    }
    const gstValue = plan.gst_percentage;
    if (gstValue !== null && gstValue !== undefined && gstValue !== '' &&
      (!Number.isFinite(Number(gstValue)) || Number(gstValue) < 0 || Number(gstValue) > 100)) {
      return 'GST must be between 0% and 100%';
    }
    return '';
  }

  /** Recalculates GST and the final price per room / month */
  calculateDiscount(): boolean {
    const plan = this.plan;
    if (!plan) {
      return false;
    }
    if (plan.perRoomCost) {
      plan.perRoomCost = Math.floor(plan.perRoomCost);
    }
    const error = this.validationError();
    if (error) {
      this.alertService.error(error, this.options);
      return false;
    }
    const total = Number(plan.perRoomCost) || 0;
    const discountValue = Number(plan.discountValue) || 0;
    const discount = plan.discountType === 'percentage' ? (total * discountValue) / 100
      : plan.discountType === 'flat' ? discountValue : 0;
    const discounted = total - discount;
    const yearly = discounted * 12;
    plan.gstAmount = gstFor(discounted, plan);
    plan.finalPrice = +(discounted + plan.gstAmount).toFixed(2);
    plan.peryeargstAmount = gstFor(yearly, plan);
    plan.peryearcost = +(yearly + plan.peryeargstAmount).toFixed(2);
    return true;
  }

  save(): void {
    if (!this.plan || this.saving || !this.calculateDiscount()) {
      return;
    }
    const plan = this.plan;
    const subscriptionDetail = {
      name: plan.name,
      plan_type: this.planType,
      price: plan.perRoomCost,
      perRoomCost: plan.perRoomCost,
      roomCount: 1,
      discountType: plan.discountType,
      discountValue: plan.discountValue,
      finalPrice: plan.finalPrice,
      gst_amount: plan.gstAmount,
      gst_percentage: gstPercentageOf(plan),
      currency_type: plan.currency_type || '$',
      inr_per_usd: inrPerUsdOf(plan)
    };
    const paymentPlan = this.buildPaymentPlan();

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_update: {
          subscription_detail: subscriptionDetail,
          ...(paymentPlan ? { payment_plan: paymentPlan } : {})
        }
      },
      extras: { find: { id: this.hotelId } }
    };
    this.saving = true;
    this.hotelenrollmenttabviewService.updateCustomer(requestBody).subscribe(
      resp => {
        this.saving = false;
        if (resp?.success === 1 && resp.status_code === 200) {
          this.customerdata.subscription_detail = subscriptionDetail;
          if (paymentPlan) {
            this.customerdata.payment_plan = paymentPlan;
          }
          this.hotelenrollmenttabviewService.clearAdminFormEvent();
          this.alertService.success(resp.message || 'Record Successfully Updated', this.options);
        } else {
          this.alertService.error(resp?.message || 'Something bad happened. Please try again!', this.options);
        }
      },
      err => {
        this.saving = false;
        if (err?.error?.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options);
          this.router.navigate([`/login`], { skipLocationChange: false });
        } else {
          this.alertService.error(err?.error?.message || 'Something bad happened. Please try again!', this.options);
        }
      }
    );
  }

  /** Last day of the free period (DD-MM-YYYY): the saved one, or the one saving Free now would set */
  get freePeriodEndDate(): string {
    if (this.planType !== 'free') {
      return '';
    }
    return this.buildPaymentPlan()?.free_period?.end_date
      || this.customerdata?.payment_plan?.free_period?.end_date || '';
  }

  private parseDate(value: string): Date | null {
    const [day, month, year] = String(value || '').split('-').map(Number);
    return day && month && year ? new Date(year, month - 1, day) : null;
  }

  private formatDate(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  }

  /**
   * payment_plan to save, or null if it does not change.
   * Free: a three-month free_period from today, which the hotel admin app reads to switch
   * payment off. Saving Free again keeps a running period's start date, so it cannot be
   * extended by accident. Cost removes the period. Paid dates are never touched.
   */
  private buildPaymentPlan(): any | null {
    const { free_period, ...rest } = this.customerdata?.payment_plan || {};
    if (this.planType !== 'free') {
      return free_period ? rest : null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addFreeMonths = (start: Date) => {
      const end = new Date(start);
      end.setMonth(end.getMonth() + FREE_MONTHS);
      return end;
    };
    const currentStart = this.parseDate(free_period?.start_date);
    const start = currentStart && addFreeMonths(currentStart) >= today ? currentStart : today;
    return {
      ...rest,
      free_period: { start_date: this.formatDate(start), end_date: this.formatDate(addFreeMonths(start)) }
    };
  }

  /** Currency symbol from the plan's currency_type ("dollar" -> "$"). */
  currencySymbol(plan: any): string {
    return currencySymbolOf(plan);
  }

  /** The plan's GST percentage (18 when not set). */
  gstPercentage(plan: any): number {
    return gstPercentageOf(plan);
  }

  preventDecimal(event: KeyboardEvent) {
    if (['.', 'e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private getCustomerById(): Promise<any> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: { find: { id: this.hotelId } }
    };
    return new Promise((resolve, reject) => {
      this.hotelenrollmenttabviewService.getCustomerById(requestBody).subscribe(
        resp => resolve(resp?.result?.data?.[0] || {}),
        err => {
          if (err?.error?.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else {
            this.alertService.error(err?.error?.message || 'Something bad happened. Please try again!', this.options);
          }
          reject(err);
        }
      );
    });
  }

  previousTab() {
    const tab = document.getElementById('hierarchy-tab');
    if (tab) {
      (tab as HTMLAnchorElement).click();
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDataService } from '../shared/shared-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentDetailsService } from '../payment-details/payment-details.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { LoaderService } from '../shared/loader/loader.service';

@Component({
  selector: 'app-payment-summary-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-summary-list.component.html',
  styleUrl: './payment-summary-list.component.scss'
})
export class PaymentSummaryListComponent implements OnInit {
  paymentData: any;
  installments: any[] = [];
  paymentSplitName: string = '';
  totalPaymentAmount: number = 0;
  totalPaidAmount: number = 0;
  totalPendingAmount: number = 0;
  customerdata: any;

  constructor(
    private sharedService: SharedDataService,
    private router: Router,
    private route: ActivatedRoute,
    private paymentDetailsService: PaymentDetailsService,
    private authTokenService: AuthTokenService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loaderService.emitLoading();
        this.getOrderDetails(id);
      } else {
        this.router.navigate(['/payment-details']);
      }
    });
  }

  getOrderDetails(id: any) {
    const requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: Number(id)
        }
      }
    };

    this.paymentDetailsService.orderDetailsGetById(requestData).subscribe(
      (resp: any) => {
        if (resp && resp.success === 1 && resp.result.data.length > 0) {
          this.paymentData = resp.result.data[0];
          if (this.paymentData.customer_id) {
            this.getCustomerById(this.paymentData.customer_id);
          } else {
            this.loaderService.emitComplete();
          }
          this.processPaymentData();
        } else {
          console.error('Order not found');
          this.loaderService.emitComplete();
          this.router.navigate(['/payment-tab-view']);
        }
      },
      err => {
        console.error('Error fetching order details', err);
        this.loaderService.emitComplete();
        this.router.navigate(['/payment-tab-view']);
      }
    );
  }

  processPaymentData() {
    // console.log('Processing Payment Data:', this.paymentData);
    if (!this.paymentData) {
      console.warn('No payment data available to process');
      return;
    }

    let splits = this.findPaymentSplit(this.paymentData);
    // console.log('Found Splits:', splits);

    if (splits && Array.isArray(splits) && splits.length > 0) {
      this.installments = [];

      // Handle the case where splits is an array of installment objects directly
      // or an array of plan objects that contain installments.
      splits.forEach((item: any, splitIndex: number) => {
        if (item.installments && Array.isArray(item.installments)) {
          // Nested structure: [ { name, installments: [...] } ]
          let planName = item.name || 'Plan';
          if (planName.toLowerCase() === 'full') planName = 'Annual';

          if (!this.paymentSplitName) this.paymentSplitName = planName;

          item.installments.forEach((inst: any, instIndex: number) => {
            this.addInstallment(inst, planName, instIndex === 0, item.installments.length, instIndex);
          });
        } else if (item.status || item.order_total_amount || item.subscription_end_date) {
          // Flat structure: [ { status, order_total_amount, ... }, ... ]
          let planName = this.paymentData.payment_type || 'Plan';
          if (planName.toLowerCase() === 'full') planName = 'Annual';

          if (!this.paymentSplitName) this.paymentSplitName = planName;
          this.addInstallment(item, planName, splitIndex === 0, splits.length, splitIndex);
        }
      });

      this.totalPaymentAmount = this.installments.reduce((sum, inst) => sum + inst.order_total_amount, 0);
      this.totalPaidAmount = this.installments.reduce((sum, inst) => sum + inst.due_amount_paid, 0);
      this.totalPendingAmount = this.installments.reduce((sum, inst) => sum + inst.due_balance_amount, 0);

      // console.log('Processed Installments:', this.installments);
      // console.log('Totals:', {
        // payment: this.totalPaymentAmount,
        // paid: this.totalPaidAmount,
        // pending: this.totalPendingAmount
      // });
    }
  }

  getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  addInstallment(inst: any, name: string, isFirst: boolean = false, rowSpan: number = 1, index: number = 0) {
    const isPaid = inst.status === 'Paid';
    const isPending = inst.status === 'Not Paid' || inst.status === 'Due Pending';

    let displayName = name;
    if (name.toLowerCase() === 'quarterly') {
      displayName = `${this.getOrdinal(index + 1)} Quarterly`;
    } else if (name.toLowerCase() == "half_yearly") {
      displayName = `${this.getOrdinal(index + 1)} Half`;
    } else if (name.toLowerCase() === 'full' || name.toLowerCase() === 'annual') {
      displayName = 'Annual';
    }

    this.installments.push({
      ...inst,
      splitName: displayName,
      isFirst: isFirst,
      rowSpan: rowSpan,
      due_amount_paid: isPaid ? inst.order_total_amount : 0,
      due_balance_amount: isPending ? inst.order_total_amount : 0,
      displayStatus: isPaid ? 'Paid' : 'Due Pending'
    });
  }

  findPaymentSplit(obj: any): any[] | null {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.payment_split && Array.isArray(obj.payment_split)) return obj.payment_split;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const found = this.findPaymentSplit(obj[key]);
        if (found) return found;
      }
    }
    return null;
  }

  getCustomerById(customerId: number) {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: Number(customerId)
        }
      }
    };

    this.paymentDetailsService.getCustomerById(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp && resp.result && resp.result.data) {
          this.customerdata = resp.result.data[0];
        }
      },
      err => {
        this.loaderService.emitComplete();
        console.error('Error fetching customer info', err);
      }
    );
  }

  goBack() {
    if (this.paymentData && this.paymentData.customer_id) {
      this.router.navigate(['/payment-details', this.paymentData.customer_id]);
    }
  }
}

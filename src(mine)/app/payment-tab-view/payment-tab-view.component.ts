import { Component } from '@angular/core';
import { EventEmitter,Output } from '@angular/core';
import { PaymentListComponent } from '../payment-list/payment-list.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-tab-view',
  standalone: true,
  imports: [PaymentListComponent,CommonModule,FormsModule],
  templateUrl: './payment-tab-view.component.html',
  styleUrl: './payment-tab-view.component.scss'
})
export class PaymentTabViewComponent {
  dataForTab: string = '';
  searchTerm: string = ''; // newly added for filtering
  @Output() dataEmitter = new EventEmitter<any>();
  sendCommission() {
    this.dataForTab = 'Commission';
    //console.log('Data set for commission tab:', this.dataForTab);
  }
  sendSubscription() {
    this.dataForTab = 'Subscription';
    //console.log('Data set for commission tab:', this.dataForTab);
  }

  
  

}
  

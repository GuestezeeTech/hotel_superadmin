// shared-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private userDataSource = new BehaviorSubject<any>(null);
  userData$ = this.userDataSource.asObservable();
  private sharedData = new BehaviorSubject<any>(null); // holds your data
  currentData = this.sharedData.asObservable();        // listen to this in any component

  private paymentPage = new BehaviorSubject<number>(1);
  currentPaymentPage = this.paymentPage.asObservable();

  setUserData(data: any) {
    this.userDataSource.next(data);
  }

  shareData(data: any) {
    this.sharedData.next(data);
    localStorage.setItem('paymentType', JSON.stringify(data));
  }
  getStoredData(): any {
    const data = localStorage.getItem('paymentType');
    return data ? JSON.parse(data) : null;
  }

  setPaymentPage(page: number) {
    this.paymentPage.next(page);
    localStorage.setItem('paymentPage', page.toString());
  }

  getPaymentPage(): number {
    const savedPage = localStorage.getItem('paymentPage');
    return savedPage ? parseInt(savedPage, 10) : 1;
  }

}

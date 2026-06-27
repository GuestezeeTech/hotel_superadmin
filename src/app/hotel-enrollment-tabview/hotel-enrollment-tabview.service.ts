import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HotelEnrollmentTabviewService {
  private data = new BehaviorSubject('');
  currentData = this.data.asObservable()

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService,
    private router: Router,
    private route: ActivatedRoute
  ) {

  }
  updateAdminFormEvent(item: any) {
    this.data.next(item);
  }

  clearAdminFormEvent() {
    this.data.observers.pop();
  }
  clearEvent() {
    this.data = new BehaviorSubject('');
    this.currentData = this.data.asObservable();
  }

  httpOptions = new HttpHeaders().set('Content-Type', 'application/json');
  // httpOptions = new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())

  // MAKE API SERVICE CALLS HERE...

  // API CALLS

  // POST
  postApiCall(dataObj: any, api_endpoint: any): Observable<any> {
    return this.http.post(api_endpoint, dataObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
  }
  postApiCall1(dataObj: any, api_endpoint: any): Observable<any> {
    if (typeof api_endpoint !== 'string') {
      //console.error('Invalid API endpoint:', api_endpoint);
      return throwError(() => new Error('API endpoint must be a string'));
    }

    return this.http.post(api_endpoint, dataObj, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getToken(tokenObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GETNEWACCESSTOKEN, tokenObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) })
    }
  }
  addCustomer(AddCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.ADD_CUSTOMER, AddCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  getCustomerById(getCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GET_CUSTOMER, getCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  // Newly added
  getLoginCustomerById(getCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GET_LOGIN_CUSTOMER, getCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

  getAllTechnicalInfo(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GET_ALL_TECHNICAL_INFO, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }



  // Update Customer Details
  updateCustomer(UpdateCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      // return this.http.post(ENDPOINTS.UPDATE_CUSTOMER, UpdateCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())});
      return this.http.post(ENDPOINTS.UPDATE_LOGIN_CUSTOMER_FCM, UpdateCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  updateCustomerSettings(UpdateCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.UPDATE_LOGIN_CUSTOMER, UpdateCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  //newly added for role update
  updateCustomercFcmToken(UpdateCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.UPDATE_LOGIN_CUSTOMER, UpdateCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

  orderUpsert(UpdateCustomerObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.ORDER_UPDATION, UpdateCustomerObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  getCountries(): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GET_ALL_COUNTRIES, {
        "domain_name": "https://www.beaubelle.in",
        "user_id": this.authTokenService.getUserId(),
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
      }, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  getStatesById(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GET_STATES_BY_ID, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

  orderDetailsGetById(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.ORDERDETAILSGETBYID, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }
  apiCall(Obj: any, endpointUrl: string): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { skipLocationChange: false });
      return new Observable(); // ⚠️ Consider replacing with EMPTY or throwError as noted earlier
    } else {
      const headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken());

      return this.http.post(endpointUrl, Obj, { headers });
    }
  }



  getAllSubscriptionDetails(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    } else {
      return this.http.post(ENDPOINTS.GET_ALL_SUBSCRIPTION, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

  // Ṇewly added for sms(username, password - welcome sms)
  sendSMS(tokenObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.GENERRATE_NAME_PASSWORD, tokenObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) })
    }
  }
  /*  sendSMS(tokenObj: any): Observable<any> {
     if (this.authTokenService.isTokenExpired()) {
       this.router.navigate(['/login'], { skipLocationChange: false });
       return new Observable();
     }
 
     return this.http.post(
       ENDPOINTS.GENERRATE_NAME_PASSWORD,
       tokenObj,
       {
         headers: new HttpHeaders().set(
           'Content-Type',
           'application/json'
         )
       }
     );
   } */


  // Newly added for tech info check
  checkIsTechnicalInfoExist(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    } else {
      return this.http.post(ENDPOINTS.CHECK_IS_TECHNICAL_INFO_EXIST, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

}

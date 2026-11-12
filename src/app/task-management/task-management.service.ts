import { AuthTokenService } from '../auth-services/auth-token.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ENDPOINTS } from '../app.config';

/**
 * Superadmin Hotels Overview is read-only.
 * Only GET/list helpers are exposed — no create / update / upsert.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskManagementService {
  constructor(
    private authTokenService: AuthTokenService,
    private router: Router,
    private http: HttpClient
  ) {}

  getAllTask(requestBody: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { skipLocationChange: false });
      return of({ success: 0, result: { data: [] }, message: 'Session Expired' });
    }
    return this.http.post(ENDPOINTS.GET_ALL_TASK, requestBody, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getAllStaves(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_All_STAVES, jsonObj, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getAllRatings(requestBody: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { skipLocationChange: false });
      return of({ success: 0, result: { data: [] }, message: 'Session Expired' });
    }
    return this.http.post(ENDPOINTS.GET_TASK_RATINGS, requestBody, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getCheckOut(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_CHECKOUT_BY_ID, jsonObj, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getGuestDetails(requestBody: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_GUEST_DETAILS, requestBody, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getAllOutlets(requestBody: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_ALL_OUTLETS, requestBody, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  getProductByOutlet(requestBody: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_PRODUCT_BY_OUTLET, requestBody, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }

  private selectedTabSubject = new BehaviorSubject<string | null>(null);
  selectedTab$ = this.selectedTabSubject.asObservable();

  setSelectedTab(tab: string) {
    this.selectedTabSubject.next(tab);
  }
}

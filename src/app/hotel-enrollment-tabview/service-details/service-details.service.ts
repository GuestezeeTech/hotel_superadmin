import { AuthTokenService } from './../../auth-services/auth-token.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../app.config';

/**
 * Superadmin Hotels Overview is read-only — services catalog is GET-only.
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceDetailService {
  constructor(
    private authTokenService: AuthTokenService,
    private router: Router,
    private http: HttpClient
  ) {}

  getAllServices(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    return this.http.post(ENDPOINTS.GET_ALL_SERVICES, jsonObj, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
    });
  }
}

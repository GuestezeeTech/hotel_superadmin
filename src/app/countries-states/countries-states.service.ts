import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DOMAIN_NAME, ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';

export interface CountryState {
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CountryDoc {
  id?: number;
  country: string;
  code: string;
  sort_order: number;
  is_active: boolean;
  is_deleted?: boolean;
  states: CountryState[];
}

/** Countries collection API: getall, plus create / update / delete. */
@Injectable({ providedIn: 'root' })
export class CountriesStatesService {
  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService,
    private router: Router
  ) {}

  private base() {
    return {
      domain_name: this.authTokenService.getDomain() || DOMAIN_NAME,
      user_id: this.authTokenService.getUserId()
    };
  }

  private post(url: string, body: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { skipLocationChange: false });
      return new Observable();
    }
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken());
    return this.http.post(url, body, { headers });
  }

  getAll(): Observable<any> {
    return this.post(ENDPOINTS.GET_ALL_COUNTRIES_STATES, { ...this.base(), extras: { find: {} } });
  }

  create(country: CountryDoc): Observable<any> {
    return this.post(ENDPOINTS.CREATE_COUNTRY, {
      ...this.base(),
      payload: { country_creation: country }
    });
  }

  /** States live inside the country, so this sends the whole states array. */
  update(id: number, country: CountryDoc): Observable<any> {
    return this.post(ENDPOINTS.UPDATE_COUNTRY, {
      ...this.base(),
      extras: { find: { id } },
      payload: { country_updation: country }
    });
  }

  delete(id: number): Observable<any> {
    return this.post(ENDPOINTS.DELETE_COUNTRY, {
      ...this.base(),
      extras: { find: { id } },
      payload: {}
    });
  }
}

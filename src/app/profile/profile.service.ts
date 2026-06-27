import { Component } from '@angular/core';
import { AuthTokenService } from '../../app/auth-services/auth-token.service';
import { throwError, Observable } from 'rxjs';
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ENDPOINTS } from "../app.config";
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // BehaviorSubject for profile image
  private profileImageSubject = new BehaviorSubject<string | null>(this.getStoredProfileImage());
  profileImage$ = this.profileImageSubject.asObservable();

  // BehaviorSubject for user name
  private profileNameSubject = new BehaviorSubject<string | null>(this.getStoredProfileName());
  profileName$ = this.profileNameSubject.asObservable();

  constructor(
    private authTokenService: AuthTokenService,
    private router: Router,
    private http: HttpClient,
  ) { }

  updatePassword(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return throwError(() => new Error('Token expired, redirecting to login.'));
    } else {
      return this.http.post(ENDPOINTS.UPDATE_PASSWORD, jsonObj, {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/json')
          .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()),
      });
    }
  }
  sendImage(jsonObj: any, headers: any): Observable<any> {
    return this.http.post(ENDPOINTS.SEND_IMAGE, jsonObj, { headers: headers });
  }

  updateUser(jsonObj: any): Observable<any> {
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate([`/login`], { skipLocationChange: false });
      return new Observable();
    }
    else {
      return this.http.post(ENDPOINTS.UPDATE_USER, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
    }
  }

  postApiCall(dataObj: any, api_endpoint: any): Observable<any> {
    return this.http.post(api_endpoint, dataObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
  }

  // Get stored image from localStorage
  getStoredProfileImage(): string | null {
    return localStorage.getItem('profile_image') || 'https://images.ecbee.net/GuestEzee/Brand/ChatGPT_Image_Jun_19__2026__01_25_37_PM.webp';
  }

  // Update profile image
  updateProfileImage(imageUrl: string) {
    localStorage.setItem('profile_image', imageUrl);
    this.profileImageSubject.next(imageUrl); // Notify all subscribers
  }

  // Get stored name from localStorage
  getStoredProfileName(): string | null {
    return localStorage.getItem('profile_name') || 'Guest User';
  }

  // Update profile name
  updateProfileName(name: string) {
    localStorage.setItem('profile_name', name);
    this.profileNameSubject.next(name);
  }

}
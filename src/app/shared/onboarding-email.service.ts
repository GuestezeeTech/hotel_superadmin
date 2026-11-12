import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ENDPOINTS } from '../app.config';

export type OnboardingTemplate =
  | 'Awaiting Approval'
  | 'New Registration Approval'
  | 'Subscription Request'
  | 'Subscription Approval'
  | 'Subscription Verification'
  | 'Complete Onboarding'
  | 'Awaiting Final Approval'
  | 'Final Approval Verification'
  | 'Go live Approved';

/**
 * Sends the onboarding stage emails (:9430/onboardingemail) to the hotel.
 * Fire-and-forget: a failed email is logged and never undoes the superadmin's action.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingEmailService {
  constructor(private http: HttpClient) {}

  hotelNameOf(customer: any): string {
    return String(customer?.name || customer?.property_details?.property_name || customer?.first_name || '').trim();
  }

  /** Sends a template to the customer's own email */
  sendToCustomer(templateName: OnboardingTemplate, customer: any): void {
    const to = String(customer?.email || '').trim();
    if (!to) {
      console.warn(`Onboarding email "${templateName}" skipped: hotel has no email`);
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(ENDPOINTS.ONBOARDING_EMAIL, {
      templateName,
      to,
      variables: { hotelName: this.hotelNameOf(customer) }
    }, { headers }).subscribe({
      error: (err) => console.error(`Onboarding email "${templateName}" failed`, err)
    });
  }
}

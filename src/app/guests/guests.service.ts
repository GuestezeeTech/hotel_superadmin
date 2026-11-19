import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';

export type GuestRow = {
  key: string;
  memberId: string;
  hotelName: string;
  name: string;
  mobile: string;
  email: string;
  kycUrl: string;
  stays: number;
  lastStay: string;
};

export type ReservationRow = {
  id: string;
  memberId: string;
  hotelName: string;
  guestKey: string;
  guestName: string;
  mobile: string;
  room: string;
  pax: number;
  arrival: string;
  departure: string;
  arrivalMs: number;
  nights: number;
  status: string;
};

export type FrequentGuestRow = {
  memberId: string;
  hotelName: string;
  guestName: string;
  mobile: string;
  email: string;
  stays: number;
  nights: number;
  firstStay: string;
  lastStay: string;
  lastStayMs: number;
};

/** Guests of every hotel (guestdata) and their reservations, for the superadmin Guests menu. */
@Injectable({ providedIn: 'root' })
export class SuperadminGuestsService {
  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService,
    private router: Router
  ) { }

  /** memberId null = no member_id in the payload (find: {}) */
  private post(url: string, memberId: string | null): Observable<any[]> {
    const member = memberId === null ? null : String(memberId ?? '').trim();
    if (member === '') {
      return of([]);
    }
    if (this.authTokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { skipLocationChange: false });
      return of([]);
    }
    const find = member ? { member_id: member } : {};
    const body = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: { find, pagination: false, sorting: true, sortingDetails: { id: -1 } }
    };
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken());
    return this.http.post(url, body, { headers }).pipe(
      map((resp: any) => (resp?.success === 1 || resp?.success === true) && Array.isArray(resp?.result?.data) ? resp.result.data : []),
      catchError(() => of([]))
    );
  }

  /** guest/getall (:1205): every guest, no member_id in the payload */
  fetchAllGuests(): Observable<any[]> {
    return this.post(ENDPOINTS.GET_ALL_GUESTS, null);
  }

  /**
   * The chosen hotel's guests out of all guests: records with that member_id, or, for
   * records without a member_id, guests found in that hotel's reservations.
   * Returned records carry the hotel's member_id so stays line up with reservations.
   */
  guestsForHotel(allGuests: any[], memberId: string, reservations: ReservationRow[]): any[] {
    const resKeys = new Set(reservations.map((r) => r.guestKey));
    const resMobiles = new Set(reservations.map((r) => this.mobileDigits(r.mobile)).filter((m) => m.length >= 6));
    const resNames = new Set(reservations.map((r) => r.guestName.toLowerCase()).filter((n) => n && n !== '—'));
    return (allGuests || [])
      .filter((d) => {
        const g = this.guestFields(d);
        if (g.memberId) {
          return g.memberId === memberId;
        }
        const mobile = this.mobileDigits(g.mobile);
        return resKeys.has(this.guestKey(memberId, g.guestId, g.name, g.mobile, g.email))
          || (mobile.length >= 6 && resMobiles.has(mobile))
          || (!!g.name && resNames.has(g.name.toLowerCase()));
      })
      .map((d) => (this.guestFields(d).memberId ? d : { ...d, member_id: memberId }));
  }

  fetchReservations(memberId: string): Observable<any[]> {
    return this.post(ENDPOINTS.GET_ALL_RESERVATIONS, memberId);
  }

  buildReservationRows(docs: any[], hotelName: (memberId: string) => string): ReservationRow[] {
    return (docs || []).map((r) => {
      const g = Array.isArray(r?.Guest_detail) ? r.Guest_detail[0] || {} : r?.Guest_detail || {};
      const memberId = String(r?.member_id ?? r?.customer_member_id ?? '').trim();
      const name = [g?.First_Name, g?.Last_Name].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ');
      const mobile = String(g?.Mobile ?? g?.Phone ?? '').trim();
      const arrival = this.toDate(r?.Arrival_Date);
      const departure = this.toDate(r?.Departure_Date);
      const nights = arrival && departure
        ? Math.max(1, Math.round((this.dayStart(departure) - this.dayStart(arrival)) / 86400000))
        : 0;
      return {
        id: String(r?.Reservation_Id ?? r?.Reservation_No ?? r?.Booking_Id ?? r?.id ?? '—'),
        memberId: memberId || '—',
        hotelName: hotelName(memberId),
        guestKey: this.guestKey(memberId, g?.Guest_Id, name, mobile, g?.Email),
        guestName: name || '—',
        mobile: mobile || '—',
        room: String(r?.Room_No ?? '').trim() || '—',
        pax: (Number(r?.Adult_Pax) || 0) + (Number(r?.Child_Pax) || 0),
        arrival: arrival ? this.formatDateTime(arrival) : '—',
        departure: departure ? this.formatDateTime(departure) : '—',
        arrivalMs: arrival ? arrival.getTime() : 0,
        nights,
        status: this.statusLabel(r?.Event)
      };
    }).sort((a, b) => b.arrivalMs - a.arrivalMs);
  }

  buildGuestRows(docs: any[], reservations: ReservationRow[], hotelName: (memberId: string) => string): GuestRow[] {
    const staysByGuest = this.staysByGuest(reservations);
    return (docs || []).map((d) => {
      const g = this.guestFields(d);
      const key = this.guestKey(g.memberId, g.guestId, g.name, g.mobile, g.email);
      const stays = staysByGuest.get(key) || [];
      const last = stays.reduce((m, s) => Math.max(m, s.arrivalMs), 0);
      return {
        key,
        memberId: g.memberId || '—',
        hotelName: hotelName(g.memberId),
        name: g.name || '—',
        mobile: g.mobile || '—',
        email: g.email || '—',
        kycUrl: g.kycUrl,
        stays: stays.length,
        lastStay: last ? this.formatDate(new Date(last)) : '—'
      };
    }).sort((a, b) => a.hotelName.localeCompare(b.hotelName) || a.name.localeCompare(b.name));
  }

  /** Guests with 2+ stays at the same hotel (cancelled bookings don't count) */
  buildFrequentGuests(reservations: ReservationRow[], guestDocs: any[]): FrequentGuestRow[] {
    const emailByKey = new Map<string, string>();
    for (const d of guestDocs || []) {
      const g = this.guestFields(d);
      if (g.email) {
        emailByKey.set(this.guestKey(g.memberId, g.guestId, g.name, g.mobile, g.email), g.email);
      }
    }
    const rows: FrequentGuestRow[] = [];
    for (const [key, stays] of this.staysByGuest(reservations)) {
      if (stays.length < 2) {
        continue;
      }
      const sorted = [...stays].sort((a, b) => a.arrivalMs - b.arrivalMs);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      rows.push({
        memberId: last.memberId,
        hotelName: last.hotelName,
        guestName: last.guestName,
        mobile: last.mobile,
        email: emailByKey.get(key) || '—',
        stays: stays.length,
        nights: stays.reduce((sum, s) => sum + s.nights, 0),
        firstStay: first.arrivalMs ? this.formatDate(new Date(first.arrivalMs)) : '—',
        lastStay: last.arrivalMs ? this.formatDate(new Date(last.arrivalMs)) : '—',
        lastStayMs: last.arrivalMs
      });
    }
    return rows.sort((a, b) => b.stays - a.stays || b.lastStayMs - a.lastStayMs);
  }

  /** Guest record fields, whichever naming the guest API uses */
  private guestFields(d: any): { memberId: string; guestId: any; name: string; mobile: string; email: string; kycUrl: string } {
    const str = (...values: any[]) => {
      for (const v of values) {
        const s = String(v ?? '').trim();
        if (s) return s;
      }
      return '';
    };
    const first = str(d?.First_Name, d?.first_name, d?.firstName);
    const last = str(d?.Last_Name, d?.last_name, d?.lastName);
    const name = [first, last].filter(Boolean).join(' ') || str(d?.guest_name, d?.Guest_Name, d?.name, d?.full_name);
    return {
      memberId: str(d?.member_id, d?.Member_Id, d?.customer_member_id),
      guestId: d?.Guest_Id ?? d?.guest_id ?? d?.Guest_ID,
      name,
      mobile: str(d?.Mobile, d?.mobile, d?.mobile_number, d?.phone_number, d?.Phone, d?.phone),
      email: str(d?.Email, d?.email, d?.email_id),
      kycUrl: str(d?.kyc_document, d?.Kyc_Document, d?.kyc_url)
    };
  }

  private staysByGuest(reservations: ReservationRow[]): Map<string, ReservationRow[]> {
    const map = new Map<string, ReservationRow[]>();
    for (const r of reservations || []) {
      if (r.status === 'Cancelled') {
        continue;
      }
      const list = map.get(r.guestKey) || [];
      list.push(r);
      map.set(r.guestKey, list);
    }
    return map;
  }

  /** Same guest at the same hotel: guest id when there is one, else mobile, email or name */
  private guestKey(memberId: string, guestId: any, name: string, mobile: string, email: any): string {
    const who = String(guestId ?? '').trim()
      || (mobile && mobile !== '—' ? 'm:' + this.mobileDigits(mobile) : '')
      || (email ? 'e:' + String(email).trim().toLowerCase() : '')
      || 'n:' + name.toLowerCase();
    return memberId.toLowerCase() + '|' + who;
  }

  /** Last 10 digits, so "+91 90000 00003" and "9000000003" are the same number */
  private mobileDigits(mobile: string): string {
    return String(mobile ?? '').replace(/\D/g, '').slice(-10);
  }

  private statusLabel(event: any): string {
    const e = String(event ?? '').trim().toLowerCase();
    if (e === 'reserved' || e === 'reserved(amend)') return 'Reserved';
    if (e === 'check-in' || e === 'in-house(amend)') return 'Checked-in';
    if (e === 'checked-out') return 'Checked-out';
    if (e === 'late checkout') return 'Late Checkout';
    if (e === 'cancelled') return 'Cancelled';
    return String(event ?? '').trim() || '—';
  }

  private toDate(value: any): Date | null {
    const s = String(value ?? '').trim();
    if (!s) {
      return null;
    }
    const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    const d = dmy ? new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])) : new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private dayStart(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatDateTime(d: Date): string {
    return this.formatDate(d) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}

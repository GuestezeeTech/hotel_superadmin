import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { LocalStorageService } from '../../auth-services/local-storage.service';
import { HotelListService } from '../../hotel-list/hotel-list.service';

export type SelectedHotel = {
  id: string | number;
  name: string;
  memberId: string;
  status: string;
};

/**
 * Global approved-hotel selection for Hotels Overview / F&B / FO / HK dashboards.
 * Mirrors DashboardPeriodStateService: persists in sessionStorage and keeps
 * MemberId in localStorage so existing ops services keep working.
 */
@Injectable({ providedIn: 'root' })
export class SelectedHotelContextService {
  private readonly storageKey = 'guestezee.superadmin.dashboard.hotel';

  private readonly selectedSubject = new BehaviorSubject<SelectedHotel | null>(null);
  readonly selectedHotel$ = this.selectedSubject.asObservable();

  hotels: SelectedHotel[] = [];
  private loaded = false;
  private loading$?: Observable<SelectedHotel[]>;

  constructor(
    private hotelListService: HotelListService,
    private authTokenService: AuthTokenService,
    private localStorage: LocalStorageService
  ) {
    this.restore();
  }

  getMemberId(): string {
    return (
      this.selectedSubject.value?.memberId ||
      (this.localStorage.get('MemberId') || '')
    ).trim();
  }

  getSelected(): SelectedHotel | null {
    return this.selectedSubject.value;
  }

  /** Load approved hotels once; default-select first when nothing valid is stored. */
  ensureLoaded(): Observable<SelectedHotel[]> {
    if (this.loaded) {
      return of(this.hotels);
    }
    if (this.loading$) {
      return this.loading$;
    }

    this.loading$ = this.fetchApprovedHotels().pipe(
      tap((hotels) => {
        this.hotels = hotels;
        this.loaded = true;
        this.loading$ = undefined;

        const current = this.selectedSubject.value;
        const stillValid =
          !!current?.memberId && hotels.some((h) => h.memberId === current.memberId);

        if (stillValid && current) {
          this.applySelection(current, false);
          return;
        }

        if (hotels.length) {
          this.applySelection(hotels[0], false);
          return;
        }

        this.clearSelection();
      }),
      shareReplay(1)
    );

    return this.loading$;
  }

  selectByMemberId(memberId: string): SelectedHotel | null {
    const id = String(memberId || '').trim();
    const hotel = this.hotels.find((h) => h.memberId === id) || null;
    if (hotel) {
      this.applySelection(hotel, true);
    }
    return hotel;
  }

  selectHotel(hotel: SelectedHotel): void {
    if (!hotel?.memberId) {
      return;
    }
    this.applySelection(hotel, true);
  }

  private applySelection(hotel: SelectedHotel, _userInitiated: boolean): void {
    this.localStorage.set('MemberId', hotel.memberId);
    this.persist(hotel);
    this.selectedSubject.next(hotel);
  }

  private clearSelection(): void {
    this.localStorage.remove('MemberId');
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      /* ignore */
    }
    this.selectedSubject.next(null);
  }

  private fetchApprovedHotels(): Observable<SelectedHotel[]> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {},
        pagination: true,
        paginationDetails: { limit: 0, pageSize: 10 },
        sorting: true,
        sortingDetails: { created_on: -1 }
      }
    };

    return this.hotelListService.getAllCustomers(requestBody).pipe(
      map((resp: any) => {
        if (!(resp?.success === 1 || resp?.success === true)) {
          return [];
        }
        const rows = (resp?.result?.data || []).filter(
          (item: any) => !('staff_employee_number' in item) && !('member_id' in item)
        );
        return rows
          .map((c: any) => this.mapHotel(c))
          .filter((h: SelectedHotel) => !!h.memberId && h.status === 'approved')
          .sort((a: SelectedHotel, b: SelectedHotel) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
      }),
      catchError(() => of([]))
    );
  }

  private mapHotel(c: any): SelectedHotel {
    return {
      id: c?.id ?? c?._id ?? '',
      name: String(c?.name || c?.hotel_name || c?.customer_member_id || 'Hotel').trim() || 'Hotel',
      memberId: String(c?.customer_member_id || '').trim(),
      status: String(c?.status || '').trim().toLowerCase()
    };
  }

  private persist(hotel: SelectedHotel): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(hotel));
    } catch {
      /* ignore */
    }
  }

  private restore(): void {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as SelectedHotel;
      if (parsed?.memberId) {
        this.localStorage.set('MemberId', parsed.memberId);
        this.selectedSubject.next(parsed);
      }
    } catch {
      /* ignore */
    }
  }
}

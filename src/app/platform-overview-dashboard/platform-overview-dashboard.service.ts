import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { HotelListService } from '../hotel-list/hotel-list.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview/hotel-enrollment-tabview.service';
import { TechnicalInfoService } from '../technical-info/technical-info.service';
import { ENDPOINTS } from '../app.config';

export type HotelSignedBucket = 'all' | 'lock' | 'pms' | 'only-key';

export type PlatformHotelRow = {
  id: number | string;
  name: string;
  memberId: string;
  email: string;
  phone: string;
  status: string;
  country: string;
  city: string;
  createdOn: string;
  createdMs: number;
  lockName: string;
  pmsName: string;
  lockNames: string[];
  pmsNames: string[];
  hasLock: boolean;
  hasPms: boolean;
  onlyKey: boolean;
};

export type IntegrationHotelGroup = {
  name: string;
  count: number;
  hotels: PlatformHotelRow[];
};

/** Master integration row from Technical Info catalog (no member_id). */
export type MasterIntegration = {
  id: number | string;
  name: string;
  title: string;
  type: string;
  logo: string;
  isActive: boolean;
  description: string;
};

@Injectable({ providedIn: 'root' })
export class PlatformOverviewDashboardService {
  constructor(
    private authTokenService: AuthTokenService,
    private hotelListService: HotelListService,
    private enrollmentService: HotelEnrollmentTabviewService,
    private technicalInfoService: TechnicalInfoService
  ) {}

  fetchAllHotels(): Observable<any[]> {
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
        return (resp?.result?.data || []).filter(
          (item: any) => !('staff_employee_number' in item) && !('member_id' in item)
        );
      }),
      catchError(() => of([]))
    );
  }

  /** All ecom/technical docs (lock + PMS integrations per hotel). */
  fetchAllTechnicalInfo(): Observable<any[]> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {},
        pagination: false,
        sorting: true,
        sortingDetails: { id: -1 }
      }
    };
    return this.enrollmentService.getAllTechnicalInfo(requestBody).pipe(
      map((resp: any) => {
        if (!(resp?.success === 1 || resp?.success === true)) {
          return [];
        }
        return resp?.result?.data || [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Same catalog as Superadmin Technical Info list:
   * ecomintegrationsettings/getall → docs without member_id, filtered by type.
   * Lock → type=lock · PMS → type=pos
   */
  fetchMasterIntegrations(kind: 'lock' | 'pos'): Observable<MasterIntegration[]> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: { find: {} }
    };
    return this.technicalInfoService.apiCall(requestBody, ENDPOINTS.GET_ALL_API_INT_SETTINGS).pipe(
      map((resp: any) => {
        const data = resp?.result?.data || [];
        return (data as any[])
          .filter((item) => item?.member_id == null || item?.member_id === undefined)
          .filter((item) => String(item?.type ?? '').toLowerCase() === kind)
          .map((item) => {
            const title = String(item?.title || item?.name || '').trim();
            const name = String(item?.name || item?.title || '—').trim() || '—';
            return {
              id: item?.id ?? title,
              name,
              title: title || name,
              type: String(item?.type ?? kind).toLowerCase(),
              logo: String(item?.logo || '').trim(),
              isActive: item?.is_active === true || item?.is_active === 'true',
              description: String(item?.description || '').trim()
            } as MasterIntegration;
          })
          .sort((a, b) => a.name.localeCompare(b.name));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Hotels that enabled a chosen integration:
   * ecom getall find { title, is_enabled: true, is_deleted: false } → member_ids
   */
  fetchEnabledEcomByTitle(title: string): Observable<any[]> {
    const t = String(title || '').trim();
    if (!t) {
      return of([]);
    }
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          title: t,
          is_enabled: true,
          is_deleted: false
        },
        pagination: false
      }
    };

    const normalize = (resp: any): any[] => {
      const data = resp?.result?.data;
      return Array.isArray(data) ? data : [];
    };

    return forkJoin({
      hotelTech: this.enrollmentService.getAllTechnicalInfo(requestBody).pipe(
        map(normalize),
        catchError(() => of([]))
      ),
      apiSettings: this.technicalInfoService
        .apiCall(requestBody, ENDPOINTS.GET_ALL_API_INT_SETTINGS)
        .pipe(
          map(normalize),
          catchError(() => of([]))
        )
    }).pipe(
      map(({ hotelTech, apiSettings }) => {
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const doc of [...hotelTech, ...apiSettings]) {
          const key = String(doc?.id ?? doc?._id ?? `${doc?.member_id}-${doc?.title}-${doc?.name}`);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          merged.push(doc);
        }
        return merged;
      })
    );
  }

  /** Collect member_ids from ecom docs (top-level or nested enabled items). */
  extractMemberIdsFromEcom(docs: any[], title?: string): string[] {
    const want = String(title || '').trim().toLowerCase();
    const ids = new Set<string>();
    for (const doc of docs || []) {
      const topMember = String(doc?.member_id ?? doc?.customer_member_id ?? '').trim();
      const topTitle = String(doc?.title || doc?.name || '').trim().toLowerCase();
      const topDeleted = doc?.is_deleted === true || doc?.is_deleted === 'true';
      // Find already filters is_enabled/is_deleted; still skip explicit deleted
      const topEnabled =
        doc?.is_enabled === true ||
        doc?.is_enabled === 'true' ||
        doc?.is_enabled === undefined;

      if (topMember && topEnabled && !topDeleted) {
        if (!want || !topTitle || topTitle === want) {
          ids.add(topMember);
        }
      }

      const nested: any[] = Array.isArray(doc?.customer_technical_info)
        ? doc.customer_technical_info
        : [];
      for (const item of nested) {
        const enabled = item?.is_enabled === true || item?.is_enabled === 'true';
        const deleted = item?.is_deleted === true || item?.is_deleted === 'true';
        const itemTitle = String(item?.title || item?.name || '').trim().toLowerCase();
        if (!enabled || deleted) {
          continue;
        }
        if (want && itemTitle && itemTitle !== want) {
          continue;
        }
        if (topMember) {
          ids.add(topMember);
        }
      }
    }
    return [...ids];
  }

  hotelsByMemberIds(rows: PlatformHotelRow[], memberIds: string[]): PlatformHotelRow[] {
    const set = new Set((memberIds || []).map((id) => String(id).trim()).filter(Boolean));
    if (!set.size) {
      return [];
    }
    return (rows || []).filter((r) => set.has(String(r.memberId).trim()));
  }

  buildHotelRows(customers: any[], technicalDocs: any[] = []): PlatformHotelRow[] {
    /** Flat ecom docs (and nested customer_technical_info) keyed by member_id. */
    const techListByMember = new Map<string, any[]>();
    const pushTech = (memberKey: string, item: any) => {
      if (!memberKey || !item) {
        return;
      }
      const list = techListByMember.get(memberKey) || [];
      list.push(item);
      techListByMember.set(memberKey, list);
    };

    for (const doc of technicalDocs || []) {
      const key = String(doc?.member_id ?? doc?.customer_member_id ?? '').trim();
      if (!key) {
        continue;
      }
      if (Array.isArray(doc?.customer_technical_info) && doc.customer_technical_info.length) {
        for (const nested of doc.customer_technical_info) {
          pushTech(key, nested);
        }
      } else if (doc?.type || doc?.title || doc?.name) {
        // Flat per-integration doc from ecom getall (has member_id + type)
        pushTech(key, doc);
      }
    }

    return (customers || []).map((c) => {
      const memberId = String(c?.customer_member_id ?? '').trim();
      const fromEcom = memberId ? techListByMember.get(memberId) || [] : [];
      const fromCustomer = Array.isArray(c?.customer_technical_info) ? c.customer_technical_info : [];
      const techList: any[] = fromEcom.length ? fromEcom : fromCustomer;

      const enabled = techList.filter((t) => {
        const on = t?.is_enabled === true || t?.is_enabled === 'true';
        const deleted = t?.is_deleted === true || t?.is_deleted === 'true';
        return on && !deleted;
      });
      const locks = enabled.filter((t) => String(t?.type ?? '').toLowerCase() === 'lock');
      const pms = enabled.filter((t) => {
        const type = String(t?.type ?? '').toLowerCase();
        return type === 'pos' || type === 'pms';
      });
      const hasLock = locks.length > 0;
      const hasPms = pms.length > 0;
      const lockNames = [
        ...new Set(
          locks
            .map((t) => String(t?.name || t?.title || t?.integration_name || 'Lock').trim())
            .filter(Boolean)
        )
      ];
      const pmsNames = [
        ...new Set(
          pms
            .map((t) => String(t?.name || t?.title || t?.integration_name || 'PMS').trim())
            .filter(Boolean)
        )
      ];
      const address = c?.property_details?.property_address || c?.property_address || {};
      const createdRaw = c?.created_on || c?.modified_on || '';
      const createdDate = createdRaw ? new Date(createdRaw) : null;
      const createdValid = !!(createdDate && !Number.isNaN(createdDate.getTime()));

      return {
        id: c?.id ?? memberId,
        name: String(c?.name || c?.hotel_name || '—').trim() || '—',
        memberId: memberId || '—',
        email: String(c?.email ?? '').trim() || '—',
        phone: String(c?.phone_number ?? c?.phone ?? '').trim() || '—',
        status: String(c?.status ?? '').trim() || '—',
        country: String(address?.country || address?.Country || c?.country || '').trim(),
        city: String(address?.city || address?.City || c?.city || '').trim(),
        createdOn: createdValid ? this.formatShortDate(createdDate as Date) : '—',
        createdMs: createdValid ? (createdDate as Date).getTime() : 0,
        lockName: lockNames.join(', ') || '—',
        pmsName: pmsNames.join(', ') || '—',
        lockNames,
        pmsNames,
        hasLock,
        hasPms,
        // “Only key” = lock present, no PMS (mobile-key style hotels)
        onlyKey: hasLock && !hasPms
      };
    });
  }

  resolvePeriodRange(
    period: string,
    customFrom?: string,
    customTo?: string
  ): { start: Date; end: Date; label: string; unbounded?: boolean } {
    const now = new Date();
    const end = this.endOfDay(now);
    if (period === 'All Dates' || period === 'All' || period === 'All Time') {
      return {
        start: this.startOfDay(new Date(1970, 0, 1)),
        end: this.endOfDay(new Date(2099, 11, 31)),
        label: 'All Dates',
        unbounded: true
      };
    }
    if (period === 'Today') {
      return { start: this.startOfDay(now), end, label: 'Today' };
    }
    if (period === 'This Week') {
      const start = this.startOfDay(now);
      const day = start.getDay();
      const diffToMon = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMon);
      return { start, end, label: 'This Week' };
    }
    if ((period === 'For Date' || period === 'Particular Date') && customFrom) {
      const day = this.parseLocalDateInput(customFrom);
      if (day) {
        return {
          start: this.startOfDay(day),
          end: this.endOfDay(day),
          label: this.formatShortDate(day)
        };
      }
    }
    if (
      (period === 'Date Range' || period === 'Custom Range') &&
      customFrom &&
      customTo
    ) {
      let start = this.parseLocalDateInput(customFrom);
      let customEnd = this.parseLocalDateInput(customTo);
      if (start && customEnd) {
        if (start.getTime() > customEnd.getTime()) {
          const tmp = start;
          start = customEnd;
          customEnd = tmp;
        }
        return {
          start: this.startOfDay(start),
          end: this.endOfDay(customEnd),
          label: `${this.formatShortDate(start)} – ${this.formatShortDate(customEnd)}`
        };
      }
    }
    const start = this.startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return { start, end, label: 'This Month' };
  }

  filterByPeriod(
    rows: PlatformHotelRow[],
    start: Date,
    end: Date,
    unbounded = false
  ): PlatformHotelRow[] {
    if (unbounded) {
      return [...(rows || [])];
    }
    const startMs = this.startOfDay(start).getTime();
    const endMs = this.endOfDay(end).getTime();
    return (rows || []).filter((row) => {
      if (!row.createdMs) {
        return false;
      }
      return row.createdMs >= startMs && row.createdMs <= endMs;
    });
  }

  filterByLocation(
    rows: PlatformHotelRow[],
    country: string,
    city: string
  ): PlatformHotelRow[] {
    const c = String(country || '').trim().toLowerCase();
    const cityQ = String(city || '').trim().toLowerCase();
    return (rows || []).filter((row) => {
      if (c && c !== 'all' && row.country.toLowerCase() !== c) {
        return false;
      }
      if (cityQ && cityQ !== 'all' && row.city.toLowerCase() !== cityQ) {
        return false;
      }
      return true;
    });
  }

  filterByBucket(rows: PlatformHotelRow[], bucket: HotelSignedBucket): PlatformHotelRow[] {
    if (bucket === 'lock') {
      return rows.filter((r) => r.hasLock);
    }
    if (bucket === 'pms') {
      return rows.filter((r) => r.hasPms);
    }
    if (bucket === 'only-key') {
      return rows.filter((r) => r.onlyKey);
    }
    return [...rows];
  }

  distinctCountries(rows: PlatformHotelRow[]): string[] {
    return [...new Set(rows.map((r) => r.country).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  distinctCities(rows: PlatformHotelRow[], country: string): string[] {
    const c = String(country || '').trim().toLowerCase();
    return [
      ...new Set(
        rows
          .filter((r) => !c || c === 'all' || r.country.toLowerCase() === c)
          .map((r) => r.city)
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));
  }

  groupCounts(
    rows: PlatformHotelRow[],
    key: 'lockName' | 'pmsName'
  ): Array<{ name: string; count: number }> {
    return this.groupHotelsByIntegration(rows, key === 'lockName' ? 'lock' : 'pms').map((g) => ({
      name: g.name,
      count: g.count
    }));
  }

  /** Group hotels under each enabled Lock (type=lock) or PMS (type=pos/pms) name. */
  groupHotelsByIntegration(
    rows: PlatformHotelRow[],
    kind: 'lock' | 'pms'
  ): IntegrationHotelGroup[] {
    const map = new Map<string, PlatformHotelRow[]>();
    for (const row of rows || []) {
      const names = kind === 'lock' ? row.lockNames : row.pmsNames;
      for (const name of names || []) {
        const key = String(name || '').trim();
        if (!key) {
          continue;
        }
        const list = map.get(key) || [];
        if (!list.some((h) => String(h.memberId) === String(row.memberId) && String(h.id) === String(row.id))) {
          list.push(row);
        }
        map.set(key, list);
      }
    }
    return [...map.entries()]
      .map(([name, hotels]) => ({
        name,
        count: hotels.length,
        hotels: [...hotels].sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  searchHotels(rows: PlatformHotelRow[], query: string): PlatformHotelRow[] {
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      return [...(rows || [])];
    }
    return (rows || []).filter((r) => {
      const hay = [r.name, r.memberId, r.email, r.phone, r.country, r.city, r.status, r.lockName, r.pmsName]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  private parseLocalDateInput(value: string): Date | null {
    const m = String(value || '')
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      return null;
    }
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private formatShortDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
}

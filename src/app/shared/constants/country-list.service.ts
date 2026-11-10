import { Injectable } from '@angular/core';
import { CountriesStatesService } from '../../countries-states/countries-states.service';
import { COUNTRY_STATES } from './countries';

/**
 * Replaces the contents of COUNTRY_STATES with the countries collection, so the
 * Registered Office and Property Details dropdowns show what is managed on the
 * Countries & States page. The built-in values stay when the API is unreachable.
 */
@Injectable({ providedIn: 'root' })
export class CountryListService {
  private loading?: Promise<void>;

  constructor(private countriesStatesService: CountriesStatesService) {}

  /** Loads once; a failed load (for example before login) is retried on the next call. */
  load(force = false): Promise<void> {
    if (!this.loading || force) {
      this.loading = this.fetch().then((loaded) => {
        if (!loaded) {
          this.loading = undefined;
        }
      });
    }
    return this.loading;
  }

  /** Active, not deleted, ordered by sort_order: the list the forms should offer. */
  static toDropdownList(docs: any[]): { country: string; states: string[] }[] {
    const byOrder = (a: any, b: any) =>
      (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0) ||
      String(a?.country ?? a?.name ?? '').localeCompare(String(b?.country ?? b?.name ?? ''));
    return (docs || [])
      .filter((c: any) => c?.country && c.is_deleted !== true && c.is_active !== false)
      .sort(byOrder)
      .map((c: any) => ({
        country: c.country,
        states: (c.states || [])
          .filter((s: any) => s?.name && s.is_active !== false)
          .sort(byOrder)
          .map((s: any) => s.name)
      }));
  }

  private async fetch(): Promise<boolean> {
    try {
      const resp: any = await new Promise((resolve, reject) => {
        this.countriesStatesService.getAll().subscribe({ next: resolve, error: reject });
      });
      const list = CountryListService.toDropdownList(resp?.result?.data);
      if (!list.length) {
        return false;
      }
      COUNTRY_STATES.splice(0, COUNTRY_STATES.length, ...list);
      return true;
    } catch (err) {
      console.warn('Countries API unavailable; using the built-in country list.', err);
      return false;
    }
  }
}

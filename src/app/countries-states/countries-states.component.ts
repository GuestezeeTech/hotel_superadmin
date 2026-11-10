import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { AlertsService } from '../shared/alerts/alerts.service';
import { CountryListService } from '../shared/constants/country-list.service';
import { CountriesStatesService, CountryDoc, CountryState } from './countries-states.service';

/**
 * Countries & States: one document per country with its states inside.
 * Admin signup and enrollment, and the superadmin hotel tabs, read this list.
 */
@Component({
  selector: 'app-countries-states',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertsComponent],
  templateUrl: './countries-states.component.html',
  styleUrl: './countries-states.component.scss'
})
export class CountriesStatesComponent implements OnInit {
  countries: CountryDoc[] = [];
  loading = false;
  loadError = '';
  saving = false;
  search = '';

  // Add / edit country
  showCountryModal = false;
  editingCountry: CountryDoc | null = null;
  countryForm = { country: '', code: '', is_active: true };
  countryError = '';

  // Manage states (edited locally, saved together)
  showStatesModal = false;
  statesCountry: CountryDoc | null = null;
  statesDraft: CountryState[] = [];
  newStateName = '';
  statesError = '';

  // Delete
  deleteTarget: CountryDoc | null = null;

  private options = { autoClose: true, keepAfterRouteChange: false };

  constructor(
    private countriesService: CountriesStatesService,
    private countryListService: CountryListService,
    private alertService: AlertsService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  get filteredCountries(): CountryDoc[] {
    const query = this.search.trim().toLowerCase();
    return query
      ? this.countries.filter(c => c.country.toLowerCase().includes(query) || c.code.includes(query))
      : this.countries;
  }

  activeStateCount(country: CountryDoc): number {
    return (country.states || []).filter(s => s.is_active !== false).length;
  }

  loadCountries(): void {
    this.loading = true;
    this.loadError = '';
    this.countriesService.getAll().subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp?.success !== 1) {
          this.loadError = resp?.message || 'Unable to load countries.';
          return;
        }
        // Only real country documents: anything without a country name is ignored,
        // so Edit / Delete can never be pointed at an unrelated record
        this.countries = (resp?.result?.data || [])
          .filter((c: any) => typeof c?.country === 'string' && c.country.trim() && c?.is_deleted !== true)
          .sort((a: any, b: any) =>
            (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.country).localeCompare(String(b.country)));
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Unable to reach the countries service. Please try again.';
      }
    });
  }

  /** Re-reads the list here and in the dropdowns of the hotel tabs. */
  private afterChange(message: string): void {
    this.alertService.success(message, this.options);
    this.loadCountries();
    this.countryListService.load(true);
  }

  private run(request: Observable<any>, success: string, onDone: () => void, onError: (msg: string) => void): void {
    this.saving = true;
    request.subscribe({
      next: (resp: any) => {
        this.saving = false;
        if (resp?.success === 1) {
          onDone();
          this.afterChange(success);
        } else {
          onError(resp?.message || 'Something went wrong. Please try again.');
        }
      },
      error: (err: any) => {
        this.saving = false;
        onError(err?.error?.message || 'Something went wrong. Please try again.');
      }
    });
  }

  /** Fields saved with every update; states are always sent as the whole array. */
  private toDoc(country: CountryDoc, changes: Partial<CountryDoc>): CountryDoc {
    return {
      country: country.country,
      code: country.code,
      sort_order: Number(country.sort_order) || 0,
      is_active: country.is_active !== false,
      states: country.states || [],
      ...changes
    };
  }

  // ---- Country ----

  openAddCountry(): void {
    this.editingCountry = null;
    this.countryForm = { country: '', code: '+', is_active: true };
    this.countryError = '';
    this.showCountryModal = true;
  }

  openEditCountry(country: CountryDoc): void {
    this.editingCountry = country;
    this.countryForm = { country: country.country, code: country.code, is_active: country.is_active !== false };
    this.countryError = '';
    this.showCountryModal = true;
  }

  closeCountryModal(): void {
    if (!this.saving) {
      this.showCountryModal = false;
    }
  }

  saveCountry(): void {
    const name = this.countryForm.country.trim();
    const code = this.countryForm.code.trim();
    if (!name) {
      this.countryError = 'Country name is required.';
      return;
    }
    if (!/^\+\d{1,4}$/.test(code)) {
      this.countryError = 'Dial code must be + followed by 1 to 4 digits, for example +91.';
      return;
    }
    const others = this.countries.filter(c => c !== this.editingCountry);
    if (others.some(c => c.country.toLowerCase() === name.toLowerCase())) {
      this.countryError = `${name} already exists.`;
      return;
    }
    if (others.some(c => c.code === code)) {
      this.countryError = `Dial code ${code} is already used by ${others.find(c => c.code === code)?.country}.`;
      return;
    }
    this.countryError = '';

    if (this.editingCountry) {
      const target = this.editingCountry;
      if (target.id == null) {
        this.countryError = 'This country has no id, so it cannot be updated. Add an id to it in the database.';
        return;
      }
      this.run(
        this.countriesService.update(target.id, this.toDoc(target, { country: name, code, is_active: this.countryForm.is_active })),
        `${name} updated.`,
        () => (this.showCountryModal = false),
        (msg) => (this.countryError = msg)
      );
    } else {
      const nextOrder = Math.max(0, ...this.countries.map(c => Number(c.sort_order) || 0)) + 1;
      this.run(
        this.countriesService.create({
          country: name, code, sort_order: nextOrder, is_active: this.countryForm.is_active, is_deleted: false, states: []
        }),
        `${name} added. Add its states next.`,
        () => (this.showCountryModal = false),
        (msg) => (this.countryError = msg)
      );
    }
  }

  // ---- States ----

  openStates(country: CountryDoc): void {
    this.statesCountry = country;
    this.statesDraft = (country.states || []).map(s => ({ ...s, is_active: s.is_active !== false }));
    this.newStateName = '';
    this.statesError = '';
    this.showStatesModal = true;
  }

  closeStatesModal(): void {
    if (!this.saving) {
      this.showStatesModal = false;
    }
  }

  addState(): void {
    const name = this.newStateName.trim();
    if (!name) {
      return;
    }
    if (this.statesDraft.some(s => s.name.trim().toLowerCase() === name.toLowerCase())) {
      this.statesError = `${name} is already in the list.`;
      return;
    }
    this.statesError = '';
    this.statesDraft.push({ name, sort_order: this.statesDraft.length + 1, is_active: true });
    this.newStateName = '';
  }

  removeState(index: number): void {
    this.statesDraft.splice(index, 1);
  }

  saveStates(): void {
    const country = this.statesCountry;
    if (!country) {
      return;
    }
    const names = this.statesDraft.map(s => s.name.trim());
    if (names.some(n => !n)) {
      this.statesError = 'State names cannot be empty.';
      return;
    }
    const duplicate = names.find((n, i) => names.findIndex(m => m.toLowerCase() === n.toLowerCase()) !== i);
    if (duplicate) {
      this.statesError = `${duplicate} appears more than once.`;
      return;
    }
    if (country.id == null) {
      this.statesError = 'This country has no id, so it cannot be updated. Add an id to it in the database.';
      return;
    }
    this.statesError = '';
    const states = this.statesDraft.map((s, i) => ({ name: s.name.trim(), sort_order: i + 1, is_active: s.is_active }));
    this.run(
      this.countriesService.update(country.id, this.toDoc(country, { states })),
      `States saved for ${country.country}.`,
      () => (this.showStatesModal = false),
      (msg) => (this.statesError = msg)
    );
  }

  // ---- Delete ----

  openDelete(country: CountryDoc): void {
    this.deleteTarget = country;
  }

  closeDelete(): void {
    if (!this.saving) {
      this.deleteTarget = null;
    }
  }

  confirmDelete(): void {
    const target = this.deleteTarget;
    if (!target) {
      return;
    }
    if (target.id == null) {
      this.alertService.error('This country has no id, so it cannot be deleted. Add an id to it in the database.', this.options);
      return;
    }
    this.run(
      this.countriesService.delete(target.id),
      `${target.country} deleted.`,
      () => (this.deleteTarget = null),
      (msg) => this.alertService.error(msg, this.options)
    );
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  DashboardRefreshButtonComponent,
  DashboardRefreshSource
} from '../shared/dashboard-refresh/dashboard-refresh-button.component';
import { scrollAppToTop } from '../shared/scroll-to-top.util';
import {
  HotelSignedBucket,
  MasterIntegration,
  PlatformHotelRow,
  PlatformOverviewDashboardService
} from './platform-overview-dashboard.service';

type KpiItem = {
  key: HotelSignedBucket;
  cssClass: string;
  icon: string;
  label: string;
  value: string;
  note: string;
};

type DetailView =
  | 'overview'
  | 'all-hotels'
  | 'lock-wise'
  | 'pms-wise'
  | 'only-key'
  | 'integration-hotels';

@Component({
  selector: 'app-platform-overview-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardRefreshButtonComponent],
  templateUrl: './platform-overview-dashboard.component.html',
  styleUrl: './platform-overview-dashboard.component.scss'
})
export class PlatformOverviewDashboardComponent implements OnInit {
  loading = true;
  refreshing = false;
  integrationLoading = false;
  loadError = '';

  selectedCountry = 'All';
  selectedCity = 'All';
  countryOptions: string[] = [];
  cityOptions: string[] = [];

  activeView: DetailView = 'overview';
  listTitle = 'Hotels Signed';
  hotelSearch = '';
  integrationSearch = '';

  private sourceRows: PlatformHotelRow[] = [];
  filteredRows: PlatformHotelRow[] = [];
  listRows: PlatformHotelRow[] = [];
  visibleHotels: PlatformHotelRow[] = [];

  lockMasters: MasterIntegration[] = [];
  pmsMasters: MasterIntegration[] = [];
  visibleLockMasters: MasterIntegration[] = [];
  visiblePmsMasters: MasterIntegration[] = [];

  selectedIntegration: MasterIntegration | null = null;
  selectedIntegrationKind: 'lock' | 'pos' = 'lock';
  integrationHotels: PlatformHotelRow[] = [];
  visibleIntegrationHotels: PlatformHotelRow[] = [];
  private returnView: DetailView = 'lock-wise';

  kpis: KpiItem[] = [
    {
      key: 'all',
      cssClass: 'primary',
      icon: 'bi bi-building',
      label: 'Total Hotels Signed',
      value: '—',
      note: 'All signed hotels'
    },
    {
      key: 'lock',
      cssClass: 'blue',
      icon: 'bi bi-lock-fill',
      label: 'Lock Wise Signed',
      value: '—',
      note: 'Tech type · lock'
    },
    {
      key: 'pms',
      cssClass: 'green',
      icon: 'bi bi-hdd-network-fill',
      label: 'PMS Wise Signed',
      value: '—',
      note: 'Tech type · pos'
    },
    {
      key: 'only-key',
      cssClass: 'orange',
      icon: 'bi bi-key-fill',
      label: 'Only Key Signed',
      value: '—',
      note: 'Lock only · no PMS'
    }
  ];

  constructor(
    private platformService: PlatformOverviewDashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData(false);
  }

  /** Open hotel enrollment tabs (Office / Property / Technical Info / …). */
  openHotel(row: PlatformHotelRow, event?: Event): void {
    event?.stopPropagation();
    const id = row?.id;
    if (id === null || id === undefined || id === '') {
      return;
    }
    this.router.navigate(['/edit-new-hotel', id]);
  }

  onDashboardRefresh(_source: DashboardRefreshSource): void {
    this.loadData(true);
  }

  onCountryChange(): void {
    this.selectedCity = 'All';
    this.cityOptions = this.platformService.distinctCities(
      this.sourceRows,
      this.selectedCountry
    );
    this.applyFilters();
  }

  onCityChange(): void {
    this.applyFilters();
  }

  onHotelSearchChange(): void {
    this.refreshVisibleLists();
  }

  onIntegrationSearchChange(): void {
    this.refreshMasterLists();
  }

  openKpi(kpi: KpiItem): void {
    this.listTitle = kpi.label;
    this.hotelSearch = '';
    this.integrationSearch = '';
    this.selectedIntegration = null;
    this.integrationHotels = [];
    this.visibleIntegrationHotels = [];

    if (kpi.key === 'all') {
      this.activeView = 'all-hotels';
    } else if (kpi.key === 'lock') {
      this.activeView = 'lock-wise';
    } else if (kpi.key === 'pms') {
      this.activeView = 'pms-wise';
    } else {
      this.activeView = 'only-key';
    }

    this.refreshVisibleLists();
    scrollAppToTop();
  }

  openIntegrationFromOverview(kind: 'lock' | 'pos', item: MasterIntegration): void {
    this.activeView = kind === 'lock' ? 'lock-wise' : 'pms-wise';
    this.listTitle = kind === 'lock' ? 'Lock Wise Signed' : 'PMS Wise Signed';
    this.integrationSearch = '';
    this.refreshMasterLists();
    this.selectIntegration(kind, item);
  }

  backToOverview(): void {
    this.activeView = 'overview';
    this.hotelSearch = '';
    this.integrationSearch = '';
    this.selectedIntegration = null;
    this.integrationHotels = [];
    scrollAppToTop();
  }

  backFromIntegrationHotels(): void {
    this.activeView = this.returnView;
    this.selectedIntegration = null;
    this.integrationHotels = [];
    this.visibleIntegrationHotels = [];
    this.hotelSearch = '';
    scrollAppToTop();
  }

  selectIntegration(kind: 'lock' | 'pos', item: MasterIntegration): void {
    this.selectedIntegrationKind = kind;
    this.selectedIntegration = item;
    this.returnView = kind === 'lock' ? 'lock-wise' : 'pms-wise';
    this.hotelSearch = '';
    this.integrationHotels = [];
    this.visibleIntegrationHotels = [];
    this.activeView = 'integration-hotels';
    this.loadHotelsForIntegration(item);
    scrollAppToTop();
  }

  statusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') {
      return 'status-pill status-pill--ok';
    }
    if (s.includes('unapproved') || s.includes('reject')) {
      return 'status-pill status-pill--bad';
    }
    return 'status-pill';
  }

  private loadData(soft = false): void {
    if (soft) {
      if (this.refreshing) {
        return;
      }
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.loadError = '';

    forkJoin({
      hotels: this.platformService.fetchAllHotels().pipe(catchError(() => of([]))),
      tech: this.platformService.fetchAllTechnicalInfo().pipe(catchError(() => of([]))),
      locks: this.platformService.fetchMasterIntegrations('lock').pipe(catchError(() => of([]))),
      pms: this.platformService.fetchMasterIntegrations('pos').pipe(catchError(() => of([])))
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
        })
      )
      .subscribe({
        next: ({ hotels, tech, locks, pms }) => {
          this.sourceRows = this.platformService.buildHotelRows(hotels, tech);
          this.lockMasters = locks;
          this.pmsMasters = pms;
          this.countryOptions = this.platformService.distinctCountries(this.sourceRows);
          this.cityOptions = this.platformService.distinctCities(
            this.sourceRows,
            this.selectedCountry
          );
          this.applyFilters();
          if (this.activeView === 'integration-hotels' && this.selectedIntegration) {
            this.loadHotelsForIntegration(this.selectedIntegration);
          }
        },
        error: () => {
          this.loadError = 'Unable to load platform hotel metrics.';
          this.sourceRows = [];
          this.lockMasters = [];
          this.pmsMasters = [];
          this.applyFilters();
        }
      });
  }

  private loadHotelsForIntegration(item: MasterIntegration): void {
    const title = String(item.title || item.name || '').trim();
    if (!title) {
      this.integrationHotels = [];
      this.visibleIntegrationHotels = [];
      return;
    }

    this.integrationLoading = true;
    this.platformService
      .fetchEnabledEcomByTitle(title)
      .pipe(finalize(() => (this.integrationLoading = false)))
      .subscribe({
        next: (docs) => {
          let memberIds = this.platformService.extractMemberIdsFromEcom(docs, title);
          let matched = this.platformService.hotelsByMemberIds(this.filteredRows, memberIds);

          // Fallback: match by lock/pms name already joined on hotel rows
          if (!matched.length) {
            const want = title.toLowerCase();
            const kind = this.selectedIntegrationKind;
            matched = this.filteredRows.filter((row) => {
              const names = kind === 'lock' ? row.lockNames : row.pmsNames;
              return (names || []).some((n) => String(n).trim().toLowerCase() === want);
            });
          }

          this.integrationHotels = [...matched].sort((a, b) => a.name.localeCompare(b.name));
          this.visibleIntegrationHotels = this.platformService.searchHotels(
            this.integrationHotels,
            this.hotelSearch
          );
        },
        error: () => {
          this.integrationHotels = [];
          this.visibleIntegrationHotels = [];
        }
      });
  }

  private applyFilters(): void {
    this.filteredRows = this.platformService.filterByLocation(
      this.sourceRows,
      this.selectedCountry,
      this.selectedCity
    );

    const total = this.filteredRows.length;
    const lockCount = this.filteredRows.filter((r) => r.hasLock).length;
    const pmsCount = this.filteredRows.filter((r) => r.hasPms).length;
    const onlyKeyCount = this.filteredRows.filter((r) => r.onlyKey).length;

    this.setKpi('all', String(total), 'All signed hotels');
    this.setKpi(
      'lock',
      String(this.lockMasters.length),
      `${lockCount} hotels · ${this.lockMasters.length} lock integrations`
    );
    this.setKpi(
      'pms',
      String(this.pmsMasters.length),
      `${pmsCount} hotels · ${this.pmsMasters.length} PMS integrations`
    );
    this.setKpi('only-key', String(onlyKeyCount), 'Lock only · no PMS');

    this.refreshVisibleLists();
  }

  private refreshVisibleLists(): void {
    const all = this.platformService.filterByBucket(this.filteredRows, 'all');
    const onlyKey = this.platformService.filterByBucket(this.filteredRows, 'only-key');

    this.refreshMasterLists();

    if (this.activeView === 'all-hotels') {
      this.listRows = all;
      this.visibleHotels = this.platformService.searchHotels(all, this.hotelSearch);
    } else if (this.activeView === 'only-key') {
      this.listRows = onlyKey;
      this.visibleHotels = this.platformService.searchHotels(onlyKey, this.hotelSearch);
    } else if (this.activeView === 'integration-hotels') {
      this.visibleIntegrationHotels = this.platformService.searchHotels(
        this.integrationHotels,
        this.hotelSearch
      );
    }
  }

  private refreshMasterLists(): void {
    const q = String(this.integrationSearch || '').trim().toLowerCase();
    const filterMasters = (list: MasterIntegration[]) => {
      if (!q) {
        return [...list];
      }
      return list.filter((m) => {
        const hay = [m.name, m.title, m.description, m.type].join(' ').toLowerCase();
        return hay.includes(q);
      });
    };
    this.visibleLockMasters = filterMasters(this.lockMasters);
    this.visiblePmsMasters = filterMasters(this.pmsMasters);
  }

  private setKpi(key: HotelSignedBucket, value: string, note: string): void {
    const kpi = this.kpis.find((k) => k.key === key);
    if (kpi) {
      kpi.value = value;
      kpi.note = note;
    }
  }
}

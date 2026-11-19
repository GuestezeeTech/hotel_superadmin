import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlatformOverviewDashboardService } from '../platform-overview-dashboard/platform-overview-dashboard.service';
import { FrequentGuestRow, GuestRow, ReservationRow, SuperadminGuestsService } from './guests.service';

type GuestTab = 'guests' | 'reservations' | 'frequent';

/** Guests menu: every hotel's guests, reservations and frequent guests, with a hotel filter */
@Component({
  selector: 'app-superadmin-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guests.component.html',
  styleUrl: './guests.component.scss'
})
export class GuestsComponent implements OnInit {
  readonly pageSize = 20;

  hotelOptions: { memberId: string; label: string; name: string }[] = [];
  /** Member id of the hotel shown; the first hotel is picked on load */
  selectedHotel = '';
  activeTab: GuestTab = 'guests';
  search = '';
  statusFilter = 'All';

  private guestDocs: any[] = [];
  guests: GuestRow[] = [];
  reservations: ReservationRow[] = [];
  frequent: FrequentGuestRow[] = [];

  visibleGuests: GuestRow[] = [];
  visibleReservations: ReservationRow[] = [];
  visibleFrequent: FrequentGuestRow[] = [];
  page = 1;

  kycUrl: SafeResourceUrl | null = null;
  kycRawUrl = '';
  kycIsPdf = false;

  private loadSeq = 0;
  /** guest/getall (no member_id), loaded once */
  private allGuests: any[] | null = null;
  private reservationDocs: any[] = [];
  loadingGuests = false;
  loadingReservations = false;

  constructor(
    private guestsService: SuperadminGuestsService,
    private platformService: PlatformOverviewDashboardService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.platformService.fetchAllHotels().subscribe((hotels) => {
      const rows = this.platformService.buildHotelRows(hotels, []);
      this.hotelOptions = rows
        .filter((h) => h.memberId && h.memberId !== '—')
        .map((h) => ({ memberId: h.memberId, name: h.name, label: `${h.memberId} - ${h.name}` }))
        .sort((a, b) => a.label.localeCompare(b.label));
      this.selectedHotel = this.hotelOptions[0]?.memberId || '';
      this.loadGuests();
      this.load();
    });
  }

  /** Guest Details: every guest from guest/getall (no member_id), loaded once */
  private loadGuests(): void {
    this.loadingGuests = true;
    this.guestsService
      .fetchAllGuests()
      .pipe(finalize(() => (this.loadingGuests = false)))
      .subscribe((guests) => {
        this.allGuests = guests;
        this.guests = this.guestsService.buildGuestRows(guests, [], (m) => this.hotelNameOf(m));
        this.refreshHotelData();
      });
  }

  private hotelNameOf(memberId: string): string {
    if (!memberId) {
      return '—';
    }
    return this.hotelOptions.find((h) => h.memberId.toLowerCase() === String(memberId).toLowerCase())?.name || memberId;
  }

  /** Loading state of the tab on screen */
  get loading(): boolean {
    return this.activeTab === 'guests' ? this.loadingGuests : this.loadingReservations;
  }

  get pageStart(): number {
    return this.currentList.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.currentList.length);
  }

  get selectedHotelLabel(): string {
    return this.hotelOptions.find((h) => h.memberId === this.selectedHotel)?.label || this.selectedHotel || 'No hotel';
  }

  get statusOptions(): string[] {
    return [...new Set(this.reservations.map((r) => r.status))].filter((s) => s && s !== '—').sort();
  }

  get inHouseCount(): number {
    return this.reservations.filter((r) => r.status === 'Checked-in').length;
  }

  get upcomingCount(): number {
    const now = Date.now();
    return this.reservations.filter((r) => r.status === 'Reserved' && r.arrivalMs >= now - 86400000).length;
  }

  get currentList(): any[] {
    return this.activeTab === 'guests'
      ? this.visibleGuests
      : this.activeTab === 'reservations'
        ? this.visibleReservations
        : this.visibleFrequent;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.currentList.length / this.pageSize));
  }

  get pagedRows(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.currentList.slice(start, start + this.pageSize);
  }

  onHotelChange(): void {
    this.page = 1;
    this.statusFilter = 'All';
    this.load();
  }

  setTab(tab: GuestTab): void {
    this.activeTab = tab;
    this.page = 1;
  }

  onFilterChange(): void {
    this.page = 1;
    this.applyFilters();
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  /** Reservations of the hotel in the dropdown (member_id sent in the payload) */
  load(): void {
    const seq = ++this.loadSeq;
    if (!this.selectedHotel) {
      this.reservationDocs = [];
      this.refreshHotelData();
      return;
    }
    this.loadingReservations = true;
    this.guestsService
      .fetchReservations(this.selectedHotel)
      .pipe(finalize(() => { if (seq === this.loadSeq) this.loadingReservations = false; }))
      .subscribe((reservations) => {
        if (seq !== this.loadSeq) {
          return; // a newer hotel was picked meanwhile
        }
        // Keep only the chosen hotel even if the API ignores the filter
        this.reservationDocs = reservations.filter((d) => {
          const m = String(d?.member_id ?? d?.Member_Id ?? d?.customer_member_id ?? '').trim();
          return !m || m === this.selectedHotel;
        });
        this.refreshHotelData();
      });
  }

  /** Reservations and frequent guests of the chosen hotel */
  private refreshHotelData(): void {
    this.reservations = this.guestsService.buildReservationRows(this.reservationDocs, (m) => this.hotelNameOf(m));
    this.guestDocs = this.guestsService.guestsForHotel(this.allGuests || [], this.selectedHotel, this.reservations);
    this.frequent = this.guestsService.buildFrequentGuests(this.reservations, this.guestDocs);
    this.applyFilters();
  }

  private applyFilters(): void {
    const q = this.search.trim().toLowerCase();
    const has = (...parts: any[]) => !q || parts.join(' ').toLowerCase().includes(q);
    this.visibleGuests = this.guests.filter((g) => has(g.name, g.mobile, g.email, g.hotelName, g.memberId));
    this.visibleReservations = this.reservations.filter((r) =>
      (this.statusFilter === 'All' || r.status === this.statusFilter) &&
      has(r.id, r.guestName, r.mobile, r.room, r.hotelName, r.memberId, r.status));
    this.visibleFrequent = this.frequent.filter((f) => has(f.guestName, f.mobile, f.email, f.hotelName, f.memberId));
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Checked-in': return 'g-pill g-pill--in';
      case 'Reserved': return 'g-pill g-pill--res';
      case 'Cancelled': return 'g-pill g-pill--cancel';
      default: return 'g-pill';
    }
  }

  viewKyc(url: string): void {
    this.kycRawUrl = url;
    this.kycIsPdf = url.toLowerCase().includes('.pdf');
    this.kycUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  closeKyc(): void {
    this.kycUrl = null;
    this.kycRawUrl = '';
  }
}

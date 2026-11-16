import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SelectedHotel,
  SelectedHotelContextService
} from './selected-hotel-context.service';

@Component({
  selector: 'app-dashboard-hotel-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-hotel-controls.component.html',
  styleUrl: './dashboard-hotel-controls.component.scss'
})
export class DashboardHotelControlsComponent implements OnInit {
  @Input() disabled = false;
  @Output() hotelChange = new EventEmitter<SelectedHotel | null>();

  hotels: SelectedHotel[] = [];
  selectedMemberId = '';
  loading = true;
  loadError = '';

  constructor(private hotelContext: SelectedHotelContextService) {}

  ngOnInit(): void {
    this.hotelContext.ensureLoaded().subscribe({
      next: (hotels) => {
        this.hotels = hotels;
        this.selectedMemberId = this.hotelContext.getMemberId();
        this.loading = false;
        if (!hotels.length) {
          this.loadError = 'No approved hotels';
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Unable to load hotels';
      }
    });
  }

  onHotelModelChange(memberId: string): void {
    const nextId = String(memberId || '').trim();
    if (!nextId || nextId === this.selectedMemberId) {
      return;
    }
    const hotel = this.hotelContext.selectByMemberId(nextId);
    this.selectedMemberId = hotel?.memberId || nextId;
    this.hotelChange.emit(hotel);
  }
}

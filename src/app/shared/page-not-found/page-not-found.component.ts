import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../auth-services/local-storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss'
})

export class PageNotFoundComponent {

  constructor(
    private router: Router,
    private localservice: LocalStorageService
  ) { }

  goBack(): void {
    const lastValid = this.localservice.get('lastValidUrl');
    if (lastValid) {
      this.router.navigateByUrl(lastValid);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goHome(): void {
    this.router.navigate(['/hotel-list']);
  }
}

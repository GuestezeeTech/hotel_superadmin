import { Component } from '@angular/core';
import { TechInfoContentComponent } from '../tech-info-content/tech-info-content.component';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tech-info-list',
  standalone: true,
  imports: [TechInfoContentComponent, CommonModule],
  templateUrl: './tech-info-list.component.html',
  styleUrl: './tech-info-list.component.scss'
})

export class TechInfoListComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  selectedTab: string = 'lock'; // Default tab
  activeTab: number = 1;

  toggleSwitch(element: any) {
    element.classList.toggle("active");
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  firstTabCount() {
    this.activeTab = 1;
  }

  secondTabCount() {
    this.activeTab = 2;
  }

  thirdTabCount() {
    this.activeTab = 3;
  }

  nextTabInfo() {
    switch (this.activeTab) {
      case 1:
        this.selectTab('pos');
        this.secondTabCount();
        break;
      case 2:
        this.selectTab('other');
        this.thirdTabCount();
        break;
    }
  }

  addTechnicalInfo() {
    this.router.navigate(['/add-technical-info'])
  }

}

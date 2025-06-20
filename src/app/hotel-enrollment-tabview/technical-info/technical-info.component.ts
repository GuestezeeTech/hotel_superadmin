import { Component } from '@angular/core';
import { TechInfoListComponent } from '../../technical-info/tech-info-list/tech-info-list.component';

@Component({
  selector: 'app-technical-info',
  standalone: true,
  imports: [TechInfoListComponent],
  templateUrl: './technical-info.component.html',
  styleUrl: './technical-info.component.scss'
})
export class TechnicalInfoComponent {
  toggleSwitch(element:any) {
    element.classList.toggle("active");
}

}

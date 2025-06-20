import { Component } from '@angular/core';
import { TechInfoContentComponent } from '../tech-info-content/tech-info-content.component';
import { CommonModule } from '@angular/common';
import { Router,ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tech-info-list',
  standalone: true,
  imports: [TechInfoContentComponent,CommonModule],
  templateUrl: './tech-info-list.component.html',
  styleUrl: './tech-info-list.component.scss'
})
export class TechInfoListComponent {
  constructor(

  
    private router:Router,
    private route:ActivatedRoute
  
  ){}
  selectedTab: string = 'lock'; // Default tab
  toggleSwitch(element:any) {
    element.classList.toggle("active");
    
}
selectTab(tab: string) {
  this.selectedTab = tab;
}
addTechnicalInfo(){
    this.router.navigate(['/add-technical-info'])

}

}

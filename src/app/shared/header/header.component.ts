import { Component, Input, OnInit } from '@angular/core';
import {  ElementRef, HostListener, ViewChild } from '@angular/core';
import { LocalStorageService } from '../../auth-services/local-storage.service';
 
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { EventEmitter, Output } from '@angular/core';
import { filter } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';
import { CommonModule } from '@angular/common';
import { UserAccessService } from '../../user-access/user-access.service';
import { NotificationComponent } from '../../notification/notification.component';
 
 
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,NotificationComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private currentRoute$ = new BehaviorSubject<string>('');
  @Input() selectedMenu: string = '';
  profile_image: string | null = null;
  profile_name: string | null = '';
  showAccount = false;
  showNotification=false;

  
  @ViewChild('userInfo', { static: true }) userInfoRef!: ElementRef;
 
  // userName:string='';
  constructor(
 
    private localService: LocalStorageService,
    private route: ActivatedRoute, private router: Router,
    private profileService: ProfileService,
    private userAccessService:UserAccessService
 
  ) {
    this.currentRoute$ = new BehaviorSubject<string>(this.router.url); // ✅
  }
 
  ngOnInit(): void {
   
    this.profileService.profileImage$.subscribe(imageUrl => {
      this.profile_image = imageUrl;
    });
 
    this.profileService.profileName$.subscribe(name => {
      this.profile_name = name;
    });
 
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute$.next(event.urlAfterRedirects);
        //console.log("Current Route Updated:", event.urlAfterRedirects);
      });
 
    this.activeMenu;
  }
  get activeMenu(): string {
    const currentRoute = this.currentRoute$.value;
    //console.log("payment", currentRoute.includes('payment'));
    if (currentRoute.includes('payment')) {
      return (this.selectedMenu = "Payment");
 
    }
    else if (currentRoute.includes('hotel')) {
      return (this.selectedMenu = "Hotel");
 
 
    }
    else if (currentRoute.includes('role')) {
      return (this.selectedMenu = "Roles");
 
    }
    else if (currentRoute.includes('user')) {
      return (this.selectedMenu = "Users");
 
    }
    else if (currentRoute.includes('dashboard')) {
      return (this.selectedMenu = "Dashboard");
 
    }
    else if (currentRoute.includes('service')) {
      return (this.selectedMenu = "Service Settings");
 
    }
    else if (currentRoute.includes('service')) {
      return (this.selectedMenu = "Service Settings");
 
    }
    else if (currentRoute.includes('technical')) {
      return (this.selectedMenu = "Technical Info");
 
    }
    else {
      return "set the name here";
    }
 
  }
  navigateToProfile() {
    this.showAccount = false;
    this.router.navigate(['/profile']);
  }
 
  logout() {
    this.localService.remove('accessToken');
    this.localService.remove('refreshToken');
    this.localService.remove('expireTime');
    this.localService.remove('UserName');
    this.localService.remove('UserEmail');
    this.localService.remove('UserId');
    this.localService.remove('domainName');
    this.localService.remove('rexpireTime');
    this.router.navigate([`/login`], { skipLocationChange: false });
    this.userAccessService.removeUserAccess();
     
  
  }
 
  toggleLogout() {
    this.showAccount = !this.showAccount;
  }
  toggleNotification() {
    this.showNotification = !this.showNotification;
  }
 @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.userInfoRef && !this.userInfoRef.nativeElement.contains(event.target)) {
      this.showAccount = false;
    }
  }
}
 
 
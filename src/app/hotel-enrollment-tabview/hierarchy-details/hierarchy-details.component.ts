import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { ENDPOINTS } from '../../app.config';
@Component({
  selector: 'app-hierarchy-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hierarchy-details.component.html',
  styleUrl: './hierarchy-details.component.scss'
})
export class HierarchyDetailsComponent implements OnInit {
  hotelId: Number | null = null;
  hierarchies: any = [];
  customerdata: any = {};
  member_id: any;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  constructor(

    private authTokenService: AuthTokenService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);
      // console.log('Hotel ID:', this.hotelId); // Debugging
      this.getCustomerById().then(() => {
        this.getHierarchyById();
      });
    });
  }

  getCustomerById(): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.hotelId
          }
        }
      };
      this.hotelenrollmenttabviewService.getCustomerById(requestBody).subscribe(
        resp => {
          if (resp && resp.success == 1 && resp.result && resp.result.data && resp.result.data.length > 0) {
            this.customerdata = resp.result.data[0];
            this.member_id = this.customerdata.customer_member_id;
            resolve();
          }
          else {
            resolve();
          }
        },
        err => {
          if (err.error.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertService.error(err.error.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);
        }
      );
    });
  }

  getHierarchyById() {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          member_id: this.member_id
        }
      }
    }
    //console.log("123")
    this.hotelenrollmenttabviewService.apiCall(requestBody, ENDPOINTS.GETBYID_HIERARCHY).subscribe(
      resp => {
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            this.hierarchies = resp.result.data || [];
            //  this.apiSelectedServices=resp.result.data[0].services.filter((item:any) => item.service_required === false);
          }
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertService.error(resp.message, this.options);
            }
          }
          else if (resp.message && resp.status_code !== 200) {
            this.alertService.error(resp.message, this.options);
          }
          else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
        }
      },
      err => {
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`], { skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertService.error(err.error.message, this.options)
        }
        else {
          this.alertService.error('Something bad happened. Please try again!', this.options);
        }
      }
    )
  }


  onViewHierarchy(id: number) {
    this.router.navigate(['/view-customer-hierarchy', id], {
      queryParams: { customerId: this.hotelId }
    })
  }

  // Newly added function to navigate to the next tab
  nextTab() {
    let nextTab = document.getElementById('payment-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  previousTab() {
    let nextTab = document.getElementById('services-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

}

import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { TechnicalInfoService } from '../technical-info.service';
import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { ENDPOINTS } from '../../app.config';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-tech-info-content',
  standalone: true,
  imports: [AlertsComponent, CommonModule],
  templateUrl: './tech-info-content.component.html',
  styleUrl: './tech-info-content.component.scss'
})
export class TechInfoContentComponent implements OnChanges {
  @Input() filterType: string = '';
  ecomData: any;
  overallData: any;
  tech_info_id: any;
  isLoading: boolean = false;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  constructor(
    private fb: FormBuilder,
    private authTokenService: AuthTokenService,
    private technicalInfoService: TechnicalInfoService,
    private alertService: AlertsService,
    private router: Router,
    private route: ActivatedRoute

  ) { }
  ngOnInit(): void {
    // Redundant logic commented to prevent flickering, relying on ngOnChanges instead
    /*
    console.log('Filter type changed:', this.filterType);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Reactive ID:', id);
      this.tech_info_id = Number(id);

    });
    console.log("tech_info_id", this.tech_info_id)
    if (this.tech_info_id !== undefined && this.tech_info_id !== 0) {
      console.log("11");
      this.ecomIntegrationSettingsGetbyId()
    }
    else {
      console.log("12");
      this.ecomIntegrationSettingsGetAll();
    }
    */
    this.route.paramMap.subscribe(params => { // newly added for technical info optimization
      const id = params.get('id');
      this.tech_info_id = Number(id);
      this.loadData();
    });
  }

  ngOnChanges() {
    /*
    console.log('Tab selected:', this.filterType);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Reactive ID:', id);
      this.tech_info_id = Number(id);
    });

    if (this.tech_info_id !== undefined && this.tech_info_id !== 0) {
      console.log("11");
      this.ecomIntegrationSettingsGetbyId()

    }
    else {
      console.log("12");
      this.ecomIntegrationSettingsGetAll();
    }
    */
    this.filterData(); // newly commented for technical info optimization
  }

  loadData() { // newly added for technical info optimization
    if (this.tech_info_id !== undefined && this.tech_info_id !== 0) {
      this.ecomIntegrationSettingsGetbyId();
    } else {
      this.ecomIntegrationSettingsGetAll();
    }
  }

  filterData() { // newly added for technical info optimization
    if (!this.overallData) return;

    if (this.filterType == "pos") {
      this.ecomData = this.overallData.filter((item: any) => (item.type == "pos"));

    }
    if (this.filterType == "P" || this.filterType == "lock") {
      this.ecomData = this.overallData.filter((item: any) => (item.type == "lock"));

    }
    if (this.filterType == "SMS") {
      this.ecomData = this.overallData.filter((item: any) => (item.type == "SMS"));

    }
    if (this.filterType == "Payment") {
      this.ecomData = this.overallData.filter((item: any) => (item.type == "Payment"));

    }
    if (this.filterType == "other") {
      this.ecomData = this.overallData.filter((item: any) => (item.type == "other"));

    }
    // Call filtering logic here
  }
  ecomIntegrationSettingsGetAll() {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            // customer_id: this.tech_info_id
          }
        }
      };

      this.technicalInfoService.apiCall(requestBody, ENDPOINTS.GET_ALL_API_INT_SETTINGS).subscribe(
        resp => {
          this.isLoading = false;
          if (resp) {
            let respdata = resp.result.data;
            // this.overallData = respdata.filter((item: any) => (item.customer_id == undefined));
            // this.overallData = respdata.filter((item: any) => (item.customer_member_id == undefined)); //newly changed from customer_id to customer_member_id
            this.overallData = respdata.filter((item: any) => (item.member_id == undefined || item.member_id == null));
            // console.log(this.overallData, "respdata");

            // this.ecomData = this.overallData.filter((item: any) => item.e == this.filterType); // Old line with typo
            this.ecomData = this.overallData.filter((item: any) => item.type == this.filterType); // New corrected line

            // console.log(this.ecomData, " this.ecomData")
          }
          resolve(resp);
        },
        err => {
          this.isLoading = false;
          // this.loaderService.emitComplete();
          if (err.error.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertService.error(err.error.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }
  ecomIntegrationSettingsGetbyId() {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            // member_id: this.tech_info_id
            customer_id: this.tech_info_id
            // customer_member_id: this.tech_info_id //newly changed from customer_id to customer_member_id
          }
        }
      };

      this.technicalInfoService.apiCall(requestBody, ENDPOINTS.GET_ALL_API_INT_SETTINGS).subscribe(
        resp => {
          this.isLoading = false;
          if (resp) {
            let respdata = resp.result.data;
            this.overallData = respdata;

            // console.log(this.overallData, "respdata");

            this.ecomData = this.overallData[0].customer_technical_info.filter((item: any) => item.type == this.filterType);

            // console.log(this.ecomData, " this.ecomData")
          }
          resolve(resp);
        },
        err => {
          this.isLoading = false;
          // this.loaderService.emitComplete();
          if (err.error.statusCode === 403) {
            this.alertService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate([`/login`], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertService.error(err.error.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }

  viewDetails(id: number) {
    this.router.navigate(['/edit-tech-info', id])
  }

  // Newly updated for active/deactive purpose
  onToggleActive(event: Event, item: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    item.is_active = isChecked;
    const updatedData = {
      is_active: isChecked
    };
    const message = `${item.name} has been ${isChecked ? 'activated' : 'deactivated'} successfully.`;
    this.updateItemStatus(updatedData, item, message);
  }

  updateItemStatus(updatedData: any, item: any, message: string): void {
    const id = item.id;
    delete updatedData._id;
    delete updatedData.id;
    delete updatedData.created_on;
    delete updatedData.is_deleted;
    delete updatedData.modified_on;
    let createobj =
    {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "payload": {
        "integration_settings": updatedData
      },
      "extras": {
        "find": {
          "id": id
        }
      }
    };
    this.technicalInfoService.apiCall(createobj, ENDPOINTS.EDIT_APIINTEGRATION_SETTINGS).subscribe(
      resp => {
        if (resp.success == 1 && resp.status_code == 200) {
          this.alertService.success(message, this.options);
        }
        else if (resp.status_code == 201) {
          if (!updatedData.is_active) {
            item.is_active = true;
            this.alertService.error(resp.message, this.options);
          } else {
            this.alertService.success(message, this.options);
          }
        }
        else {
          item.is_active = !updatedData.is_active;
          this.alertService.error(resp.message, this.options);
        }
      },
      err => {
        item.is_active = !updatedData.is_active;
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options);
          this.router.navigate([`/login`], { skipLocationChange: false });
        } else if (err.error.message) {
          this.alertService.error(err.error.message, this.options);
        } else {
          this.alertService.error('Something bad happened. Please try again!', this.options);
        }
      }
    );
  }
  // ended
}

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
    console.log('Filter type changed:', this.filterType);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Reactive ID:', id);
      this.tech_info_id = Number(id);

    });
    console.log("tech_info_id",this.tech_info_id)
    if(this.tech_info_id!==undefined && this.tech_info_id!==0){
      console.log("11");
      this. ecomIntegrationSettingsGetbyId()

    }
    else{
       console.log("12");
      this.ecomIntegrationSettingsGetAll();


    }


  }
  ngOnChanges() {
    console.log('Tab selected:', this.filterType);
     this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Reactive ID:', id);
      this.tech_info_id = Number(id);

    });
  if(this.tech_info_id!==undefined && this.tech_info_id!==0){
     console.log("11");
      this. ecomIntegrationSettingsGetbyId()

    }
    else{
      console.log("12");
      this.ecomIntegrationSettingsGetAll();


    }
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

          if (resp) {
            let respdata = resp.result.data;
            // this.overallData = respdata.filter((item: any) => (item.customer_id == undefined));
            this.overallData = respdata.filter((item: any) => (item.customer_member_id == undefined)); //newly changed from customer_id to customer_member_id

            console.log(this.overallData, "respdata");

            this.ecomData = this.overallData.filter((item: any) => item.type == this.filterType);

            console.log(this.ecomData, " this.ecomData")











          }
        },
        err => {
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


    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
              // customer_id: this.tech_info_id
              customer_member_id: this.tech_info_id //newly changed from customer_id to customer_member_id
          }
        }
      };

      this.technicalInfoService.apiCall(requestBody, ENDPOINTS.GET_ALL_API_INT_SETTINGS).subscribe(
        resp => {

          if (resp) {
            let respdata = resp.result.data;
            this.overallData = respdata;

            console.log(this.overallData, "respdata");

            this.ecomData = this.overallData[0].customer_technical_info.filter((item: any) => item.type == this.filterType);

            console.log(this.ecomData, " this.ecomData")











          }
        },
        err => {
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
  onToggleActive(event: Event, item: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    const updatedData = {
      ...item,
      is_active: isChecked
    };

    // Call your update API here
    this.updateItemStatus(updatedData, updatedData.id);
  }
  updateItemStatus(updatedData: any, id: number): void {
    delete updatedData._id

    let createobj =
    {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "payload": {
        updatedData
      },
      "extras": {
        "find": {
          "id": id
        }
      }
    }

    this.technicalInfoService.apiCall(createobj, ENDPOINTS.EDIT_APIINTEGRATION_SETTINGS).subscribe(
      resp => {
        console.log("test", "123")
        if (resp) {

          this.router.navigate(['/tech-info-list'])







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

      }
    );
    // Replace with your actual API service
  }
}

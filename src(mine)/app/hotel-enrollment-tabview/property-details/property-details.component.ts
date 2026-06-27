import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HotelEnrollmentTabviewComponent } from '../hotel-enrollment-tabview.component';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { CustomValidators } from '../validators';
import { ENDPOINTS } from '../../app.config';
import { CheckoutApiService } from '../checkout.service';
import { LocalStorageService } from '../../auth-services/local-storage.service';


@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HotelEnrollmentTabviewComponent, AlertsComponent],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss'
})
export class PropertyDetailsComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  customerProprtyDetailsForm: FormGroup = new FormGroup({});
  hotelId: Number | null = null;
  countryDropdownList: any;
  customerId: string | null = null;
  orderData: any;
  memberId: Number | null = null;
  customerdata: any = {};
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  states: any;
  statesDropdownList: any;
  upsertData: any;
  constructor(

    private authTokenService: AuthTokenService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private checkoutApiService: CheckoutApiService,
    private localStorageService: LocalStorageService


  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url; // Get the current URL
        //console.log('Current URL:', currentUrl); // Debugging (Optional)

        // Enable showSidebar if URL contains "confirmation"
        this.isVisible = currentUrl.includes('confirmation')


        if (currentUrl.includes('confirmation')) {
          let nextTab = document.getElementById('profile-tab');
          if (nextTab) {
            (nextTab as HTMLAnchorElement).click();
          }


        }


      }
    });
  }
  ngOnInit(): void {
    this.countryDropdownList =
 [
    { "country": "Afghanistan", "code": "", "flag": "" },
    { "country": "Åland (Finland)", "code": "", "flag": "" },
    { "country": "Albania", "code": "", "flag": "" },
    { "country": "Algeria", "code": "", "flag": "" },
    { "country": "American Samoa (US)", "code": "", "flag": "" },
    { "country": "Andorra", "code": "", "flag": "" },
    { "country": "Angola", "code": "", "flag": "" },
    { "country": "Anguilla (BOT)", "code": "", "flag": "" },
    { "country": "Antigua and Barbuda", "code": "", "flag": "" },
    { "country": "Argentina", "code": "", "flag": "" },
    { "country": "Armenia", "code": "", "flag": "" },
    { "country": "Artsakh", "code": "", "flag": "" },
    { "country": "Aruba (Netherlands)", "code": "", "flag": "" },
    { "country": "Australia", "code": "", "flag": "" },
    { "country": "Austria", "code": "", "flag": "" },
    { "country": "Azerbaijan", "code": "", "flag": "" },
    { "country": "Bahamas", "code": "", "flag": "" },
    { "country": "Bahrain", "code": "", "flag": "" },
    { "country": "Bangladesh", "code": "", "flag": "" },
    { "country": "Barbados", "code": "", "flag": "" },
    { "country": "Belarus", "code": "", "flag": "" },
    { "country": "Belgium", "code": "", "flag": "" },
    { "country": "Belize", "code": "", "flag": "" },
    { "country": "Benin", "code": "", "flag": "" },
    { "country": "Bermuda (BOT)", "code": "", "flag": "" },
    { "country": "Bhutan", "code": "", "flag": "" },
    { "country": "Bolivia", "code": "", "flag": "" },
    { "country": "Bonaire (Netherlands)", "code": "", "flag": "" },
    { "country": "Bosnia and Herzegovina", "code": "", "flag": "" },
    { "country": "Botswana", "code": "", "flag": "" },
    { "country": "Brazil", "code": "", "flag": "" },
    { "country": "British Virgin Islands (BOT)", "code": "", "flag": "" },
    { "country": "Brunei", "code": "", "flag": "" },
    { "country": "Bulgaria", "code": "", "flag": "" },
    { "country": "Burkina Faso", "code": "", "flag": "" },
    { "country": "Burundi", "code": "", "flag": "" },
    { "country": "Cambodia", "code": "", "flag": "" },
    { "country": "Cameroon", "code": "", "flag": "" },
    { "country": "Canada", "code": "", "flag": "" },
    { "country": "Cape Verde", "code": "", "flag": "" },
    { "country": "Cayman Islands (BOT)", "code": "", "flag": "" },
    { "country": "Central African Republic", "code": "", "flag": "" },
    { "country": "Chad", "code": "", "flag": "" },
    { "country": "Chile", "code": "", "flag": "" },
    { "country": "China", "code": "", "flag": "" },
    { "country": "Christmas Island (Australia)", "code": "", "flag": "" },
    { "country": "Cocos (Keeling) Islands (Australia)", "code": "", "flag": "" },
    { "country": "Colombia", "code": "", "flag": "" },
    { "country": "Comoros", "code": "", "flag": "" },
    { "country": "Congo", "code": "", "flag": "" },
    { "country": "Cook Islands", "code": "", "flag": "" },
    { "country": "Costa Rica", "code": "", "flag": "" },
    { "country": "Croatia", "code": "", "flag": "" },
    { "country": "Cuba", "code": "", "flag": "" },
    { "country": "Curaçao (Netherlands)", "code": "", "flag": "" },
    { "country": "Cyprus", "code": "", "flag": "" },
    { "country": "Czech Republic", "code": "", "flag": "" },
    { "country": "Denmark", "code": "", "flag": "" },
    { "country": "Djibouti", "code": "", "flag": "" },
    { "country": "Dominica", "code": "", "flag": "" },
    { "country": "Dominican Republic", "code": "", "flag": "" },
    { "country": "DR Congo", "code": "", "flag": "" },
    { "country": "East Timor", "code": "", "flag": "" },
    { "country": "Ecuador", "code": "", "flag": "" },
    { "country": "Egypt", "code": "", "flag": "" },
    { "country": "El Salvador", "code": "", "flag": "" },
    { "country": "Equatorial Guinea", "code": "", "flag": "" },
    { "country": "Eritrea", "code": "", "flag": "" },
    { "country": "Estonia", "code": "", "flag": "" },
    { "country": "Eswatini", "code": "", "flag": "" },
    { "country": "Ethiopia", "code": "", "flag": "" },
    { "country": "Falkland Islands (BOT)", "code": "", "flag": "" },
    { "country": "Faroe Islands (Denmark)", "code": "", "flag": "" },
    { "country": "Fiji", "code": "", "flag": "" },
    { "country": "Finland", "code": "", "flag": "" },
    { "country": "France", "code": "", "flag": "" },
    { "country": "French Guiana (France)", "code": "", "flag": "" },
    { "country": "French Polynesia (France)", "code": "", "flag": "" },
    { "country": "Gabon", "code": "", "flag": "" },
    { "country": "Gambia", "code": "", "flag": "" },
    { "country": "Georgia", "code": "", "flag": "" },
    { "country": "Germany", "code": "", "flag": "" },
    { "country": "Ghana", "code": "", "flag": "" },
    { "country": "Gibraltar (BOT)", "code": "", "flag": "" },
    { "country": "Greece", "code": "", "flag": "" },
    { "country": "Greenland (Denmark)", "code": "", "flag": "" },
    { "country": "Grenada", "code": "", "flag": "" },
    { "country": "Guadeloupe (France)", "code": "", "flag": "" },
    { "country": "Guam (US)", "code": "", "flag": "" },
    { "country": "Guatemala", "code": "", "flag": "" },
    { "country": "Guernsey (Crown Dependency)", "code": "", "flag": "" },
    { "country": "Guinea", "code": "", "flag": "" },
    { "country": "Guinea-Bissau", "code": "", "flag": "" },
    { "country": "Guyana", "code": "", "flag": "" },
    { "country": "Haiti", "code": "", "flag": "" },
    { "country": "Honduras", "code": "", "flag": "" },
    { "country": "Hong Kong", "code": "", "flag": "" },
    { "country": "Hungary", "code": "", "flag": "" },
    { "country": "Iceland", "code": "", "flag": "" },
    { "country": "India", "code": "", "flag": "" },
    { "country": "Indonesia", "code": "", "flag": "" },
    { "country": "Iran", "code": "", "flag": "" },
    { "country": "Iraq", "code": "", "flag": "" },
    { "country": "Ireland", "code": "", "flag": "" },
    { "country": "Isle of Man (Crown Dependency)", "code": "", "flag": "" },
    { "country": "Israel", "code": "", "flag": "" },
    { "country": "Italy", "code": "", "flag": "" },
    { "country": "Ivory Coast", "code": "", "flag": "" },
    { "country": "Jamaica", "code": "", "flag": "" },
    { "country": "Japan", "code": "", "flag": "" },
    { "country": "Jersey (Crown Dependency)", "code": "", "flag": "" },
    { "country": "Jordan", "code": "", "flag": "" },
    { "country": "Kazakhstan", "code": "", "flag": "" },
    { "country": "Kenya", "code": "", "flag": "" },
    { "country": "Kiribati", "code": "", "flag": "" },
    { "country": "Kosovo", "code": "", "flag": "" },
    { "country": "Kuwait", "code": "", "flag": "" },
    { "country": "Kyrgyzstan", "code": "", "flag": "" },
    { "country": "Laos", "code": "", "flag": "" },
    { "country": "Latvia", "code": "", "flag": "" },
    { "country": "Lebanon", "code": "", "flag": "" },
    { "country": "Lesotho", "code": "", "flag": "" },
    { "country": "Liberia", "code": "", "flag": "" },
    { "country": "Libya", "code": "", "flag": "" },
    { "country": "Liechtenstein", "code": "", "flag": "" },
    { "country": "Lithuania", "code": "", "flag": "" },
    { "country": "Luxembourg", "code": "", "flag": "" },
    { "country": "Macau", "code": "", "flag": "" },
    { "country": "Madagascar", "code": "", "flag": "" },
    { "country": "Malawi", "code": "", "flag": "" },
    { "country": "Malaysia", "code": "", "flag": "" },
    { "country": "Maldives", "code": "", "flag": "" },
    { "country": "Mali", "code": "", "flag": "" },
    { "country": "Malta", "code": "", "flag": "" },
    { "country": "Marshall Islands", "code": "", "flag": "" },
    { "country": "Martinique (France)", "code": "", "flag": "" },
    { "country": "Mauritania", "code": "", "flag": "" },
    { "country": "Mauritius", "code": "", "flag": "" },
    { "country": "Mayotte (France)", "code": "", "flag": "" },
    { "country": "Mexico", "code": "", "flag": "" },
    { "country": "Micronesia", "code": "", "flag": "" },
    { "country": "Moldova", "code": "", "flag": "" },
    { "country": "Monaco", "code": "", "flag": "" },
    { "country": "Mongolia", "code": "", "flag": "" },
    { "country": "Montenegro", "code": "", "flag": "" },
    { "country": "Montserrat (BOT)", "code": "", "flag": "" },
    { "country": "Morocco", "code": "", "flag": "" },
    { "country": "Mozambique", "code": "", "flag": "" },
    { "country": "Myanmar", "code": "", "flag": "" },
    { "country": "Namibia", "code": "", "flag": "" },
    { "country": "Nauru", "code": "", "flag": "" },
    { "country": "Nepal", "code": "", "flag": "" },
    { "country": "Netherlands", "code": "", "flag": "" },
    { "country": "New Caledonia (France)", "code": "", "flag": "" },
    { "country": "New Zealand", "code": "", "flag": "" },
    { "country": "Nicaragua", "code": "", "flag": "" },
    { "country": "Niger", "code": "", "flag": "" },
    { "country": "Nigeria", "code": "", "flag": "" },
    { "country": "Niue", "code": "", "flag": "" },
    { "country": "Norfolk Island (Australia)", "code": "", "flag": "" },
    { "country": "North Korea", "code": "", "flag": "" },
    { "country": "North Macedonia", "code": "", "flag": "" },
    { "country": "Northern Cyprus", "code": "", "flag": "" },
    { "country": "Northern Mariana Islands (US)", "code": "", "flag": "" },
    { "country": "Norway", "code": "", "flag": "" },
    { "country": "Oman", "code": "", "flag": "" },
    { "country": "Pakistan", "code": "", "flag": "" },
    { "country": "Palau", "code": "", "flag": "" },
    { "country": "Palestine", "code": "", "flag": "" },
    { "country": "Panama", "code": "", "flag": "" },
    { "country": "Papua New Guinea", "code": "", "flag": "" },
    { "country": "Paraguay", "code": "", "flag": "" },
    { "country": "Peru", "code": "", "flag": "" },
    { "country": "Philippines", "code": "", "flag": "" },
    { "country": "Pitcairn Islands (BOT)", "code": "", "flag": "" },
    { "country": "Poland", "code": "", "flag": "" },
    { "country": "Portugal", "code": "", "flag": "" },
    { "country": "Puerto Rico (US)", "code": "", "flag": "" },
    { "country": "Qatar", "code": "", "flag": "" },
    { "country": "Réunion (France)", "code": "", "flag": "" },
    { "country": "Romania", "code": "", "flag": "" },
    { "country": "Russia", "code": "", "flag": "" },
    { "country": "Rwanda", "code": "", "flag": "" },
    { "country": "Saba (Netherlands)", "code": "", "flag": "" },
    { "country": "Saint Barthélemy (France)", "code": "", "flag": "" },
    { "country": "Saint Helena, Ascension and Tristan da Cunha (BOT)", "code": "", "flag": "" },
    { "country": "Saint Kitts and Nevis", "code": "", "flag": "" },
    { "country": "Saint Lucia", "code": "", "flag": "" },
    { "country": "Saint Martin (France)", "code": "", "flag": "" },
    { "country": "Saint Pierre and Miquelon (France)", "code": "", "flag": "" },
    { "country": "Saint Vincent and the Grenadines", "code": "", "flag": "" },
    { "country": "Samoa", "code": "", "flag": "" },
    { "country": "San Marino", "code": "", "flag": "" },
    { "country": "São Tomé and Príncipe", "code": "", "flag": "" },
    { "country": "Saudi Arabia", "code": "", "flag": "" },
    { "country": "Senegal", "code": "", "flag": "" },
    { "country": "Serbia", "code": "", "flag": "" },
    { "country": "Seychelles", "code": "", "flag": "" },
    { "country": "Sierra Leone", "code": "", "flag": "" },
    { "country": "Singapore", "code": "", "flag": "" },
    { "country": "Sint Eustatius (Netherlands)", "code": "", "flag": "" },
    { "country": "Sint Maarten (Netherlands)", "code": "", "flag": "" },
    { "country": "Slovakia", "code": "", "flag": "" },
    { "country": "Slovenia", "code": "", "flag": "" },
    { "country": "Solomon Islands", "code": "", "flag": "" },
    { "country": "Somalia", "code": "", "flag": "" },
    { "country": "South Africa", "code": "", "flag": "" },
    { "country": "South Korea", "code": "", "flag": "" },
    { "country": "South Sudan", "code": "", "flag": "" },
    { "country": "Spain", "code": "", "flag": "" },
    { "country": "Sri Lanka", "code": "", "flag": "" },
    { "country": "Sudan", "code": "", "flag": "" },
    { "country": "Suricountry", "code": "", "flag": "" },
    { "country": "Svalbard and Jan Mayen (Norway)", "code": "", "flag": "" },
    { "country": "Sweden", "code": "", "flag": "" },
    { "country": "Switzerland", "code": "", "flag": "" },
    { "country": "Syria", "code": "", "flag": "" },
    { "country": "Taiwan", "code": "", "flag": "" },
    { "country": "Tajikistan", "code": "", "flag": "" },
    { "country": "Tanzania", "code": "", "flag": "" },
    { "country": "Thailand", "code": "", "flag": "" },
    { "country": "Togo", "code": "", "flag": "" },
    { "country": "Tokelau (NZ)", "code": "", "flag": "" },
    { "country": "Tonga", "code": "", "flag": "" },
    { "country": "Transnistria", "code": "", "flag": "" },
    { "country": "Trinidad and Tobago", "code": "", "flag": "" },
    { "country": "Tunisia", "code": "", "flag": "" },
    { "country": "Turkey", "code": "", "flag": "" },
    { "country": "Turkmenistan", "code": "", "flag": "" },
    { "country": "Turks and Caicos Islands (BOT)", "code": "", "flag": "" },
    { "country": "Tuvalu", "code": "", "flag": "" },
    { "country": "U.S. Virgin Islands (US)", "code": "", "flag": "" },
    { "country": "Uganda", "code": "", "flag": "" },
    { "country": "Ukraine", "code": "", "flag": "" },
    { "country": "United Arab Emirates", "code": "", "flag": "" },
    { "country": "United Kingdom", "code": "", "flag": "" },
    { "country": "United States", "code": "", "flag": "" },
    { "country": "Uruguay", "code": "", "flag": "" },
    { "country": "Uzbekistan", "code": "", "flag": "" },
    { "country": "Vanuatu", "code": "", "flag": "" },
    { "country": "Vatican City", "code": "", "flag": "" },
    { "country": "Venezuela", "code": "", "flag": "" },
    { "country": "Vietnam", "code": "", "flag": "" },
    { "country": "Wallis and Futuna (France)", "code": "", "flag": "" },
    { "country": "Western Sahara", "code": "", "flag": "" },
    { "country": "Yemen", "code": "", "flag": "" }
];
 this.statesDropdownList = 
[
      { "state": "Andhra Pradesh", "code": "", "flag": "" },
      { "state": "Arunachal Pradesh", "code": "", "flag": "" },
      { "state": "Assam", "code": "", "flag": "" },
      { "state": "Bihar", "code": "", "flag": "" },
      { "state": "Chhattisgarh", "code": "", "flag": "" },
      { "state": "Goa", "code": "", "flag": "" },
      { "state": "Gujarat", "code": "", "flag": "" },
      { "state": "Haryana", "code": "", "flag": "" },
      { "state": "Himachal Pradesh", "code": "", "flag": "" },
      { "state": "Jharkhand", "code": "", "flag": "" },
      { "state": "Karnataka", "code": "", "flag": "" },
      { "state": "Kerala", "code": "", "flag": "" },
      { "state": "Madhya Pradesh", "code": "", "flag": "" },
      { "state": "Maharashtra", "code": "", "flag": "" },
      { "state": "Manipur", "code": "", "flag": "" },
      { "state": "Meghalaya", "code": "", "flag": "" },
      { "state": "Mizoram", "code": "", "flag": "" },
      { "state": "Nagaland", "code": "", "flag": "" },
      { "state": "Odisha", "code": "", "flag": "" },
      { "state": "Punjab", "code": "", "flag": "" },
      { "state": "Rajasthan", "code": "", "flag": "" },
      { "state": "Sikkim", "code": "", "flag": "" },
      { "state": "Tamil Nadu", "code": "", "flag": "" },
      { "state": "Telangana", "code": "", "flag": "" },
      { "state": "Tripura", "code": "", "flag": "" },
      { "state": "Uttar Pradesh", "code": "", "flag": "" },
      { "state": "Uttarakhand", "code": "", "flag": "" },
      { "state": "West Bengal", "code": "", "flag": "" }
 ];
 
    this.activatedRoute.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);
      //console.log('Hotel ID:', this.hotelId); // Debugging
    });
    this.executeFunctions();
    this.customerProprtyDetailsForm = new FormGroup({

      hotel_name: new FormControl('', Validators.required),
      contact_person: new FormControl('', Validators.required),
      designation: new FormControl('', Validators.required),
      primary_phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      secondary_phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      email: new FormControl('', [Validators.required, Validators.email]),
      brand: new FormControl('', Validators.required),
      other_brand_name:new FormControl(''),

      property_doorno: new FormControl('', Validators.required),
      property_address: new FormControl('', Validators.required),
      property_city: new FormControl('', Validators.required),
      property_state: new FormControl('', Validators.required),
      property_location: new FormControl('', [Validators.required,]),
      property_country: new FormControl('', Validators.required),
      property_pincode: new FormControl('', Validators.required),
      property_pan: new FormControl('', [Validators.required, CustomValidators.panValidator]),
      property_gst: new FormControl('', [Validators.required, CustomValidators.gstValidator]),
      property_size: new FormControl('', Validators.required),

    });
    if (this.hotelId != 0) {
      this.getCustomerById();
    }

    // this.getCountries();
    this.getCustomerDataAfterConfirmation();

    // Newly added code to disable the form
    this.customerProprtyDetailsForm.disable();

  }
  async getCustomerDataAfterConfirmation() {
    if (this.router.url.includes('confirmation')) {
      // this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer_id');
      this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer.id');
      //console.log('Customer ID:', this.customerId);
      this.hotelId = Number(this.customerId)
      this.executeFunctions().then(() => {
        this.getOrderData(Number(this.customerId))
      });

    }
  }
  onSubmit() {
    if (this.customerProprtyDetailsForm.valid) {
      //console.log("Form Submitted");
      this.customerUpdate();
    } else {
      //console.log("Form is invalid!",this.customerProprtyDetailsForm);


    }

  }
  async customerUpdate() {
    delete this.customerdata._id;
    //console.log(this.customerdata._id,this.customerdata,"test check ")
    let tempCustomerObject = {
      "contact_details": {
        hotel_name: this.customerProprtyDetailsForm.value.hotel_name,
        contact_person: this.customerProprtyDetailsForm.value.contact_person,
        designation: this.customerProprtyDetailsForm.value.designation,
        primary_phone_number: this.customerProprtyDetailsForm.value.primary_phone_number,
        secondary_phone_number: this.customerProprtyDetailsForm.value.secondary_phone_number,
        email: this.customerProprtyDetailsForm.value.email,
        brand: this.customerProprtyDetailsForm.value.brand,



      },
      "property_address": {
        property_doorno: this.customerProprtyDetailsForm.value.property_doorno,
        property_address: this.customerProprtyDetailsForm.value.property_address,
        property_city: this.customerProprtyDetailsForm.value.property_city,
        property_state: this.customerProprtyDetailsForm.value.property_state,
        property_location: this.customerProprtyDetailsForm.value.property_location,
        property_country: this.customerProprtyDetailsForm.value.property_country,
        property_pincode: this.customerProprtyDetailsForm.value.property_pincode,
        property_pan: this.customerProprtyDetailsForm.value.property_pan,
        property_gst: this.customerProprtyDetailsForm.value.property_gst,
        property_size: this.customerProprtyDetailsForm.value.property_size,

      }





    }
    this.customerdata["property_details"] = tempCustomerObject;
    this.customerdata["name"] = this.customerProprtyDetailsForm.value.hotel_name;




    //console.log(tempCustomerObject)
    //console.log( this.customerdata," this.customerdata")

    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: this.customerdata
      },
      extras: {
        find: {
          id: this.hotelId
        }
      }
    }
    //console.log("123")
    this.hotelenrollmenttabviewService.updateCustomer(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // //console.log(resp);
            this.hotelenrollmenttabviewService.clearAdminFormEvent();
            //console.log("alerttttt")
            this.alertService.success(resp.message, this.options);
            this.payNow();
            // setTimeout(() => {
            //   this.router.navigate([`/all-customers`], { skipLocationChange: false });
            // }, 1000);
            // this.router.navigate(['/all-customers'], { state: { result: resp.message }, relativeTo: this.activatedRoute, skipLocationChange: false });

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
        this.loaderService.emitComplete();
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
          this.loaderService.emitComplete();
          if (resp) {
            this.customerdata = resp.result.data[0];
            //console.log(this.customerdata, "RESPDATA");
            //console.log(Array.isArray(this.customerdata)); 
            resolve();  // Resolve promise when data is set
          }
        },
        err => {
          this.loaderService.emitComplete();
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

  setFormValues() {
    if (
      this.customerdata?.property_details?.contact_details &&
      this.customerdata?.property_details?.property_address
    ) {
      this.customerProprtyDetailsForm.patchValue({
        hotel_name: this.customerdata?.property_details?.contact_details?.hotel_name,
        contact_person: this.customerdata.property_details?.contact_details?.contact_person,
        designation: this.customerdata.property_details?.contact_details?.designation,
        primary_phone_number: this.customerdata.property_details?.contact_details?.primary_phone_number,
        secondary_phone_number: this.customerdata.property_details?.contact_details?.secondary_phone_number,
        email: this.customerdata.property_details.contact_details?.email,
        brand: this.customerdata.property_details.contact_details?.brand,


        property_doorno: this.customerdata.property_details.property_address?.property_doorno,
        property_address: this.customerdata.property_details.property_address?.property_address,
        property_city: this.customerdata.property_details.property_address?.property_city,
        property_country: this.customerdata?.property_details.property_address?.property_country,
        property_state: this.customerdata.property_details.property_address?.property_state,
        property_location: this.customerdata.property_details.property_address?.property_location,

        property_pincode: this.customerdata.property_details.property_address?.property_pincode,
        property_pan: this.customerdata.property_details.property_address?.property_pan,
        property_gst: this.customerdata.property_details.property_address?.property_gst,
        property_size: this.customerdata.property_details.property_address.property_size,
        other_brand_name:this.customerdata.property_details.contact_details?.other_brand_name ?? ''
      });

    }

  }
  async executeFunctions(): Promise<void> {
    this.getCustomerById()
      .then(() => {
        this.setFormValues() // Runs after data is fetched
      })
      .catch(error => {
        //console.error("Error fetching customer data:", error);
      });


  }

  getCountries() {
    // get country list
    this.hotelenrollmenttabviewService.getCountries().subscribe(
      resp => {
        this.countryDropdownList = resp.result;
        console.log(this.countryDropdownList,"countryDropdownList");
        if (this.customerdata?.registered_address?.country != undefined && this.customerdata.registered_address?.country != null) {
          this.getStateData()

        }
        // console.log(this.countryList);
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
          // this.alertService.error('Something bad happened while loading countries. Please try again!', this.options);
        }
      }
    )
  }
  getStateData() {
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === this.customerdata.registered_address?.country); if (selectedCountry) {
      //console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }

  }
  getStates(country_id: number) {

    let statesRequest = {
      "domain_name": this.authTokenService.getDomain(),
      "user_id": this.authTokenService.getUserId(),
      "extras": {
        "find": {
          "countryid": country_id
        },
        "pagination": false,
        "paginationDetails": {
          "limit": 0,
          "pageSize": 2
        },
        "sorting": true,
        "sortingDetails": {
          "sortfield": "",
          "sortorder": -1
        }
      }
    }
    this.hotelenrollmenttabviewService.getStatesById(statesRequest).subscribe(resp => {

      if (resp.success === 1) {

        this.states = resp.result

        let temArray: any = []

        //iterate through object
        Object.entries(this.states).forEach(([key, value]) => {
          temArray.push(value)
        })

        //flatten array
        this.statesDropdownList = Array.prototype.concat.apply([], temArray)
        //console.log( this.statesDropdownList," this.statesDropdownList")

        // //console.log(this.statesDropdownList)

      }
      else {
        this.states = []
      }

    }, err => {
      if (err.error.statusCode === 403) {
        this.alertService.error('Session Time Out! Please login Again', this.options)
        this.router.navigate([`/login`], { skipLocationChange: false });
      }
      else if (err.error.message) {
        this.alertService.error(err.error.message, this.options)
      }
      else {
        this.alertService.error('Something bad happened while loading customer group. Please try again!', this.options);
      }
      this.states = []
    })
  }



  // generateMemberID(orderAmount:number) {
  //   const today = new Date();

  //   // Format date as YYYYMMDD
  //   const year = today.getFullYear();
  //   const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  //   const day = String(today.getDate()).padStart(2, '0');

  //   // Generate a random 4-digit number
  //   const randomNum = Math.floor(1000 + Math.random() * 9000); 
  //   let start=''
  //   if(orderAmount==10000){
  //      start='B'

  //   }
  //   else if(orderAmount==20000){
  //        start='S'

  //   }
  //   else if(orderAmount==30000){
  //     start='G'


  //   }
  //   else if(orderAmount==40000){
  //     start='P'

  //   }


  //   // return `GE-${year}${month}${day}-${randomNum}`;
  //    return `${start}${this.customerdata.property_details.property_address.property_country.substring(0, 2).toUpperCase()}${this.customerdata.property_details.property_address.property_state.split(" ")
  //     .map((word: string) => word[0])
  //     .join("")
  //     .toUpperCase()}${this.customerdata.id.toString().padStart(5, "0")}`;
  // }


  async payNow() {
    let orderAmount = 10000;
    if (this.customerProprtyDetailsForm.value.property_size == "01-50 Rooms") {
      orderAmount = 10000;

    }
    if (this.customerProprtyDetailsForm.value.property_size == "51-101 Rooms") {
      orderAmount = 20000;


    }
    if (this.customerProprtyDetailsForm.value.property_size == "101-150 Rooms") {
      orderAmount = 30000;


    }
    if (this.customerProprtyDetailsForm.value.property_size == "50 and above Rooms") {
      orderAmount = 40000;


    }
    //console.log("this.custom data",this.customerdata);

    let endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
    let due_date = `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()}`; // Format as YYYY-MM-DD


    let orderData = {

      // "customer_id": this.customerdata.id,
      "customer_member_id": this.customerdata.id, //newly changed from customer_id to customer_member_id
      "status": "Awaiting Payment",
      "status_id": "1",
      "system_label": "Pending",
      "orderConfirmDate": new Date(),
      "subscription_end_date": due_date,
      "customer": {
        // "customer_id": this.customerdata.id,
        "customer_member_id": this.customerdata.id, //newly changed from customer_id to customer_member_id
        "customer_name": this.customerdata.first_name,
        "email": this.customerdata.email,
        "customer_type": "business customer",
        "phone_number": this.customerdata.phone_number,
        "address": this.customerdata.property_details.property_address.property_address,
        "brand": this.customerdata.property_details.contact_details.brand,
        "hotel_name": this.customerdata.property_details.contact_details.hotel_name,
        // "member_id":this.generateMemberID(orderAmount),  
        "property_size": this.customerdata.property_details.property_address.property_size,
        "is_email_opt_in": false
      },
      "delivery": {
        "outlet_id": "1",
        "outlet_name": "guest ezee",
        "email": this.customerdata.property_details.contact_details.email,

        "phone_number": this.customerdata.property_details.contact_details.primary_phone_number,
        "address": this.customerdata.property_details.property_address.property_address,

        "is_email_opt_in": false
      },


      "order_review": {
        "order_summary": {
          "sub_total": Number(orderAmount),

          "tax": 0.00,

          "order_total_amount": Number(orderAmount)

        }
      },





      "organization_id": 46,
      "store_id": 1,



      "created_by": this.localStorageService.get('UserId'),
      "is_deleted": false,
      "is_active": true,
      "modified_by": 16,

    }
    let requestData = {
      domain_name: this.authTokenService.getDomain(),
      user_id: 1,
      payload: {
        order_creation: orderData,
      },
      extras: {
        find: {
          id: ""
        }
      }
    }
    this.hotelenrollmenttabviewService.orderUpsert(requestData).subscribe(
      resp => {
        let res: any = resp;
        this.upsertData = res.result.data;
        //console.log(this.upsertData,'this.upsertData')

        if (res.success) {

          let user = {
            exist: false,
            password: false,
            email: false
          }
          this.getHdfcData();

        }
      })


  }

  getHdfcData() {
    //console.log("123")
    let hdfcData = {
      domain_name: this.authTokenService.getDomain(),
      oid: this.upsertData[0].id,
      amount: 1500,
    }
    this.checkoutApiService.getHDFClink(hdfcData).then(
      respData3 => {

        let res3: any = respData3;
        //console.log("123",res3)
        if (res3 !== false) {
          var form = document.createElement("form");
          var element1 = document.createElement("input");
          var element2 = document.createElement("input");
          form.method = "POST";
          form.action = res3.link;
          form.target = '_self'
          element1.value = res3.encrequest;
          element1.name = "encRequest";
          form.appendChild(element1);
          element2.value = res3.accesscode;
          element2.name = "access_code";
          form.appendChild(element2);
          document.body.appendChild(form);
          // this.loaderService.emitComplete();
          form.submit();
          // this.CheckoutLocalStorageService.removeOrderId();
          // window.open("https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=AVJT16KI07CA37TJAC&encRequest=0ae90ee5da7391dbfa55bccc526d8366460f50701e9fdcafbfee1a7ba1b4c9dffc7d4a40107a85e3e5c51598aa1803cc4eeace4bfb0f5f3730b1e8a908b69dadb7ee1a4666c3e16af8dcd5f51febbfc71a76b84f58735aea84ff54e8c49202a493724321f1172976a76798968d8a289e4534ebfffe0033bd8d3336113b548e47adb6ffc205e4056811ffe0309bb9ebbe2f05cbc0b36c3453a72cbb6ed7198348e40732622ecfc1586ceb0ede38a08e4bce9265b0d21677daeeefe23f1ca2da3a")
        }
      }
    );
  }

  onBack() {
    this.close.emit();
  }

  onContinue() {
    this.close.emit();
    this.router.navigate(["/hotel-list"]);
  }
  backtoForm() {
    // this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer_id');
    this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer.id');
    //console.log('Customer ID:', this.customerId);
    this.router.navigate(["/edit-new-hotel", this.customerId]);

  }
  cancel() {
    this.customerProprtyDetailsForm.reset();

  }
  onItemsSelect(item: any) {
    //console.log(item.target.value,"item")
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === item.target.value); if (selectedCountry) {
      //console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }



  }


  // getOrderData(customer_id: number) {
    getOrderData(customer_member_id: number) {
    //console.log("111")
    let formatJson = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          // customer_id: Number(customer_id),
          customer_member_id: Number(customer_member_id), //newly changed from customer_id to customer_member_id

          status: "Order Confirmed"

        }
      },
      "pagination": false,
      "paginationDetails": {
        "limit": 0,
        "pageSize": 10
      },
      "sorting": true,
      "sortingDetails": {
        "sortfield": "",
        "sortorder": -1
      }
    }



    this.hotelenrollmenttabviewService.orderDetailsGetById(formatJson).subscribe(
      resp => {
        if (resp.success === 1 && resp.status_code === 200 && resp.result.data.length > 0) {

          let response = resp.result.data;



          // let element = resp.result.data[response.length-1 ];
          let element = resp.result.data[0];
          this.orderData = element;
          this.memberId = element.customer_member_id != null ? element.customer_member_id : "sample id";
          // this.memberId = element.status;










        }




      }
    )
  }

  // Newly added function to navigate to the next tab
  nextTab() {
    let nextTab = document.getElementById('contact-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  previousTab() {
    let nextTab = document.getElementById('home-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

}

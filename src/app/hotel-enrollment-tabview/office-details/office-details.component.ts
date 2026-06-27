import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { CustomValidators, PINCODE_RULES } from '../validators';
import { LocalStorageService } from '../../auth-services/local-storage.service';
import { RoleService } from '../../user-access/role/role.service';
import { ENDPOINTS, DOMAIN_NAME } from '../../app.config';
import { COUNTRY_STATES, CountryState } from '../../shared/constants/countries';


@Component({
  selector: 'app-office-details',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AlertsComponent],
  templateUrl: './office-details.component.html',
  styleUrl: './office-details.component.scss'
})
export class OfficeDetailsComponent implements OnInit {
  customerForm: FormGroup = new FormGroup({});
  hotelId: Number | null = null;
  countryDropdownList: any = [];
  states: any;
  statesDropdownList: any = [];
  customerdata: any = {};
  // Newly added: flag to detect view-only mode
  isViewMode: boolean = false;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  taxSectionTitle = '';
  taxField1Label = '';
  taxField2Label = '';
  taxField1Key = '';
  taxField2Key = '';
  showTaxSection = false;
  maxPincodeLength = 10;
  isInitialLoad = false;

  get taxControl1(): FormControl {
    return this.customerForm.get(this.taxField1Key) as FormControl;
  }

  get taxControl2(): FormControl {
    return this.customerForm.get(this.taxField2Key) as FormControl;
  }
  constructor(

    private authTokenService: AuthTokenService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private localStorageService: LocalStorageService,
    private roleService: RoleService,


  ) { }


  ngOnInit(): void {
    //      this.countryDropdownList = [
    //     { "country": "Afghanistan", "code": "", "flag": "" },
    //     { "country": "Åland (Finland)", "code": "", "flag": "" },
    //     { "country": "Albania", "code": "", "flag": "" },
    //     { "country": "Algeria", "code": "", "flag": "" },
    //     { "country": "American Samoa (US)", "code": "", "flag": "" },
    //     { "country": "Andorra", "code": "", "flag": "" },
    //     { "country": "Angola", "code": "", "flag": "" },
    //     { "country": "Anguilla (BOT)", "code": "", "flag": "" },
    //     { "country": "Antigua and Barbuda", "code": "", "flag": "" },
    //     { "country": "Argentina", "code": "", "flag": "" },
    //     { "country": "Armenia", "code": "", "flag": "" },
    //     { "country": "Artsakh", "code": "", "flag": "" },
    //     { "country": "Aruba (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Australia", "code": "", "flag": "" },
    //     { "country": "Austria", "code": "", "flag": "" },
    //     { "country": "Azerbaijan", "code": "", "flag": "" },
    //     { "country": "Bahamas", "code": "", "flag": "" },
    //     { "country": "Bahrain", "code": "", "flag": "" },
    //     { "country": "Bangladesh", "code": "", "flag": "" },
    //     { "country": "Barbados", "code": "", "flag": "" },
    //     { "country": "Belarus", "code": "", "flag": "" },
    //     { "country": "Belgium", "code": "", "flag": "" },
    //     { "country": "Belize", "code": "", "flag": "" },
    //     { "country": "Benin", "code": "", "flag": "" },
    //     { "country": "Bermuda (BOT)", "code": "", "flag": "" },
    //     { "country": "Bhutan", "code": "", "flag": "" },
    //     { "country": "Bolivia", "code": "", "flag": "" },
    //     { "country": "Bonaire (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Bosnia and Herzegovina", "code": "", "flag": "" },
    //     { "country": "Botswana", "code": "", "flag": "" },
    //     { "country": "Brazil", "code": "", "flag": "" },
    //     { "country": "British Virgin Islands (BOT)", "code": "", "flag": "" },
    //     { "country": "Brunei", "code": "", "flag": "" },
    //     { "country": "Bulgaria", "code": "", "flag": "" },
    //     { "country": "Burkina Faso", "code": "", "flag": "" },
    //     { "country": "Burundi", "code": "", "flag": "" },
    //     { "country": "Cambodia", "code": "", "flag": "" },
    //     { "country": "Cameroon", "code": "", "flag": "" },
    //     { "country": "Canada", "code": "", "flag": "" },
    //     { "country": "Cape Verde", "code": "", "flag": "" },
    //     { "country": "Cayman Islands (BOT)", "code": "", "flag": "" },
    //     { "country": "Central African Republic", "code": "", "flag": "" },
    //     { "country": "Chad", "code": "", "flag": "" },
    //     { "country": "Chile", "code": "", "flag": "" },
    //     { "country": "China", "code": "", "flag": "" },
    //     { "country": "Christmas Island (Australia)", "code": "", "flag": "" },
    //     { "country": "Cocos (Keeling) Islands (Australia)", "code": "", "flag": "" },
    //     { "country": "Colombia", "code": "", "flag": "" },
    //     { "country": "Comoros", "code": "", "flag": "" },
    //     { "country": "Congo", "code": "", "flag": "" },
    //     { "country": "Cook Islands", "code": "", "flag": "" },
    //     { "country": "Costa Rica", "code": "", "flag": "" },
    //     { "country": "Croatia", "code": "", "flag": "" },
    //     { "country": "Cuba", "code": "", "flag": "" },
    //     { "country": "Curaçao (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Cyprus", "code": "", "flag": "" },
    //     { "country": "Czech Republic", "code": "", "flag": "" },
    //     { "country": "Denmark", "code": "", "flag": "" },
    //     { "country": "Djibouti", "code": "", "flag": "" },
    //     { "country": "Dominica", "code": "", "flag": "" },
    //     { "country": "Dominican Republic", "code": "", "flag": "" },
    //     { "country": "DR Congo", "code": "", "flag": "" },
    //     { "country": "East Timor", "code": "", "flag": "" },
    //     { "country": "Ecuador", "code": "", "flag": "" },
    //     { "country": "Egypt", "code": "", "flag": "" },
    //     { "country": "El Salvador", "code": "", "flag": "" },
    //     { "country": "Equatorial Guinea", "code": "", "flag": "" },
    //     { "country": "Eritrea", "code": "", "flag": "" },
    //     { "country": "Estonia", "code": "", "flag": "" },
    //     { "country": "Eswatini", "code": "", "flag": "" },
    //     { "country": "Ethiopia", "code": "", "flag": "" },
    //     { "country": "Falkland Islands (BOT)", "code": "", "flag": "" },
    //     { "country": "Faroe Islands (Denmark)", "code": "", "flag": "" },
    //     { "country": "Fiji", "code": "", "flag": "" },
    //     { "country": "Finland", "code": "", "flag": "" },
    //     { "country": "France", "code": "", "flag": "" },
    //     { "country": "French Guiana (France)", "code": "", "flag": "" },
    //     { "country": "French Polynesia (France)", "code": "", "flag": "" },
    //     { "country": "Gabon", "code": "", "flag": "" },
    //     { "country": "Gambia", "code": "", "flag": "" },
    //     { "country": "Georgia", "code": "", "flag": "" },
    //     { "country": "Germany", "code": "", "flag": "" },
    //     { "country": "Ghana", "code": "", "flag": "" },
    //     { "country": "Gibraltar (BOT)", "code": "", "flag": "" },
    //     { "country": "Greece", "code": "", "flag": "" },
    //     { "country": "Greenland (Denmark)", "code": "", "flag": "" },
    //     { "country": "Grenada", "code": "", "flag": "" },
    //     { "country": "Guadeloupe (France)", "code": "", "flag": "" },
    //     { "country": "Guam (US)", "code": "", "flag": "" },
    //     { "country": "Guatemala", "code": "", "flag": "" },
    //     { "country": "Guernsey (Crown Dependency)", "code": "", "flag": "" },
    //     { "country": "Guinea", "code": "", "flag": "" },
    //     { "country": "Guinea-Bissau", "code": "", "flag": "" },
    //     { "country": "Guyana", "code": "", "flag": "" },
    //     { "country": "Haiti", "code": "", "flag": "" },
    //     { "country": "Honduras", "code": "", "flag": "" },
    //     { "country": "Hong Kong", "code": "", "flag": "" },
    //     { "country": "Hungary", "code": "", "flag": "" },
    //     { "country": "Iceland", "code": "", "flag": "" },
    //     { "country": "India", "code": "", "flag": "" },
    //     { "country": "Indonesia", "code": "", "flag": "" },
    //     { "country": "Iran", "code": "", "flag": "" },
    //     { "country": "Iraq", "code": "", "flag": "" },
    //     { "country": "Ireland", "code": "", "flag": "" },
    //     { "country": "Isle of Man (Crown Dependency)", "code": "", "flag": "" },
    //     { "country": "Israel", "code": "", "flag": "" },
    //     { "country": "Italy", "code": "", "flag": "" },
    //     { "country": "Ivory Coast", "code": "", "flag": "" },
    //     { "country": "Jamaica", "code": "", "flag": "" },
    //     { "country": "Japan", "code": "", "flag": "" },
    //     { "country": "Jersey (Crown Dependency)", "code": "", "flag": "" },
    //     { "country": "Jordan", "code": "", "flag": "" },
    //     { "country": "Kazakhstan", "code": "", "flag": "" },
    //     { "country": "Kenya", "code": "", "flag": "" },
    //     { "country": "Kiribati", "code": "", "flag": "" },
    //     { "country": "Kosovo", "code": "", "flag": "" },
    //     { "country": "Kuwait", "code": "", "flag": "" },
    //     { "country": "Kyrgyzstan", "code": "", "flag": "" },
    //     { "country": "Laos", "code": "", "flag": "" },
    //     { "country": "Latvia", "code": "", "flag": "" },
    //     { "country": "Lebanon", "code": "", "flag": "" },
    //     { "country": "Lesotho", "code": "", "flag": "" },
    //     { "country": "Liberia", "code": "", "flag": "" },
    //     { "country": "Libya", "code": "", "flag": "" },
    //     { "country": "Liechtenstein", "code": "", "flag": "" },
    //     { "country": "Lithuania", "code": "", "flag": "" },
    //     { "country": "Luxembourg", "code": "", "flag": "" },
    //     { "country": "Macau", "code": "", "flag": "" },
    //     { "country": "Madagascar", "code": "", "flag": "" },
    //     { "country": "Malawi", "code": "", "flag": "" },
    //     { "country": "Malaysia", "code": "", "flag": "" },
    //     { "country": "Maldives", "code": "", "flag": "" },
    //     { "country": "Mali", "code": "", "flag": "" },
    //     { "country": "Malta", "code": "", "flag": "" },
    //     { "country": "Marshall Islands", "code": "", "flag": "" },
    //     { "country": "Martinique (France)", "code": "", "flag": "" },
    //     { "country": "Mauritania", "code": "", "flag": "" },
    //     { "country": "Mauritius", "code": "", "flag": "" },
    //     { "country": "Mayotte (France)", "code": "", "flag": "" },
    //     { "country": "Mexico", "code": "", "flag": "" },
    //     { "country": "Micronesia", "code": "", "flag": "" },
    //     { "country": "Moldova", "code": "", "flag": "" },
    //     { "country": "Monaco", "code": "", "flag": "" },
    //     { "country": "Mongolia", "code": "", "flag": "" },
    //     { "country": "Montenegro", "code": "", "flag": "" },
    //     { "country": "Montserrat (BOT)", "code": "", "flag": "" },
    //     { "country": "Morocco", "code": "", "flag": "" },
    //     { "country": "Mozambique", "code": "", "flag": "" },
    //     { "country": "Myanmar", "code": "", "flag": "" },
    //     { "country": "Namibia", "code": "", "flag": "" },
    //     { "country": "Nauru", "code": "", "flag": "" },
    //     { "country": "Nepal", "code": "", "flag": "" },
    //     { "country": "Netherlands", "code": "", "flag": "" },
    //     { "country": "New Caledonia (France)", "code": "", "flag": "" },
    //     { "country": "New Zealand", "code": "", "flag": "" },
    //     { "country": "Nicaragua", "code": "", "flag": "" },
    //     { "country": "Niger", "code": "", "flag": "" },
    //     { "country": "Nigeria", "code": "", "flag": "" },
    //     { "country": "Niue", "code": "", "flag": "" },
    //     { "country": "Norfolk Island (Australia)", "code": "", "flag": "" },
    //     { "country": "North Korea", "code": "", "flag": "" },
    //     { "country": "North Macedonia", "code": "", "flag": "" },
    //     { "country": "Northern Cyprus", "code": "", "flag": "" },
    //     { "country": "Northern Mariana Islands (US)", "code": "", "flag": "" },
    //     { "country": "Norway", "code": "", "flag": "" },
    //     { "country": "Oman", "code": "", "flag": "" },
    //     { "country": "Pakistan", "code": "", "flag": "" },
    //     { "country": "Palau", "code": "", "flag": "" },
    //     { "country": "Palestine", "code": "", "flag": "" },
    //     { "country": "Panama", "code": "", "flag": "" },
    //     { "country": "Papua New Guinea", "code": "", "flag": "" },
    //     { "country": "Paraguay", "code": "", "flag": "" },
    //     { "country": "Peru", "code": "", "flag": "" },
    //     { "country": "Philippines", "code": "", "flag": "" },
    //     { "country": "Pitcairn Islands (BOT)", "code": "", "flag": "" },
    //     { "country": "Poland", "code": "", "flag": "" },
    //     { "country": "Portugal", "code": "", "flag": "" },
    //     { "country": "Puerto Rico (US)", "code": "", "flag": "" },
    //     { "country": "Qatar", "code": "", "flag": "" },
    //     { "country": "Réunion (France)", "code": "", "flag": "" },
    //     { "country": "Romania", "code": "", "flag": "" },
    //     { "country": "Russia", "code": "", "flag": "" },
    //     { "country": "Rwanda", "code": "", "flag": "" },
    //     { "country": "Saba (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Saint Barthélemy (France)", "code": "", "flag": "" },
    //     { "country": "Saint Helena, Ascension and Tristan da Cunha (BOT)", "code": "", "flag": "" },
    //     { "country": "Saint Kitts and Nevis", "code": "", "flag": "" },
    //     { "country": "Saint Lucia", "code": "", "flag": "" },
    //     { "country": "Saint Martin (France)", "code": "", "flag": "" },
    //     { "country": "Saint Pierre and Miquelon (France)", "code": "", "flag": "" },
    //     { "country": "Saint Vincent and the Grenadines", "code": "", "flag": "" },
    //     { "country": "Samoa", "code": "", "flag": "" },
    //     { "country": "San Marino", "code": "", "flag": "" },
    //     { "country": "São Tomé and Príncipe", "code": "", "flag": "" },
    //     { "country": "Saudi Arabia", "code": "", "flag": "" },
    //     { "country": "Senegal", "code": "", "flag": "" },
    //     { "country": "Serbia", "code": "", "flag": "" },
    //     { "country": "Seychelles", "code": "", "flag": "" },
    //     { "country": "Sierra Leone", "code": "", "flag": "" },
    //     { "country": "Singapore", "code": "", "flag": "" },
    //     { "country": "Sint Eustatius (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Sint Maarten (Netherlands)", "code": "", "flag": "" },
    //     { "country": "Slovakia", "code": "", "flag": "" },
    //     { "country": "Slovenia", "code": "", "flag": "" },
    //     { "country": "Solomon Islands", "code": "", "flag": "" },
    //     { "country": "Somalia", "code": "", "flag": "" },
    //     { "country": "South Africa", "code": "", "flag": "" },
    //     { "country": "South Korea", "code": "", "flag": "" },
    //     { "country": "South Sudan", "code": "", "flag": "" },
    //     { "country": "Spain", "code": "", "flag": "" },
    //     { "country": "Sri Lanka", "code": "", "flag": "" },
    //     { "country": "Sudan", "code": "", "flag": "" },
    //     { "country": "Suricountry", "code": "", "flag": "" },
    //     { "country": "Svalbard and Jan Mayen (Norway)", "code": "", "flag": "" },
    //     { "country": "Sweden", "code": "", "flag": "" },
    //     { "country": "Switzerland", "code": "", "flag": "" },
    //     { "country": "Syria", "code": "", "flag": "" },
    //     { "country": "Taiwan", "code": "", "flag": "" },
    //     { "country": "Tajikistan", "code": "", "flag": "" },
    //     { "country": "Tanzania", "code": "", "flag": "" },
    //     { "country": "Thailand", "code": "", "flag": "" },
    //     { "country": "Togo", "code": "", "flag": "" },
    //     { "country": "Tokelau (NZ)", "code": "", "flag": "" },
    //     { "country": "Tonga", "code": "", "flag": "" },
    //     { "country": "Transnistria", "code": "", "flag": "" },
    //     { "country": "Trinidad and Tobago", "code": "", "flag": "" },
    //     { "country": "Tunisia", "code": "", "flag": "" },
    //     { "country": "Turkey", "code": "", "flag": "" },
    //     { "country": "Turkmenistan", "code": "", "flag": "" },
    //     { "country": "Turks and Caicos Islands (BOT)", "code": "", "flag": "" },
    //     { "country": "Tuvalu", "code": "", "flag": "" },
    //     { "country": "U.S. Virgin Islands (US)", "code": "", "flag": "" },
    //     { "country": "Uganda", "code": "", "flag": "" },
    //     { "country": "Ukraine", "code": "", "flag": "" },
    //     { "country": "United Arab Emirates", "code": "", "flag": "" },
    //     { "country": "United Kingdom", "code": "", "flag": "" },
    //     { "country": "United States", "code": "", "flag": "" },
    //     { "country": "Uruguay", "code": "", "flag": "" },
    //     { "country": "Uzbekistan", "code": "", "flag": "" },
    //     { "country": "Vanuatu", "code": "", "flag": "" },
    //     { "country": "Vatican City", "code": "", "flag": "" },
    //     { "country": "Venezuela", "code": "", "flag": "" },
    //     { "country": "Vietnam", "code": "", "flag": "" },
    //     { "country": "Wallis and Futuna (France)", "code": "", "flag": "" },
    //     { "country": "Western Sahara", "code": "", "flag": "" },
    //     { "country": "Yemen", "code": "", "flag": "" }
    // ];
    //  this.statesDropdownList = 
    // [
    //       { "state": "Andhra Pradesh", "code": "", "flag": "" },
    //       { "state": "Arunachal Pradesh", "code": "", "flag": "" },
    //       { "state": "Assam", "code": "", "flag": "" },
    //       { "state": "Bihar", "code": "", "flag": "" },
    //       { "state": "Chhattisgarh", "code": "", "flag": "" },
    //       { "state": "Goa", "code": "", "flag": "" },
    //       { "state": "Gujarat", "code": "", "flag": "" },
    //       { "state": "Haryana", "code": "", "flag": "" },
    //       { "state": "Himachal Pradesh", "code": "", "flag": "" },
    //       { "state": "Jharkhand", "code": "", "flag": "" },
    //       { "state": "Karnataka", "code": "", "flag": "" },
    //       { "state": "Kerala", "code": "", "flag": "" },
    //       { "state": "Madhya Pradesh", "code": "", "flag": "" },
    //       { "state": "Maharashtra", "code": "", "flag": "" },
    //       { "state": "Manipur", "code": "", "flag": "" },
    //       { "state": "Meghalaya", "code": "", "flag": "" },
    //       { "state": "Mizoram", "code": "", "flag": "" },
    //       { "state": "Nagaland", "code": "", "flag": "" },
    //       { "state": "Odisha", "code": "", "flag": "" },
    //       { "state": "Punjab", "code": "", "flag": "" },
    //       { "state": "Rajasthan", "code": "", "flag": "" },
    //       { "state": "Sikkim", "code": "", "flag": "" },
    //       { "state": "Tamil Nadu", "code": "", "flag": "" },
    //       { "state": "Telangana", "code": "", "flag": "" },
    //       { "state": "Tripura", "code": "", "flag": "" },
    //       { "state": "Uttar Pradesh", "code": "", "flag": "" },
    //       { "state": "Uttarakhand", "code": "", "flag": "" },
    //       { "state": "West Bengal", "code": "", "flag": "" }
    //     ];
    this.customerForm = new FormGroup({
      first_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      last_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      designation: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      phone_number: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      email: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/)]),
      gender: new FormControl('', Validators.required),

      sec_first_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      sec_last_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      sec_designation: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      sec_phone_number: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      sec_email: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/)]),
      sec_gender: new FormControl('', Validators.required),
      company_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      door_no: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      address: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      city: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      state: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      pincode: new FormControl('', [Validators.required, CustomValidators.dynamicPincodeValidator()]),

      is_review_emails: new FormControl(false),
      is_password_reset_next_login: new FormControl(false),
      store_credit: new FormControl(0),
      notes: new FormControl(''),
      has_also_subscribed: new FormControl(false),
      subscription_source: new FormControl(''),
      language_code: new FormControl(''),
      token: new FormControl(''),
      is_safe: new FormControl(false),
      is_active: new FormControl(false)
    });


    this.activatedRoute.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);
      //console.log('Hotel ID:', this.hotelId); // Debugging
    });

    if (this.hotelId != 0) {
      this.executeFunctions();
      // this.getCountries();


    }
    else {
      // this.getCountries();
    }

    // Newly added code to disable the form 
    // this.customerForm.disable(); 

    // Newly added: detect view-only mode (hotel-preview route)
    this.isViewMode = this.router.url.includes('hotel-preview');

    // Newly added to get countries data
    // this.getCountries();

    // Initialize countries list from the shared constant
    this.countryDropdownList = COUNTRY_STATES;
    this.statesDropdownList = [];

    // Disable state initially
    this.customerForm.get('state')?.disable();

    // Listen to changes on the country select dropdown
    this.customerForm.get('country')?.valueChanges.subscribe((selectedCountryName) => {
      if (selectedCountryName) {
        // Find the matching country object
        const selectedCountry = COUNTRY_STATES.find(
          (c) => c.country === selectedCountryName
        );

        if (selectedCountry) {
          // The template expects objects with a 'state' property
          this.statesDropdownList = selectedCountry.states.map(s => ({ state: s, code: '', flag: '' }));
          if (this.customerForm.disabled || this.isViewMode) {
            this.customerForm.get('state')?.disable();
          } else {
            this.customerForm.get('state')?.enable();
          }

          // Reset the state value whenever the country changes
          if (!this.isInitialLoad && !this.customerForm.get('country')?.disabled) {
            const stateCtrl = this.customerForm.get('state');
            if (stateCtrl) {
              stateCtrl.setValue('');
              const selectedCountryObj = COUNTRY_STATES.find((c) => c.country === selectedCountryName);
              if (selectedCountryObj && !stateCtrl.disabled) {
                stateCtrl.markAsTouched();
              }
            }
          }
        } else {
          this.statesDropdownList = [];
          this.customerForm.get('state')?.disable();
          if (!this.isInitialLoad && !this.customerForm.get('country')?.disabled) {
            this.customerForm.get('state')?.setValue('');
          }
        }
      } else {
        this.statesDropdownList = [];
        this.customerForm.get('state')?.disable();
        if (!this.isInitialLoad && !this.customerForm.get('country')?.disabled) {
          this.customerForm.get('state')?.setValue('');
        }
      }

      // Re-validate pincode when country changes
      const pincodeCtrl = this.customerForm.get('pincode');
      const rule = PINCODE_RULES[selectedCountryName || 'default'] || PINCODE_RULES['default'];
      this.maxPincodeLength = rule.maxLength;
      if (pincodeCtrl) {
        pincodeCtrl.updateValueAndValidity();
        if (!this.isInitialLoad && pincodeCtrl.value) {
          pincodeCtrl.markAsTouched();
        }
      }

      if (!this.isInitialLoad) {
        this.onCountryOrStateChange(selectedCountryName, this.customerForm.get('state')?.value);
      }
    });

    // Listen to changes on the state select dropdown
    this.customerForm.get('state')?.valueChanges.subscribe((selectedStateName) => {
      if (!this.isInitialLoad) {
        this.onCountryOrStateChange(this.customerForm.get('country')?.value, selectedStateName);
      }
    });

  }

  readFormData() {
    return {
      name: this.customerForm.value?.name || "",
      last_name: this.customerForm.value?.last_name || "",
      company_name: this.customerForm.value?.company_name || "",
      outlet_id: this.customerForm.value?.outlet_id || "",
      outlet_name: this.customerForm.value?.outlet_name || "",
      email: this.customerForm.value?.email || "",
      phone_number: this.customerForm.value?.phone_number || "",
      mobile_number: this.customerForm.value?.mobile_number || "",
      customer_group: this.customerForm.value?.customer_group || "",
      customer_type: this.customerForm.value?.customer_type || "",
      ie_code: this.customerForm.value?.ie_code || "",
      joined_date: this.customerForm.value?.joined_date || "",
      fob_value: this.customerForm.value?.fob_value || "",
      status: this.customerForm.value?.status || "",
      vat_number: this.customerForm.value?.vat_number || "",
      gst: this.customerForm.value?.gst || "",
      cin: this.customerForm.value?.cin || "",
      tin: this.customerForm.value?.tin || "",
      is_review_emails: this.customerForm.value?.is_review_emails || false,
      is_password_reset_next_login: this.customerForm.value?.is_password_reset_next_login || false,
      store_credit: Number(this.customerForm.value?.store_credit) || 0,
      notes: this.customerForm.value?.notes || "",
      has_also_subscribed: this.customerForm.value?.has_also_subscribed || false,
      subscription_source: this.customerForm.value?.subscription_source || "",
      language_code: this.customerForm.value?.language_code || "",
      token: this.customerForm.value?.token || "",
      is_safe: this.customerForm.value?.is_safe || false,
      is_active: this.customerForm.value?.is_active || false
    };
  }
  async onSubmit() {
    if (this.customerForm.valid) {
      //console.log("Form Submitted");
      if (this.hotelId == 0) {
        try {
          await this.customerCreate().then(() => {
            this.afterCustomerCreate();   // Now customerdata.id will be available

          });  // ✅ Wait until HTTP response comes back

        } catch (err) {
          //console.error("Customer creation failed:", err);
        }
      }
      else {
        this.customerUpdate();
      }

    } else {
      //console.log("Form is invalid!");
    }
  }

  async customerCreate(): Promise<void> {
    return new Promise((resolve, reject) => {
      let customerObject = {
        first_name: this.customerForm.value.first_name,
        last_name: this.customerForm.value.last_name,
        designation: this.customerForm.value.designation,
        phone_number: this.customerForm.value.phone_number,
        email: this.customerForm.value.email,
        primary_email: this.customerForm.value.email,
        gender: this.customerForm.value.gender,
        sec_first_name: this.customerForm.value.sec_first_name,
        sec_last_name: this.customerForm.value.sec_last_name,
        sec_designation: this.customerForm.value.sec_designation,
        sec_phone_number: this.customerForm.value.sec_phone_number,
        sec_email: this.customerForm.value.sec_email,
        sec_gender: this.customerForm.value.sec_gender,
        status: "pending",
        is_active: true,
        send_welcome_email: false,
        send_welcome_sms: false,
        registered_address: {
          company_name: this.customerForm.value.company_name,
          door_no: this.customerForm.value.door_no,
          address: this.customerForm.value.address,
          city: this.customerForm.value.city,
          state: this.customerForm.value.state,
          country: this.customerForm.value.country,
          pincode: this.customerForm.value.pincode,
          ...(this.customerForm.value.country === 'India' ? {
            pan_no: this.customerForm.value.pan_no,
            gst_no: this.customerForm.value.gst_no
          } : {
            vat_no: this.customerForm.value.vat_no,
            tin_no: this.customerForm.value.tin_no
          })
        },
        property_details: {
          property_address: {
            property_address: "",
            property_city: "Chennai",
            property_country: "India",
            property_doorno: "",
            property_gst: "",
            property_location: "",
            property_pan: "",
            property_size: "01-50 Rooms",
            property_state: "Tamil Nadu",
          }
        },

        is_office_details_exists: true,
      }
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          customer_creation: customerObject
        }
      };
      this.hotelenrollmenttabviewService.addCustomer(requestBody).subscribe(
        async resp => {
          this.loaderService.emitComplete();
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
              // //console.log(resp);
              this.hotelenrollmenttabviewService.clearAdminFormEvent();
              this.alertService.success(resp.message, this.options);
              this.customerdata = resp.result.data[0];
              this.hotelId = this.customerdata.id; // Update hotelId for subsequent calls

              //role creation for hotel user
              if (this.customerdata.customer_member_id) {
                try {
                  // 1. Get latest customer details
                  await this.getCustomerById()
                  // Create email for that customer
                  // const email = this.customerForm.value?.email;
                  // 2. Create Admin role for that customer
                  const createdRole = await this.createAdminRole(this.customerdata);
                  console.log('Role Created Successfully:', createdRole);
                  if (createdRole) {
                    // After fetching customer details, load role info similar to sign-in
                    const role_id = createdRole.id;
                    const role_name = createdRole.name;
                    // 3. Update customer with role_id & role_name
                    const roleUpdated = await this.updateCustomerRole(this.customerdata.id, role_id, role_name);
                    const customerRoleId = role_id;
                    this.localStorageService.set('roleId', customerRoleId);
                    this.localStorageService.set('roleName', role_name);
                    if (customerRoleId !== null && customerRoleId !== undefined && customerRoleId !== '' && customerRoleId !== 'undefined' && customerRoleId !== 'null') {
                      this.getRoleById(role_id);
                    }
                    if (roleUpdated) {
                      this.sendMessage(this.customerdata);
                    }
                  }
                } catch (err) {
                  console.error('Error during role creation:', err);
                }
                this.localStorageService.set('MemberId', this.customerdata.customer_member_id);
                console.log("MemberId", this.customerdata.customer_member_id);
              }
              //console.log( this.customerdata,"cst");
              this.router.navigate(["/edit-new-hotel", this.customerdata.id]).then(() => {

                let nextTab = document.getElementById('property-tab');
                if (nextTab) {
                  (nextTab as HTMLAnchorElement).click();
                }
              })
              // this.afterCustomerCreate();

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

    })
  }

  async customerUpdate() {
    this.customerdata.first_name = this.customerForm.value.first_name,
      this.customerdata.last_name = this.customerForm.value.last_name,
      this.customerdata.designation = this.customerForm.value.designation,
      this.customerdata.phone_number = this.customerForm.value.phone_number,
      this.customerdata.primary_email = this.customerForm.value.email,
      this.customerdata.gender = this.customerForm.value.gender,
      this.customerdata.sec_first_name = this.customerForm.value.sec_first_name,
      this.customerdata.sec_last_name = this.customerForm.value.sec_last_name,
      this.customerdata.sec_designation = this.customerForm.value.sec_designation,
      this.customerdata.sec_phone_number = this.customerForm.value.sec_phone_number,
      this.customerdata.sec_email = this.customerForm.value.sec_email,
      this.customerdata.sec_gender = this.customerForm.value.sec_gender,
      this.customerdata.is_active = true,
      // Newly added for key while updation
      this.customerdata.is_office_details_exists = true,
      // End of newly added for key while updation
      this.customerdata.registered_address = this.customerdata.registered_address || {};
    this.customerdata.registered_address.company_name = this.customerForm.value.company_name;
    this.customerdata.registered_address.door_no = this.customerForm.value.door_no;
    this.customerdata.registered_address.address = this.customerForm.value.address;
    this.customerdata.registered_address.city = this.customerForm.value.city;
    this.customerdata.registered_address.state = this.customerForm.value.state;
    this.customerdata.registered_address.country = this.customerForm.value.country;
    this.customerdata.registered_address.pincode = this.customerForm.value.pincode;

    if (this.customerForm.value.country === 'India') {
      this.customerdata.registered_address.pan_no = this.customerForm.value.pan_no;
      this.customerdata.registered_address.gst_no = this.customerForm.value.gst_no;
      delete this.customerdata.registered_address.vat_no;
      delete this.customerdata.registered_address.tin_no;
    } else {
      this.customerdata.registered_address.vat_no = this.customerForm.value.vat_no;
      this.customerdata.registered_address.tin_no = this.customerForm.value.tin_no;
      delete this.customerdata.registered_address.pan_no;
      delete this.customerdata.registered_address.gst_no;
    }

    delete this.customerdata._id;
    // Remove password-related fields during update
    delete this.customerdata.password;
    delete this.customerdata.password_to_customer;
    // Ended
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

    this.hotelenrollmenttabviewService.updateCustomer(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // //console.log(resp);
            this.hotelenrollmenttabviewService.clearAdminFormEvent();
            //console.log(resp.message,"resp.message")
            this.alertService.success(resp.message, this.options);
            this.saveAndContinue()
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

  async createAdminRole(customer: any): Promise<any> {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        role_creation: {
          name: 'Admin',
          is_standard: true,
          is_active: true,
          member_id: customer.customer_member_id,
          modules: this.getAllAccessModules()
        }
      }
    };

    // console.log('Request Body:', requestBody);
    return await new Promise((resolve, reject) => {
      this.roleService.postApiCall(requestBody, ENDPOINTS.CREATE_ROLES)
        .subscribe(
          (resp: any) => {
            this.loaderService.emitComplete();
            if (resp) {
              if (resp.success === 1 && resp.status_code === 200) {
                // console.log('Role created successfully for Admin:', resp);
                resolve(resp.result.data[0]);
              }
              else if (resp.success === 0) {
                if (resp.message) {
                  this.alertService.error(resp.message, this.options);
                }
                resolve(false);
              }
              else if (resp.message && resp.status_code !== 200) {
                this.alertService.error(resp.message, this.options);
                resolve(false);
              }
              else {
                this.alertService.error(
                  'Something bad happened. Please try again!',
                  this.options
                );
                resolve(false);
              }
            } else {
              this.alertService.error(
                'Something bad happened. Please try again!',
                this.options
              );
              resolve(false);
            }
          },
          (err: any) => {
            this.loaderService.emitComplete();
            if (err?.error?.statusCode === 403) {
              this.alertService.error(
                'Session Time Out! Please login Again',
                this.options
              );
            }
            else if (err?.error?.message) {
              this.alertService.error(err.error.message, this.options);
            }
            else {
              this.alertService.error(
                'Something bad happened. Please try again!',
                this.options
              );
            }
            resolve(false);
          }
        );
    });
  }

  async updateCustomerRole(customerId: any, roleId: number, roleName: string): Promise<boolean> {
    const updateBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: customerId
        }
      },
      payload: {
        customer_update: {
          role_id: roleId,
          role_name: roleName
        }
      }
    };
    return await new Promise<boolean>((resolve) => {
      this.hotelenrollmenttabviewService
        .updateCustomercFcmToken(updateBody) // use your existing update API
        .subscribe(
          (resp: any) => {
            if (resp.success === 1 && resp.status_code === 200) {
              resolve(true);
            } else {
              console.error('Failed to update customer role:', resp?.message);
              resolve(false);
            }
          },
          (err: any) => {
            console.error('Error updating customer role:', err);
            resolve(false);
          }
        );
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
    this.isInitialLoad = true;
    //console.log(this.customerdata.first_name, 'this.customerdata.first_name', this.customerdata.registered_address?.state);

    const country = this.customerdata.registered_address?.country || '';
    const state = this.customerdata.registered_address?.state || '';
    this.onCountryOrStateChange(country, state, this.isInitialLoad);

    const patchData: any = {
      first_name: this.customerdata.first_name,
      last_name: this.customerdata.last_name,
      designation: this.customerdata.designation,
      phone_number: this.customerdata.phone_number,
      email: this.customerdata.primary_email || this.customerdata.email,
      gender: this.customerdata.gender,

      sec_first_name: this.customerdata.sec_first_name,
      sec_last_name: this.customerdata.sec_last_name,
      sec_designation: this.customerdata.sec_designation,
      sec_phone_number: this.customerdata.sec_phone_number,
      sec_email: this.customerdata.sec_email,
      sec_gender: this.customerdata.sec_gender,
      company_name: this.customerdata.registered_address?.company_name,
      door_no: this.customerdata.registered_address?.door_no,
      address: this.customerdata.registered_address?.address,
      city: this.customerdata.registered_address?.city,
      state: this.customerdata.registered_address?.state,
      country: this.customerdata.registered_address?.country,
      pincode: this.customerdata.registered_address?.pincode
    };

    if (this.taxField1Key) {
      patchData[this.taxField1Key] = this.taxField1Key === 'pan_no'
        ? this.customerdata.registered_address?.pan_no
        : this.customerdata.registered_address?.vat_no;
    }
    if (this.taxField2Key) {
      patchData[this.taxField2Key] = this.taxField2Key === 'gst_no'
        ? this.customerdata.registered_address?.gst_no
        : this.customerdata.registered_address?.tin_no;
    }

    this.customerForm.patchValue(patchData);
    this.isInitialLoad = false;
  }

  executeFunctions() {
    this.getCustomerById()
      .then(() => {
        this.setFormValues(); // Runs after data is fetched
        // Newly added: disable form in view-only mode
        if (this.isViewMode) {
          this.customerForm.disable();
        }
      })
      .catch(error => {
        //console.error("Error fetching customer data:", error);
      });
  }
  // getCountries() {
  //   // get country list
  //   this.hotelenrollmenttabviewService.getCountries().subscribe(
  //     resp => {
  //       this.countryDropdownList = resp.result;
  //       // console.log(this.countryDropdownList,"countryDropdownList");
  //       if(this.customerdata?.registered_address?.country!=undefined && this.customerdata.registered_address?.country!=null){
  //         this.getStateData();
  //       }
  //       // //console.log(this.countryList);
  //     },
  //     err => {
  //       if (err.error.statusCode === 403){
  //         this.alertService.error('Session Time Out! Please login Again', this.options)
  //         this.router.navigate([`/login`],{ skipLocationChange: false });
  //       }
  //       else if (err.error.message) {
  //         this.alertService.error(err.error.message, this.options)
  //       }
  //       else {
  //         // this.alertService.error('Something bad happened while loading countries. Please try again!', this.options);
  //       }
  //     }
  //   )
  // }
  // getStates(country_id: number) {
  //   let statesRequest = {
  //     "domain_name": "https://www.guestezee.com",
  //   "user_id": 16,
  //   "extras": {
  //       "find": {},
  //       "pagination": false,
  //       "paginationDetails": {
  //           "limit": 10000000,
  //           "pageSize": 2
  //       },
  //       "sorting": true,
  //       "sortingDetails": {
  //           "sortfield": "",
  //           "sortorder": -1
  //       }
  //   }
  //     // "domain_name": "https://www.beaubelle.in",
  //     // "user_id": this.authTokenService.getUserId(),
  //     // "extras": {
  //     //   "find": {
  //     //     "countryid": country_id
  //     //   },
  //     //   "pagination": false,
  //     //   "paginationDetails": {
  //     //     "limit": 0,
  //     //     "pageSize": 2
  //     //   },
  //     //   "sorting": true,
  //     //   "sortingDetails": {
  //     //     "sortfield": "",
  //     //     "sortorder": -1
  //     //   }
  //     // }
  //   }
  //   this.hotelenrollmenttabviewService.getStatesById(statesRequest).subscribe(resp => {

  //     if (resp.success === 1) {

  //       this.states = resp.result

  //       let temArray: any = []

  //       //iterate through object
  //       Object.entries(this.states).forEach(([key, value]) => {
  //         temArray.push(value)
  //       })

  //       //flatten array
  //       this.statesDropdownList = Array.prototype.concat.apply([], temArray)
  //       // console.log( this.statesDropdownList," this.statesDropdownList")

  //       // //console.log(this.statesDropdownList)

  //     }
  //     else {
  //       this.states = []
  //     }

  //   }, err => {
  //     if (err.error.statusCode === 403) {
  //       this.alertService.error('Session Time Out! Please login Again', this.options)
  //       this.router.navigate([`/login`], { skipLocationChange: false });
  //     }
  //     else if (err.error.message) {
  //       this.alertService.error(err.error.message, this.options)
  //     }
  //     else {
  //       // this.alertService.error('Something bad happened while loading customer group. Please try again!', this.options);
  //     }
  //     this.states = []
  //   })
  // }
  onItemsSelect(item: any) {
    //console.log(item.target.value,"item")
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === item.target.value); if (selectedCountry) {
      //console.log('Selected Country ID:', selectedCountry.id);
      // this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }
  }

  getRoleById(roleId: any) {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: roleId
        }
      }
    }
    this.roleService.postApiCall(requestBody, ENDPOINTS.GETBYID_ROLES).subscribe(resp => {
      if (resp) {
        console.log('Verified Role Details:', resp.result.data[0]);
      }
    });
  }

  /* getStateData() {
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === this.customerdata.registered_address?.country); if (selectedCountry) {
      // console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      // console.log('Country not found');
    }
  } */

  saveAndContinue() {
    // Select next tab using JavaScript
    let nextTab = document.getElementById('property-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }
  cancel() {
    this.customerForm.reset();

  }

  async afterCustomerCreate() {
    //console.log(this.customerdata.id ,"CHECK THE URL")
    // Select next tab using JavaScript
    this.router.navigate(["/edit-new-hotel", this.customerdata.id]).then(() => {

      let nextTab = document.getElementById('property-tab');
      if (nextTab) {
        (nextTab as HTMLAnchorElement).click();
      }

    });

  }
  onCountryOrStateChange(country: string, state: string, isInitialLoad = false) {
    if (!country) {
      this.showTaxSection = false;
      if (this.taxField1Key) this.customerForm.removeControl(this.taxField1Key);
      if (this.taxField2Key) this.customerForm.removeControl(this.taxField2Key);
      this.taxField1Key = '';
      this.taxField2Key = '';
      return;
    }

    this.showTaxSection = true;
    const isIndia = country === 'India';
    const newField1Key = isIndia ? 'pan_no' : 'vat_no';
    const newField2Key = isIndia ? 'gst_no' : 'tin_no';

    // Calculate new title and labels first
    let newTaxSectionTitle = '';
    let newTaxField1Label = '';
    let newTaxField2Label = '';

    if (isIndia) {
      newTaxSectionTitle = 'PAN & GST Details';
      newTaxField1Label = 'PAN Number';
      newTaxField2Label = 'GST';
    } else {
      newTaxSectionTitle = 'VAT & TIN Details';
      newTaxField1Label = 'VAT Number';
      newTaxField2Label = 'Tax Identification Number (TIN)';

      if (country === 'Spain') {
        newTaxField2Label = 'Tax ID (NIF / NIE)';
        if (state === 'Canary Islands') {
          newTaxSectionTitle = 'IGIC & Tax ID Details';
          newTaxField1Label = 'IGIC Number';
        } else {
          newTaxSectionTitle = 'VAT & Tax ID Details';
          newTaxField1Label = 'VAT Number (IVA)';
        }
      } else if (country === 'Switzerland') {
        newTaxSectionTitle = 'VAT & Business ID Details';
        newTaxField1Label = 'VAT Number (MWST/TVA/IVA)';
        newTaxField2Label = 'Business ID (UID)';
      } else if (country === 'Germany') {
        newTaxSectionTitle = 'VAT & Tax Number Details';
        newTaxField1Label = 'VAT Number (USt-IdNr.)';
        newTaxField2Label = 'Tax Number (Steuernummer)';
      } else if (country === 'Austria') {
        newTaxSectionTitle = 'VAT & Tax Number Details';
        newTaxField1Label = 'VAT Number (UID)';
        newTaxField2Label = 'Tax Number (Steuernummer)';
      } else if (country === 'Poland') {
        newTaxSectionTitle = 'VAT & Tax ID Details';
        newTaxField1Label = 'VAT Number (NIP)';
        newTaxField2Label = 'Tax ID (NIP / PESEL)';
      } else if (country === 'Romania') {
        newTaxSectionTitle = 'VAT & Tax ID Details';
        newTaxField1Label = 'VAT Number (CIF)';
        newTaxField2Label = 'Tax ID (CIF / CNP)';
      } else if (country === 'United Kingdom') {
        newTaxSectionTitle = 'VAT & Tax Reference Details';
        newTaxField1Label = 'VAT Number';
        newTaxField2Label = 'Unique Taxpayer Reference (UTR)';
      }
    }

    // Determine if the tax system configuration actually changed
    const taxSystemChanged =
      this.taxField1Key !== newField1Key ||
      this.taxField2Key !== newField2Key ||
      this.taxSectionTitle !== newTaxSectionTitle ||
      this.taxField1Label !== newTaxField1Label ||
      this.taxField2Label !== newTaxField2Label;

    if (this.taxField1Key && this.taxField1Key !== newField1Key) {
      this.customerForm.removeControl(this.taxField1Key);
    }
    if (this.taxField2Key && this.taxField2Key !== newField2Key) {
      this.customerForm.removeControl(this.taxField2Key);
    }

    this.taxField1Key = newField1Key;
    this.taxField2Key = newField2Key;
    this.taxSectionTitle = newTaxSectionTitle;
    this.taxField1Label = newTaxField1Label;
    this.taxField2Label = newTaxField2Label;

    if (!this.customerForm.contains(newField1Key)) {
      const existingVal1 = isInitialLoad
        ? (isIndia
          ? (this.customerdata?.registered_address?.pan_no || '')
          : (this.customerdata?.registered_address?.vat_no || ''))
        : '';

      const ctrl1 = new FormControl(existingVal1, [
        Validators.required,
        CustomValidators.noWhitespaceValidator,
        CustomValidators.dynamicTaxValidator('VAT')
      ]);
      this.customerForm.addControl(newField1Key, ctrl1);
    } else {
      const ctrl1 = this.customerForm.get(newField1Key);
      if (ctrl1) {
        ctrl1.setValidators([
          Validators.required,
          CustomValidators.noWhitespaceValidator,
          CustomValidators.dynamicTaxValidator('VAT')
        ]);
        if (!isInitialLoad && taxSystemChanged) {
          ctrl1.setValue('');
        }
        ctrl1.updateValueAndValidity();
      }
    }

    if (!this.customerForm.contains(newField2Key)) {
      const existingVal2 = isInitialLoad
        ? (isIndia
          ? (this.customerdata?.registered_address?.gst_no || '')
          : (this.customerdata?.registered_address?.tin_no || ''))
        : '';

      const ctrl2 = new FormControl(existingVal2, [
        Validators.required,
        CustomValidators.noWhitespaceValidator,
        CustomValidators.dynamicTaxValidator('TIN')
      ]);
      this.customerForm.addControl(newField2Key, ctrl2);
    } else {
      const ctrl2 = this.customerForm.get(newField2Key);
      if (ctrl2) {
        ctrl2.setValidators([
          Validators.required,
          CustomValidators.noWhitespaceValidator,
          CustomValidators.dynamicTaxValidator('TIN')
        ]);
        if (!isInitialLoad && taxSystemChanged) {
          ctrl2.setValue('');
        }
        ctrl2.updateValueAndValidity();
      }
    }

    if (this.customerForm.disabled || this.isViewMode) {
      this.customerForm.get(newField1Key)?.disable();
      this.customerForm.get(newField2Key)?.disable();
    }

    // Programmatic error triggering on country/state changes
    const ctrl1 = this.customerForm.get(newField1Key);
    if (ctrl1) {
      if ((!isInitialLoad && taxSystemChanged) || (isInitialLoad && ctrl1.value)) {
        ctrl1.markAsTouched();
      }
    }
    const ctrl2 = this.customerForm.get(newField2Key);
    if (ctrl2) {
      if ((!isInitialLoad && taxSystemChanged) || (isInitialLoad && ctrl2.value)) {
        ctrl2.markAsTouched();
      }
    }
  }

  // Allow pincode characters dynamically
  allowPincodeInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const country = this.customerForm.get('country')?.value || 'default';
    const rule = PINCODE_RULES[country] || PINCODE_RULES['default'];

    // Check digits-only
    if (rule.digitsOnly && (event.key < '0' || event.key > '9')) {
      event.preventDefault();
      return;
    }

    if (!rule.digitsOnly) {
      const allowedChars = /^[a-zA-Z0-9\s\-]$/;
      if (event.key.length === 1 && !allowedChars.test(event.key)) {
        event.preventDefault();
        return;
      }
    }

    // Limit length
    if (input.value.length >= rule.maxLength) {
      event.preventDefault();
    }
  }

  handlePaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const country = this.customerForm.get('country')?.value || 'default';
    const rule = PINCODE_RULES[country] || PINCODE_RULES['default'];

    let regex = /^[a-zA-Z0-9\s\-]+$/;
    if (rule.digitsOnly) {
      regex = /^\d+$/;
    }
    if (!regex.test(pasted) || pasted.length > rule.maxLength) {
      event.preventDefault();
    }
  }

  // Allow only alphanumeric characters for PAN and GST
  onlyAllowAlphaNumeric(event: KeyboardEvent) {
    const charCode = event.key;
    // Allow only letters and numbers
    if (!/^[a-zA-Z0-9]$/.test(charCode)) {
      event.preventDefault();
    }
  }

  handleAlphaNumericPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned) {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const val = input.value;
      const newVal = val.slice(0, start) + cleaned + val.slice(end);
      input.value = newVal;
      input.setSelectionRange(start + cleaned.length, start + cleaned.length);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const input = event.target as HTMLInputElement;

    if (charCode < 48 || charCode > 57) event.preventDefault();
    if (charCode === 48 && input.value.length === 0) event.preventDefault();
  }

  nextTab() {
    this.saveAndContinue()
  }

  // Newly added for back navigation
  goBack() {
    this.router.navigate(['/hotel-list']);
  }

  // Newly added for username & password
  sendMessage(customerData: any) {
    const payload = {
      "domain_name": this.authTokenService.getDomain(),
      "customer_member_id": customerData.customer_member_id,
      "templateCode": "enrollment",
      "user_id": 1
      /* OrganizationId: 30,
      Mobile: customerData.phone_number */
    };
    this.hotelenrollmenttabviewService.sendSMS(payload).subscribe({
      next: async (res) => {
        if (res && (res.success === 1)) {
          console.log('Welcome SMS sent successfully:', res);
          await this.updateCustomerWelcomeSms(customerData.id);
        }
        else {
          console.log('Failed to send welcome SMS:', res);
        }
      },
      error: (err) => {
        console.error('Email API error:', err);
      }
    });
  }

  async updateCustomerWelcomeSms(customerId: any): Promise<boolean> {
    const updateBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: customerId
        }
      },
      payload: {
        customer_update: {
          send_welcome_sms: true
        }
      }
    };
    return await new Promise<boolean>((resolve) => {
      this.hotelenrollmenttabviewService
        .updateCustomercFcmToken(updateBody)
        .subscribe(
          (resp: any) => {
            if (resp.success === 1 && resp.status_code === 200) {
              resolve(true);
            } else {
              console.error('Failed to update customer welcome sms status:', resp?.message);
              resolve(false);
            }
          },
          (err: any) => {
            console.error('Error updating customer welcome sms status:', err);
            resolve(false);
          }
        );
    });
  }

  // Newly added & commented out for DUE PAYMENTS access permission
  /*   getAllAccessModules() {
    const moduleNames = [
      'DASHBOARD',
      'PAYMENT',
      'SYSTEM SETTINGS',
      'USER ACCESS',
      'HOTELS',
      'TASK MANAGEMENT',
      'BOOKINGS',
      'OUTLETS',
      // 'RESTAURANTS',
      'FEATURES'
    ];
    return moduleNames.map(name => ({
      module_name: name,
      permission: {
        has_add_permission: true,
        has_edit_permission: true,
        has_read_permission: true,
        has_delete_permission: true
      }
    }));
  } */

  getAllAccessModules() {
    const moduleNames = [
      'DASHBOARD',
      'PAYMENT',
      'SYSTEM SETTINGS',
      'USER ACCESS',
      'HOTELS',
      'TASK MANAGEMENT',
      'BOOKINGS',
      'OUTLETS',
      'FEATURES'
    ];
    const modules = moduleNames.map(name => ({
      module_name: name,
      permission: {
        has_add_permission: true,
        has_edit_permission: true,
        has_read_permission: true,
        has_delete_permission: true
      }
    }));
    modules.push({
      module_name: 'DUE PAYMENTS',
      permission: {
        has_add_permission: false,
        has_edit_permission: false,
        has_read_permission: true,
        has_delete_permission: false
      }
    });
    return modules;
  }

}

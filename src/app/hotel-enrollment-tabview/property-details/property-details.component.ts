import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HotelEnrollmentTabviewComponent } from '../hotel-enrollment-tabview.component';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { CustomValidators, PINCODE_RULES } from '../validators';
import { ENDPOINTS } from '../../app.config';
import { CheckoutApiService } from '../checkout.service';
import { LocalStorageService } from '../../auth-services/local-storage.service';
import { ProfileService } from '../../profile/profile.service';
import { HttpHeaders } from '@angular/common/http';
// import { HierarchyService } from '../../hierarchy/hierarchy.service';
// import { CustomerService } from '../../onboarding/services/customer.service';
import { COUNTRY_STATES, CountryState } from '../../shared/constants/countries';


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
  taxSectionTitle = '';
  taxField1Label = '';
  taxField2Label = '';
  taxField1Key = '';
  taxField2Key = '';
  showTaxSection = false;
  maxPincodeLength = 10;
  isInitialLoad = false;

  get taxControl1(): FormControl {
    return this.customerProprtyDetailsForm.get(this.taxField1Key) as FormControl;
  }

  get taxControl2(): FormControl {
    return this.customerProprtyDetailsForm.get(this.taxField2Key) as FormControl;
  }

  hotelId: Number | null = null;
  countryDropdownList: any = [];
  customerId: string | null = null;
  orderData: any;
  // memberId: Number | null = null;
  memberId: any | null = null;
  customerdata: any = {};
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  states: any;
  statesDropdownList: any = [];
  isOtherBrand: boolean = false;
  upsertData: any;
  /* companyStatusOptions: any = []; */
  companyStatusOptions = [
    { id: 'radio1', label: 'Private Limited / Public Limited Company' },
    { id: 'radio2', label: 'Sole Proprietor' },
    { id: 'radio3', label: 'Partnership Firm / LLP' },
    { id: 'radio4', label: 'Individual' },
    { id: 'radio5', label: 'NGO or Other (Business Filing Status)' }
  ];
  companyStatusDocuments: { [key: string]: { name: string }[] } = {
    'Private Limited / Public Limited Company': [
      { name: 'Company PAN card' },
      { name: 'Signing authority PAN card' },
      { name: 'Signing authority Aadhar card' },
      { name: 'MOA & Certificate of Incorporation' },
      { name: 'Office Address Proof (Landline/BanK Statement)' },
      { name: 'GST Certificate' },
      { name: 'Cancelled Cheque' }
    ],
    'Sole Proprietor': [
      { name: 'Signing authority PAN card' },
      { name: 'Signing authority Aadhar card' },
      { name: 'Office Address Proof (Landline/BanK Statement)' },
      { name: 'Shop and Establishment Certificate' },
      { name: 'GST Certificate (if applicable)' },
      { name: 'Cancelled Cheque' }
    ],
    'Partnership Firm / LLP': [
      { name: 'Company PAN card' },
      { name: 'Signing authority PAN card' },
      { name: 'Signing authority Aadhar card' },
      { name: 'Partnership Deed / LLP Agreement' },
      { name: 'Office Address Proof (Landline/BanK Statement)' },
      { name: 'GST Certificate' },
      { name: 'Cancelled Cheque' }
    ],
    'Individual': [
      { name: 'Signing authority PAN card' },
      { name: 'Signing authority Aadhar card' },
      { name: 'Cancelled Cheque' }
    ],
    'NGO or Other (Business Filing Status)': [
      { name: 'Company PAN card' },
      { name: 'Signing authority PAN card' },
      { name: 'Signing authority Aadhar card' },
      { name: 'Trust Deed' },
      { name: 'Cancelled Cheque' }
    ]
  };
  uploadedDocuments: { [key: string]: File } = {};
  uploaded_documents: { document_name: string; document_url: string }[] = [];
  uploadedDocumentsApi: any = [];
  // Newly added for payment done
  @Input() paymentDone!: boolean;
  hotelLogo: File | null = null;
  hotelLogoUrl: string | null = null;
  logoUploading = false;
  selectedPropertySize: string = ''; // don't hardcode default here
  plans: any[] = [];
  propertyPricingMap: Record<string, number> = {};
  singleRoomFinalPrice: number = 0; // from "SingleRoomPricing"
  finalPrice: number = 0; // current selected per-room final price
  totalCost: number = 0;
  propertySizes: any[] = []; // will be fetched from API
  // Add a map to define max rooms for each property size
  propertySizeLimits: { [key: string]: number } = {
    '01-50 Rooms': 50,
    '51-100 Rooms': 100,
    '101-150 Rooms': 150,
    '150 and above Rooms': Infinity // no upper limit
  };
  // Min/max range per property size band
  propertySizeRanges: { [key: string]: { min: number; max: number } } = {
    '01-50 Rooms': { min: 1, max: 50 },
    '51-100 Rooms': { min: 51, max: 100 },
    '101-150 Rooms': { min: 101, max: 150 },
    '150 and above Rooms': { min: 151, max: Infinity }
  };
  // dynamicRoomCost: number = 0;
  status: string = '';
  customerStatus: string = '';
  // Newly added fo hierarchy member_id update
  hierarchyData: any;
  // Newly added for documents upload
  originalUploadedDocuments: any[] = [];
  // The company_status value that was last saved to the server
  originalCompanyStatus: string = '';
  // Tracks which specific doc the user clicked upload for
  selectedApiDocName: string | null = null;
  selectedUploadDoc: string | null = null;
  // Newly added: flag to detect view-only mode
  isViewMode: boolean = false;

  constructor(
    private authTokenService: AuthTokenService,
    private hotelenrollmenttabviewService: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private alertService: AlertsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private checkoutApiService: CheckoutApiService,
    private localStorageService: LocalStorageService,
    private hotelenrollmentservice: HotelEnrollmentTabviewService,
    // Newly added
    private profileService: ProfileService,
    // Newly added fo hierarchy member_id update
    // private hierarchyService: HierarchyService,

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
    /* this.countryDropdownList =
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
          ]; */

    this.activatedRoute.paramMap.subscribe(params => {
      var temphotelid = params.get('id'); // Get the 'id' from the URL
      this.hotelId = Number(temphotelid);

      //console.log('Hotel ID:', this.hotelId); // Debugging
    });
    // this.memberId = this.localStorageService.get('MemberId');
    this.executeFunctions();
    /* this.customerProprtyDetailsForm = new FormGroup({

      hotel_name: new FormControl('', Validators.required),
      contact_person: new FormControl('', Validators.required),
      designation: new FormControl('', Validators.required),
      primary_phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      secondary_phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      email: new FormControl('', [Validators.required, Validators.email]),
      brand: new FormControl('', Validators.required),
      other_brand_name: new FormControl(''),

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

    }); */
    this.customerProprtyDetailsForm = new FormGroup({
      hotel_name: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      contact_person: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      designation: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      primary_phone_number: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      secondary_phone_number: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      // Newly added & commented for consective dots
      email: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_%+-]+(?:\.[a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/)]),
      // End of newly added & commented for consective dots
      brand: new FormControl('', Validators.required),
      property_doorno: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      property_address: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      property_city: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      property_state: new FormControl('', Validators.required),
      property_location: new FormControl('', [Validators.required, CustomValidators.noWhitespaceValidator]),
      property_country: new FormControl('', Validators.required),
      property_pincode: new FormControl('', [Validators.required, CustomValidators.dynamicPincodeValidator()]),
      property_size: new FormControl('', Validators.required),
      company_status: new FormControl('', Validators.required),
      other_brand_name: new FormControl(''),
      number_of_rooms: new FormControl('', [Validators.required]),
    });

    const companyStatusControl = this.customerProprtyDetailsForm.get('company_status');
    if (companyStatusControl) {
      companyStatusControl.valueChanges.subscribe((status: string) => {
        this.onCompanyStatusChange(status);
      });
    }
    // Newly added for getting customer id for customer type
    // if (this.hotelId != 0) {
    if (this.memberId !== undefined && this.memberId !== null && this.memberId !== '' && this.memberId !== 'undefined' && this.memberId !== 'null') {
      // End of newly added for getting customer id for customer type
      this.getCustomerById().then(() => {
        if (!this.selectedPropertySize && Object.keys(this.propertyPricingMap).length > 0) {
          const defaultSize = Object.keys(this.propertyPricingMap).find(k => k !== 'SingleRoomPricing')
            || Object.keys(this.propertyPricingMap)[0];
          this.selectedPropertySize = defaultSize;
          this.customerProprtyDetailsForm.get('property_size')?.setValue(defaultSize);
        }
      });
    }

    // this.getCountries();
    this.getCustomerDataAfterConfirmation();

    // Initialize countries list from the shared constant
    this.countryDropdownList = COUNTRY_STATES;
    this.statesDropdownList = [];

    // Disable state initially
    this.customerProprtyDetailsForm.get('property_state')?.disable();

    // Listen to changes on the country select dropdown
    this.customerProprtyDetailsForm.get('property_country')?.valueChanges.subscribe((selectedCountryName) => {
      if (selectedCountryName) {
        // Find the matching country object
        const selectedCountry = COUNTRY_STATES.find(
          (c) => c.country === selectedCountryName
        );

        if (selectedCountry) {
          // The template expects objects with a 'state' property
          this.statesDropdownList = selectedCountry.states.map(s => ({ state: s, code: '', flag: '' }));
          if (this.customerProprtyDetailsForm.disabled || this.isViewMode || this.paymentDone) {
            this.customerProprtyDetailsForm.get('property_state')?.disable();
          } else {
            this.customerProprtyDetailsForm.get('property_state')?.enable();
          }

          // Reset the state value whenever the country changes
          if (!this.isInitialLoad && !this.customerProprtyDetailsForm.get('property_country')?.disabled) {
            const stateCtrl = this.customerProprtyDetailsForm.get('property_state');
            if (stateCtrl) {
              stateCtrl.setValue('');
              const selectedCountry = COUNTRY_STATES.find((c) => c.country === selectedCountryName);
              if (selectedCountry && !stateCtrl.disabled) {
                stateCtrl.markAsTouched();
              }
            }
          }
        } else {
          this.statesDropdownList = [];
          this.customerProprtyDetailsForm.get('property_state')?.disable();
          if (!this.isInitialLoad && !this.customerProprtyDetailsForm.get('property_country')?.disabled) {
            this.customerProprtyDetailsForm.get('property_state')?.setValue('');
          }
        }
      } else {
        this.statesDropdownList = [];
        this.customerProprtyDetailsForm.get('property_state')?.disable();
        if (!this.isInitialLoad && !this.customerProprtyDetailsForm.get('property_country')?.disabled) {
          this.customerProprtyDetailsForm.get('property_state')?.setValue('');
        }
      }

      // Re-validate pincode when country changes
      const pincodeCtrl = this.customerProprtyDetailsForm.get('property_pincode');
      const rule = PINCODE_RULES[selectedCountryName || 'default'] || PINCODE_RULES['default'];
      this.maxPincodeLength = rule.maxLength;
      if (pincodeCtrl) {
        pincodeCtrl.updateValueAndValidity();
        if (!this.isInitialLoad && pincodeCtrl.value) {
          pincodeCtrl.markAsTouched();
        }
      }

      // Setup dynamic tax controls
      if (!this.isInitialLoad) {
        this.onCountryOrStateChange(selectedCountryName, this.customerProprtyDetailsForm.get('property_state')?.value, false);
      }
    });

    // Listen to changes on the state select dropdown
    this.customerProprtyDetailsForm.get('property_state')?.valueChanges.subscribe((selectedStateName) => {
      if (!this.isInitialLoad) {
        this.onCountryOrStateChange(this.customerProprtyDetailsForm.get('property_country')?.value, selectedStateName, false);
      }
    });

    // Newly added code to disable the form
    // this.customerProprtyDetailsForm.disable();

    // Newly added: detect view-only mode (hotel-preview route)
    this.isViewMode = this.router.url.includes('hotel-preview');

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.customerProprtyDetailsForm && (changes['paymentDone'] || this.paymentDone)) {
      this.customerProprtyDetailsForm.get('property_size')?.disable();
      this.customerProprtyDetailsForm.get('number_of_rooms')?.disable();
      this.customerProprtyDetailsForm.get('property_country')?.disable();
      this.customerProprtyDetailsForm.get('property_state')?.disable();
      if (this.taxField1Key === 'property_vat') {
        this.customerProprtyDetailsForm.get('property_vat')?.disable();
      }
      if (this.taxField2Key === 'property_gst') {
        this.customerProprtyDetailsForm.get('property_gst')?.disable();
      }
    }
  }
  refreshData() {
    this.executeFunctions();
  }

  isFormValid(): boolean {
    return this.customerProprtyDetailsForm.valid;
  }

  async getCustomerDataAfterConfirmation() {
    if (this.router.url.includes('confirmation')) {
      // this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer_id');
      this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer.id');
      //console.log('Customer ID:', this.customerId);
      this.hotelId = Number(this.customerId)
      this.memberId = this.localStorageService.get('MemberId');//newly added 
      this.executeFunctions().then(() => {
        // this.getOrderData(Number(this.customerId))
        this.getOrderData(this.memberId)//newly added
      });

    }
  }

  onBrandChange(event: any): void {
    const selectedBrand = event.target.value;
    // console.log('Selected Brand:', selectedBrand);
    this.isOtherBrand = selectedBrand === 'Others';
    const otherBrandControl = this.customerProprtyDetailsForm.controls['other_brand_name'];
    // console.log('Other Brand Name:', otherBrandControl);
    // Always reset value and validation status
    otherBrandControl.setValue('');
    otherBrandControl.markAsPristine();
    otherBrandControl.markAsUntouched();

    if (this.isOtherBrand) {
      otherBrandControl.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      otherBrandControl.clearValidators();
    }
    otherBrandControl.updateValueAndValidity();
  }
  // Custom validator to prevent whitespace-only input
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
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
    delete this.customerdata.password;
    delete this.customerdata.password_to_customer;
    const formValues = this.customerProprtyDetailsForm.getRawValue();
    const tempCustomerObjectUpdated = {
      contact_details: {
        hotel_name: formValues.hotel_name,
        contact_person: formValues.contact_person,
        designation: formValues.designation,
        primary_phone_number: formValues.primary_phone_number,
        secondary_phone_number: formValues.secondary_phone_number,
        email: formValues.email,
        brand: formValues.brand,
        other_brand_name: formValues.other_brand_name,
      },
      property_address: {
        property_doorno: formValues.property_doorno,
        property_address: formValues.property_address,
        property_city: formValues.property_city,
        property_state: formValues.property_state,
        property_location: formValues.property_location,
        property_country: formValues.property_country,
        property_pincode: formValues.property_pincode,
        property_size: formValues.property_size,
        number_of_rooms: formValues.number_of_rooms,
        ...(formValues.property_country === 'India' ? {
          property_pan: formValues.property_pan,
          property_gst: formValues.property_gst
        } : {
          property_vat: formValues.property_vat,
          property_tin: formValues.property_tin
        })
      },
      kyc_documents: {
        ...this.customerdata?.property_details?.kyc_documents,
        company_status: formValues.company_status,
        uploaded_documents: this.uploaded_documents
      },
      hotel_logo: this.hotelLogoUrl
    };
    // this.customerdata["property_details"] = tempCustomerObjectUpdated;
    // this.customerdata["name"] = formValues.hotel_name;
    // this.customerdata['is_property_details_exists'] = true;
    // this.customerdata['old_member_id'] = this.localStorageService.get('MemberId');

    // Create a shallow copy to prevent the UI from glitching during the save
    let payloadCustomerData = { ...this.customerdata };
    // Remove password-related fields during update
    delete payloadCustomerData.password;
    delete payloadCustomerData.password_to_customer;
    // Ended
    payloadCustomerData["property_details"] = tempCustomerObjectUpdated;
    payloadCustomerData["name"] = formValues.hotel_name;
    payloadCustomerData['is_property_details_exists'] = true;
    payloadCustomerData['old_member_id'] = this.localStorageService.get('MemberId');
    //console.log(tempCustomerObject)
    //console.log( this.customerdata," this.customerdata")
    //console.log( payloadCustomerData," payloadCustomerData")

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        // customer_updation: this.customerdata
        //  customer_update: this.customerdata
        customer_update: payloadCustomerData
      },
      extras: {
        find: {
          id: this.hotelId
          // customer_member_id: this.memberId
        }
      }
    };

    //console.log("123")
    // this.hotelenrollmenttabviewService.updateCustomerSettings(requestBody).subscribe(
    //   resp => {
    //     this.loaderService.emitComplete();
    //     if (resp) {
    //       if (resp.success === 1 && resp.status_code === 200) {
    //         // //console.log(resp);
    //         this.hotelenrollmenttabviewService.clearAdminFormEvent();
    //         //console.log("alerttttt")
    //         this.alertService.success(resp.message, this.options);
    //         // this.payNow();
    //         this.nextTab();
    //         // setTimeout(() => {
    //         //   this.router.navigate([`/all-customers`], { skipLocationChange: false });
    //         // }, 1000);
    //         // this.router.navigate(['/all-customers'], { state: { result: resp.message }, relativeTo: this.activatedRoute, skipLocationChange: false });
    //       }
    //       else if (resp.success === 0) {
    //         if (resp.message) {
    //           this.alertService.error(resp.message, this.options);
    //         }
    //       }
    //       else if (resp.message && resp.status_code !== 200) {
    //         this.alertService.error(resp.message, this.options);
    //       }
    //       else {
    //         this.alertService.error('Something bad happened. Please try again!', this.options);
    //       }
    //     }
    //   },
    //   err => {
    //     this.loaderService.emitComplete();
    //     if (err.error.statusCode === 403) {
    //       this.alertService.error('Session Time Out! Please login Again', this.options)
    //       this.router.navigate([`/login`], { skipLocationChange: false });
    //     }
    //     else if (err.error.message) {
    //       this.alertService.error(err.error.message, this.options)
    //     }
    //     else {
    //       this.alertService.error('Something bad happened. Please try again!', this.options);
    //     }
    //   }
    // )
    this.hotelenrollmenttabviewService.updateCustomerSettings(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {

            // After update, get customer data and member_id
            const getCustomerBody = {
              domain_name: this.authTokenService.getDomain(),
              user_id: this.authTokenService.getUserId(),
              extras: {
                find: {
                  id: this.hotelId
                  // customer_member_id: this.memberId
                }
              }
            };

            this.hotelenrollmentservice.getLoginCustomerById(getCustomerBody).subscribe(
              resp2 => {
                this.loaderService.emitComplete();
                if (resp2) {
                  const customerMemberId = resp2.result.data[0].customer_member_id;
                  this.memberId = customerMemberId;
                  // Store member id
                  this.localStorageService.set('MemberId', customerMemberId);

                  const checkPayload = {
                    domain_name: this.authTokenService.getDomain(),
                    user_id: this.authTokenService.getUserId(),
                    payload: {
                      integration_settings: {
                        member_id: customerMemberId
                      }
                    }
                  };
                  this.hotelenrollmenttabviewService.checkIsTechnicalInfoExist(checkPayload).subscribe({
                    next: (checkResp: any) => {
                      if (checkResp) {
                        if (checkResp.success === 1 && checkResp.status_code === 200) {
                          // Final success actions
                          this.hotelenrollmenttabviewService.updateAdminFormEvent('refreshTechnicalInfo');
                          this.alertService.success(resp.message || 'Record Updated Successfully.', this.options);
                          this.executeFunctions();
                          this.nextTab();
                        } else if (checkResp.success === 0) {
                          if (checkResp.message) {
                            this.alertService.error(checkResp.message, this.options);
                          }
                        } else if (checkResp.message && checkResp.status_code !== 200) {
                          this.alertService.error(checkResp.message, this.options);
                        } else {
                          this.alertService.error('Something bad happened. Please try again!', this.options);
                        }
                      }
                    },
                    error: (err: any) => {
                      this.loaderService.emitComplete();
                      if (err.error && err.error.statusCode === 403) {
                        this.alertService.error('Session Time Out! Please login Again', this.options);
                        this.router.navigate(['/login'], { skipLocationChange: false });
                      } else if (err.error && err.error.message) {
                        this.alertService.error(err.error.message, this.options);
                      } else {
                        this.alertService.error('Something bad happened. Please try again!', this.options);
                      }
                    }
                  });
                }
              },
              err => {
                this.loaderService.emitComplete();
                if (err.error.statusCode === 403) {
                  this.alertService.error('Session Time Out! Please login Again', this.options);
                  this.router.navigate(['/login'], { skipLocationChange: false });
                } else if (err.error.message) {
                  this.alertService.error(err.error.message, this.options);
                } else {
                  this.alertService.error('Something bad happened. Please try again!', this.options);
                }
              }
            );

          }
          else if (resp.message.toLowerCase().includes('input parameters missing')) {
            this.alertService.error('Please fill all the required fields.', this.options);
          }
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertService.error(resp.message, this.options);
            }
          } else if (resp.message && resp.status_code !== 200) {
            this.alertService.error(resp.message, this.options);
          } else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
        }
      },
      err => {
        this.loaderService.emitComplete();
        if (err.error.statusCode === 403) {
          this.alertService.error('Session Time Out! Please login Again', this.options);
          this.router.navigate(['/login'], { skipLocationChange: false });
        } else if (err.error.message) {
          this.alertService.error(err.error.message, this.options);
        } else {
          this.alertService.error('Something bad happened. Please try again!', this.options);
        }
      }
    );
  }

  getCustomerById(): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.hotelId,
            // customer_member_id: this.memberId
            // id: this.hotelId || undefined, // This finds the correct hotel 497
            // customer_member_id: !this.hotelId ? this.memberId : undefined 
          }
        }
      };

      this.hotelenrollmenttabviewService.getLoginCustomerById(requestBody).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            this.customerdata = resp.result.data[0];
            this.hotelId = resp.result.data[0].id;
            // this.memberId = resp.result.data[0].customer_member_id;
            // console.log('Synchronized Member ID:', this.memberId);
            if (resp.result.data[0]) {
              if (resp?.result?.data[0]?.property_details?.kyc_documents?.uploaded_documents) {
                const apiDocs = resp.result.data[0].property_details.kyc_documents.uploaded_documents;
                // Store snapshot so onCompanyStatusChange can restore URLs when switching back
                this.originalUploadedDocuments = apiDocs;
                this.uploaded_documents = apiDocs;
                this.uploadedDocumentsApi = [...apiDocs];
                // uploadedDocuments is a {[docName]: File} map — do NOT assign the API array to it
                this.uploadedDocuments = {};
              }
              // Track the company status that was originally saved to the server
              if (resp?.result?.data[0]?.property_details?.kyc_documents?.company_status) {
                this.originalCompanyStatus = resp.result.data[0].property_details.kyc_documents.company_status;
              }
              //  Store company logo URL from API
              if (resp?.result?.data[0]?.property_details?.hotel_logo) {
                this.hotelLogoUrl = resp?.result?.data[0]?.property_details?.hotel_logo;
                // console.log('Existing company logo:', this.hotelLogoUrl);
              }
              this.status = this.customerdata.status;
              this.customerStatus = this.customerdata.status;
              // console.log('Customer status:', this.status);
              if (this.paymentDone) {
                this.customerProprtyDetailsForm.get('property_size')?.disable();
                this.customerProprtyDetailsForm.get('number_of_rooms')?.disable();
                this.customerProprtyDetailsForm.get('property_country')?.disable();
                this.customerProprtyDetailsForm.get('property_state')?.disable();
                if (this.taxField1Key === 'property_vat') {
                  this.customerProprtyDetailsForm.get('property_vat')?.disable();
                }
                if (this.taxField2Key === 'property_gst') {
                  this.customerProprtyDetailsForm.get('property_gst')?.disable();
                }
              }
              if (this.status === 'approved') {
                // Disable the form if approved - handled in executeFunctions via setTimeout
              }

              this.getAllSubscriptionsAndSetGeneral();
            }
            //newly added for form
            // this.status = this.customerdata.status;
            // this.customerStatus = this.customerdata.status;
            // this.getAllSubscriptionsAndSetGeneral();
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
    if (
      this.customerdata?.property_details?.contact_details &&
      this.customerdata?.property_details?.property_address &&
      this.customerdata?.property_details?.kyc_documents // newly added
    ) {
      //newly added
      const docs = this.customerdata.property_details?.kyc_documents?.uploaded_documents;
      docs.forEach((doc: any) => {
        this.uploadedDocumentsApi[doc.document_name] = doc.document_url;
      });
      if (this.customerdata.property_details.contact_details?.brand == "Others") {
        this.isOtherBrand = true;
      }
      if (
        this.customerdata?.property_details?.contact_details &&
        this.customerdata?.property_details?.property_address &&
        this.customerdata?.property_details?.kyc_documents &&
        this.customerdata?.property_details?.hotel_logo
      ) {
        this.hotelLogoUrl = this.customerdata.property_details?.hotel_logo
      }
      //End of newly added

      const country = this.customerdata.property_details.property_address?.property_country || '';
      const state = this.customerdata.property_details.property_address?.property_state || '';

      if (country) {
        const selectedCountry = COUNTRY_STATES.find(c => c.country === country);
        if (selectedCountry) {
          this.statesDropdownList = selectedCountry.states.map(s => ({ state: s, code: '', flag: '' }));
        }
      }

      this.onCountryOrStateChange(country, state, this.isInitialLoad);

      const patchData: any = {
        hotel_name: this.customerdata?.property_details?.contact_details?.hotel_name,
        contact_person: this.customerdata.property_details?.contact_details?.contact_person,
        designation: this.customerdata.property_details?.contact_details?.designation,
        primary_phone_number: this.customerdata.property_details?.contact_details?.primary_phone_number,
        secondary_phone_number: this.customerdata.property_details?.contact_details?.secondary_phone_number,
        email: this.customerdata.property_details.contact_details?.email,
        brand: this.customerdata.property_details.contact_details?.brand,
        other_brand_name: this.customerdata.property_details.contact_details?.other_brand_name,

        property_doorno: this.customerdata.property_details.property_address?.property_doorno,
        property_address: this.customerdata.property_details.property_address?.property_address,
        property_city: this.customerdata.property_details.property_address?.property_city,
        property_country: this.customerdata?.property_details.property_address?.property_country,
        property_state: this.customerdata.property_details.property_address?.property_state,
        property_location: this.customerdata.property_details.property_address?.property_location,

        property_pincode: this.customerdata.property_details.property_address?.property_pincode,
        property_size: this.customerdata.property_details.property_address.property_size,
        company_status: this.customerdata.property_details?.kyc_documents?.company_status,
        uploaded_documents: this.customerdata.property_details?.kyc_documents?.uploaded_documents,
        registered_address: this.customerdata.property_details?.kyc_documents?.registered_address,
        number_of_rooms: this.customerdata.property_details?.property_address?.number_of_rooms
      };

      if (this.taxField1Key) {
        patchData[this.taxField1Key] = this.taxField1Key === 'property_pan'
          ? (this.customerdata.property_details.property_address?.property_pan || '')
          : (this.customerdata.property_details.property_address?.property_vat || '');
      }
      if (this.taxField2Key) {
        patchData[this.taxField2Key] = this.taxField2Key === 'property_gst'
          ? (this.customerdata.property_details.property_address?.property_gst || '')
          : (this.customerdata.property_details.property_address?.property_tin || '');
      }

      this.customerProprtyDetailsForm.patchValue(patchData);

      // Sync selectedPropertySize so range validation works correctly on load
      const savedSize = this.customerdata.property_details?.property_address?.property_size;
      if (savedSize) {
        this.selectedPropertySize = savedSize;
      }
      // Newly added for documents upload
      //  this.uploadedDocumentsApi = this.customerdata.property_details?.kyc_documents?.uploaded_documents;
      this.originalUploadedDocuments = this.customerdata.property_details?.kyc_documents?.uploaded_documents || [];
      this.uploadedDocumentsApi = [...this.originalUploadedDocuments];
    }
    this.isInitialLoad = false;
  }

  async executeFunctions(): Promise<void> {
    this.getCustomerById()
      .then(() => {
        this.setFormValues() // Runs after data is fetched
        // Newly added: disable form in view-only mode
        // Newly commented & added code for avoid checking status
        // if (this.isViewMode || this.status === 'approved') {
        if (this.isViewMode) {
          // End of newly commented & added code for avoid checking status 
          setTimeout(() => {
            this.customerProprtyDetailsForm.disable();
          });
        }
        if (this.paymentDone) {
          setTimeout(() => {
            this.customerProprtyDetailsForm.get('property_size')?.disable();
            this.customerProprtyDetailsForm.get('number_of_rooms')?.disable();
            this.customerProprtyDetailsForm.get('property_country')?.disable();
            this.customerProprtyDetailsForm.get('property_state')?.disable();
            if (this.taxField1Key === 'property_vat') {
              this.customerProprtyDetailsForm.get('property_vat')?.disable();
            }
            if (this.taxField2Key === 'property_gst') {
              this.customerProprtyDetailsForm.get('property_gst')?.disable();
            }
          });
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
  //       console.log(this.countryDropdownList, "countryDropdownList");
  //       if (this.customerdata?.registered_address?.country != undefined && this.customerdata.registered_address?.country != null) {
  //         this.getStateData()

  //       }
  //       // console.log(this.countryList);
  //     },
  //     err => {
  //       if (err.error.statusCode === 403) {
  //         this.alertService.error('Session Time Out! Please login Again', this.options)
  //         this.router.navigate([`/login`], { skipLocationChange: false });
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
  /* getStateData() {
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === this.customerdata.registered_address?.country); if (selectedCountry) {
      //console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }
  }
  getStates(country_id: number) {
    let statesRequest = {
      "domain_name": "https://www.guestezee.com",
    "user_id": 16,
    "extras": {
        "find": {},
        "pagination": false,
        "paginationDetails": {
            "limit": 10000000,
            "pageSize": 2
        },
        "sorting": true,
        "sortingDetails": {
            "sortfield": "",
            "sortorder": -1
        }
    }
      // "domain_name": this.authTokenService.getDomain(),
      // "user_id": this.authTokenService.getUserId(),
      // "extras": {
      //   "find": {
      //     "countryid": country_id
      //   },
      //   "pagination": false,
      //   "paginationDetails": {
      //     "limit": 0,
      //     "pageSize": 2
      //   },
      //   "sorting": true,
      //   "sortingDetails": {
      //     "sortfield": "",
      //     "sortorder": -1
      //   }
      // }
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
  } */

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


  // async payNow() {
  //   let orderAmount = 10000;
  //   if (this.customerProprtyDetailsForm.value.property_size == "01-50 Rooms") {
  //     orderAmount = 10000;

  //   }
  //   if (this.customerProprtyDetailsForm.value.property_size == "51-101 Rooms") {
  //     orderAmount = 20000;


  //   }
  //   if (this.customerProprtyDetailsForm.value.property_size == "101-150 Rooms") {
  //     orderAmount = 30000;


  //   }
  //   if (this.customerProprtyDetailsForm.value.property_size == "50 and above Rooms") {
  //     orderAmount = 40000;


  //   }
  //   //console.log("this.custom data",this.customerdata);

  //   let endDate = new Date();
  //   endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
  //   let due_date = `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()}`; // Format as YYYY-MM-DD


  //   let orderData = {

  //     // "customer_id": this.customerdata.id,
  //     "customer_member_id": this.customerdata.id, //newly changed from customer_id to customer_member_id
  //     "status": "Awaiting Payment",
  //     "status_id": "1",
  //     "system_label": "Pending",
  //     "orderConfirmDate": new Date(),
  //     "subscription_end_date": due_date,
  //     "customer": {
  //       // "customer_id": this.customerdata.id,
  //       "customer_member_id": this.customerdata.id, //newly changed from customer_id to customer_member_id
  //       "customer_name": this.customerdata.first_name,
  //       "email": this.customerdata.email,
  //       "customer_type": "business customer",
  //       "phone_number": this.customerdata.phone_number,
  //       "address": this.customerdata.property_details.property_address.property_address,
  //       "brand": this.customerdata.property_details.contact_details.brand,
  //       "hotel_name": this.customerdata.property_details.contact_details.hotel_name,
  //       // "member_id":this.generateMemberID(orderAmount),  
  //       "property_size": this.customerdata.property_details.property_address.property_size,
  //       "is_email_opt_in": false
  //     },
  //     "delivery": {
  //       "outlet_id": "1",
  //       "outlet_name": "guest ezee",
  //       "email": this.customerdata.property_details.contact_details.email,

  //       "phone_number": this.customerdata.property_details.contact_details.primary_phone_number,
  //       "address": this.customerdata.property_details.property_address.property_address,

  //       "is_email_opt_in": false
  //     },


  //     "order_review": {
  //       "order_summary": {
  //         "sub_total": Number(orderAmount),

  //         "tax": 0.00,

  //         "order_total_amount": Number(orderAmount)

  //       }
  //     },





  //     "organization_id": 46,
  //     "store_id": 1,



  //     "created_by": this.localStorageService.get('UserId'),
  //     "is_deleted": false,
  //     "is_active": true,
  //     "modified_by": 16,

  //   }
  //   let requestData = {
  //     domain_name: this.authTokenService.getDomain(),
  //     user_id: 1,
  //     payload: {
  //       order_creation: orderData,
  //     },
  //     extras: {
  //       find: {
  //         id: ""
  //       }
  //     }
  //   }
  //   this.hotelenrollmenttabviewService.orderUpsert(requestData).subscribe(
  //     resp => {
  //       let res: any = resp;
  //       this.upsertData = res.result.data;
  //       //console.log(this.upsertData,'this.upsertData')

  //       if (res.success) {

  //         let user = {
  //           exist: false,
  //           password: false,
  //           email: false
  //         }
  //         this.getHdfcData();

  //       }
  //     })


  // }

  // getHdfcData() {
  //   //console.log("123")
  //   let hdfcData = {
  //     domain_name: this.authTokenService.getDomain(),
  //     oid: this.upsertData[0].id,
  //     amount: 1500,
  //   }
  //   this.checkoutApiService.getHDFClink(hdfcData).then(
  //     respData3 => {

  //       let res3: any = respData3;
  //       //console.log("123",res3)
  //       if (res3 !== false) {
  //         var form = document.createElement("form");
  //         var element1 = document.createElement("input");
  //         var element2 = document.createElement("input");
  //         form.method = "POST";
  //         form.action = res3.link;
  //         form.target = '_self'
  //         element1.value = res3.encrequest;
  //         element1.name = "encRequest";
  //         form.appendChild(element1);
  //         element2.value = res3.accesscode;
  //         element2.name = "access_code";
  //         form.appendChild(element2);
  //         document.body.appendChild(form);
  //         // this.loaderService.emitComplete();
  //         form.submit();
  //         // this.CheckoutLocalStorageService.removeOrderId();
  //         // window.open("https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=AVJT16KI07CA37TJAC&encRequest=0ae90ee5da7391dbfa55bccc526d8366460f50701e9fdcafbfee1a7ba1b4c9dffc7d4a40107a85e3e5c51598aa1803cc4eeace4bfb0f5f3730b1e8a908b69dadb7ee1a4666c3e16af8dcd5f51febbfc71a76b84f58735aea84ff54e8c49202a493724321f1172976a76798968d8a289e4534ebfffe0033bd8d3336113b548e47adb6ffc205e4056811ffe0309bb9ebbe2f05cbc0b36c3453a72cbb6ed7198348e40732622ecfc1586ceb0ede38a08e4bce9265b0d21677daeeefe23f1ca2da3a")
  //       }
  //     }
  //   );
  // }

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
      // this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }
  }


  // getOrderData(customer_id: number) {
  // getOrderData(customer_member_id: number) {
  getOrderData(memberId: any) {
    //console.log("111")
    let formatJson = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          // customer_id: Number(customer_id),
          // customer_member_id: Number(customer_member_id), //newly changed from customer_id to customer_member_id
          customer_member_id: memberId,
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

  updatePricingAndValidation(numberOfRooms?: number, selectedSize?: string) {
    const control = this.customerProprtyDetailsForm.get('number_of_rooms');
    const rooms = numberOfRooms ?? control?.value ?? 0;
    const propertySize = selectedSize ?? this.selectedPropertySize;
    // --- Determine price per room and update cost display
    const pricePerRoom = this.propertyPricingMap[propertySize] ?? this.singleRoomFinalPrice;
    this.finalPrice = pricePerRoom;
    this.totalCost = rooms > 0 ? pricePerRoom * rooms * 12 : 0;

    // --- Validate: rooms must fall within the min/max band of the selected property size
    const range = this.propertySizeRanges[propertySize];
    const errors: any = {};

    if (!rooms || rooms === '') {
      errors['required'] = true;
    } else if (Number(rooms) < 1) {
      errors['min'] = true;
    } else if (range) {
      if (Number(rooms) < range.min) {
        errors['belowMin'] = true;
      } else if (range.max !== Infinity && Number(rooms) > range.max) {
        errors['maxExceeded'] = true;
      }
    }
    control?.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  // Triggered when number input changes
  onRoomNumberChange() {
    const rooms = this.customerProprtyDetailsForm.get('number_of_rooms')?.value;
    this.updatePricingAndValidation(rooms, undefined);
  }

  // Triggered when property size radio is changed
  onPropertySizeChange(option: string) {
    this.selectedPropertySize = option;
    // const rooms = this.customerProprtyDetailsForm.get('number_of_rooms')?.value ?? 0;
    const control = this.customerProprtyDetailsForm.get('number_of_rooms');
    let rooms = control?.value ?? 0;
    // Mark control as touched so errors appear immediately
    control?.markAsTouched();
    this.updatePricingAndValidation(rooms, option);
  }


  // Newly added function to navigate to the next tab
  nextTab() {
    let nextTab = document.getElementById('technical-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  previousTab() {
    let nextTab = document.getElementById('office-tab');
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
    }
  }

  back() {
    this.previousTab();
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const input = event.target as HTMLInputElement;

    if (charCode < 48 || charCode > 57) event.preventDefault();
    if (charCode === 48 && input.value.length === 0) event.preventDefault();
  }

  /* Newly added getters and methods for documents and KYC */
  get selectedDocumentList(): { name: string }[] {
    const status = this.customerProprtyDetailsForm.get('company_status')?.value;
    return this.companyStatusDocuments[status] || [];
  }

  get nextPendingDocument(): string | null {
    for (let doc of this.selectedDocumentList) {
      if (!this.uploadedDocuments[doc.name]) {
        return doc.name;
      }
    }
    return null;
  }

  isAllDocumentsUploaded(): boolean {
    return this.selectedDocumentList.length > 0 &&
      this.selectedDocumentList.every(doc => !!this.uploadedDocuments[doc.name]);
  }

  get hasPendingDocument(): boolean {
    return this.uploadedDocumentsApi.some((doc: any) => doc.document_url.trim() === '');
  }

  get nextApiPendingDocument(): string | null {
    const pendingDoc = this.uploadedDocumentsApi.find((doc: any) => doc.document_url.trim() === '');
    return pendingDoc ? pendingDoc.document_name : null;
  }

  isAllApiDocumentsUploaded(): boolean {
    return this.uploadedDocumentsApi.length > 0 &&
      this.uploadedDocumentsApi.every(
        (doc: any) => !!doc.document_url && doc.document_url.trim() !== ''
      );
  }

  onFileChange(event: Event) {
    var reader = new FileReader();
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        this.alertService.error('Only PDF, JPEG, JPG files are allowed.', this.options);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.error('File size must be less than 2MB.', this.options);
        return;
      }
      const currentDoc = this.selectedUploadDoc ?? this.nextPendingDocument;
      if (currentDoc) {
        this.uploadedDocuments[currentDoc] = file;
        reader.readAsDataURL(file);
        let headers = new HttpHeaders().set("source", "Brand").set("domain_name", this.authTokenService.getDomain());
        let formData = new FormData();
        formData.append('upload', file);
        this.profileService.sendImage(formData, headers).subscribe(resp => {
          if (resp && resp.success === 1 && resp.status_code === 200) {
            let imgVariable = resp.result.data[0];
            const docObject = {
              document_name: currentDoc,
              document_url: imgVariable.location
            };
            this.uploaded_documents = this.uploaded_documents.filter(doc => doc.document_name !== currentDoc);
            this.uploaded_documents.push(docObject);
            // Newly added for document error
            // Keep uploadedDocumentsApi in sync so validation matches if template switches
            const apiIndex = this.uploadedDocumentsApi.findIndex((doc: any) => doc.document_name === currentDoc);
            if (apiIndex !== -1) {
              this.uploadedDocumentsApi[apiIndex].document_url = imgVariable.location;
            } else {
              this.uploadedDocumentsApi.push({
                document_name: currentDoc,
                document_url: imgVariable.location
              });
            }
            // Ended for document error
            if (!this.nextPendingDocument) {
              this.alertService.success('All required documents uploaded successfully.', this.options);
            }
          }
        });
      }
      fileInput.value = '';
      this.selectedUploadDoc = null;
    }
  }

  triggerUpload(docName: string, input: HTMLInputElement) {
    this.selectedUploadDoc = docName;
    input.value = '';
    input.click();
  }

  removeDocument(docName: string) {
    if (this.uploadedDocuments[docName]) {
      delete this.uploadedDocuments[docName];
      this.uploaded_documents = this.uploaded_documents.filter(doc => doc.document_name !== docName);
      //  Newly added for document error
      // Keep uploadedDocumentsApi in sync by clearing the URL for this document
      const apiIndex = this.uploadedDocumentsApi.findIndex((doc: any) => doc.document_name === docName);
      if (apiIndex !== -1) {
        this.uploadedDocumentsApi[apiIndex].document_url = '';
      }
      // Ended for document error
    } else {
      this.alertService.error(`No file uploaded for ${docName}`, this.options);
    }
  }

  previewDocument(docName: string) {
    const file = this.uploadedDocuments[docName];
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else {
      this.alertService.error(`No file uploaded for ${docName}`, this.options);
    }
  }

  onFileChangeApi(event: Event) {
    const reader = new FileReader();
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        this.alertService.error('Only PDF, JPEG, JPG files are allowed.', this.options);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.error('File size must be less than 2MB.', this.options);
        return;
      }
      const currentDoc = this.selectedApiDocName ?? this.nextApiPendingDocument;
      if (currentDoc) {
        reader.readAsDataURL(file);
        let headers = new HttpHeaders().set("source", "Brand").set("domain_name", this.authTokenService.getDomain());
        let formData = new FormData();
        formData.append('upload', file);
        this.profileService.sendImage(formData, headers).subscribe(resp => {
          if (resp && resp.success === 1 && resp.status_code === 200) {
            let imgVariable = resp.result.data[0];
            const index = this.uploadedDocumentsApi.findIndex((doc: any) => doc.document_name === currentDoc);
            if (index !== -1) {
              this.uploadedDocumentsApi[index].document_url = imgVariable.location;
            }
            this.uploaded_documents = [...this.uploadedDocumentsApi];
            if (!this.hasPendingDocument) {
              this.alertService.success('All required documents uploaded successfully.', this.options);
            }
          }
        });
      }
      fileInput.value = '';
      this.selectedApiDocName = null;
    }
  }

  removeDocumentApi(document: any) {
    const index = this.uploadedDocumentsApi.findIndex((doc: any) => doc.document_url === document.document_url);
    if (index !== -1) {
      this.uploaded_documents = this.uploadedDocumentsApi.filter((doc: any) => doc.document_url !== document.document_url);
      this.uploadedDocumentsApi = this.uploadedDocumentsApi.map((doc: any) => {
        if (doc.document_url === document.document_url) {
          return { ...doc, document_url: '' };
        }
        return doc;
      });
    } else {
      this.alertService.error(`No file uploaded for ${document.document_name}`, this.options);
    }
  }

  previewApiDocument(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.alertService.error(`No file uploaded for this document`, this.options);
    }
  }

  triggerApiUpload(docName: string, input: HTMLInputElement) {
    this.selectedApiDocName = docName;
    input.value = '';
    input.click();
  }

  onLogoChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        this.alertService.error('Only JPG, JPEG, or PNG files are allowed.', this.options);
        fileInput.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.error('File size must be less than 2MB.', this.options);
        fileInput.value = '';
        return;
      }

      // Validate dimensions: recommended size is 200 × 200 pixels (do not restrict uploading)
      const img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = () => {
        // Newly commented for 200*200 check
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        // End of newly commented for 200*200 check
        window.URL.revokeObjectURL(img.src);
        // Newly commented for 200*200 check
        // if (width !== 200 || height !== 200) {
        //   this.alertService.error(`Image dimensions must be exactly 200 × 200 pixels. (Uploaded image: ${width} × ${height} pixels)`, this.options);
        //   fileInput.value = '';
        //   return;
        // }
        // End of newly commented for 200*200 check
        this.uploadAndPreviewLogo(file);
      };

      img.onerror = () => {
        window.URL.revokeObjectURL(img.src);
        this.alertService.error('Invalid image file.', this.options);
        fileInput.value = '';
      };

      fileInput.value = '';
    }
  }

  uploadAndPreviewLogo(file: File) {
    this.logoUploading = true;
    this.hotelLogo = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.hotelLogoUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    const headers = new HttpHeaders().set('source', 'Brand').set('domain_name', this.authTokenService.getDomain());
    const formData = new FormData();
    formData.append('upload', file);
    this.profileService.sendImage(formData, headers).subscribe({
      next: (resp: any) => {
        if (resp && resp.success === 1 && resp.status_code === 200) {
          const imgVariable = resp.result.data[0];
          this.hotelLogoUrl = imgVariable.location;
          this.alertService.success('Logo uploaded successfully.', this.options);
        } else {
          this.alertService.error('Failed to upload logo. Please try again.', this.options);
        }
        this.logoUploading = false;
      },
      error: () => {
        this.alertService.error('Error uploading logo.', this.options);
        this.logoUploading = false;
      }
    });
  }

  previewLogo() {
    if (this.hotelLogoUrl) {
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`
        <html>
          <head><title>Hotel Logo Preview</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background: black;">
            <img src="${this.hotelLogoUrl}" alt="Company Logo" style="max-width:100%;max-height:100%;object-fit:contain;">
          </body>
        </html>
      `);
      }
    } else {
      this.alertService.error('Logo not uploaded yet.', this.options);
    }
  }

  removeLogo() {
    if (this.hotelLogoUrl) {
      this.hotelLogo = null;
      this.hotelLogoUrl = null;
      this.alertService.success('Logo removed.', this.options);
    } else {
      this.alertService.error('No logo to remove.', this.options);
    }
  }

  getAllSubscriptionsAndSetGeneral() {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: { find: {}, pagination: true, paginationDetails: { limit: 0, pageSize: 10 } }
    };
    this.hotelenrollmenttabviewService.getAllSubscriptionDetails(requestBody).subscribe(
      (resp: any) => {
        if (resp?.result?.data?.length) {
          this.plans = resp.result.data;
          this.propertyPricingMap = {};
          this.singleRoomFinalPrice = this.singleRoomFinalPrice || 0;
          this.plans.forEach((plan: any) => {
            if (!plan || !plan.name) return;
            this.propertyPricingMap[plan.name] = plan.finalPrice ?? 0;
            if (plan.name === 'SingleRoomPricing') {
              this.singleRoomFinalPrice = plan.finalPrice ?? this.singleRoomFinalPrice;
            }
          });
          this.finalPrice = this.propertyPricingMap[this.selectedPropertySize] ?? this.singleRoomFinalPrice ?? 0;
          this.totalCost = this.getTotalCostForOption(this.selectedPropertySize);
        }
      },
      err => {
        this.alertService.error('Failed to load plans', this.options);
      }
    );
  }

  getTotalCostForOption(option: string): number {
    const limit = this.propertySizeLimits[option];
    const price = this.propertyPricingMap[option] || this.singleRoomFinalPrice;
    return price * (limit === Infinity ? 200 : limit) * 12;
  }

  onCompanyStatusChange(status: string) {
    if (!status) return;
    const templates = this.companyStatusDocuments[status] || [];
    const isSameAsOriginal = status === this.originalCompanyStatus;
    const currentMap = new Map<string, string>();
    if (isSameAsOriginal) {
      this.originalUploadedDocuments.forEach((doc: any) => {
        if (doc && doc.document_name) {
          currentMap.set(doc.document_name, doc.document_url || '');
        }
      });
    }
    this.uploadedDocumentsApi = templates.map(t => ({
      document_name: t.name,
      document_url: currentMap.get(t.name) || ''
    }));
    this.uploaded_documents = [...this.uploadedDocumentsApi];
    this.uploadedDocuments = {};
  }

  onCountryOrStateChange(country: string, state: string, isInitialLoad = false) {
    if (!country) {
      this.showTaxSection = false;
      if (this.taxField1Key) this.customerProprtyDetailsForm.removeControl(this.taxField1Key);
      if (this.taxField2Key) this.customerProprtyDetailsForm.removeControl(this.taxField2Key);
      this.taxField1Key = '';
      this.taxField2Key = '';
      return;
    }

    this.showTaxSection = true;
    const isIndia = country === 'India';
    const newField1Key = isIndia ? 'property_pan' : 'property_vat';
    const newField2Key = isIndia ? 'property_gst' : 'property_tin';

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
      this.customerProprtyDetailsForm.removeControl(this.taxField1Key);
    }
    if (this.taxField2Key && this.taxField2Key !== newField2Key) {
      this.customerProprtyDetailsForm.removeControl(this.taxField2Key);
    }

    this.taxField1Key = newField1Key;
    this.taxField2Key = newField2Key;
    this.taxSectionTitle = newTaxSectionTitle;
    this.taxField1Label = newTaxField1Label;
    this.taxField2Label = newTaxField2Label;

    if (!this.customerProprtyDetailsForm.contains(newField1Key)) {
      const existingVal1 = isInitialLoad
        ? (isIndia
          ? (this.customerdata?.property_details?.property_address?.property_pan || '')
          : (this.customerdata?.property_details?.property_address?.property_vat || ''))
        : '';

      const ctrl1 = new FormControl(existingVal1, [
        Validators.required,
        CustomValidators.noWhitespaceValidator,
        CustomValidators.dynamicTaxValidator('VAT')
      ]);
      this.customerProprtyDetailsForm.addControl(newField1Key, ctrl1);
    } else {
      const ctrl1 = this.customerProprtyDetailsForm.get(newField1Key);
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

    if (!this.customerProprtyDetailsForm.contains(newField2Key)) {
      const existingVal2 = isInitialLoad
        ? (isIndia
          ? (this.customerdata?.property_details?.property_address?.property_gst || '')
          : (this.customerdata?.property_details?.property_address?.property_tin || ''))
        : '';

      const ctrl2 = new FormControl(existingVal2, [
        Validators.required,
        CustomValidators.noWhitespaceValidator,
        CustomValidators.dynamicTaxValidator('TIN')
      ]);
      this.customerProprtyDetailsForm.addControl(newField2Key, ctrl2);
    } else {
      const ctrl2 = this.customerProprtyDetailsForm.get(newField2Key);
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

    if (this.customerProprtyDetailsForm.disabled || this.isViewMode) {
      this.customerProprtyDetailsForm.get(newField1Key)?.disable();
      this.customerProprtyDetailsForm.get(newField2Key)?.disable();
    } else if (this.paymentDone) {
      if (newField1Key === 'property_vat') {
        this.customerProprtyDetailsForm.get('property_vat')?.disable();
      }
      if (newField2Key === 'property_gst') {
        this.customerProprtyDetailsForm.get('property_gst')?.disable();
      }
    }

    // Programmatic error triggering on country/state changes
    const ctrl1 = this.customerProprtyDetailsForm.get(newField1Key);
    if (ctrl1) {
      if ((!isInitialLoad && taxSystemChanged) || (isInitialLoad && ctrl1.value)) {
        ctrl1.markAsTouched();
      }
    }
    const ctrl2 = this.customerProprtyDetailsForm.get(newField2Key);
    if (ctrl2) {
      if ((!isInitialLoad && taxSystemChanged) || (isInitialLoad && ctrl2.value)) {
        ctrl2.markAsTouched();
      }
    }
  }

  allowPincodeInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const country = this.customerProprtyDetailsForm.get('property_country')?.value || 'default';
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
    const country = this.customerProprtyDetailsForm.get('property_country')?.value || 'default';
    const rule = PINCODE_RULES[country] || PINCODE_RULES['default'];

    let regex = /^[a-zA-Z0-9\s\-]+$/;
    if (rule.digitsOnly) {
      regex = /^\d+$/;
    }
    if (!regex.test(pasted) || pasted.length > rule.maxLength) {
      event.preventDefault();
    }
  }

  onlyAllowAlphaNumeric(event: KeyboardEvent) {
    const charCode = event.key;
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

}

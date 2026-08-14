import { CommonModule } from '@angular/common';
import { DOMAIN_NAME, ENDPOINTS } from '../../app.config';
import { AlertsService } from './../../shared/alerts/alerts.service';
import { Component, Output, EventEmitter, AfterViewInit, Input, OnInit } from '@angular/core';
import { LocalStorageService } from './../../auth-services/local-storage.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, AbstractControl, Validators } from '@angular/forms';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
// Newly added
import { TechnicalInfoService } from './technical-info.service';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { EditTechnicalInfoComponent } from './edit-technical-info/edit-technical-info.component';
// Newly added for payment
declare var $: any;
// import * as bootstrap from 'bootstrap';
declare var bootstrap: any;
import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-technical-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EditTechnicalInfoComponent, AlertsComponent],
  templateUrl: './technical-info.component.html',
  styleUrl: './technical-info.component.scss'
})

export class HotelTechnicalInfoComponent implements OnInit {
  toggleSwitch(element: any) {
    element.classList.toggle("active");
  }

  // Newly added
  @Output() continue = new EventEmitter<void>();
  hotelId: Number | null = null;
  customerdata: any;
  status !: string;
  selectedTab = "lock";
  selectedTechInfo: any;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  showEdit: boolean = true;
  upsertData: any;
  memberId: string | null = null;
  generalTechInfoData: any;
  allinfoData: any;
  customerTechInfo: any;
  technicalInfoData: any; // hold iniital technicalInfo data
  technicalInfodatalength: any; // hold iniital technicalInfo data length
  checkExistingtechnicalInfoChoosen!: Number; // check if technicalInfo is already
  isTechnicalInfoExists: boolean = false; // Flag to check if TechnicalInfo exists
  technicalInfos: any; //store whole technicalInfo data
  selectedTechnicalInfoToCreate: any[] = []; // Holds the chosen technicalInfo obj
  isSelectedTechnicalInfoId: any; // Holds the chosen technicalInfo obj
  customerTechnicalInfodata: any;
  isCustomerChoosen: boolean = false;
  // Track which technical info items are enabled in DB for this customer (by id)
  enabledCustomerTechnicalInfoIds: Set<number> = new Set<number>();
  iscancelVisible = false;
  isMemberId: boolean = false;
  activeTab: number = 1;
  customerStatus: any;
  // Ecom Integration Settings 
  @ViewChild('ecomIntegrationModal') ecomIntegrationModal!: ElementRef;
  ecomIntegrationModalInstance: any;
  selectedEcomIntegrationData: any = null;
  ecomIntegrationForm: FormGroup;
  ecomTechnicalInfoForm: FormGroup;
  // End of Ecom Integration Settings 
  // Loader flag - show loader until initial data is loaded (same as department / service tab)
  isLoading: boolean = false;
  /** When false, parent (Hotels) loader is still showing; don't show Technical Info until true to avoid two loaders at once. */
  @Input() parentLoaderDone: boolean = true;
  isViewMode: boolean = false;
  modifiedTechnicalInfos: any[] = [];
  originalEnabledState: { [key: number]: boolean } = {};
  // Newly added & commented for disabled after payment 
  @Input() isApproved: boolean = false;
  //  End of newly added & commented for disabled after payment  

  constructor(
    private localService: LocalStorageService,
    private authTokenService: AuthTokenService,
    private router: Router,
    private alertsService: AlertsService,
    private hotelenrollmentservice: HotelEnrollmentTabviewService,
    private loaderService: LoaderService,
    private profileSrvice: ProfileService,
    private activatedRoute: ActivatedRoute,
    private technicalInfoService: TechnicalInfoService,
    private fb: FormBuilder) {
    // Ecom Integration Settings 
    // Initialize Ecom Integration forms
    this.ecomIntegrationForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      type: [{ value: '', disabled: true }],
      // api_url: ['', [Validators.pattern(/^(http|https):\/\/[^ "]+$/)]]
      api_url: [{ value: '', disabled: true }]
    });
    this.ecomTechnicalInfoForm = this.fb.group({
      technicalInfo: this.fb.array([])
    });
    // End of Ecom Integration Settings 
  }

  async ngOnInit(): Promise<void> {
    this.isViewMode = this.router.url.includes('hotel-preview');
    await this.refreshData();

    // Listen for refresh events from other tabs (e.g., Property Details)
    this.hotelenrollmentservice.currentData.subscribe((event: any) => {
      if (event === 'refreshTechnicalInfo') {
        this.refreshData();
      }
    });
  }

  async refreshData(): Promise<void> {
    // Get hotelId from URL instead of local storage for better reliability
    const routeId = this.activatedRoute.parent?.snapshot.paramMap.get('id') ||
      this.activatedRoute.snapshot.paramMap.get('id');
    this.hotelId = routeId ? Number(routeId) : null;
    // Always show loader while initializing
    this.isLoading = true;
    try {
      if (this.hotelId && this.hotelId !== 0) {
        // Fetch customer details using the ID from URL to get the memberId
        await this.getCustomerById();
        this.getAllTechnicalInfo();
      }
    } catch (err) {
      this.isLoading = false;
      ////console.error('Failed to get customer by ID:', err);
    }
  }

  async customerUpdate() {
    delete this.customerdata._id;
    delete this.customerdata.password;
    delete this.customerdata.password_to_customer;
    ////console.log(this.customerdata._id, this.customerdata, "test check ");
    // this.customerdata["status"] = 'approved';
    //  Password key reset value
    // this.customerdata["password"] = this.localService.get('Password');
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: this.customerdata
      },
      extras: {
        find: {
          // id: this.hotelId
          customer_member_id: this.memberId
        }
      }
    }
    this.hotelenrollmentservice.updateCustomer(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // ////console.log(resp);
            this.alertsService.success(resp.message, this.options);
            // this.payNow();
            this.localService.set('maxTabReached', 4);
            // this.onContinue();
            setTimeout(() => {
              this.router.navigate([`/all-customers`], { skipLocationChange: false });
            }, 1000);
            this.router.navigate(['/all-customers'], { state: { result: resp.message }, relativeTo: this.activatedRoute, skipLocationChange: false });
          }
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertsService.error(resp.message, this.options);
            }
          }
          else if (resp.message && resp.status_code !== 200) {
            this.alertsService.error(resp.message, this.options);
          }
          else {
            this.alertsService.error('Something bad happened. Please try again!', this.options);
          }
        }
      },
      err => {
        this.loaderService.emitComplete();
        if (err.error.statusCode === 403) {
          this.alertsService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`], { skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertsService.error(err.error.message, this.options)
        }
        else {
          this.alertsService.error('Something bad happened. Please try again!', this.options);
        }
      }
    )
  }



  async getCustomerById(): Promise<void> {
    // console.log('Hotel ID:', this.hotelId);
    return new Promise((resolve, reject) => {
      const requestBody = {
        // domain_name: DOMAIN_NAME,
        // user_id: USER_ID,
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.hotelId // Use URL-based hotelId
          }
        }
      };
      this.hotelenrollmentservice.getLoginCustomerById(requestBody).subscribe(
        async resp => {
          this.loaderService.emitComplete();
          if (resp?.result?.data?.length) {
            this.customerdata = resp.result.data[0];
            // console.log('Customer Data:', this.customerdata);
            this.status = this.customerdata.status;
            this.isMemberId = this.customerdata.status === 'Order Confirmed';
            this.memberId = this.customerdata.customer_member_id;
            this.localService.set('MemberId', this.memberId);
            // console.log(this.memberId, "Member id(In technical info)");
            // console.log('Member ID:', this.memberId);
            // Newly added for disabling form on payment done to approving the customer
            this.customerStatus = this.customerdata.status;

            // Now that we have the memberId, fetch the technical info
            this.getAllTechnicalInfo();
            resolve();
          } else {
            reject(' No customer data found.');
          }
          // Ended
        },
        err => {
          this.isLoading = false;
          this.loaderService.emitComplete();
          if (err.error?.statusCode === 403) {
            this.alertsService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate(['/login'], { skipLocationChange: false });
          } else if (err.error?.message) {
            this.alertsService.error(err.error.message, this.options);
          } else {
            this.alertsService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);
        }
      );
    });
  }

  /*  getAllTechnicalInfo() {
     let checkExistingTechnicalInfoAvailbility = {
       // domain_name: DOMAIN_NAME,
       // user_id: USER_ID, //Default user id
       domain_name: this.authTokenService.getDomain(),
       user_id: this.authTokenService.getUserId(),
       "extras": {
         "find": {
           // "customer_id": this.hotelId
           member_id: this.memberId
         }
       }
     }
 
     this.hotelenrollmentservice.getAllTechnicalInfo(checkExistingTechnicalInfoAvailbility).subscribe(
       (resp: any) => {
         this.loaderService.emitComplete();
         if (resp) {
           this.technicalInfodatalength = resp.result.data.length;
 
           // ---------------------------
           // CASE 1: CUSTOMER DATA EXISTS
           // ---------------------------
           if (this.technicalInfodatalength > 0) {
             const customerData = resp.result.data[0];
             const customerTechInfo = customerData.customer_technical_info || [];
 
             // Step 1: Get enabled customer-specific technical info
             const enabledCustomerTechInfo = customerTechInfo.filter((item: any) => item.is_enabled === true);
             const enabledCustomerIds = new Set(enabledCustomerTechInfo.map((item: any) => item.id));
             //  Ecom Integration Settings - Refreshes enabled technical-info ids from the data we just saved
             // Track which technical infos are enabled in DB for this customer
             this.enabledCustomerTechnicalInfoIds = new Set<number>(
               Array.from(enabledCustomerIds).map((id: any) => Number(id))
             );
             // Ended
             this.generalTechInfoData = customerTechInfo.filter((item: any) => item.type == this.selectedTab);
             this.technicalInfoData = customerData;
             this.showEdit = true;
             this.isTechnicalInfoExists = true;
             this.isCustomerChoosen = true;
 
             // Step 2: Fetch Common Technical Info
             const commonReq = {
               // domain_name: DOMAIN_NAME,
               // user_id: USER_ID,
               domain_name: this.authTokenService.getDomain(),
               user_id: this.authTokenService.getUserId(),
               extras: {
                 find: {}
               }
             };
 
             this.hotelenrollmentservice.getAllTechnicalInfo(commonReq).subscribe(
               (commonResp: any) => {
                 this.isLoading = false;
                 if (commonResp.success === 1 && commonResp.status_code === 200) {
                   const allCommonData = commonResp.result.data || [];
 
                   // REMOVE ITEMS WITH NAMES: "SMS Templates and Header" and "HDFC Gateway"
                   const rawCommonTechInfo = allCommonData
                     // Newly added for getting member id for customer type
                     // .filter((item: any) => item.customer_id === undefined)
                     .filter((item: any) => item.member_id === undefined && item.customer_id === undefined && item.is_active === true)
                     // Ended for getting member id for customer type
                     .filter((item: any) =>
                       !["SMS Delivery Template", "HDFC Gateway"].includes(item.name)
                     );
 
                   // Step 3: Filter common items (not enabled + not duplicate)
                   const filteredCommonTechInfo = rawCommonTechInfo.filter(
                     (item: any) =>
                       (!item.hasOwnProperty('is_enabled') || item.is_enabled === false) &&
                       !enabledCustomerIds.has(item.id)
                   );
 
                   // Step 4: Combine both sets
                   this.technicalInfos = [...enabledCustomerTechInfo, ...filteredCommonTechInfo];
                   this.allinfoData = this.technicalInfos;
 
                   // CRITICAL: Update generalTechInfoData so the UI reflects the merged list immediately
                   this.generalTechInfoData = this.allinfoData?.filter((item: any) => item.type == this.selectedTab);
                 }
               },
               () => {
                 this.isLoading = false;
               }
             );
           }
 
           // ---------------------------
           // CASE 2: NO CUSTOMER DATA
           // ---------------------------
           if (this.technicalInfodatalength == 0) {
             let requestBody = {
               // domain_name: DOMAIN_NAME,
               // user_id: USER_ID,
               domain_name: this.authTokenService.getDomain(),
               user_id: this.authTokenService.getUserId(),
               "extras": {
                 "find": {}
               }
             }
 
             this.hotelenrollmentservice.getAllTechnicalInfo(requestBody).subscribe(
               (resp: any) => {
                 this.loaderService.emitComplete();
                 this.isLoading = false;
 
                 if (resp.success === 1 && resp.status_code === 200) {
                   this.showEdit = false;
                   this.isTechnicalInfoExists = false;
 
                   if (resp.result.data.length > 0) {
                     // REMOVE ITEMS WITH NAMES: "SMS Templates and Header" and "HDFC Gateway"
                     this.technicalInfos = resp.result.data
                       // Newly added for getting member id for customer type
                       // .filter((technicaalInfo: any) => technicaalInfo.customer_id == undefined)
                       .filter((technicaalInfo: any) => technicaalInfo.member_id == undefined && technicaalInfo.customer_id == undefined && technicaalInfo.is_active === true)
                       // Ended for getting member id for customer type
                       .filter((item: any) =>
                         !["SMS Delivery Template", "HDFC Gateway"].includes(item.name)
                       );
 
                     this.allinfoData = this.technicalInfos;
 
                     this.generalTechInfoData = this.technicalInfos?.filter(
                       (item: any) => item.type == this.selectedTab
                     );
                   }
                 }
               },
               (err: any) => {
                 this.isLoading = false;
                 if (err.error?.statusCode === 403) {
                   this.alertsService.error('Session Time Out! Please login Again', this.options)
                   this.router.navigate([`/login`], { skipLocationChange: false });
                 }
                 else if (err.error?.message) {
                   this.alertsService.error(err.error.message, this.options)
                 }
                 else {
                   this.alertsService.error('Something bad happened. Please try again!', this.options);
                 }
               }
             );
 
           }
         }
       },
       (err: any) => {
         this.isLoading = false;
         this.loaderService.emitComplete();
 
         if (err.error?.statusCode === 403) {
           this.alertsService.error('Session Time Out! Please login Again', this.options);
           this.router.navigate([`/login`], { skipLocationChange: false });
         } else if (err.error.message) {
           this.alertsService.error(err.error.message, this.options);
         } else {
           this.alertsService.error('Something bad happened. Please try again!', this.options);
         }
       }
     );
   } */


  getIsActive(technicalInfo: any): boolean {
    if (!this.selectedTechnicalInfoToCreate || !Array.isArray(this.selectedTechnicalInfoToCreate)) {
      return false;
    }
    const match = this.selectedTechnicalInfoToCreate.find(
      (item: any) => item.id === technicalInfo.id
    );
    return match ? match.is_active : false;
  }

  async technicalInfoCreate(selectedTechnicalInfoToCreate: any): Promise<void> {
    const memberId = this.localService.get('MemberId');
    // console.log(memberId, 'Tech member id');
    // delete this.selectedTechnicalInfoToCreate._id
    return new Promise((resolve, reject) => {
      // Strip nested customer_technical_info from each item — raw items from the DB
      // carry this sub-array, which would cause recursive nesting in the payload.
      const cleanedPayload = Array.isArray(selectedTechnicalInfoToCreate)
        ? selectedTechnicalInfoToCreate.map(({ customer_technical_info, ...rest }: any) => rest)
        : selectedTechnicalInfoToCreate;

      let requestBody = {
        // domain_name: DOMAIN_NAME,
        // user_id: USER_ID,
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          create_technical_info: {
            customer_id: this.hotelId,
            customer_technical_info: cleanedPayload,
            member_id: this.memberId
          }
        }
      };
      //Call API
      this.technicalInfoService.addCustomerTechnicalInfo(requestBody).subscribe(
        (resp: any) => {
          this.loaderService.emitComplete();
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
              this.customerTechnicalInfodata = resp.result.data;
              ////console.log(this.customerTechnicalInfodata, "Customer Technical Info");
              this.isSelectedTechnicalInfoId = selectedTechnicalInfoToCreate.id;
              // ////console.log('Selected technical info id', this.isSelectedTechnicalInfoId); 
              ////console.log("Property size:", this.customerdata.property_details.property_address.property_size);
              this.isTechnicalInfoExists = true;

              // Ecom Integration Settings - Automatically sync Hotel_Code if a PMS integration is enabled
              if (Array.isArray(selectedTechnicalInfoToCreate)) {
                const enabledPms = selectedTechnicalInfoToCreate.find((item: any) =>
                  item.is_enabled === true &&
                  (item.type === 'pos') &&
                  (item.name?.toLowerCase() === 'win hms' || item.name?.toLowerCase() === 'oracle')
                );
                if (enabledPms) {
                  // console.log('Syncing Hotel_Code from active PMS integration:', enabledPms.name);
                  this.updateCustomerHotelCodeFromEcomAttributes(enabledPms.attributes || [], enabledPms.name);
                } else {
                  const disabledPms = selectedTechnicalInfoToCreate.find((item: any) =>
                    item.type === 'pos' &&
                    (item.name?.toLowerCase() === 'win hms' || item.name?.toLowerCase() === 'oracle')
                  );
                  if (disabledPms) {
                    this.updateCustomerHotelCodeFromEcomAttributes([], disabledPms.name);
                  }
                }
              }

              this.updateCustomer();
              // this.customerdata();
              ////console.log("TechnicalInfoExists", this.isTechnicalInfoExists);
              // this.payNow();
              this.localService.set('maxTabReached', 4);
              // this.continue.emit();
              resolve();
            } else if (resp.success === 0 && resp.message) {
              this.alertsService.error(resp.message, this.options);
              reject(resp.message);
            } else if (resp.message && resp.status_code !== 200) {
              this.alertsService.error(resp.message, this.options);
              reject(resp.message);
            } else {
              this.alertsService.error('Something bad happened. Please try again!', this.options);
              reject('Unknown error');
            }
          }
        },
        (err: any) => {
          this.loaderService.emitComplete();
          if (err.error.statusCode === 403) {
            this.alertsService.error('Session Time Out! Please login Again', this.options);
            this.router.navigate(['/login'], { skipLocationChange: false });
          } else if (err.error.message) {
            this.alertsService.error(err.error.message, this.options);
          } else {
            this.alertsService.error('Something bad happened. Please try again!', this.options);
          }
          reject(err);
        }
      );
    });
  }

  onToggleSwitch(technicalInfo: any, isChecked: boolean): void {
    const index = this.selectedTechnicalInfoToCreate?.findIndex(
      (item: any) => item.id === technicalInfo.id
    );
    if (index !== -1 && index !== undefined) {
      this.selectedTechnicalInfoToCreate[index].is_active = isChecked;
    } else {
      // Optionally push it if not found
      this.selectedTechnicalInfoToCreate?.push({
        ...technicalInfo,
        is_active: isChecked
      });
    }
  }

  /*  updateTechnicalInfo(updatedTechnicalInfo: any): void {
     // if (!this.technicalInfoData) {
     //   this.alertsService.error('Customer technical info data not found. Please fetch first.', this.options);
     //   return;
     // }
     // const updatedCustomerTechnicalInfo = updtaedTechnicalInfo;
     // Strip nested customer_technical_info from each item (same issue as create path)
     const cleanedUpdate = Array.isArray(updatedTechnicalInfo)
       ? updatedTechnicalInfo.map(({ customer_technical_info, ...rest }: any) => rest)
       : updatedTechnicalInfo;
     const requestBody = {
       // domain_name: DOMAIN_NAME,
       // user_id: USER_ID,
       domain_name: this.authTokenService.getDomain(),
       user_id: this.authTokenService.getUserId(),
       payload: {
         update_technical_info: {
           customer_technical_info: cleanedUpdate
         }
       },
       extras: {
         find: {
           // Newly added for getting member id for customer type
           // customer_id: this.hotelId
           "member_id": this.memberId
           // Ended for getting member id for customer type
         }
       }
     };
     ////console.log('Called 1')
     ////console.log("Final payload:", requestBody);
     this.technicalInfoService.updateTechnicalInfo(requestBody).subscribe(
       (resp: any) => {
         this.loaderService.emitComplete();
         if (resp?.success === 1 && resp?.status_code === 200) {
           this.alertsService.success(resp.message, this.options);
           //  Ecom Integration Settings - Refresh enabled technical-info ids from the data we just saved
           // Refresh enabled technical-info ids from the data we just saved
           if (Array.isArray(updatedTechnicalInfo)) {
             this.enabledCustomerTechnicalInfoIds = new Set<number>(
               updatedTechnicalInfo
                 .filter((item: any) => item.is_enabled === true)
                 .map((item: any) => Number(item.id))
             );
           }
           // Ended
           this.updateCustomer();
           // this.customerdata();
           // this.payNow();
           this.localService.set('maxTabReached', 4);
 
           // Ecom Integration Settings - Automatically sync Hotel_Code if a PMS integration is enabled
           if (Array.isArray(updatedTechnicalInfo)) {
             const enabledPms = updatedTechnicalInfo.find((item: any) =>
               item.is_enabled === true &&
               (item.type === 'pos') &&
               (item.name?.toLowerCase() === 'win hms' || item.name?.toLowerCase() === 'oracle')
             );
             if (enabledPms) {
               // console.log('Syncing Hotel_Code from active PMS integration:', enabledPms.name);
               this.updateCustomerHotelCodeFromEcomAttributes(enabledPms.attributes || [], enabledPms.name);
             } else {
               const disabledPms = updatedTechnicalInfo.find((item: any) =>
                 item.type === 'pos' &&
                 (item.name?.toLowerCase() === 'win hms' || item.name?.toLowerCase() === 'oracle')
               );
               if (disabledPms) {
                 this.updateCustomerHotelCodeFromEcomAttributes([], disabledPms.name);
               }
             }
           }
         } else {
           this.alertsService.error(resp?.message || 'Update failed', this.options);
         }
       },
       (err: any) => {
         this.loaderService.emitComplete();
         this.alertsService.error(err?.error?.message || 'Something went wrong!', this.options);
       }
     );
   } */

  /*  save() {
     if (this.isTechnicalInfoExists) {
       this.updateTechnicalInfo(this.allinfoData);
     }
     else {
       if (this.allinfoData.length > 0) {
         this.technicalInfoCreate(this.allinfoData);
       }
       else {
         this.alertsService.warn('Please choose a technical info before proceeding.', this.options);
       }
     }
     this.nextTab();
   } */

  selectTab(tab: string) {
    this.selectedTab = tab;
    if (tab === 'lock') {
      this.activeTab = 1;
    } else if (tab === 'pos') {
      this.activeTab = 2;
    }
    // Commented out for 3rd sub tab removal
    // else if (tab === 'other') {
    //   this.activeTab = 3;
    // }
    // End of 3rd sub tab removal
    const uniqueInfos = this.technicalInfos?.filter(
      (item: any, index: any, self: any) => index === self?.findIndex((t: any) => t.id === item.id)
    );
    this.generalTechInfoData = uniqueInfos?.filter((item: any) => item.type === this.selectedTab);
    // Optional: update allinfoData with deduplicated latest data
    // this.allinfoData = [
    //   ...this.allinfoData?.filter((existing: any) => !this.generalTechInfoData.some((newItem: any) => newItem.id === existing.id)),
    //   ...this.generalTechInfoData,
    // ];
    this.allinfoData = [
      ...(this.allinfoData?.filter((existing: any) =>
        !this.generalTechInfoData?.some((newItem: any) => newItem.id === existing.id)
      ) || []), // fallback to empty array
      ...(this.generalTechInfoData || []), // fallback to empty array
    ];

  }

  /*   onCustomerToggleSwitch(event: any, technicalInfo: any): void {
      const inputElement = event.target as HTMLInputElement;
      const isChecked = inputElement.checked;
      if (!Array.isArray(this.allinfoData)) {
        this.allinfoData = [];
      }
  
      const isSingleSelect = isChecked;
  
      // Helper: returns the updated is_enabled value for any item
      const getIsEnabled = (item: any): boolean => {
        if (item.id === technicalInfo.id) return isChecked;
        // When enabling in single-select mode, disable all others of the same type
        if (isSingleSelect && item.type === technicalInfo.type) return false;
        return item.is_enabled === true;
      };
  
      // Rebuild generalTechInfoData with new object refs so Angular re-renders every card
      this.generalTechInfoData = this.generalTechInfoData.map((item: any) => ({
        ...item,
        is_enabled: getIsEnabled(item)
      }));
  
      // Sync technicalInfos
      this.technicalInfos = this.technicalInfos?.map((item: any) => ({
        ...item,
        is_enabled: getIsEnabled(item)
      }));
  
      // Rebuild allinfoData: replace each item that was modified
      const updatedIds = new Set(this.generalTechInfoData.map((i: any) => i.id));
      this.allinfoData = [
        ...this.allinfoData
          .filter((item: any) => !updatedIds.has(item.id))
          .map((item: any) => ({
            ...item,
            is_enabled: item.hasOwnProperty('is_enabled') ? item.is_enabled : false
          })),
        ...this.generalTechInfoData
      ];
  
      ////console.log('All info data after toggling:', this.allinfoData);
    } */

  // trackBy function for *ngFor on generalTechInfoData cards — prevents checkbox DOM reuse glitch
  trackById(index: number, item: any): any {
    return item?.id ?? index;
  }

  editKeyValues(id: any) {
    this.router.navigate(['/edit-tech-info', id]);
  }

  setTechInfo(data: any) {
    this.selectedTechInfo = data;
  }


  updateCustomer(callback?: () => void) {
    if (!this.customerdata) {
      console.warn('No customer data available to update.');
      return;
    }
    this.customerdata.is_technical_info_exists = true;

    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        customer_updation: {
          is_technical_info_exists: true
        }
      },
      extras: {
        find: {
          customer_member_id: this.memberId
        }
      }
    };
    this.hotelenrollmentservice.updateCustomer(requestBody).subscribe(
      resp => {
        this.loaderService.emitComplete();
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            // ////console.log(resp);
            this.hotelenrollmentservice.updateAdminFormEvent('refreshCustomer');
            this.hotelenrollmentservice.clearAdminFormEvent();
            ////console.log(resp.message, "resp.message")
            this.alertsService.success(resp.message, this.options);
            if (callback) {
              callback();
            }
          }
          else if (resp.success === 0) {
            if (resp.message) {
              this.alertsService.error(resp.message, this.options);
            }
          }
          else if (resp.message && resp.status_code !== 200) {
            this.alertsService.error(resp.message, this.options);
          }
          else {
            this.alertsService.error('Something bad happened. Please try again!', this.options);
          }
        }
      },
      err => {
        this.loaderService.emitComplete();
        if (err.error.statusCode === 403) {
          this.alertsService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`], { skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertsService.error(err.error.message, this.options)
        }
        else {
          this.alertsService.error('Something bad happened. Please try again!', this.options);
        }
      }
    )
  }
  next() {
    this.continue.emit();
  }

  nextTab() {
    const targetTabId = (this.customerStatus?.toLowerCase() === 'approved') ? 'services-tab' : 'payment-tab';
    const nextTab = document.getElementById(targetTabId);
    if (nextTab) {
      (nextTab as HTMLAnchorElement).click();
      window.scroll(0, 0);
    }
  }

  firstTabCount() {
    this.activeTab = 1;
  }

  secondTabCount() {
    this.activeTab = 2;
  }

  // Commented out for 3rd sub tab removal
  // thirdTabCount() {
  //   this.activeTab = 3;
  // }
  // End of 3rd sub tab removal
  /*  nextTabInfo() {
     // console.log('Before navigation: activeTab =', this.activeTab);
     this.isTechnicalInfoExists
       ? this.updateTechnicalInfo(this.allinfoData)
       : this.technicalInfoCreate(this.allinfoData);
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
     // console.log('After navigation: activeTab =', this.activeTab);
   } */

  // Newly added for back
  back() {
    if (this.activeTab == 1) {
      var back = document.getElementById('property-tab');
      if (back) {
        back.click();
        window.scroll(0, 0);
      }
    }
    if (this.activeTab == 2) {
      this.selectTab('lock');
      this.firstTabCount();
    }
    // Commented out for 3rd sub tab removal
    // if (this.activeTab == 3) {
    //   this.selectTab('pos');
    //   this.secondTabCount();
    // }
    // End of 3rd sub tab removal
  }


  //Ecom Integration Settings 
  // Check if Ecom settings are enabled for this technical info (based on DB state)
  isEcomSettingsEnabled(data: any): boolean {
    if (!data) return false;
    const id = Number(data.id);
    return !!id && this.enabledCustomerTechnicalInfoIds.has(id);
  }

  // Handle click on Ecom settings icon
  onEcomSettingsClick(data: any): void {
    // console.log('Ecom settings clicked', data);
    if (!this.isEcomSettingsEnabled(data)) {
      // console.log('Ecom settings not enabled', data);
      // Disabled state: do nothing
      return;
    }
    this.openEcomIntegrationModal(data);
  }

  // Helper: returns true if the currently opened integration is WIN HMS or Oracle.
  // Hotel_Code locking only applies to these two integrations.
  isHotelCodeIntegration(): boolean {
    if (!this.selectedEcomIntegrationData) return false;
    const type = (this.selectedEcomIntegrationData.type || '').toString().trim().toLowerCase();
    const name = (this.selectedEcomIntegrationData.name || '').toString().trim().toLowerCase();
    return type === 'pos' || name === 'win hms' || name === 'oracle';
  }

  // Open Ecom Integration Settings Modal
  openEcomIntegrationModal(data: any): void {
    // console.log('Ecom settings opened', data);
    this.selectedEcomIntegrationData = data;
    // Populate form with data
    this.ecomIntegrationForm.patchValue({
      name: data.name || '',
      type: data.type || '',
      api_url: data.api_url || ''
    });
    // Populate technical info form array
    const techInfoArray = this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
    techInfoArray.clear();

    let attributesToDisplay = data.attributes ? [...data.attributes] : [];

    // Automatically ensure Hotel_Code is present for WIN HMS and Oracle integrations
    // OLD: was checked by tab (selectedTab === 'pos') — now checked by integration name
    // if (this.selectedTab === 'pos') {
    if (this.isHotelCodeIntegration()) {
      const hasHotelCode = attributesToDisplay.some((attr: any) =>
        attr && typeof attr.key === 'string' && attr.key.trim().toLowerCase() === 'hotel_code'
      );
      if (!hasHotelCode) {
        // Add default Hotel_Code attribute at the beginning
        attributesToDisplay.unshift({ key: 'Hotel_Code', value: '' });
      }
    }

    if (attributesToDisplay.length) {
      attributesToDisplay.forEach((attr: any) => {
        techInfoArray.push(this.createEcomAttributeGroup(attr.key || '', attr.value || ''));
      });
    }
    /*
        if (data.attributes && Array.isArray(data.attributes) && data.attributes.length) {
          data.attributes.forEach((attr: any) => {
            techInfoArray.push(this.createEcomAttributeGroup(attr.key || '', attr.value || ''));
          });
        } else {
          // At least one empty row
          techInfoArray.push(this.createEcomAttributeGroup());
        }
    */
    // Ensure modal instance exists and element is present
    if (!this.ecomIntegrationModalInstance && this.ecomIntegrationModal) {
      this.ecomIntegrationModalInstance = new bootstrap.Modal(this.ecomIntegrationModal.nativeElement, {
        backdrop: 'static',
        keyboard: false
      });
    }
    if (this.ecomIntegrationModalInstance) {
      // console.log('Ecom integration modal instance', this.ecomIntegrationModalInstance);
      this.ecomIntegrationModalInstance.show();
    }
  }

  // Close Ecom Integration Settings Modal
  closeEcomIntegrationModal(): void {
    if (this.ecomIntegrationModalInstance) {
      this.ecomIntegrationModalInstance.hide();
    }
    this.selectedEcomIntegrationData = null;
    // Reset forms
    this.ecomIntegrationForm.reset();
    const techInfoArray = this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
    techInfoArray.clear();
  }

  // Get technical info form array
  getEcomTechnicalInfoControls(): FormArray {
    return this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
  }

  // Add new field to technical info
  addEcomField(): void {
    const techInfoArray = this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
    techInfoArray.push(this.createEcomAttributeGroup());
  }

  // Remove field from technical info
  removeEcomField(index: number): void {
    const techInfoArray = this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
    // Prevent removal of Hotel_Code only for WIN HMS and Oracle integrations
    // OLD: was checked by tab (selectedTab === 'pos') — now checked by integration name
    // if (this.selectedTab === 'pos') {
    if (this.isHotelCodeIntegration()) {
      const fieldControl = techInfoArray.at(index);
      if (fieldControl) {
        // Use getRawValue to read disabled controls (Hotel_Code key is disabled)
        const rawKey = (fieldControl as FormGroup).getRawValue()?.key ?? '';
        const keyVal = rawKey.toString().trim().toLowerCase();
        if (keyVal === 'hotel_code') {
          this.alertsService.error('Hotel_Code label cannot be removed.', this.options);
          return;
        }
      }
    }
    techInfoArray.removeAt(index);
  }
  /*
    // Remove field from technical info - OLD (applied to all tabs, not just PMS)
    removeEcomField_old(index: number): void {
      const techInfoArray = this.ecomTechnicalInfoForm.get('technicalInfo') as FormArray;
      // Prevent removal of Hotel_Code attribute
      const fieldControl = techInfoArray.at(index);
      if (fieldControl) {
        const keyControl = fieldControl.get('key');
        const keyVal = (keyControl?.value ?? '').toString().trim().toLowerCase();
        if (keyVal === 'hotel_code'.toLowerCase()) {
          this.alertsService.error('Hotel_Code label cannot be removed.', this.options);
          return;
        }
      }
      techInfoArray.removeAt(index);
    }
  */

  // Create a FormGroup for Ecom attribute with conditional validation:
  // if key is entered, value becomes required.
  // We disable the key field for all attributes across both Lock and PMS tabs.
  createEcomAttributeGroup(key: string = '', value: string = ''): FormGroup {
    const isValueDisabled = this.customerStatus === 'approved' || this.isViewMode;
    const group = this.fb.group({
      key: [{ value: key, disabled: true }],
      value: [{ value: value, disabled: isValueDisabled }]
    });
    group.valueChanges.subscribe(() => {
      this.validateEcomAttributeGroup(group);
    });
    // Run once initially to set correct state
    this.validateEcomAttributeGroup(group);
    return group;
  }

  validateEcomAttributeGroup(group: AbstractControl | null): void {
    if (!group) return;
    const keyCtrl = group.get('key');
    const valueCtrl = group.get('value');
    if (!keyCtrl || !valueCtrl) return;
    const keyVal = (keyCtrl.value ?? '').toString().trim();
    const valueVal = (valueCtrl.value ?? '').toString().trim();
    const errors = { ...(valueCtrl.errors || {}) };
    if (keyVal && !valueVal) {
      errors['requiredWhenKey'] = true;
    } else {
      delete errors['requiredWhenKey'];
    }
    if (Object.keys(errors).length) {
      valueCtrl.setErrors(errors);
    } else {
      valueCtrl.setErrors(null);
    }
  }

  // Save Ecom Integration Settings (API Url + Attributes) for selected integration
  async saveEcomIntegration(): Promise<void> {
    if (!this.selectedEcomIntegrationData) {
      return;
    }
    const integrationFormValue = this.ecomIntegrationForm.getRawValue();
    // Re-run validation for all attribute rows before checking validity
    const techInfoArray = this.getEcomTechnicalInfoControls();
    techInfoArray.controls.forEach(ctrl => this.validateEcomAttributeGroup(ctrl));
    this.ecomTechnicalInfoForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    // Validate Ecom technical info fields (Key / Value)
    if (this.ecomTechnicalInfoForm.invalid) {
      this.ecomTechnicalInfoForm.markAllAsTouched();
      return;
    }
    // Use getRawValue() to include disabled controls (like Hotel_Code key)
    const technicalInfoValue = (this.ecomTechnicalInfoForm.getRawValue().technicalInfo || []).map((attr: any) => ({
      key: attr.key || '',
      value: attr.value || ''
    }));
    /*
    const technicalInfoValue = this.ecomTechnicalInfoForm.value.technicalInfo || [];
    */
    // Update the selected item locally (customer-specific list)
    this.selectedEcomIntegrationData.api_url = integrationFormValue.api_url;
    this.selectedEcomIntegrationData.attributes = technicalInfoValue;
    // Update in generalTechInfoData (cards list)
    if (this.generalTechInfoData && Array.isArray(this.generalTechInfoData)) {
      const idx = this.generalTechInfoData.findIndex((item: any) => item.id === this.selectedEcomIntegrationData.id);
      if (idx > -1) {
        this.generalTechInfoData[idx] = {
          ...this.generalTechInfoData[idx],
          api_url: integrationFormValue.api_url,
          attributes: technicalInfoValue
        };
      }
    }
    // Update in allinfoData (full customer_technical_info payload)
    if (this.allinfoData && Array.isArray(this.allinfoData)) {
      const idxAll = this.allinfoData.findIndex((item: any) => item.id === this.selectedEcomIntegrationData.id);
      if (idxAll > -1) {
        this.allinfoData[idxAll] = {
          ...this.allinfoData[idxAll],
          api_url: integrationFormValue.api_url,
          attributes: technicalInfoValue
        };
      }
    }
    // Persist only for this customer using dedicated Ecom update function.
    // Customer (Hotel_Code) will be updated inside this method *after* technical info update succeeds.
    await this.updateCustomerEcomIntegrationSettings(this.selectedEcomIntegrationData, technicalInfoValue);
    this.closeEcomIntegrationModal();
  }

  // Update customer.Hotel_Code based on Ecom attributes (Hotel_Code key)
  async updateCustomerHotelCodeFromEcomAttributes(attributes: any[], integrationNameInput?: string, integrationTypeInput?: string): Promise<void> {
    // Use provided integration name or fall back to the one from the modal data
    const integrationName = (integrationNameInput !== undefined ? integrationNameInput : (this.selectedEcomIntegrationData?.name || '')).toString().toLowerCase();
    const integrationType = (integrationTypeInput !== undefined ? integrationTypeInput : (this.selectedEcomIntegrationData?.type || '')).toString().toLowerCase();

    // Hotel_Code is relevant for all PMS/POS (pos) integrations, and WIN HMS / Oracle
    if (integrationType !== 'pos' && integrationName !== 'win hms' && integrationName !== 'oracle') {
      // For other integrations, don't touch customer.Hotel_Code
      return;
    }

    // Determine new Hotel_Code value and whether the key still exists.
    let hasHotelCodeKey = false;
    let newHotelCode: string | null = null;
    if (attributes && attributes.length) {
      const hotelCodeAttr = attributes.find((attr: any) =>
        attr &&
        typeof attr.key === 'string' &&
        attr.key.trim().toLowerCase() === 'hotel_code'.toLowerCase()
      );
      if (hotelCodeAttr) {
        hasHotelCodeKey = true;
        if (hotelCodeAttr.value !== undefined && hotelCodeAttr.value !== null) {
          newHotelCode = String(hotelCodeAttr.value).trim();
        } else {
          newHotelCode = '';
        }
      }
    }
    // Always fetch latest customer data so we compare against the real current Hotel_Code
    try {
      await this.getCustomerById();
    } catch {
      // If customer data cannot be loaded, silently skip Hotel_Code update
      return;
    }
    const existingHotelCode: string =
      (this.customerdata && this.customerdata.Hotel_Code)
        ? String(this.customerdata.Hotel_Code)
        : '';
    // Decide whether and what to update on the customer:
    // 1. If Hotel_Code key exists in technical and its value changed -> update to that value (even empty string).
    // 2. If Hotel_Code key does NOT exist anymore but customer currently has a Hotel_Code -> set it to empty string.
    // 3. Otherwise, do nothing.
    let shouldUpdateCustomer = false;
    let valueToSend = existingHotelCode;
    if (hasHotelCodeKey) {
      const valueForCompare = newHotelCode ?? '';
      if (valueForCompare !== existingHotelCode) {
        shouldUpdateCustomer = true;
        valueToSend = valueForCompare;
      }
    } else {
      // key renamed/removed in technical info
      if (existingHotelCode) {
        shouldUpdateCustomer = true;
        valueToSend = '';
      }
    }
    if (!shouldUpdateCustomer) {
      return;
    }
    try {
      // Prepare minimal payload: only Hotel_Code field, no need to send full customer object
      const requestBody = {
        // domain_name: DOMAIN_NAME,
        // user_id: USER_ID,
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          customer_updation: {
            Hotel_Code: valueToSend
          }
        },
        extras: {
          find: {
            // id: this.hotelId
            customer_member_id: this.memberId
          }
        }
      };
      await new Promise<void>((resolve) => {
        this.hotelenrollmentservice.updateCustomer(requestBody).subscribe(
          (resp: any) => {
            // Confirm API actually succeeded before treating it as success
            if (!(resp?.success === 1 && resp?.status_code === 200)) {
              this.alertsService.error(
                resp?.message || 'Failed to update customer Hotel_Code',
                this.options
              );
            }
            resolve();
          },
          (err: any) => {
            this.alertsService.error(
              err?.error?.message || 'Failed to update customer Hotel_Code',
              this.options
            );
            resolve();
          }
        );
      });
    } catch (error) {
      console.error('Failed to update customer Hotel_Code from Ecom attributes', error);
    }
  }
  // Update only current customer's Ecom integration settings
  updateCustomerEcomIntegrationSettings(selectedIntegration: any, attributesForSelected: any[]): Promise<void> {
    const { _id, id, created_on, is_deleted, modified_on, ...cleanedIntegration } = selectedIntegration;
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        integration_settings: cleanedIntegration
      },
      extras: {
        find: {
          id: id
        }
      }
    };
    return new Promise<void>((resolve) => {
      this.technicalInfoService.updateTechnicalInfo(requestBody).subscribe(
        async (resp: any) => {
          this.loaderService.emitComplete();
          if (resp?.success === 1 && resp?.status_code === 200) {
            this.alertsService.success(resp.message, this.options);
            // Refresh enabled ids from the updated integration (now persisted)
            if (selectedIntegration) {
              if (selectedIntegration.is_enabled === true) {
                this.enabledCustomerTechnicalInfoIds.add(Number(id));
              } else {
                this.enabledCustomerTechnicalInfoIds.delete(Number(id));
              }
            }
            // Only after technical info is successfully updated, update customer with Hotel_Code if present
            await this.updateCustomerHotelCodeFromEcomAttributes(attributesForSelected, this.selectedEcomIntegrationData?.name, this.selectedEcomIntegrationData?.type);
          } else {
            this.alertsService.error(resp?.message || 'Update failed', this.options);
          }
          resolve();
        },
        (err: any) => {
          this.loaderService.emitComplete();
          this.alertsService.error(err?.error?.message || 'Something went wrong!', this.options);
          resolve();
        }
      );
    });
  }
  // End of Ecom Integration Settings 

  // closeModal() {
  //   console.log('closing Modal');
  //   const modalEl: any = document.getElementById('paymentType');
  //   console.log('modalEl', modalEl);
  //   const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  //   console.log('modal', modal);
  //   modal.hide();
  // 
  // }
  async syncCustomerHotelCodeFromActivePms(): Promise<void> {
    if (this.selectedTab !== 'pos') {
      return;
    }
    const activePms = this.generalTechInfoData?.find(
      (item: any) => item.type === 'pos' && item.is_enabled === true
    );
    if (activePms) {
      await this.updateCustomerHotelCodeFromEcomAttributes(activePms.attributes || [], activePms.name, activePms.type);
    } else {
      await this.updateCustomerHotelCodeFromEcomAttributes([], '', 'pos');
    }
  }

  nextTabInfo() {

    const enabledIntegrations = this.allinfoData.filter(
      (item: any) =>
        item.type === this.selectedTab &&
        (item.is_enabled === true || item.is_enabled === 'true')
    );

    if (enabledIntegrations.length > 1) {
      // Commented out for 3rd sub tab removal
      // const tabName = this.selectedTab === 'lock' ? 'Lock' : (this.selectedTab === 'pos' ? 'PMS' : 'Other');
      const tabName = this.selectedTab === 'lock' ? 'Lock' : 'PMS';
      // End of 3rd sub tab removal
      this.alertsService.error(
        `Only one ${tabName} integration can be enabled at a time.`,
        this.options
      );
      return;
    }

    if (this.activeTab === 1) {
      const hasEnabledLock = this.allinfoData && this.allinfoData.some(
        (item: any) => item.type === 'lock' && (item.is_enabled === true || item.is_enabled === 'true')
      );
      if (!hasEnabledLock) {
        this.alertsService.error(
          'Please enable at least one Lock integration before proceeding.',
          this.options
        );
        return;
      }
    }

    // Commented out for 3rd sub tab removal
    // if (this.activeTab === 2) {
    //   const hasEnabledPms = this.allinfoData && this.allinfoData.some(
    //     (item: any) => item.type === 'pos' && (item.is_enabled === true || item.is_enabled === 'true')
    //   );
    //   if (!hasEnabledPms) {
    //     this.alertsService.error(
    //       'Please enable at least one PMS integration before proceeding.',
    //       this.options
    //     );
    //     return;
    //   }
    // }
    // End of 3rd sub tab removal
    const changedRecords = this.allinfoData.filter(
      (item: any) => {
        if (item.type !== this.selectedTab) {
          return false;
        }
        const original = !!this.originalEnabledState[item.id];
        const current = !!item.is_enabled;
        return original !== current;
      }
    );

    if (changedRecords.length === 0) {
      // No changes, navigate directly
      this.navigateNextTab();
      return;
    }

    let completedCount = 0;

    changedRecords.forEach((item: any) => {

      this.updateTechnicalInfo(item, async () => {

        completedCount++;

        if (completedCount === changedRecords.length) {

          this.alertsService.success(
            'Technical information updated successfully.',
            this.options
          );

          // Refresh original state
          changedRecords.forEach((record: any) => {
            this.originalEnabledState[record.id] =
              record.is_enabled;
          });

          await this.syncCustomerHotelCodeFromActivePms();
          this.hotelenrollmentservice.updateAdminFormEvent('refreshCustomer');
          this.navigateNextTab();
        }

      });

    });
  }

  navigateNextTab() {

    switch (this.activeTab) {

      case 1:
        this.selectTab('pos');
        this.secondTabCount();
        break;

      // Commented out for 3rd sub tab removal
      // case 2:
      //   this.selectTab('other');
      //   this.thirdTabCount();
      //   break;
      // End of 3rd sub tab removal
    }
  }

  updateTechnicalInfo(
    technicalInfo: any,
    callback?: () => void
  ): void {

    const { _id, id, created_on, is_deleted, modified_on, ...cleanedTechnicalInfo } = technicalInfo;

    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        integration_settings: cleanedTechnicalInfo
      },
      extras: {
        find: {
          id: id
        }
      }
    };

    this.technicalInfoService.updateTechnicalInfo(requestBody)
      .subscribe(
        (resp: any) => {

          if (
            resp?.success === 1 &&
            resp?.status_code === 200
          ) {

            if (technicalInfo.is_enabled === true || technicalInfo.is_enabled === 'true') {
              this.enabledCustomerTechnicalInfoIds.add(Number(technicalInfo.id));
            } else {
              this.enabledCustomerTechnicalInfoIds.delete(Number(technicalInfo.id));
            }

            callback?.();

          } else {

            this.alertsService.error(
              resp?.message || 'Update failed',
              this.options
            );

          }
        },
        (err: any) => {

          this.alertsService.error(
            err?.error?.message || 'Something went wrong!',
            this.options
          );

        }
      );
  }

  async save() {
    this.isLoading = true;
    const dbData = await new Promise<any[]>((resolve) => {
      const requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            member_id: this.memberId
          }
        }
      };
      this.hotelenrollmentservice.getAllTechnicalInfo(requestBody).subscribe(
        (resp: any) => {
          this.loaderService.emitComplete();
          if (resp && resp.success === 1 && resp.status_code === 200) {
            const list = resp.result.data || [];
            resolve(
              list.filter(
                (item: any) =>
                  item.is_active === true &&
                  !["SMS Delivery Template", "HDFC Gateway"].includes(item.name)
              )
            );
          } else {
            resolve([]);
          }
        },
        () => {
          this.loaderService.emitComplete();
          resolve([]);
        }
      );
    });
    this.isLoading = false;

    // Check Lock integration (local check if active tab is Lock, otherwise DB check)
    let hasEnabledLock = false;
    if (this.selectedTab === 'lock') {
      hasEnabledLock = this.generalTechInfoData && this.generalTechInfoData.some(
        (item: any) => item.is_enabled === true || item.is_enabled === 'true'
      );
    } else {
      hasEnabledLock = dbData && dbData.some(
        (item: any) => item.type === 'lock' && (item.is_enabled === true || item.is_enabled === 'true')
      );
    }

    // Check PMS integration (local check if active tab is PMS, otherwise DB check)
    let hasEnabledPms = false;
    if (this.selectedTab === 'pos') {
      hasEnabledPms = this.generalTechInfoData && this.generalTechInfoData.some(
        (item: any) => item.is_enabled === true || item.is_enabled === 'true'
      );
    } else {
      hasEnabledPms = dbData && dbData.some(
        (item: any) => item.type === 'pos' && (item.is_enabled === true || item.is_enabled === 'true')
      );
    }

    if (!hasEnabledLock) {
      this.alertsService.error(
        'Please enable at least one Lock integration before proceeding.',
        this.options
      );
      return;
    }
    if (!hasEnabledPms) {
      this.alertsService.error(
        'Please enable at least one PMS integration before proceeding.',
        this.options
      );
      return;
    }

    const enabledIntegrations = this.allinfoData.filter(
      (item: any) =>
        item.type === this.selectedTab &&
        (item.is_enabled === true || item.is_enabled === 'true')
    );

    if (enabledIntegrations.length > 1) {
      // Commented out for 3rd sub tab removal
      // const tabName = this.selectedTab === 'lock' ? 'Lock' : (this.selectedTab === 'pos' ? 'PMS' : 'Other');
      const tabName = this.selectedTab === 'lock' ? 'Lock' : 'PMS';
      // End of 3rd sub tab removal
      this.alertsService.error(
        `Only one ${tabName} integration can be enabled at a time.`,
        this.options
      );
      return;
    }

    const changedRecords = this.allinfoData.filter(
      (item: any) => {
        if (item.type !== this.selectedTab) {
          return false;
        }
        const original = !!this.originalEnabledState[item.id];
        const current = !!item.is_enabled;
        return original !== current;
      }
    );

    if (changedRecords.length === 0) {
      this.updateCustomer(() => {
        this.nextTab();
      });
      return;
    }

    let completedCount = 0;

    changedRecords.forEach((item: any) => {

      this.updateTechnicalInfo(item, async () => {

        completedCount++;

        if (completedCount === changedRecords.length) {

          this.alertsService.success(
            'Technical information updated successfully.',
            this.options
          );

          changedRecords.forEach((record: any) => {
            this.originalEnabledState[record.id] =
              record.is_enabled;
          });
          await this.syncCustomerHotelCodeFromActivePms();
          this.updateCustomer(() => {
            this.nextTab();
          });

        }

      });

    });

  }

  getAllTechnicalInfo() {
    const requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          member_id: this.memberId
        }
      }
    };

    this.hotelenrollmentservice.getAllTechnicalInfo(requestBody).subscribe(
      (resp: any) => {
        this.loaderService.emitComplete();
        this.isLoading = false;

        if (resp && resp.success === 1 && resp.status_code === 200) {

          const technicalInfoList = resp.result.data || [];

          this.technicalInfodatalength = technicalInfoList.length;

          this.showEdit = this.technicalInfodatalength > 0;
          this.isTechnicalInfoExists = this.technicalInfodatalength > 0;
          this.isCustomerChoosen = this.technicalInfodatalength > 0;

          this.technicalInfos = technicalInfoList.filter(
            (item: any) =>
              item.is_active === true &&
              !["SMS Delivery Template", "HDFC Gateway"].includes(item.name)
          );

          // Store original is_enabled values from API
          this.originalEnabledState = {};
          this.enabledCustomerTechnicalInfoIds = new Set<number>();

          this.technicalInfos.forEach((item: any) => {
            item.is_enabled = item.is_enabled === true || item.is_enabled === 'true';
            this.originalEnabledState[item.id] = item.is_enabled;
            if (item.is_enabled) {
              this.enabledCustomerTechnicalInfoIds.add(Number(item.id));
            }
          });

          this.allinfoData = [...this.technicalInfos];

          this.generalTechInfoData = this.technicalInfos.filter(
            (item: any) => item.type === this.selectedTab
          );
        }
      },
      (err: any) => {
        this.isLoading = false;
        this.loaderService.emitComplete();

        if (err.error?.statusCode === 403) {
          this.alertsService.error(
            'Session Time Out! Please login Again',
            this.options
          );

          this.router.navigate(['/login'], {
            skipLocationChange: false
          });

        } else if (err.error?.message) {

          this.alertsService.error(
            err.error.message,
            this.options
          );

        } else {

          this.alertsService.error(
            'Something bad happened. Please try again!',
            this.options
          );
        }
      }
    );
  }

  onCustomerToggleSwitch(event: any, technicalInfo: any): void {

    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;

    if (!Array.isArray(this.allinfoData)) {
      this.allinfoData = [];
    }

    const getIsEnabled = (item: any): boolean => {

      if (item.id === technicalInfo.id) {
        return isChecked;
      }

      // Single selection for same type
      if (
        isChecked &&
        item.type === technicalInfo.type &&
        item.id !== technicalInfo.id
      ) {
        return false;
      }

      return item.is_enabled === true;
    };

    this.generalTechInfoData = this.generalTechInfoData.map((item: any) => ({
      ...item,
      is_enabled: getIsEnabled(item)
    }));

    this.technicalInfos = this.technicalInfos?.map((item: any) => ({
      ...item,
      is_enabled: getIsEnabled(item)
    }));

    this.allinfoData = this.allinfoData.map((item: any) => ({
      ...item,
      is_enabled: getIsEnabled(item)
    }));

    // Store only modified records
    const modifiedRecord = this.allinfoData.find(
      (item: any) => item.id === technicalInfo.id
    );

    if (modifiedRecord) {

      const existingIndex = this.modifiedTechnicalInfos.findIndex(
        (item: any) => item.id === modifiedRecord.id
      );

      if (existingIndex > -1) {
        this.modifiedTechnicalInfos[existingIndex] = { ...modifiedRecord };
      } else {
        this.modifiedTechnicalInfos.push({ ...modifiedRecord });
      }
    }

    console.log('Modified Records', this.modifiedTechnicalInfos);
  }



}




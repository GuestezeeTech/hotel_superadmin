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
import { CustomValidators } from '../validators';



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
  countryDropdownList: any;
  states: any;
  statesDropdownList: any;
  customerdata: any = {};
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
    private activatedRoute: ActivatedRoute,


  ) { }


  ngOnInit(): void {
    this.customerForm = new FormGroup({

      first_name: new FormControl('', Validators.required),
      last_name: new FormControl('', Validators.required),
      designation: new FormControl('', Validators.required),
      phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      email: new FormControl('', [Validators.required, Validators.email]),
      gender: new FormControl('', Validators.required),

      sec_first_name: new FormControl('', Validators.required),
      sec_last_name: new FormControl('', Validators.required),
      sec_designation: new FormControl('', Validators.required),
      sec_phone_number: new FormControl('', [Validators.required, CustomValidators.phoneValidator]),
      sec_email: new FormControl('', [Validators.required, Validators.email]),
      sec_gender: new FormControl('', Validators.required),
      company_name: new FormControl('', Validators.required),
      door_no: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      pincode: new FormControl('', Validators.required),
      pan_no: new FormControl('', [Validators.required, CustomValidators.panValidator]),
      gst_no: new FormControl('', [Validators.required, CustomValidators.gstValidator]),

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
    this.customerForm.disable();

    // Newly added to get countries data
    this.getCountries();
    
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
      } else {
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
        gender: this.customerForm.value.gender,
        sec_first_name: this.customerForm.value.sec_first_name,
        sec_last_name: this.customerForm.value.sec_last_name,
        sec_designation: this.customerForm.value.sec_designation,
        sec_phone_number: this.customerForm.value.sec_phone_number,
        sec_email: this.customerForm.value.sec_email,
        sec_gender: this.customerForm.value.sec_gender,
        status: "Pending",
        is_active: true,
        registered_address: {
          company_name: this.customerForm.value.company_name,
          door_no: this.customerForm.value.door_no,
          address: this.customerForm.value.address,
          city: this.customerForm.value.city,
          state: this.customerForm.value.state,
          country: this.customerForm.value.country,
          pincode: this.customerForm.value.pincode,
          pan_no: this.customerForm.value.pan_no,
          gst_no: this.customerForm.value.gst_no,



        }



      }
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        payload: {
          customer_creation: customerObject
        }
      }

      this.hotelenrollmenttabviewService.addCustomer(requestBody).subscribe(
        resp => {
          this.loaderService.emitComplete();
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
              // //console.log(resp);
              this.hotelenrollmenttabviewService.clearAdminFormEvent();
              this.alertService.success(resp.message, this.options);
              this.customerdata = resp.result.data[0];
              //console.log( this.customerdata,"cst");
              this.router.navigate(["/edit-new-hotel", this.customerdata.id]).then(() => {

                let nextTab = document.getElementById('profile-tab');
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
      this.customerdata.email = this.customerForm.value.email,
      this.customerdata.gender = this.customerForm.value.gender,
      this.customerdata.sec_first_name = this.customerForm.value.sec_first_name,
      this.customerdata.sec_last_name = this.customerForm.value.sec_last_name,
      this.customerdata.sec_designation = this.customerForm.value.sec_designation,
      this.customerdata.sec_phone_number = this.customerForm.value.sec_phone_number,
      this.customerdata.sec_email = this.customerForm.value.sec_email,
      this.customerdata.sec_gender = this.customerForm.value.sec_gender,
      this.customerdata.is_active = true,

      this.customerdata.registered_address.company_name = this.customerForm.value.company_name,
      this.customerdata.registered_address.door_no = this.customerForm.value.door_no,
      this.customerdata.registered_address.address = this.customerForm.value.address,
      this.customerdata.registered_address.city = this.customerForm.value.city,
      this.customerdata.registered_address.state = this.customerForm.value.state,
      this.customerdata.registered_address.country = this.customerForm.value.country,
      this.customerdata.registered_address.pincode = this.customerForm.value.pincode,
      this.customerdata.registered_address.pan_no = this.customerForm.value.pan_no,
      this.customerdata.registered_address.gst_no = this.customerForm.value.gst_no







    delete this.customerdata._id;
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
    //console.log(this.customerdata.first_name, 'this.customerdata.first_name', this.customerdata.registered_address?.state);
    this.customerForm.patchValue({
      first_name: this.customerdata.first_name,
      last_name: this.customerdata.last_name,
      designation: this.customerdata.designation,
      phone_number: this.customerdata.phone_number,
      email: this.customerdata.email,
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
      pincode: this.customerdata.registered_address?.pincode,
      pan_no: this.customerdata.registered_address?.pan_no,
      gst_no: this.customerdata.registered_address?.gst_no
    });
  }

  executeFunctions() {
    this.getCustomerById()
      .then(() => {
        this.setFormValues(); // Runs after data is fetched
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
        // console.log(this.countryDropdownList,"countryDropdownList");
        if(this.customerdata?.registered_address?.country!=undefined && this.customerdata.registered_address?.country!=null){
          this.getStateData();
        }
        // //console.log(this.countryList);
      },
      err => {
        if (err.error.statusCode === 403){
          this.alertService.error('Session Time Out! Please login Again', this.options)
          this.router.navigate([`/login`],{ skipLocationChange: false });
        }
        else if (err.error.message) {
          this.alertService.error(err.error.message, this.options)
        }
        else {
          this.alertService.error('Something bad happened while loading countries. Please try again!', this.options);
        }
      }
    )
  }
  getStates(country_id: number) {

    let statesRequest = {
      "domain_name": "https://www.beaubelle.in",
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
        // console.log( this.statesDropdownList," this.statesDropdownList")

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
  onItemsSelect(item: any) {
    //console.log(item.target.value,"item")
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === item.target.value); if (selectedCountry) {
      //console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      //console.log('Country not found');
    }



  }

  getStateData() {
    const selectedCountry = this.countryDropdownList.find((c: { country: string; id: number }) => c.country === this.customerdata.registered_address?.country); if (selectedCountry) {
      // console.log('Selected Country ID:', selectedCountry.id);
      this.getStates(selectedCountry.id);
    } else {
      // console.log('Country not found');
    }
  }

  saveAndContinue() {
    // Select next tab using JavaScript
    let nextTab = document.getElementById('profile-tab');
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

      let nextTab = document.getElementById('profile-tab');
      if (nextTab) {
        (nextTab as HTMLAnchorElement).click();
      }

    });



  }

  nextTab(){
    this.saveAndContinue()
  }


}

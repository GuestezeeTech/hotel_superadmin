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

    this.getCountries();
    this.getCustomerDataAfterConfirmation();

    // Newly added code to disable the form
    this.customerProprtyDetailsForm.disable();

  }
  async getCustomerDataAfterConfirmation() {
    if (this.router.url.includes('confirmation')) {
      this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer_id');
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
        property_size: this.customerdata.property_details.property_address.property_size
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
        //console.log(this.countryDropdownList,"countryDropdownList");
        if (this.customerdata?.registered_address?.country != undefined && this.customerdata.registered_address?.country != null) {
          this.getStateData()

        }
        // //console.log(this.countryList);
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
          this.alertService.error('Something bad happened while loading countries. Please try again!', this.options);
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

      "customer_id": this.customerdata.id,
      "status": "Awaiting Payment",
      "status_id": "1",
      "system_label": "Pending",
      "orderConfirmDate": new Date(),
      "subscription_end_date": due_date,
      "customer": {
        "customer_id": this.customerdata.id,
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
    this.customerId = this.activatedRoute.snapshot.queryParamMap.get('customer_id');
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


  getOrderData(customer_id: number) {
    //console.log("111")
    let formatJson = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          customer_id: Number(customer_id),

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

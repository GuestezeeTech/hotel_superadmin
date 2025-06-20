import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { LoaderService } from '../../shared/loader/loader.service';
import { HotelEnrollmentTabviewService } from '../hotel-enrollment-tabview.service';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { ActivatedRoute,Router ,NavigationEnd} from '@angular/router';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {FormGroup, FormControl} from '@angular/forms';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { ENDPOINTS } from '../../app.config';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule,AlertsComponent],
  templateUrl: './service-details.component.html',
  styleUrl: './service-details.component.scss'
})
export class ServiceDetailsComponent implements OnInit {
  selectedServices: any[] = [];
  apiSelectedServices: any[] = []; // Stores API-selected services
    options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  customerdata: any = {}; 
  hotelId: Number | null = null;
  activeTab:Number=1;
   services :any
  constructor(
     
      private authTokenService: AuthTokenService,
      private hotelenrollmenttabviewService:HotelEnrollmentTabviewService,
      private loaderService:LoaderService,
      private alertService:AlertsService,
      private router:Router,
      private activatedRoute:ActivatedRoute

  
      
    ) {}
  
  
  
 
  
  

  

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      var temphotelid =  params.get('id'); // Get the 'id' from the URL
      this.hotelId =Number(temphotelid) ;
      //console.log('Hotel ID:', this.hotelId); // Debugging
    });
    // this.getCustomerById();
    this.getALLService ();
    this.getServiceById();
    
  }
  getServicesByType(type: string) {
     if(type=="Other"){
        return this.services.filter((service:any) => (service.department === "Engineering" ||service.department === "F&B" ));

     }
     else{
      return this.services.filter((service:any) => service.department === type);

     }
    
   
  }


  async customerUpdate(){
    delete this.customerdata._id;
    let tempCustomerObject = {
      "exempted services":this.selectedServices
      
     

      };
     
  
  
  
  
      
      this.customerdata["service_details"]=tempCustomerObject;
   
    

    
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
            //console.log(this.activeTab,'this.activeTab')
            if(this.activeTab==1){
              //console.log(this.activeTab,'this.activeTab1')
              var tab = document.getElementById("inroom-tab")
              if(tab!=undefined){
                tab.click();

              }
              
            }
            else if(this.activeTab==2){
              //console.log(this.activeTab,'this.activeTab2')
              var tab = document.getElementById("other-tab")
              if(tab!=undefined){
                tab.click();

              }
              
            }
          
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
  // getCustomerById(): Promise<void> {
  //   this.selectedServices=[];
  //   return new Promise((resolve, reject) => {
  //     let requestBody = {
  //       domain_name: this.authTokenService.getDomain(),
  //       user_id: this.authTokenService.getUserId(),
  //       extras: {
  //         find: {
  //           id: this.hotelId
  //         }
  //       }
  //     };
  
  //     this.hotelenrollmenttabviewService.getCustomerById(requestBody).subscribe(
  //       resp => {
  //         this.loaderService.emitComplete();
  //         if (resp) {
  //           this.customerdata = resp.result.data[0];
  //           if(this.customerdata &&
  //             this.customerdata.service_details &&
  //             Array.isArray(this.customerdata.service_details["exempted services"])){
  //             this.apiSelectedServices = this.customerdata.service_details["exempted services"];
  //             this.selectedServices= this.customerdata.service_details["exempted services"];
  //             //console.log( this.apiSelectedServices,' this.apiSelectedServices')
  //           }
          

  //           //console.log(this.customerdata, "RESPDATA");
  //           //console.log(Array.isArray(this.customerdata)); 
  //           resolve();  // Resolve promise when data is set
  //         }
  //       },
  //       err => {
  //         this.loaderService.emitComplete();
  //         if (err.error.statusCode === 403) {
  //           this.alertService.error('Session Time Out! Please login Again', this.options);
  //           this.router.navigate([`/login`], { skipLocationChange: false });
  //         } else if (err.error.message) {
  //           this.alertService.error(err.error.message, this.options);
  //         } else {
  //           this.alertService.error('Something bad happened. Please try again!', this.options);
  //         }
  //         reject(err);  // Reject promise if there is an error
  //       }
  //     );
  //   });
  // }

  isSelected(serviceId: number): boolean {
  
    // //console.log(this.selectedServices.some(s => s.id === serviceId) ||  this.apiSelectedServices.some(s => s.id === serviceId))
    return this.selectedServices.some(s => s.id === serviceId) ||  this.apiSelectedServices.some(s => s.id === serviceId);
  }
  isApiSelectedServiceType1(serviceName:string) {
     //console.log(serviceName,this.apiSelectedServices.some(s => s.department === serviceName),"check")
  
    return (this.apiSelectedServices.some(s => s.department === serviceName)) ;
    // //console.log(this.selectedServices.some(s => s.id === serviceId) ||  this.apiSelectedServices.some(s => s.id === serviceId))
    // return    this.selectedServices.some(s => s.id === serviceId);
  }
  isApiSelectedServiceType2(serviceName:string) {
    // //console.log(serviceName,this.apiSelectedServices.some(s => s.department === serviceName,//console.log( serviceName)),"check")
 
   return (this.apiSelectedServices.some(s => s.department === serviceName)) ;
   // //console.log(this.selectedServices.some(s => s.id === serviceId) ||  this.apiSelectedServices.some(s => s.id === serviceId))
   // return    this.selectedServices.some(s => s.id === serviceId);
 }
 isApiSelectedServiceType3(serviceName:string) {
  //console.log(serviceName,this.apiSelectedServices.some(s => s.department === serviceName),"check")

 return (this.apiSelectedServices.some(s => s.department === serviceName)) ;
 // //console.log(this.selectedServices.some(s => s.id === serviceId) ||  this.apiSelectedServices.some(s => s.id === serviceId))
 // return    this.selectedServices.some(s => s.id === serviceId);
}
isServiceActive(service: any): boolean {
  return service.department === "FO";
}
isServiceTypeIIActive(service: any): boolean {
  return service.department === "EHK";
}
isServiceTypeIIIActive(service: any): boolean {
  return (service.department === "Engineering" || service.department === "F&B" || service.department === "Engineering" || service.department === "Other");
}
  
GetSelectedService(serviceName: string) {
  //console.log(this.services,"this.services")
  const selectedService = this.services.find((service:any) => service.name === serviceName);
  
  if (!selectedService) return;

  const index = this.selectedServices.findIndex(s => s.id === selectedService.id);

  if (index > -1) {
    // Already selected – remove it (unselect)
    this.selectedServices.splice(index, 1);
  } else {
    // Not selected – add it
    this.selectedServices.push(selectedService);
  }

  //console.log(this.selectedServices); // Debugging
}

  tabCount(){
    this.activeTab=2;
  }
  thirdTabCount(){
    this.activeTab=3;

  }
  firstTabCount(){
    this.activeTab=1;

  }




   getServiceById(){
    //console.log(this.hotelId,"this.hotelId")
  
     let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
       
        extras: {
          find: {
            customer_id: this.hotelId
          }
        }
      }
    //console.log("123")
    this.hotelenrollmenttabviewService.apiCall(requestBody,ENDPOINTS.GETBYID_SERVICE).subscribe(
        resp => {
     
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
             this.apiSelectedServices=resp.result.data[0].services.filter((item:any) => item.service_required === false);
             this.selectedServices = resp.result.data[0].services.filter((item:any) => item.service_required === false); 
              
 
  
  
  
            
               
        
    
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
  getALLService(){
  
     let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
       
        extras: {
          find: {
            // id: this.hotelId
          }
        }
      }
    //console.log("123")
    this.hotelenrollmenttabviewService.apiCall(requestBody,ENDPOINTS.GETALL_SERVICE).subscribe(
        resp => {
     
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
              this.services=resp.result.data.filter((service: any) => service.customer_id === undefined);
              //console.log(this.services,"this.services")
              
 
  
  
  
            
               
        
    
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
 
}

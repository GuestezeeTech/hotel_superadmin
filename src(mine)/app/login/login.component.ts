import { Component ,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {ReactiveFormsModule }  from '@angular/forms';
import { AlertsService } from '../shared/alerts/alerts.service';

import { LoginService } from './login.service';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { LocalStorageService } from '../auth-services/local-storage.service';
import { LoaderService } from '../shared/loader/loader.service';
import { ActivatedRoute,Router } from '@angular/router';
import { DOMAIN_NAME } from '../app.config';
import { ENDPOINTS } from '../app.config';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { SharedDataService } from '../shared/shared-data.service';
import { UserAccessService } from '../user-access/user-access.service';
import { ProfileService } from '../profile/profile.service';
// import { PushService } from '../services/push.service';



@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [CommonModule,ReactiveFormsModule,AlertsComponent ]  // Add CommonModule here
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = new FormGroup({});
  showalertmsg: boolean = false;
  validateForm: Boolean = false;
  dbSchema:any;
  passwordVisible: boolean = false;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  constructor(private fb: FormBuilder, private alertService: AlertsService,
    private appService: LoginService,
    private authService: AuthTokenService,
    private localService: LocalStorageService,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedDataService: SharedDataService,
    private userAccessService: UserAccessService,
    private profileService: ProfileService,
    // private pushService :PushService
  ){}
  loginData: any;
  ngOnInit(): void {
    // Initialize the login form with validation rules
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Email field with validation
      password: ['', [Validators.required, Validators.minLength(6)]] // Password field with validation
    });
  }
  get f() { return this.loginForm.controls; }
  onSubmit(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      //console.log('Form Data:', formData);
      this.signIn();
      // Here, you can integrate with your backend to handle authentication
    } else {
      //console.log('Form is invalid');
      this.loginForm.markAllAsTouched();  // Mark all controls as touched to trigger validation
    }
  }
  async signIn() {
    this.alertService.clear();
    this.showalertmsg = true;
    if (this.loginForm.valid) {
      this.loaderService.emitLoading();
      this.validateForm = false;
      this.loginData = {
        domain_name: DOMAIN_NAME,
        username: this.loginForm.value.email,
      //  username: this.loginForm.value.email + '-' + DOMAIN_NAME
      //   ,

        password: this.loginForm.value.password
      }


      // MAKE A SERVICE CALL HERE...
      this.appService.login(this.loginData).subscribe(
        resp => {
          if (resp) {
            if (resp.success === 1 && resp.status_code === 200) {
              this.authService.setExpiryTime(new Date().getTime() + (resp.access_token_expires_in * 1000))
              // this.authService.setExpiryTime(new Date().getTime() + (60*1000))
              this.authService.setRTokenExpireTime(new Date().getTime() + (resp.refresh_token_expires_in * 1000))
              this.authService.setAccessToken(resp.access_token);
              this.authService.setRefreshToken(resp.refresh_token);
              this.localService.set('UserName', resp.user.name);
              this.localService.set('UserEmail', resp.user.email);
              this.localService.set('UserId', resp.user.id);
              this.localService.set('db_schema', resp.user.db_schema);
              
              this.dbSchema = resp.user.db_schema;
              // this.localService.set('db_schema', "Tams1");
              this.localService.set('domainName', resp.user.domain_name);
              this.router.navigate([`/dashboard`], { skipLocationChange: false });

              // Newly added
              this.localService.set('password', this.loginForm.value.password);





               const updateBody1 = {
                            domain_name: DOMAIN_NAME,
                            user_id: 12,
                            payload: {
                           
                            },
                            extras: {
                              find: {
                                email: this.loginForm.value.email,
                                username: this.loginForm.value.email,
                              }
                            }
                          };
                          this.appService.postApiCall(updateBody1, ENDPOINTS.GET_ALL_USERS).subscribe(
  (updateResp: any) => {
    if (updateResp.success === 1 && updateResp.status_code === 200) {
      const customer = updateResp.result.data[0];

      // Wrap await in async IIFE
      // (async () => {
      //   try {
      //     const token = await this.pushService.requestPermissionAndGetToken(customer.id);
      //     console.log(token, 'token value');
      //     console.log(customer, "customer");
          

      //     // Ensure fcm_token array exists
      //     if (!Array.isArray(customer.fcm_token)) {
      //       customer.fcm_token = [];
      //     }
      //     customer.fcm_token.push(token);
      //     delete customer._id;

      //     // Update customer with the new array
      //     const updateBody = {
      //       domain_name: DOMAIN_NAME,
      //       user_id: 12,
      //       payload: {
      //       customer_update: {
      //                           fcm_token: customer.fcm_token
      //                         }
      //       },
      //       extras: {
      //         find: {
      //         id:customer.id
      //           // username: this.loginForm.value.email,
      //         }
      //       }
      //     };

      //     this.appService.postApiCall(updateBody, ENDPOINTS.UPDATE_USER).subscribe(
      //       (updateResp2: any) => {
      //         if (updateResp2.success === 1 && updateResp2.status_code === 200) {
      //           console.log('FCM token updated successfully:', token);
      //         } else {
      //           console.error('Failed to update FCM token:', updateResp2?.message);
      //         }
      //       },
      //       (err: any) => {
      //         console.error('Error updating customer FCM token:', err);
      //       }
      //     );

      //   } catch (err) {
      //     console.error('Error getting FCM token:', err);
      //   } finally {
      //     this.loaderService.emitComplete();
      //   }
      // })();

    } else {
      console.error('Failed to fetch customer:', updateResp?.message);
    }
  },
  (err: any) => {
    console.error('Error fetching customer:', err);
  }
);


                    
            
              this.getUserRolesAndAccess(resp.user.id).then(
                respData => {
                  let res: any = respData;
                  if (res) {
                    this.loaderService.emitComplete();
                    //console.log("trueee111")
                   
                     {
                      this.router.navigate([`/dashboard`], { skipLocationChange: false });

                    }

                  }
                }
              )
              this.appService.dbSchema = resp.user.db_schema;
            }
            else if (resp.success === 0) {
              this.loaderService.emitComplete();
              if (resp.message) {
                this.alertService.error(resp.message, this.options);
              }
            }
            else if (resp.message && resp.status_code !== 200) {
              this.loaderService.emitComplete();
              this.alertService.error(resp.message, this.options);
            }
            else {
              this.loaderService.emitComplete();
              this.alertService.error('Something bad happened. Please try again!', this.options);
            }
          }
        },
        err => {
          this.loaderService.emitComplete();
          if (err.error.statusCode === 500) {
            this.alertService.error('Please enter a valid UserName/Password', this.options);
          }
          else if (err.error.statusCode === 401) {
            this.alertService.error('Please enter a valid UserName/Password', this.options);
          }
          else {
            this.alertService.error('Something bad happened. Please try again!', this.options);
          }
        }
      )
    }
    else {
      this.validateForm = true;
    }
  }


  getUserRolesAndAccess(userID:number) {
    return new Promise((resolve, reject) => {
      let jsonObj = {
        "domain_name": this.authService.getDomain(),
        "user_id": this.authService.getUserId(),
        "extras": {
          "find": {
            "id": userID
          }
        }
      }
      this.appService.postApiCall(jsonObj, ENDPOINTS.GETBYID_ADMINUSERS).subscribe(resp => {
        if (resp.success === 1 && resp.status_code === 200) {
          let respData = resp.result.data[0];
          let respNew = resp.result.data[0];
          let role_id = respData.role_id;
          this.localService.set('roleName', respData.role_name);
          this.localService.set('role_id', respData.role_id);
          const profile_image = respData.profile_image;
          const profile_name = respData.first_name + ' ' + respData.last_name;
          // Send data to BehaviorSubject for header
          this.profileService.updateProfileImage(profile_image || '../../assets/images/guestezee/profile.png');
          this.profileService.updateProfileName(profile_name);
          //  if(this.dbSchema==='Aiema'||this.dbSchema==='shubcards' ||this.dbSchema==='Deera' ||this.dbSchema==='BBold'||this.dbSchema==='BombayHardware'||this.dbSchema==='dosapark') {


            // if(this.dbSchema==='Aiema') {
            this.userAccessService.userAccessList.DASHBOARD = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }

            this.userAccessService.userAccessList.CUSTOMERS = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }


            this.userAccessService.userAccessList.PAYMENT = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }


            this.userAccessService.userAccessList.SYSTEMSETTINGS = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }


            this.userAccessService.userAccessList.MARKETING = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }


            this.userAccessService.userAccessList.USERACCESS = {
              has_add_permission: true,
              has_edit_permission: true,
              has_read_permission: true,
              has_delete_permission: true,
            }


            // this.userAccessService.userAccessList.SYSTEMSETTINGS = {
            //   has_add_permission: true,
            //   has_edit_permission: true,
            //   has_read_permission: true,
            //   has_delete_permission: true,
            // }


            // this.userAccessService.userAccessList.AUTHORIZATION = {
            //   has_add_permission: true,
            //   has_edit_permission: true,
            //   has_read_permission: true,
            //   has_delete_permission: true,
            // }


            this.userAccessService.setUserAccess(this.userAccessService.userAccessList);
            if (this.userAccessService.getUserAccess() !== null) {
              resolve(true);
            }
          
          // resolve(true);
         {
            let roleObj = {
              "domain_name": this.authService.getDomain(),
              "user_id": this.authService.getUserId(),
              "extras": {
                "find": {
                  "id": Number(role_id)
                }
              }
            }
            this.appService.postApiCall(roleObj, ENDPOINTS.GETBYID_ROLES).subscribe(resp => {
              this.loaderService.emitComplete();
              if (resp.success === 1 && resp.status_code === 200) {
                let respData1 = resp.result.data[0];
                respData1.modules.forEach((element :{ module_name: string, permission: any })=> {
                
                  if (element.module_name === "DASHBOARD") {
                    //console.log('11',element.permission);
                   
                    this.userAccessService.userAccessList.DASHBOARD = element.permission;
                  }
                  else if (element.module_name === "CUSTOMERS") {
                    //console.log('12');
                    this.userAccessService.userAccessList.CUSTOMERS = element.permission;
                  }
                  else if (element.module_name === "PAYMENT") {
                    //console.log('13');
                    this.userAccessService.userAccessList.PAYMENT = element.permission;
                  }
                  else if (element.module_name === "MARKETING") {
                    //console.log('14');
                    this.userAccessService.userAccessList.MARKETING = element.permission;
                  }
                
                  else if (element.module_name === "SYSTEM SETTINGS") {
                    //console.log('15');
                    this.userAccessService.userAccessList.SYSTEMSETTINGS = element.permission;
                  }
                  else if (element.module_name === "USER ACCESS") {
                    //console.log('16');
                    this.userAccessService.userAccessList.USERACCESS = element.permission;
                  }
                 
                });
                this.userAccessService.setUserAccess(this.userAccessService.userAccessList);
                if (this.userAccessService.getUserAccess() !== null) {
                  resolve(true);
                }

              }
            })
          }
        }
      })
    })
  }
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }


}

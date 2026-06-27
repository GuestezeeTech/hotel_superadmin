import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../auth-services/auth-token.service'; // For calling methods in auth-token
import { LocalStorageService } from '../auth-services/local-storage.service'; // For getting data's from local storage
import { ENDPOINTS } from '../app.config'; // For getting endpoints
import { LoaderService } from '../shared/loader/loader.service';
import { LoginService } from '../login/login.service'; // For getting service methods
import { Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'; // For validating forms
import { AlertsService } from '../shared/alerts/alerts.service'; // For alert services
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { ProfileService } from './profile.service';
import { AlertsComponent } from "../shared/alerts/alerts.component";
import { ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AlertsComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileuploadinput') fileuploadinput!: ElementRef;
  // For online/offline
  isOnline: boolean = true;
  // Modal
  isPasswordModalOpen = false;
  isEmailModalOpen = false;
  // For eye visibility
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  currentEmail = '';
  newEmail = '';
  currentEmailError = '';
  newEmailError = '';
  adminUserData: any = {};
  maskedPassword: string = "********";
  userRegistartionForm!: UntypedFormGroup;
  passwordUpdateForm!: UntypedFormGroup;
  validFirstName: boolean = false;
  validLastName: boolean = false;
  isExitModalOpen: boolean = false;
  validateForm2: Boolean = false;
  validateImage: Boolean = false;
  isLogoutModalOpen: boolean = false;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  passwordErrorMessage: string = '';

  constructor(
    private localService: LocalStorageService,
    private authService: AuthTokenService,
    private loaderService: LoaderService,
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private alertService: AlertsService,
    private http: HttpClient,
    private authTokenService: AuthTokenService,
    private profileService: ProfileService
  ) { }

  ngOnInit(): void {
    //console.log('User Id:', this.authService.getUserId());
    this.getAdminProfileDetails();
    this.initializeForms();
    //console.log('Form Initialized:', this.userRegistartionForm);

  }


  // Initialize both profile and password update forms
  initializeForms() {
    this.userRegistartionForm = this.formBuilder.group({
      first_name: ['', [Validators.maxLength(40), Validators.pattern("^[a-zA-Z][a-z A-Z]*$")]],
      last_name: ['', [Validators.maxLength(40), Validators.pattern("^[a-zA-Z][a-z A-Z]*$")]],
      // profile_image: '../../assets/images/guestezee/profile.png',
      profile_image: 'https://images.ecbee.net/GuestEzee/Brand/ChatGPT_Image_Jun_19__2026__01_25_37_PM.webp',
      imageFile: [''],
    });

    this.passwordUpdateForm = this.formBuilder.group({
      current_password: ['', [Validators.minLength(6), Validators.required]],
      new_password: ['', [Validators.minLength(6), Validators.required]],
      confirm_password: ['', [Validators.minLength(6), Validators.required]],
    });

    // Clear custom modal errors when user starts typing
    this.passwordUpdateForm.valueChanges.subscribe(() => {
      this.passwordErrorMessage = '';
    });
  }

  get f() { return this.userRegistartionForm.controls; }
  get p() { return this.passwordUpdateForm.controls; }

  formCheck() {
    this.validFirstName = this.f['first_name'].invalid;
    this.validLastName = this.f['last_name'].invalid;

    if (this.userRegistartionForm.valid) {
      this.profileUpdate(this.profile_image);
    }
  }

  addBrandForm !: FormGroup;
  previewImgUrl: string | null = null;
  imageName: string = '';
  enableEdit: boolean = true;
  imgFile: File | null = null;
  //  profile_image: string | null = '../../assets/images/guestezee/profile.png';
  profile_image: string | null = 'https://images.ecbee.net/GuestEzee/Brand/ChatGPT_Image_Jun_19__2026__01_25_37_PM.webp';

  imageupload(event: any): void {
    let dragEvent = false;
    let file_data = { name: "", size: 0 };
    let originalFile: File | null = null;

    if (event.target && event.target.files && event.target.files[0]) {
      originalFile = event.target.files[0];
      file_data = event.target.files[0];
    } else if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      originalFile = event.dataTransfer.files[0];
      file_data = event.dataTransfer.files[0];
      dragEvent = true;
    }

    if (!originalFile) {
      return;
    }

    this.validateImage = true;
    this.imageName = file_data.name;
    let splitFileName = this.imageName.split(".");

    if (Math.round((file_data.size / 1000)) > 2000) {
      this.userRegistartionForm.controls['imageFile'].setErrors({ 'sizehigh': true });
      this.alertService.error("File size must be less than 2MB.", this.options);
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    if (!["jpg", "jpeg", "png", "gif", "JPG", "JPEG", "PNG", "GIF"].includes(splitFileName[splitFileName.length - 1])) {
      this.userRegistartionForm.controls['imageFile'].setErrors({ 'type': true });
      this.alertService.error("Invalid image format. Allowed types: JPG, JPEG, PNG, GIF.", this.options);
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    this.userRegistartionForm.controls['imageFile'].setErrors({ 'type': false });
    this.userRegistartionForm.controls['imageFile'].setErrors({ 'sizehigh': false });

    // Validate dimensions: must be exactly 200 x 200 pixels to look good in header profile
    const img = new Image();
    img.src = window.URL.createObjectURL(originalFile);
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      window.URL.revokeObjectURL(img.src);

      if (width !== 200 || height !== 200) {
        this.userRegistartionForm.controls['imageFile'].setErrors({ 'dimensions': true });
        this.alertService.error(`Image dimensions must be exactly 200 × 200 pixels. (Uploaded image: ${width} × ${height} pixels)`, this.options);
        if (event.target) {
          event.target.value = '';
        }
        return;
      }

      // Valid size - proceed with preview and upload original file to maintain quality
      this.imgFile = originalFile;

      const reader = new FileReader();
      reader.onload = (evt: any) => {
        this.previewImgUrl = evt.target.result;
        this.userRegistartionForm.controls['imageFile'].setValue(evt.target.result);
      };
      reader.readAsDataURL(originalFile);

      let headers = new HttpHeaders().set("source", "Brand").set("domain_name", this.authTokenService.getDomain());
      let formData_imageCate = new FormData();
      formData_imageCate.append('upload', originalFile);

      this.profileService.sendImage(formData_imageCate, headers).subscribe(resp => {
        if (resp && resp.success === 1 && resp.status_code === 200) {
          let imgVariable = resp.result.data[0];
          this.profile_image = imgVariable.location;
          this.profileUpdate(this.profile_image, "Profile image uploaded successfully!");
        }
        if (event.target) {
          event.target.value = '';
        }
      }, error => {
        this.alertService.error("Error uploading profile image.", this.options);
        if (event.target) {
          event.target.value = '';
        }
      });
    };

    img.onerror = () => {
      window.URL.revokeObjectURL(img.src);
      this.alertService.error('Invalid image file.', this.options);
      if (event.target) {
        event.target.value = '';
      }
    };
  }

  deleteImage() {
    this.profile_image = 'https://images.ecbee.net/GuestEzee/Brand/ChatGPT_Image_Jun_19__2026__01_25_37_PM.webp';
    this.profileUpdate(this.profile_image, "Profile image deleted successfully!");
    this.userRegistartionForm.controls['imageFile'].setErrors({ 'type': false });
    this.userRegistartionForm.controls['imageFile'].setErrors({ 'sizehigh': false });
    if (this.fileuploadinput) {
      this.fileuploadinput.nativeElement.value = '';
    }
    this.closeExitModal();
  }

  getAdminProfileDetails() {
    let jsonObj = {
      "domain_name": this.authService.getDomain(),
      "user_id": this.authService.getUserId(),
      "extras": {
        "find": { "id": this.authService.getUserId() }
      }
    };

    this.profileService.postApiCall(jsonObj, ENDPOINTS.GETBYID_ADMINUSERS).subscribe(resp => {
      if (resp.success === 1 && resp.status_code === 200) {
        this.adminUserData = {
          ...resp.result.data[0],
          profile_image: resp.result.data[0]?.profile_image ?? 'assets/images/default-user.png'
        };

        if (!this.adminUserData) {
          return;
        }

        if (this.adminUserData) {
          this.userRegistartionForm.patchValue({
            first_name: this.adminUserData.first_name || '',
            last_name: this.adminUserData.last_name || '',
            profile_image: this.adminUserData.profile_image
          });

          this.localService.set('profile_image', this.adminUserData.profile_image);
          this.profileService.updateProfileImage(this.adminUserData.profile_image);
          this.profile_image = this.adminUserData.profile_image || 'https://images.ecbee.net/GuestEzee/Brand/ChatGPT_Image_Jun_19__2026__01_25_37_PM.webp';
          this.profileService.updateProfileName(this.adminUserData.first_name + ' ' + this.adminUserData.last_name);
          console.log('Name:', this.localService.get('profile_name'));
        }
      }
    });
  }

  profileUpdate(profile_image: any, successMessage: string = "Profile updated successfully!") {
    if (this.userRegistartionForm.valid) {
      let formData = {
        first_name: this.userRegistartionForm.value.first_name,
        last_name: this.userRegistartionForm.value.last_name,
        profile_image: profile_image
      };

      let updateData = {
        domain_name: this.authService.getDomain(),
        user_id: this.authService.getUserId(),
        payload: {
          customer_creation: formData
        },
        extras: {
          find: { id: this.authService.getUserId() }
        }
      };

      this.profileService.postApiCall(updateData, ENDPOINTS.UPDATE_USER).subscribe(resp => {
        if (resp.success == 1) {
          this.alertService.success(successMessage, this.options);
          this.getAdminProfileDetails();
        } else {
          this.alertService.error(resp.message, this.options);
        }
      }, err => {
        this.alertService.error("Error updating profile: " + (err.error?.message || "Please try again!"), this.options);
      });
    }
  }


  /*  savePasswordChanges() {
     if (this.passwordUpdateForm.valid) {
       this.validateForm2 = true;
       // Newly added
       const storedPassword = this.localService.get('password');
       const currentPassword = this.p['current_password'].value;
       // Check if current password matches the stored password
       if (storedPassword !== currentPassword) {
         this.p['current_password'].setErrors({ incorrect: true });
         this.alertService.error("Current Password is incorrect.", this.options);
         return;
       }
       // Ensure passwords match
       if (this.p['new_password'].value !== this.p['confirm_password'].value) {
         this.p['confirm_password'].setErrors({ matchError: true });
         this.alertService.error("New Password and Confirm Password do not match.", this.options);
         return;
       }
       // let formData = {
       //   new_password: this.p['new_password'].value,
       // old_password: this.p['current_password'].value
       // };
 
       // Clone adminUserData and exclude _id
       let { _id, ...updatableUserData } = this.adminUserData;
       // Update password only
       updatableUserData.password = this.p['new_password'].value;
       // let updatedProfileData = {
       //   ...this.adminUserData,
       //   password: this.p['new_password'].value
       // };
       let jsonObj = {
         domain_name: this.authService.getDomain(),
         user_id: this.authService.getUserId(),
         payload: {
           user_updation: updatableUserData
         },
         extras: {
           find: {
             id: this.authService.getUserId()
           }
         }
       };
       this.profileService.updatePassword(jsonObj).subscribe(
         resp => {
           if (resp?.success === 1) {
             this.passwordUpdateForm.reset();
             this.isPasswordModalOpen = false;
             this.alertService.success("Password updated successfully!", this.options);
             this.localService.set('password', this.p['new_password'].value);
             // setTimeout(() => {
             //   this.alertService.clear(); // Clears the alert message
             // }, 2000);
           } else {
             this.alertService.error(resp?.message || "Something went wrong.", this.options);
             console.log('Err:', resp.message)
             // setTimeout(() => {
             //   this.alertService.clear(); // Clears the alert message
             // }, 2000);
           }
         },
         err => {
           this.alertService.error("Error updating password: " + (err.error?.message || "Please try again!"), this.options);
           // setTimeout(() => {
           //   this.alertService.clear(); // Clears the alert message
           // }, 2000);
         }
       );
     } else {
       this.passwordUpdateForm.markAllAsTouched();
       this.validateForm2 = true;
     }
   } */
  savePasswordChanges() {

    this.passwordErrorMessage = '';

    if (!this.passwordUpdateForm.valid) {
      this.passwordUpdateForm.markAllAsTouched();
      this.validateForm2 = true;
      return;
    }

    const storedPassword = this.localService.get('password');
    const currentPassword = this.p['current_password'].value;
    const newPassword = this.p['new_password'].value;
    const confirmPassword = this.p['confirm_password'].value;

    // Current password validation
    if (storedPassword !== currentPassword) {
      this.passwordErrorMessage = 'Current password is incorrect.';
      return;
    }

    // Current and New password same validation
    if (currentPassword === newPassword) {
      this.passwordErrorMessage =
        'New password must be different from the current password.';
      return;
    }

    // Confirm password validation
    /*  if (newPassword !== confirmPassword) {
       this.p['confirm_password'].setErrors({ matchError: true });
       this.passwordErrorMessage =
         'New Password and Confirm Password do not match.';
       return;
     } */
    if (newPassword !== confirmPassword) {
      return;
    }

    // API Call
    let { _id, ...updatableUserData } = this.adminUserData;

    updatableUserData.password = newPassword;

    let jsonObj = {
      domain_name: this.authService.getDomain(),
      user_id: this.authService.getUserId(),
      payload: {
        user_updation: updatableUserData
      },
      extras: {
        find: {
          id: this.authService.getUserId()
        }
      }
    };

    this.profileService.updatePassword(jsonObj).subscribe(
      resp => {
        if (resp?.success === 1) {
          this.passwordUpdateForm.reset();
          this.passwordErrorMessage = '';
          this.isPasswordModalOpen = false;

          this.alertService.success(
            'Password updated successfully!',
            this.options
          );

          this.localService.set('password', newPassword);
        } else {
          this.passwordErrorMessage =
            resp?.message || 'Something went wrong.';
        }
      },
      err => {
        this.passwordErrorMessage =
          err.error?.message || 'Error updating password. Please try again.';
      }
    );
  }

  toggleStatus() {
    this.isOnline = !this.isOnline;
  }

  openPasswordModal() {
    this.passwordUpdateForm.reset();
    this.passwordErrorMessage = '';
    this.isPasswordModalOpen = true;
  }

  // closePasswordModal(event: Event) {
  //   if (event.target === event.currentTarget) {
  //     this.isPasswordModalOpen = false;
  //   }
  // }
  closePasswordModal() {
    this.isPasswordModalOpen = false;
    this.passwordErrorMessage = '';
  }

  togglePasswordVisibility(type: string) {
    if (type === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (type === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (type === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  openEmailModal() {
    this.isEmailModalOpen = true;
  }

  closeEmailModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.isEmailModalOpen = false;
    }
  }

  validateEmails() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    this.currentEmailError = !this.currentEmail.trim()
      ? "Current email is required."
      : !emailPattern.test(this.currentEmail)
        ? "Enter a valid email address."
        : "";

    this.newEmailError = !this.newEmail.trim()
      ? "New email is required."
      : !emailPattern.test(this.newEmail)
        ? "Enter a valid email address."
        : "";
  }

  logout() {
    this.isLogoutModalOpen = true;
  }

  confirmLogout() {
    this.localService.remove('accessToken');
    this.localService.remove('refreshToken');
    this.localService.remove('expireTime');
    this.localService.remove('UserName');
    this.localService.remove('UserEmail');
    this.localService.remove('UserId');
    this.localService.remove('domainName');
    this.localService.remove('rexpireTime');
    this.localService.remove('lastValidUrl');
    this.localService.set('loggedOut', 'true');
    this.isLogoutModalOpen = false;
    this.router.navigate([`/login`], { skipLocationChange: false });
  }

  closeLogoutModal() {
    this.isLogoutModalOpen = false;
  }

  openExitModal() {
    this.isExitModalOpen = true;
  }

  closeExitModal() {
    this.isExitModalOpen = false;
  }


}


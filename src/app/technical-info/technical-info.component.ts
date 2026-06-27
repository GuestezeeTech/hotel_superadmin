import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { TechnicalInfoService } from './technical-info.service';
import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { ENDPOINTS } from '../app.config';
import { AlertsService } from '../shared/alerts/alerts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';



@Component({
  selector: 'app-technical-info',
  standalone: true,
  imports: [AlertsComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './technical-info.component.html',
  styleUrl: './technical-info.component.scss'
})
export class TechnicalInfoComponent implements OnInit {
  @ViewChild('iconInput') iconInput!: ElementRef<HTMLInputElement>;
  previewImgUrl: string | null = null;
  techInfoForm: FormGroup = new FormGroup({});
  iconPreview: string | ArrayBuffer | null = null;//newly added for image
  iconError: string = ''; //newly added for image
  showInlinePreview: boolean = false; // toggles inline preview
  imageName: string = '';
  enableEdit: boolean = true;
  imgFile: File | null = null;
  logo_image: string = '';
  techInfoDataForm: FormGroup;
  service_image: any;
  tech_info_id: any;
  ecomData: any;
  uploadedFileName: string | null = null;
  techInfoData: any;
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
    private route: ActivatedRoute,
    private location: Location

  ) {


    this.techInfoDataForm = this.fb.group({
      technicalInfo: this.fb.array([]),
    })
  }
  ngOnInit(): void {
    this.techInfoForm = new FormGroup({

      // name: new FormControl('', Validators.required),
      // type: new FormControl('', Validators.required),
      // api_url: new FormControl('', Validators.required),
      name: new FormControl('', [Validators.required, Validators.pattern(/.*\S.*/)]),
      type: new FormControl('', [Validators.required]),
      api_url: new FormControl('', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]),
      image: new FormControl(''),
      is_active: new FormControl(false),

    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Reactive ID:', id);
      this.tech_info_id = Number(id);
      console.log(this.tech_info_id, " this.tech_info_id")
      if (this.tech_info_id != 0 || this.tech_info_id != undefined || this.tech_info_id != null) {
        this.getTechInfoById();
      }
    });
  }

  employees(): FormArray {
    console.log(this.techInfoDataForm.get("technicalInfo") as FormArray);
    const values = this.techInfoDataForm.value.technicalInfo;
    console.log("123456", values);
    return this.techInfoDataForm.get("technicalInfo") as FormArray
  }


  newEmployee(): FormGroup {
    return this.fb.group({
      key: '',
      value: '',
      // skills:this.fb.array([])
    })
  }


  addEmployee() {
    console.log("Adding a employee");
    this.employees().push(this.newEmployee());
  }

  removeEmployee(empIndex: number) {
    this.employees().removeAt(empIndex);
  }


  addApiIntegration() {
    let createobj =
    {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "payload": {
        "integration_settings": {
          "name": this.techInfoForm.get('name')?.value,
          "type": this.techInfoForm.get('type')?.value,
          "title": this.techInfoForm.get('name')?.value,
          "api_url": this.techInfoForm.get('api_url')?.value,
          "is_enabled": false,
          "is_active": this.techInfoForm.get('is_active')?.value,
          "logo": this.service_image,
          "description": "",
          "attributes": this.techInfoDataForm.value.technicalInfo
        }
      }
    }
    this.technicalInfoService.apiCall(createobj, ENDPOINTS.CREATE_APIINTEGRATION_SETTINGS).subscribe(
      resp => {
        console.log("test", "123")
        if (resp && resp.status_code == 200 && resp.success == 1) {
          // this.techInfoData = resp.result.data[0];
          // this.tech_info_id=resp.result.data[0].id;
          // this.router.navigate(['/tech-info-list'])
          this.location.back();
          this.alertService.success(resp.message, this.options);
        }
        else if (resp && resp.status_code == 200 && resp.success == 0) {
          if (resp.message && (resp.message.toLowerCase().includes('record already exists') || resp.message.toLowerCase().includes('already exists'))) {
            const type = (this.techInfoForm.get('type')?.value || '').toLowerCase();
            if (type === 'lock' || type === 'pos') {
              const typeLabel = type === 'pos' ? 'pms' : type;
              this.alertService.error(`Already ${typeLabel} integration with this name exists`, this.options);
            } else {
              this.alertService.error('Record already exists', this.options);
            }
          } else {
            this.alertService.error(resp.message || 'Record already exists', this.options);
          }
        }
        else {
          this.alertService.error(resp.message, this.options);
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
  }

  updateApiIntegration() {
    let createobj =
    {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      "payload": {
        "integration_settings": {
          "name": this.techInfoForm.get('name')?.value,
          "type": this.techInfoForm.get('type')?.value,
          "title": this.techInfoForm.get('name')?.value,
          "api_url": this.techInfoForm.get('api_url')?.value,
          "is_enabled": false,
          "is_active": this.techInfoForm.get('is_active')?.value,
          "logo": this.service_image,
          "description": "",
          "attributes": this.techInfoDataForm.value.technicalInfo
        }
      },
      "extras": {
        "find": {
          "id": this.tech_info_id
        }
      }
    }
    this.technicalInfoService.apiCall(createobj, ENDPOINTS.EDIT_APIINTEGRATION_SETTINGS).subscribe(
      resp => {
        if (resp && resp.status_code == 200 && resp.success == 1) {
          // this.techInfoData = resp.result.data[0];
          // this.tech_info_id=resp.result.data[0].id;
          // this.router.navigate(['/tech-info-list'])
          this.location.back();
          this.alertService.success(resp.message, this.options);
        }
        else if (resp && resp.status_code == 200 && resp.success == 0) {
          if (resp.message && (resp.message.toLowerCase().includes('record already exists') || resp.message.toLowerCase().includes('already exists'))) {
            const type = (this.techInfoForm.get('type')?.value || '').toLowerCase();
            if (type === 'lock' || type === 'pos') {
              const typeLabel = type === 'pos' ? 'pms' : type;
              this.alertService.error(`Already ${typeLabel} integration with this name exists`, this.options);
            } else {
              this.alertService.error('Record already exists', this.options);
            }
          } else {
            this.alertService.error(resp.message || 'Record already exists', this.options);
          }
        }
        else {
          this.alertService.error(resp.message, this.options);
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
  }

  saveData() {
    if (this.techInfoForm.valid && this.techInfoDataForm.valid) {
      if (this.tech_info_id == 0 || this.tech_info_id == undefined) {
        this.addApiIntegration();
      }
      else {
        this.updateApiIntegration();
      }
    }
    else {
      console.log("Form is invalid!");
    }
  }

  imageupload(event: any): void {
    console.log("1234")
    let dragEvent = false
    let file_data = { name: "", size: 0 }
    //CHECKING DRAG EVENT OR UPLOAD EVENT
    if (event.target && event.target.files && event.target.files[0]) {

      file_data = event.target.files[0]
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.uploadedFileName = file.name;
        // Optionally handle actual upload or validation logic here
      }
    }
    else {
      file_data = event.dataTransfer.files[0]
      dragEvent = true
    }
    // this.validateImage = true;
    var reader = new FileReader();

    this.imageName = file_data.name
    let splitFileName = this.imageName.split(".")
    //CHECKING FILE NAME
    // if (splitFileName.length == 0) {
    //   this.userRegistartionForm.controls['imageFile'].setErrors({ 'invalid': true });
    //   return
    // }

    // if (file_data.size == 0) {
    //   this.userRegistartionForm.controls['imageFile'].setErrors({ 'sizezero': true });
    //   return
    // }

    if (Math.round((file_data.size / 1000)) > 2000) {
      this.techInfoForm.controls['image'].setErrors({ 'sizehigh': true });
      return
    }

    //CHECKING FILE TYPE
    if (!["jpg", "jpeg", "png", "gif", "JPG", "JPEG", "PNG", "GIF"].includes(splitFileName[splitFileName.length - 1])) {
      this.techInfoForm.controls['image'].setErrors({ 'type': true });
      return
    }


    reader.onload = (evt: any) => {
      this.previewImgUrl = evt.target.result;
      // this.techInfoForm.controls['image'].setValue(evt.target.result)
      this.imgFile = event.target.files[0];
    }

    //BASED ON EVENT READ FILE
    if (!dragEvent) {
      reader.readAsDataURL(event.target.files[0]);
      this.imgFile = event.target.files[0];

    }
    else {
      reader.readAsDataURL(event.dataTransfer.files[0]);
      this.imgFile = event.dataTransfer.files[0];
    }


    let headers = new HttpHeaders().set("source", "Brand").set("domain_name", this.authTokenService.getDomain())
    let formData_imageCate = new FormData();
    if (this.imgFile !== null) {
      formData_imageCate.append('upload', this.imgFile)
    }
    this.technicalInfoService.sendImage(formData_imageCate, headers).subscribe(resp => {
      if (resp && resp.success === 1 && resp.status_code === 200) {
        let imgVariable = resp.result.data[0];
        if (this.imgFile !== null) {
          this.service_image = imgVariable.location;
          console.log("this.service_image" + this.service_image)
          // Store profile image in localStorage
        }
      }
    })
  }

  clearImage(): void {
    this.uploadedFileName = null;
    this.techInfoForm.get('image')?.reset();
  }

  openLogofile() {
    this.iconInput.nativeElement.click();
  }

  async logoupload(event: any) {
    let file_data = { name: "", size: 0 };
    if (event.target && event.target.files && event.target.files[0]) {
      file_data = event.target.files[0];
    } else if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      file_data = event.dataTransfer.files[0];
    }

    if (!file_data.name) return;
    this.iconError = '';

    let imageName = file_data.name;
    let splitFileName = imageName.split(".");
    const maxBytes = 2 * 1024 * 1024; // 2 MB

    if (file_data.size > maxBytes) {
      this.iconError = 'Icon size should not exceed 2 MB.';
      return;
    }

    // CHECKING FILE TYPE (only jpg, jpeg, png)
    if (!["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"].includes(splitFileName[splitFileName.length - 1])) {
      this.iconError = 'Invalid icon format. Allowed types: JPG, JPEG, PNG.';
      return;
    }

    // Dimension check: 150x150
    const iconImg = new Image();
    const iconUrl = URL.createObjectURL(file_data as any);
    iconImg.onload = async () => {
      const validSize = iconImg.width === 150 && iconImg.height === 150;
      if (!validSize) {
        URL.revokeObjectURL(iconUrl);
        this.iconError = 'Icon must be exactly 150x150 pixels.';
        return;
      }

      // Passed all checks, proceed with preview + upload
      this.iconPreview = iconUrl;
      this.iconError = '';
      let headers = new HttpHeaders().set("source", "Brand").set("domain_name", this.authTokenService.getDomain())
      let formData_imageCate = new FormData();
      formData_imageCate.append('upload', file_data as any);

      this.technicalInfoService.sendImage(formData_imageCate, headers).subscribe(resp => {
        if (resp && resp.success === 1 && resp.status_code === 200) {
          this.service_image = resp.result.data[0].location;
          this.iconPreview = resp.result.data[0].location;
          URL.revokeObjectURL(iconUrl);
          this.alertService.success('Icon uploaded successfully.', this.options);
        } else {
          this.iconPreview = null;
          URL.revokeObjectURL(iconUrl);
          this.iconError = 'Icon upload failed. Please try again.';
        }
      });
    };
    iconImg.onerror = () => {
      URL.revokeObjectURL(iconUrl);
      this.iconError = 'Unable to read icon image.';
    };
    iconImg.src = iconUrl;
  }

  // viewFile(src: any) {
  //   if (src) {
  //     const newWindow = window.open();
  //     newWindow?.document.write(`<img src="${src}" style="max-width:100%; height:auto;">`);
  //   }

  togglePreview() {
    this.showInlinePreview = !this.showInlinePreview;
  }

  removeIcon() {
    this.service_image = null;
    this.iconPreview = null;
    //newly added
    if (this.iconInput) {
      this.iconInput.nativeElement.value = '';
    }
    this.alertService.success('Icon removed successfully.', this.options);
  }

  getTechInfoById(): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            id: this.tech_info_id
          }
        }
      };

      this.technicalInfoService.apiCall(requestBody, ENDPOINTS.APIINTEGRATION_BY_ID).subscribe(
        resp => {

          if (resp) {
            this.ecomData = resp.result.data[0];
            this.service_image = resp.result.data[0].logo;
            this.iconPreview = resp.result.data[0].logo;
            this.uploadedFileName = resp.result.data[0].logo;

            this.techInfoForm.patchValue({
              name: this.ecomData.name,
              type: this.ecomData.type,

              image: "",
              api_url: this.ecomData.api_url,
              is_active: this.ecomData.is_active,

              description: this.ecomData.description
            });
            console.log(this.techInfoForm.value,)

            const attributesArray = this.fb.array(
              this.ecomData.attributes.map((attr: any) =>
                this.fb.group({
                  key: [attr.key],
                  value: [attr.value]
                })
              )
            );
            this.techInfoDataForm.setControl('technicalInfo', attributesArray);




            resolve();  // Resolve promise when data is set
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

  goBack() {
    // this.router.navigate(['/tech-info-list']);
    this.location.back();
  }
}

export class country {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

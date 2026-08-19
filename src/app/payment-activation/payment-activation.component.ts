import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthTokenService } from '../auth-services/auth-token.service';
import { ProfileService } from '../profile/profile.service';
import { AlertsService } from '../shared/alerts/alerts.service';
import { LoaderService } from '../shared/loader/loader.service';
import { AlertsComponent } from '../shared/alerts/alerts.component';
import { ENDPOINTS } from '../app.config';

@Component({
    selector: 'app-payment-activation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, AlertsComponent],
    templateUrl: './payment-activation.component.html',
    styleUrl: './payment-activation.component.scss'
})

export class PaymentActivationComponent implements OnInit {
    settingsForm!: FormGroup;
    validateForm: boolean = false;
    adminUserData: any = {};
    options = {
        autoClose: true,
        keepAfterRouteChange: false
    };

    constructor(
        private fb: FormBuilder,
        private authTokenService: AuthTokenService,
        private profileService: ProfileService,
        private alertService: AlertsService,
        private loaderService: LoaderService
    ) { }

    ngOnInit(): void {
        this.settingsForm = this.fb.group({
            pay_now_days: ['', [
                Validators.required,
                Validators.pattern('^[0-9]+$'),
                Validators.min(1),
                Validators.max(80)
            ]]
        });
        this.getActivationDays();
    }

    get f() {
        return this.settingsForm.controls;
    }

    getActivationDays() {
        this.loaderService.emitLoading();
        const jsonObj = {
            domain_name: this.authTokenService.getDomain(),
            user_id: this.authTokenService.getUserId(),
            extras: {
                find: { id: this.authTokenService.getUserId() }
            }
        };
        this.profileService.postApiCall(jsonObj, ENDPOINTS.GETBYID_ADMINUSERS).subscribe(
            (resp) => {
                this.loaderService.emitComplete();
                if (resp && resp.success === 1 && resp.status_code === 200) {
                    this.adminUserData = resp.result.data[0] || {};
                    const payNowDays = this.adminUserData.pay_now_days !== undefined ? this.adminUserData.pay_now_days : '';
                    this.settingsForm.patchValue({
                        pay_now_days: payNowDays
                    });
                }
                else {
                    this.alertService.error(resp?.message || 'Failed to fetch settings.', this.options);
                }
            },
            (err) => {
                this.loaderService.emitComplete();
                this.alertService.error(err.error?.message || 'Error fetching user settings.', this.options);
            }
        );
    }

    saveSettings() {
        this.validateForm = true;
        if (this.settingsForm.invalid) {
            this.settingsForm.markAllAsTouched();
            return;
        }
        this.loaderService.emitLoading();
        // Add pay_now_days
        const payNowDaysValue = Number(this.settingsForm.value.pay_now_days);
        const updatePayload = {
            pay_now_days: payNowDaysValue
        };
        const updateData = {
            domain_name: this.authTokenService.getDomain(),
            user_id: this.authTokenService.getUserId(),
            payload: {
                user_updation: updatePayload
            },
            extras: {
                find: { id: this.authTokenService.getUserId() }
            }
        };
        this.profileService.postApiCall(updateData, ENDPOINTS.UPDATE_USER).subscribe(
            (resp) => {
                this.loaderService.emitComplete();
                if (resp && resp.success === 1) {
                    this.alertService.success('Pay Now Days settings updated successfully!', this.options);
                    this.validateForm = false;
                    // Refresh data
                    this.getActivationDays();
                }
                else {
                    this.alertService.error(resp?.message || 'Failed to save settings.', this.options);
                }
            },
            (err) => {
                this.loaderService.emitComplete();
                this.alertService.error(err.error?.message || 'Error saving settings.', this.options);
            }
        );
    }

    getDisplayDays(): string {
        const val = this.settingsForm.get('pay_now_days')?.value;
        if (val !== null && val !== undefined && val !== '' && !isNaN(Number(val))) {
            return val.toString();
        }
        return '0';
    }
}

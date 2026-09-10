import { Injectable } from '@angular/core';
import { HotelEnrollmentTabviewService } from './hotel-enrollment-tabview.service';
import { ENDPOINTS } from '../app.config';
import { AES, enc, mode } from 'crypto-js';
import * as crypto from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CheckoutApiService {

  commonRequestData = {
    "extras": {
      "find": {
      }
    }
  }

  respObject = {
    success: true,
    data: {},
    message: ""
  }

  constructor(
    public hotelenrollmenttabviewservice: HotelEnrollmentTabviewService,
  ) { }

  checkoutAPICall(endPoint: string, reqData?: any) {
    return new Promise((resolve, reject) => {
      var respObject = {
        success: true,
        data: {},
        message: ""
      }
      this.hotelenrollmenttabviewservice.postApiCall(reqData ? reqData : this.commonRequestData, endPoint).subscribe({
        next: (resp1) => {
          let resp = resp1;
          if (resp.success === 1) {
            respObject.success = true;
            if (resp.result) {
              respObject.data = resp.result.data;
            }
            else {
              respObject = resp;
            }
            if (resp.message) {
              respObject.message = resp.message;
            }
            resolve(respObject);
          }
          else if (resp.success === 0) {
            if (resp.result) {
              if (resp.result.data.deliveryCharge) {
                respObject.success = true;
                if (resp.result) {
                  respObject.data = resp.result.data;
                }
                else {
                  respObject = resp;
                }
                if (resp.message) {
                  respObject.message = resp.message;
                }
                resolve(respObject);
              }
              else {
                respObject.success = false;
                respObject.data = resp;
                if (resp.message) {
                  respObject.message = resp.message;
                }
                resolve(respObject)
              }
            }
            else {
              respObject.success = false;
              respObject.data = resp;
              if (resp.message) {
                respObject.message = resp.message;
              }
              resolve(respObject)
            }
          }
          else {
            respObject.success = false;
            if (resp.message) {
              respObject.message = resp.message;
            }
            else {
              respObject.message = 'Something bad happened; Please try again!';
            }
            resolve(respObject);
          }
        },
        error: (err) => {
          respObject.success = false;
          if (err.error.statusCode === 401) {
            respObject.message = "Your password is invalid. Please try again."
          }
          else if (err.error.statusCode === 500) {
            respObject.message = err.error.message;
          }
          else if (err.error.error) {
            if (err.error.error.message) {
              respObject.message = err.error.error.message
            }
          }
          else {
            respObject.message = 'Something bad happened; Please try again!';
          }
          resolve(respObject);
        }
      })
    })
  }

}


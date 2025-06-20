import { Injectable } from '@angular/core';
import { Observable, throwError } from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { ENDPOINTS } from '../app.config';
import { AuthTokenService } from '../auth-services/auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  dbSchema:string = "";

  constructor
    (
      private http: HttpClient,
      private authTokenService: AuthTokenService,
      private router: Router,
      private route: ActivatedRoute
    ) { }

  // SET HEADERS
  httpOptions = new HttpHeaders().set('Content-Type', 'application/json');
  // httpOptions = new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())

  // MAKE API SERVICE CALLS HERE...

  // API CALLS

  // POST
  postApiCall(dataObj: any, api_endpoint: any): Observable<any>{
    return this.http.post(api_endpoint, dataObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())});
  }

  // GET
  getApiCall(jsonObj: any, api_endpoint: any): Observable<any> {
    if(this.authTokenService.isTokenExpired()){
      this.router.navigate([`/login`], {skipLocationChange: false});
      return new Observable(); 
    }
    else{
      //console.log(api_endpoint)
    return this.http.post(api_endpoint, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())});
    }
  }


  // LOGIN SERVICE
  login(loginObj:any): Observable<any>{
    return this.http.post(ENDPOINTS.LOGIN, loginObj, { headers: new HttpHeaders().set('Content-Type', 'application/json')});
  }

 
  getToken(tokenObj: any): Observable<any> {
    if(this.authTokenService.isTokenExpired()){
      this.router.navigate([`/login`], {skipLocationChange: false});
      return new Observable(); 
    }
    else
    {
    return this.http.post(ENDPOINTS.GETNEWACCESSTOKEN, tokenObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())})
    }
  }
 

  }



 





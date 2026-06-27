import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';
import { Observable } from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ENDPOINTS } from '../../app.config';
import { AuthTokenService } from '../../auth-services/auth-token.service';

@Injectable({
    providedIn: 'root'
})

export class RoleListingService {
    private data = new BehaviorSubject('');
    currentData = this.data.asObservable()

    constructor(
        private http: HttpClient,
        private authTokenService: AuthTokenService,
        private router: Router,
        private route: ActivatedRoute
    ) { }


    getAllRoles(): Observable<any> {
        if (this.authTokenService.isTokenExpired()) {
            this.router.navigate(['/login'], { skipLocationChange: false });
            return of({ success: 0, result: { data: [] }, message: "Session Expired" }); // Return empty response
        }

        return this.http.post(ENDPOINTS.GET_ALL_ROLES, {
            "domain_name": this.authTokenService.getDomain(),
            "user_id": this.authTokenService.getUserId(),
            "extras": {
                "find": {},
                "pagination": true,
                "paginationDetails": {
                    "limit": 0,
                    "pageSize": 1
                },
                "sorting": true,
                "sortingDetails": {
                    "id": -1
                }
            }
        }, {
            headers: new HttpHeaders()
                .set('Content-Type', 'application/json')
                .set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken())
        });
    }

    //delete role
    deleteRole(jsonObj: any): Observable<any> {
        if (this.authTokenService.isTokenExpired()) {
            this.router.navigate([`/login`], { skipLocationChange: false });
            return of({ success: 0, result: { data: [] }, message: "Session Expired" });
        }
        else {
            return this.http.post(ENDPOINTS.DELETE_ROLE, jsonObj, { headers: new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + this.authTokenService.getAccessAPIToken()) });
        }
    }
}

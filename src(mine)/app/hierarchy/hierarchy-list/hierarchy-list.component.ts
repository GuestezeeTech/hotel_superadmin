import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HierarchyService,HierarchyItem } from '../hierarchy.service';
import { CommonModule } from '@angular/common';
import { AuthTokenService } from '../../auth-services/auth-token.service';
import { AlertsService } from '../../shared/alerts/alerts.service';
import { ENDPOINTS } from '../../app.config';
import { FormsModule } from '@angular/forms';

export interface HierarchyItem1 {
  id: number;
  designation: string;
  parentId: number | null;
  isTreeItem?: boolean;
  expanded?: boolean; // <-- Add this!
 

}
export interface Node {
  id: number;
  name: string;
  parentId: number | null;
  children?: Node[];
  expanded?: boolean; // track if node is open or closed
}

@Component({
  selector: 'app-hierarchy-list',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './hierarchy-list.component.html',
  styleUrl: './hierarchy-list.component.scss'
})


export class HierarchyListComponent implements OnInit{
  selectedIds= [101];
  expanded:boolean= true ;
    options = {
    autoClose: true,
    keepAfterRouteChange: false
  
  };
  hierarchyData:any;
  allhierarchyData:any;
  showCreateModal = false;
newHierarchyName = '';
 hierarchyName: string = '';
 hierarchyId:number=0;

    constructor(
    private hierarchyService: HierarchyService,
    private router: Router,
    private authTokenService:AuthTokenService,
    private alertService:AlertsService,
    private activatedRoute:ActivatedRoute
  ) {}
  ngOnInit(): void {
   this.selectedIds= [101];
   this.getAllHierarchy()
  


  }
getItemsByIds(ids: number[]): HierarchyItem[] {
  const allItems = this.getHierarchyData(); // <== This is probably undefined
  return ids
    .map(id => allItems.find(item => item.id === id)) // Error happens here
    .filter((item): item is HierarchyItem => !!item);
}

getLevel(item: HierarchyItem): number {
  const allItems = this.getHierarchyData();
  let level = 0;
  let parentId = item.parentId;
  while (parentId !== undefined) {
    const parent = allItems.find(i => i.id === parentId);
    if (!parent) break;
    level++;
    parentId = parent.parentId;
  }
  return level;
}

 getHierarchyData(): HierarchyItem[] {
    return this.hierarchyService.getHierarchyData();
  }

  async  getAllHierarchy(): Promise<void> {
    return new Promise((resolve, reject) => {
      let requestBody = {
        domain_name: this.authTokenService.getDomain(),
        user_id: this.authTokenService.getUserId(),
        extras: {
          find: {
            // id: hierarchyId
          }
        }
      };
  
      this.hierarchyService.apiCall(requestBody,ENDPOINTS.GETALL_HIERARCHY).subscribe(
        resp => {
       //console.log("test","123")
          if (resp) {
            // this.allhierarchyData = resp.result.data.filter((item :any) => item.customer_id == undefined);
            this.allhierarchyData = resp.result.data.filter((item: any) => item.customer_member_id == undefined); //newly changed from customer_id to customer_member_id

          
            resolve();  // Resolve promise when data is set
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
          reject(err);  // Reject promise if there is an error
        }
      );
    });
  }
getChildren(parentId: number | undefined): HierarchyItem[] {
  return this.getHierarchyData().filter(item => item.parentId === parentId);
}

toggleExpand(item: HierarchyItem1): void {
  item.expanded = !item.expanded;
}
toggleNode(node: Node) {
  node.expanded = !node.expanded;
}
viewHierarchy(hierarchyId:any){

  
     this.router.navigate(['/view-hierarchy',hierarchyId])

}

// openCreateModal() {
//   this.showCreateModal = true;
//   this.newHierarchyName = '';
// }

closeModal() {
  this.showCreateModal = false;
}
async getid(id:number){
  //console.log("id",id)
  this.hierarchyId = id;
  this.getHierarchyById(this.hierarchyId)

}

     getHierarchyById(hierarchyId:number): Promise<void> {
  return new Promise((resolve, reject) => {
    let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      extras: {
        find: {
          id: hierarchyId
        }
      }
    };

    this.hierarchyService.apiCall(requestBody,ENDPOINTS.GETBYID_HIERARCHY).subscribe(
      resp => {
     
        if (resp) {
          this.hierarchyData = resp.result.data[0];

    

          
        
          resolve();  // Resolve promise when data is set
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
        reject(err);  // Reject promise if there is an error
      }
    );
  });
}




updateHierarchyData(){
 delete this.hierarchyData._id;
 //console.log(this.hierarchyName,"this.hierarchyName")
 this.hierarchyData["name"]= this.hierarchyName;



   let requestBody = {
      domain_name: this.authTokenService.getDomain(),
      user_id: this.authTokenService.getUserId(),
      payload: {
        hierarchy_updation: this.hierarchyData
      },
      extras: {
        find: {
          id: this.hierarchyId
        }
      }
    }
  //console.log("123")
  this.hierarchyService.apiCall(requestBody,ENDPOINTS.UPDATE_HIERARCHY).subscribe(
      resp => {
   
        if (resp) {
          if (resp.success === 1 && resp.status_code === 200) {
            //console.log("success")
            // this.getHierarchyById(Number(this.hierarchyId))
            // .then(() => {
              // this.hierarchyService.clearHierarchyData();
               this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate(['hierarchy-list']);
  });
  // this.router.navigate(['hierarchy-list']).then(() => {
  //   this.router.navigate(['hierarchy-list']);
  // });




          
             
      
  
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
createNewHierarchy(){
  this.router.navigate([`/create-new-hierarchy`], { skipLocationChange: false });
}

}

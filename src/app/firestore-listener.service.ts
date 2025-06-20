import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docSnapshots } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreListenerService {
  private firestore: Firestore = inject(Firestore); // Inject Firestore instance
  private hitServiceChangedSource = new BehaviorSubject<boolean>(false);
  hitServiceChanged$ = this.hitServiceChangedSource.asObservable();  // Public observable to listen from outside

  constructor() { }

  // listenToHitServiceChange() {  // Listens to Firestore document change
  //   const authorityDoc = doc(this.firestore, 'authorities/1'); // Reference to document 'authorities/1'

  //   docSnapshots(authorityDoc).subscribe(snapshot => { //Listens to updates of the authorities/1 document.
  //     const data = snapshot.data(); // Extracts the document data from the snapshot.
  //     if (data?.['hitService'] === true) {
  //       //console.log('hitService changed to TRUE!');
  //       this.hitServiceChangedSource.next(true); // Notif subscribers
  //     }
  //   });
  // }

  listenToHitServiceChange() {
      const authorityDoc = doc(this.firestore, 'authorities/1'); // Firestore document reference
      let isFirstSnapshot = true; // Flag to skip the first snapshot

      docSnapshots(authorityDoc).subscribe(snapshot => { //Listens to updates of the authorities/1 document.
        const data = snapshot.data(); // Extracts the document data from the snapshot.
        const currentValue = data?.['hitService'];

        if (isFirstSnapshot) {
          isFirstSnapshot = false; // skip the first emitted snapshot
          return;
        }

        if (currentValue === true) {
          //console.log('hitService changed to TRUE!');
          this.hitServiceChangedSource.next(true);
        }
      });
  }


  resetHitServiceChangeFlag() {
    this.hitServiceChangedSource.next(false);
  }
}

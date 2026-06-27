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


  // }

  listenToHitServiceChange() {

     if (typeof window === 'undefined') return; // skip if not in browser

  const authorityDoc = doc(this.firestore, 'authorities/1'); 
  let isFirstSnapshot = true;

  docSnapshots(authorityDoc).subscribe(snapshot => {
    const data = snapshot.data();
    const currentValue = data?.['hitService'];

    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }

    if (currentValue === true) {
      this.hitServiceChangedSource.next(true);
    }
  });
  }


  resetHitServiceChangeFlag() {
    this.hitServiceChangedSource.next(false);
  }
}

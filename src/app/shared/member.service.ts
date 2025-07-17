import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  collectionData,
  deleteDoc,
  doc,
  updateDoc, getDocs, writeBatch
} from '@angular/fire/firestore';
import {from, Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private firestore = inject(Firestore);
  private collRef = collection(this.firestore, 'members');

  create(member: { memberTypeId: string; data: Record<string, any> }) {
    return from(addDoc(this.collRef, member));
  }

  delete(id: string) {
    const docRef = doc(this.firestore, 'members', id);
    return from(deleteDoc(docRef));
  }

  update(id: string, data: any) {
    const docRef = doc(this.firestore, 'members', id);
    return from(updateDoc(docRef, { data }));
  }

  getByType(memberTypeId: string) {
    const q = query(this.collRef, where('memberTypeId', '==', memberTypeId));
    return from(getDocs(q).then(snapshot => {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }));
  }

  deleteAllRecordsByMemberTypeId(memberTypeId: string) {
    const q = query(this.collRef, where('memberTypeId', '==', memberTypeId));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        const batch = writeBatch(this.firestore);

        snapshot.forEach(docSnap => {
          const docRef = doc(this.firestore, 'members', docSnap.id);
          batch.delete(docRef);
        });

        return from(batch.commit()); // returns Observable<void>
      })
    );
  }
}

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  docData,
} from '@angular/fire/firestore';
import {from, Observable, of} from 'rxjs';
import {Auth, User} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {AuthService} from './auth.service';

export interface MemberAttribute {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface MemberType extends MemberTypeInit {
  id: string;
}

export interface MemberTypeInit {
  name: string;
  attributes: MemberAttribute[];
}

@Injectable({ providedIn: 'root' })
export class MemberTypeService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private router = inject(Router);
  private collRef = collection(this.firestore, 'memberTypes');

  getAll(): Observable<MemberType[]> {
    return collectionData(this.collRef, { idField: 'id' }) as Observable<MemberType[]>;
  }

  get(id: string): Observable<MemberType> {
    const docRef = doc(this.firestore, 'memberTypes', id);
    return docData(docRef, { idField: 'id' }) as Observable<MemberType>;
  }

  create(memberType: MemberTypeInit) {
    return from(addDoc(this.collRef, memberType));
  }

  update(id: string, memberType: Partial<MemberType>) {
    const docRef = doc(this.firestore, 'memberTypes', id);
    return from(updateDoc(docRef, memberType));
  }

  delete(id: string) {
    const docRef = doc(this.firestore, 'memberTypes', id);
    return from(deleteDoc(docRef));
  }
}

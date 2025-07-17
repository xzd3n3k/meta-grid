// src/app/core/auth.service.ts (you can create a 'core' folder for this)

import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import {Observable, from, BehaviorSubject, of} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Observable to track the current user's state
  private _user = new BehaviorSubject<User | null>(null);
  user$ = this._user.asObservable(); // Expose as public observable

  constructor() {
    // Listen for authentication state changes and update the BehaviorSubject
    onAuthStateChanged(this.auth, (user) => {
      this._user.next(user);
    });
  }

  /**
   * Registers a new user with email and password.
   */
  signUp(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Signs in an existing user with email and password.
   */
  signIn(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        // Optional: Navigate after successful login
        this.router.navigate(['/domu']); // Or wherever your main content is
        return this.user$; // Return the user observable
      })
    );
  }

  /**
   * Signs out the current user.
   */
  signOut(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      switchMap(() => {
        // Optional: Navigate to login page after logout
        this.router.navigate(['/login']);
        return of(undefined); // Return an observable of void
      })
    );
  }

  // Helper to get the current user synchronously (for guards, etc.)
  get currentUser(): User | null {
    return this.auth.currentUser;
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from '../../shared/auth.service';

@Component({
  selector: 'hxt-auth-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
})
export class AuthForm {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected isLoginMode = true; // true for login, false for register
  protected errorMessage: string | null = null;

  protected toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = null; // Clear error message when switching modes
  }

  protected onSubmit() {
    this.errorMessage = null;

    if (!this.email || !this.password) {
      this.errorMessage = 'Vyplň prosím email a heslo.';
      return;
    }

    const auth$ = this.isLoginMode
      ? this.authService.signIn(this.email, this.password)
      : this.authService.signUp(this.email, this.password);

    auth$.subscribe({
      next: () => {
        if (!this.isLoginMode) {
          this.router.navigate(['/member-types']);
        }
      },
      error: (error) => {
        console.error('Authentication error:', error);
        this.errorMessage = this.mapAuthError(error.code);
      }
    });
  }

  private mapAuthError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email je již používán.';
      case 'auth/invalid-email':
        return 'Neplatný formát emailu.';
      case 'auth/weak-password':
        return 'Heslo je příliš slabé (alespoň 6 znaků).';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Neplatný email nebo heslo.';
      case 'auth/operation-not-allowed':
        return 'Email/Heslo přihlášení není povoleno. Zkontrolujte Firebase nastavení.';
      default:
        return 'Vyskytla se neznámá chyba. Zkuste to znovu.';
    }
  }
}

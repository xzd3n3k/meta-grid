import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {AuthService} from '../../shared/auth.service';
import {Button} from '../button/button';

@Component({
  selector: 'hxt-auth-form',
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
})
export class AuthForm {
  private authService = inject(AuthService);

  protected email = '';
  protected password = '';
  protected errorMessage: string | null = null;

  protected onSubmit() {
    this.errorMessage = null;

    if (!this.email || !this.password) {
      this.errorMessage = 'Vyplň prosím email a heslo.';
      return;
    }

    const auth$ = this.authService.signIn(this.email, this.password);

    auth$.subscribe({
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

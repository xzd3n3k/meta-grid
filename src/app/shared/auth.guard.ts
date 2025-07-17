import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1), // Take only the first emission to prevent infinite loops
    map(user => {
      if (user) {
        return true; // User is logged in, allow access
      } else {
        router.navigate(['/login']); // User is not logged in, redirect to login
        return false;
      }
    })
  );
};

import {Component, inject} from '@angular/core';
import {AuthService} from '../../shared/auth.service';

@Component({
  selector: 'hxt-logout',
  imports: [],
  templateUrl: './logout.html',
  styleUrl: './logout.scss'
})
export class Logout {
  private authService = inject(AuthService);

  constructor() {
    this.authService.signOut().subscribe();
  }

}

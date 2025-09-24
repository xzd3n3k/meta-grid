import {Component, inject, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Sidenav} from './components/sidenav/sidenav';
import {AuthService} from './shared/auth.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hxt-root',
  imports: [RouterOutlet, Sidenav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authService = inject(AuthService);

  protected readonly user = toSignal(this.authService.user$);
}

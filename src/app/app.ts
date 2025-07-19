import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MemberTypeForm} from './components/member-type-form/member-type-form';

@Component({
  selector: 'hxt-root',
  imports: [RouterOutlet, MemberTypeForm],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('table-db');
}

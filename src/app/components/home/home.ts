import {Component, inject, signal} from '@angular/core';
import {MemberForm} from '../member-form/member-form';
import {MemberTable} from '../member-table/member-table';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'hxt-home',
  imports: [
    MemberForm,
    MemberTable,
    FormsModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  private readonly router = inject(Router);

  protected readonly showMemberForm = signal(false);

  protected addMember() {
    this.showMemberForm.set(true);
  }

  protected addMemberType() {
    this.router.navigate(['novy-typ-clena']);
  }

  protected manageMemberTypes() {
    this.router.navigate(['spravovat-typy-clenu']);
  }

  protected logout() {
    this.router.navigate(['logout']);
  }

}

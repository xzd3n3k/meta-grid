import { Routes } from '@angular/router';
import {AuthForm} from './components/auth-form/auth-form';
import {MemberTypeForm} from './components/member-type-form/member-type-form';
import {AuthGuard} from '@angular/fire/auth-guard';
import {Logout} from './components/logout/logout';
import {Home} from './components/home/home';
import {MemberTypeTable} from './components/member-type-table/member-type-table';
import {MemberTable} from './components/member-table/member-table';
import {MemberForm} from './components/member-form/member-form';

export const routes: Routes = [
  { path: 'login', component: AuthForm },
  { path: 'logout', component: Logout },
  { path: 'novy-clen', component: MemberForm, canActivate: [AuthGuard] },
  { path: 'novy-typ-clena', component: MemberTypeForm, canActivate: [AuthGuard] },
  { path: 'spravovat-typy-clenu', component: MemberTypeTable, canActivate: [AuthGuard] },
  { path: 'domu', component: Home, canActivate: [AuthGuard] },
  { path: 'tabulka/:id', component: MemberTable, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'domu', pathMatch: 'full' },
  { path: '**', redirectTo: 'domu' },
];

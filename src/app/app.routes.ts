import { Routes } from '@angular/router';
import {AuthForm} from './components/auth-form/auth-form';
import {MemberTypeForm} from './components/member-type-form/member-type-form';
import {AuthGuard, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {Logout} from './components/logout/logout';
import {Home} from './components/home/home';
import {MemberTypeTable} from './components/member-type-table/member-type-table';
import {MemberTable} from './components/member-table/member-table';
import {MemberForm} from './components/member-form/member-form';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const authGuard = {
  canActivate: [AuthGuard],
  data: { authGuardPipe: redirectUnauthorizedToLogin }
};

export const routes: Routes = [
  { path: 'login', component: AuthForm },
  { path: 'logout', component: Logout },
  { path: 'novy-clen', component: MemberForm, ...authGuard },
  { path: 'novy-typ-clena', component: MemberTypeForm, ...authGuard },
  { path: 'spravovat-typy-clenu', component: MemberTypeTable, ...authGuard },
  { path: 'domu', component: Home, ...authGuard },
  { path: 'tabulka/:id', component: MemberTable, ...authGuard },
  { path: '', redirectTo: 'domu', pathMatch: 'full' },
  { path: '**', redirectTo: 'domu' },
];

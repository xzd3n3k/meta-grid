import {Component, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';

@Component({
  selector: 'hxt-sidenav',
  imports: [
    RouterLink
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss'
})
export class Sidenav {
  private memberTypeService = inject(MemberTypeService);
  protected readonly memberTypes = signal<MemberType[]>([]);

  ngOnInit(): void {
    this.memberTypeService.getAll().subscribe((memberTypes: MemberType[]) => {
      this.memberTypes.set(memberTypes);
    })
  }
}

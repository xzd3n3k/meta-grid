import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';
import {MemberService} from '../../shared/member.service';

@Component({
  selector: 'app-member-type-table',
  imports: [
    FormsModule,
  ],
  templateUrl: './member-type-table.html',
  styleUrl: './member-type-table.scss'
})
export class MemberTypeTable implements OnInit {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);

  protected memberTypes: MemberType[] = [];

  ngOnInit() {
    this.memberTypeService.getAll().subscribe(types => {
      this.memberTypes = types;
    });
  }

  protected editMemberType(memberType: MemberType) {
    // TODO open dialog with edit form
    return;
  }

  protected deleteMemberType(id: string) {
    if (confirm('Opravdu chcete smazat tento typ člena?')) {
      this.memberTypeService.delete(id).subscribe(() => {
        this.memberService.deleteAllRecordsByMemberTypeId(id).subscribe();
        this.memberTypes = this.memberTypes.filter(m => m.id !== id);
      });
    }
  }
}

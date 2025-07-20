import {Component, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';
import {MemberService} from '../../shared/member.service';
import {Dialog} from '../dialog/dialog';
import {MemberTypeForm} from '../member-type-form/member-type-form';
import {Button} from '../button/button';

@Component({
  selector: 'hxt-member-type-table',
  imports: [
    FormsModule,
    Dialog,
    MemberTypeForm,
    Button,
  ],
  templateUrl: './member-type-table.html',
  styleUrl: './member-type-table.scss'
})
export class MemberTypeTable implements OnInit {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);

  protected memberType = signal<MemberType | null | undefined>(null);

  protected memberTypes: MemberType[] = [];

  ngOnInit() {
    this.memberTypeService.getAll().subscribe(types => {
      this.memberTypes = types;
    });
  }

  protected editMemberType(memberType: MemberType, dialog: Dialog) {
    this.memberType.set(memberType);
    dialog.open();
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

  protected closeDialog(dialog: Dialog) {
    dialog.close();
  }

}

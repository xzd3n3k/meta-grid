import {Component, OnInit, inject, signal, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MemberService} from '../../shared/member.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {ActivatedRoute} from '@angular/router';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {Button} from '../button/button';
import {LoadingSpinner} from '../loading-spinner/loading-spinner';

@Component({
  selector: 'hxt-member-table',
  imports: [CommonModule, FormsModule, Button, LoadingSpinner],
  templateUrl: './member-table.html',
  styleUrl: './member-table.scss',
})
export class MemberTable {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);
  private activatedRoute = inject(ActivatedRoute);

  protected selectedType: MemberType | null = null;
  protected members: any[] = [];

  protected editId: string | null = null;
  protected editableMember: Record<string, any> = {};

  protected readonly loading = signal(false);

  private memberTypeId= toSignal(
    this.activatedRoute.paramMap.pipe(map(p => p.get('id'))),
  );

  private readonly loadData = effect(() => {
    this.loading.set(true);
    const memberTypeId = this.memberTypeId();
    if (memberTypeId) {
      this.memberTypeService.get(memberTypeId).subscribe(memberType => {
        this.selectedType = memberType;
      })

      this.memberService.getByType(memberTypeId).subscribe(data => {
        this.members = data;
        this.loading.set(false);
      });
    }
  })

  protected editMember(member: any) {
    this.editId = member.id;
    this.editableMember = {...member.data};
  }

  protected cancelEdit() {
    this.editId = null;
    this.editableMember = {};
  }

  protected saveEdit(id: string) {
    this.memberService.update(id, this.editableMember).subscribe(() => {
      this.members.find(m => m.id === id).data = this.editableMember;
      this.cancelEdit();
    });
  }

  protected deleteMember(id: string) {
    if (confirm('Opravdu chcete smazat tohoto člena?')) {
      this.memberService.delete(id).subscribe(() => {
        this.members = this.members.filter(m => m.id !== id);
      });
    }
  }

  protected exportToPdf(selectedType?: MemberType | null) {
    if (!selectedType) {
      return;
    }

    const doc = new jsPDF();
    const columns = selectedType.attributes.map(attr => attr.name);
    const rows = this.members.map(member =>
      selectedType.attributes.map(attr => member.data[attr.name] ?? '')
    );

    autoTable(doc, {
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${selectedType.name}_clenove.pdf`);
  }
}

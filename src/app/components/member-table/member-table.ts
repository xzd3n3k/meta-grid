import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MemberService} from '../../shared/member.service';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-member-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-table.html',
})
export class MemberTable implements OnInit {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);

  memberTypes: MemberType[] = [];
  selectedTypeId = '';
  selectedType: MemberType | null = null;
  members: any[] = [];

  editId: string | null = null;
  editableMember: Record<string, any> = {};

  editMember(member: any) {
    this.editId = member.id;
    this.editableMember = {...member.data};
  }

  cancelEdit() {
    this.editId = null;
    this.editableMember = {};
  }

  saveEdit(id: string) {
    this.memberService.update(id, this.editableMember).subscribe(() => {
      this.members.find(m => m.id === id).data = this.editableMember;
      this.cancelEdit();
    });
  }

  ngOnInit() {
    this.memberTypeService.getAll().subscribe(types => {
      this.memberTypes = types;
    });
  }

  onTypeChange() {
    this.selectedType = this.memberTypes.find(t => t.id === this.selectedTypeId) || null;
    this.members = [];

    if (this.selectedType) {
      this.memberService.getByType(this.selectedTypeId).subscribe(data => {
        this.members = data;
      });
    }
  }

  deleteMember(id: string) {
    if (confirm('Opravdu chcete smazat tohoto člena?')) {
      this.memberService.delete(id).subscribe(() => {
        this.members = this.members.filter(m => m.id !== id);
      });
    }
  }

  exportToPdf() {
    const doc = new jsPDF();
    const columns = this.selectedType!.attributes.map(attr => attr.name);
    const rows = this.members.map(member =>
      this.selectedType!.attributes.map(attr => member.data[attr.name] ?? '')
    );

    autoTable(doc, {
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${this.selectedType!.name}_clenove.pdf`);
  }
}

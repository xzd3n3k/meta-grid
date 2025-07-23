import {Component, OnInit, inject, signal, effect, viewChild, viewChildren} from '@angular/core';
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
import {TriState, TristateToggleSwitch} from '../tristate-toggle-switch/tristate-toggle-switch';

@Component({
  selector: 'hxt-member-table',
  imports: [CommonModule, FormsModule, Button, LoadingSpinner, TristateToggleSwitch],
  templateUrl: './member-table.html',
  styleUrl: './member-table.scss',
})
export class MemberTable {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);
  private activatedRoute = inject(ActivatedRoute);

  private readonly toggleSwitches = viewChildren(TristateToggleSwitch);

  protected readonly selectedType = signal<MemberType | null>(null);

  protected members: any[] = [];

  protected editId: string | null = null;
  protected editableMember: Record<string, any> = {};

  protected readonly loading = signal(false);
  protected readonly anyBooleanAttributes = signal(false);

  resetToggleFilters() {
    this.toggleSwitches().forEach(toggle => {
      toggle.setState('indeterminate');
    })
  }

  filters: { [attributeName: string]: boolean | null } = {};

  toggleBooleanFilter(attrName: string, state: boolean | null): void {
    this.filters[attrName] = state;
  }

  clearBooleanFilter(attrName: string): void {
    this.filters[attrName] = null;
  }

  filteredMembers(): any[] {
    return this.members.filter(member => {
      return Object.entries(this.filters).every(([key, value]) => {
        if (value === null) return true;
        return member.data[key] === value;
      });
    });
  }

  private readonly memberTypeId= toSignal(
    this.activatedRoute.paramMap.pipe(map(p => p.get('id'))),
  );

  private readonly findBooleanAttributes = effect(() => {
    this.anyBooleanAttributes.set(this.selectedType()?.attributes.some(attribute => attribute.type === 'boolean') ?? false);
  })

  private readonly loadData = effect(() => {
    this.loading.set(true);
    const memberTypeId = this.memberTypeId();
    if (memberTypeId) {
      this.memberTypeService.get(memberTypeId).subscribe(memberType => {
        this.selectedType.set(memberType);
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
    const rows = this.filteredMembers().map(member =>
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

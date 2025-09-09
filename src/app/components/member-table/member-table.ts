import {Component, OnInit, inject, signal, effect, viewChild, viewChildren, computed, model} from '@angular/core';
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

type FilterType = 'text' | 'number' | 'date' | 'boolean';
type FilterValue = string | number | boolean | Date | null;

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

  protected editId: string | null = null;
  protected editableMember: Record<string, any> = {};

  private readonly toggleSwitches = viewChildren(TristateToggleSwitch);

  protected readonly selectedType = signal<MemberType | null>(null);
  protected readonly members = signal<any[]>([]);
  protected readonly filters = signal<{ [attributeName: string]: FilterValue }>({});
  protected readonly loading = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = model(5);

  protected readonly paginatedMembers = computed(() => {
    const members = this.filteredMembers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return members.slice(start, start + size);
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredMembers().length / this.pageSize())
  );

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  private readonly memberTypeId= toSignal(
    this.activatedRoute.paramMap.pipe(map(p => p.get('id'))),
  );

  private readonly loadData = effect(() => {
    this.loading.set(true);
    const memberTypeId = this.memberTypeId();
    if (memberTypeId) {
      this.memberTypeService.get(memberTypeId).subscribe(memberType => {
        this.selectedType.set(memberType);
      });

      this.memberService.getByType(memberTypeId).subscribe(data => {
        this.members.set(data);
        this.loading.set(false);
      });
    }
  });

  public resetFilters(): void {
    this.filters.set({});
    this.resetToggleFilters();
    this.currentPage.set(1);
  }

  protected updateFilter(attrName: string, value: FilterValue): void {
    this.filters.update(f => ({ ...f, [attrName]: value }));
    this.currentPage.set(1);
  }

  protected clearFilter(attrName: string): void {
    this.filters.update(f => {
      const updated = { ...f };
      delete updated[attrName];
      return updated;
    });
  }

  protected readonly filteredMembers = computed(() => {
    const selectedType = this.selectedType();
    const filters = this.filters();
    const members = this.members();

    return members.filter(member => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (filterValue === null || filterValue === '' || filterValue === undefined) return true;

        const memberValue = member.data[key];
        if (memberValue === null || memberValue === undefined) return false;

        const attribute = selectedType?.attributes.find(attr => attr.name === key);
        if (!attribute) return true;

        switch (attribute.type) {
          case 'text':
            return memberValue.toString().toLowerCase().includes((filterValue as string).toLowerCase());
          case 'number':
            return Number(memberValue) === Number(filterValue);
          case 'boolean':
            return memberValue === filterValue;
          case 'date':
            const memberDate = new Date(memberValue);
            const filterDate = new Date(filterValue as Date);
            return memberDate.toDateString() === filterDate.toDateString();
          default:
            return true;
        }
      });
    });
  });

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
      this.members.update(members =>
        members.map(member =>
          member.id === id ? { ...member, data: { ...this.editableMember } } : member
        )
      );
      this.cancelEdit();
    });
  }

  protected deleteMember(id: string) {
    if (confirm('Opravdu chcete smazat tohoto člena?')) {
      this.memberService.delete(id).subscribe(() => {
        this.members.update(members => members.filter(m => m.id !== id));
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

  private resetToggleFilters() {
    this.toggleSwitches().forEach(toggle => {
      toggle.setState('indeterminate');
    })
  }
}

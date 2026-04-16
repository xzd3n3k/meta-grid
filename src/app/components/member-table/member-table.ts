import {Component, inject, signal, effect, viewChildren, computed, model} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {MemberService} from '../../shared/member.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {ActivatedRoute} from '@angular/router';
import {MemberAttribute, MemberType, MemberTypeService} from '../../shared/member-type.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {Button} from '../button/button';
import {LoadingSpinner} from '../loading-spinner/loading-spinner';
import {TriState, TristateToggleSwitch} from '../tristate-toggle-switch/tristate-toggle-switch';

type FilterValue = string | number | boolean | Date | null;

@Component({
  selector: 'hxt-member-table',
  imports: [CommonModule, FormsModule, Button, LoadingSpinner, TristateToggleSwitch, DragDropModule],
  templateUrl: './member-table.html',
  styleUrl: './member-table.scss',
})
export class MemberTable {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);
  private activatedRoute = inject(ActivatedRoute);

  protected editId: string | null = null;
  protected editableMember: Record<string, any> = {};

  // Detail overlay
  protected readonly detailMember = signal<any | null>(null);
  protected overlayEditMode = false;
  protected overlayEditData: Record<string, any> = {};

  private readonly toggleSwitches = viewChildren(TristateToggleSwitch);

  protected readonly selectedType = signal<MemberType | null>(null);
  protected readonly members = signal<any[]>([]);
  protected readonly filters = signal<{ [key: string]: FilterValue }>({});
  protected readonly loading = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = model(5);

  protected readonly columnOrder = signal<MemberAttribute[]>([]);
  private lastLoadedTypeId: string | null = null;

  private readonly syncColumnOrder = effect(() => {
    const type = this.selectedType();
    if (type && type.id !== this.lastLoadedTypeId) {
      this.lastLoadedTypeId = type.id;
      this.columnOrder.set([...type.attributes]);
    }
  });

  /** Columns shown in the table (visible !== false) */
  protected readonly visibleColumns = computed(() =>
    this.columnOrder().filter(a => a.visible !== false)
  );

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
    if (page >= 1 && page <= total) this.currentPage.set(page);
  }

  private readonly memberTypeId = toSignal(
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

  protected dropColumn(event: CdkDragDrop<MemberAttribute[]>) {
    const attrs = [...this.columnOrder()];
    moveItemInArray(attrs, event.previousIndex, event.currentIndex);
    this.columnOrder.set(attrs);
    const typeId = this.memberTypeId();
    if (typeId) this.memberTypeService.update(typeId, { attributes: attrs } as any).subscribe();
  }

  public resetFilters(): void {
    this.filters.set({});
    this.resetToggleFilters();
    this.currentPage.set(1);
  }

  protected updateFilter(attrName: string, value: FilterValue): void {
    this.filters.update(f => ({ ...f, [attrName]: value }));
    this.currentPage.set(1);
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
        const attribute = selectedType?.attributes.find(a => a.name === key);
        if (!attribute) return true;

        switch (attribute.type) {
          case 'text':
            return memberValue.toString().toLowerCase().includes((filterValue as string).toLowerCase());
          case 'number':
            return Number(memberValue) === Number(filterValue);
          case 'boolean':
            return memberValue === filterValue;
          case 'single-select':
            return memberValue === filterValue;
          case 'multi-select':
            return Array.isArray(memberValue) &&
              memberValue.some(v => String(v).toLowerCase().includes((filterValue as string).toLowerCase()));
          case 'date':
            return new Date(memberValue).toDateString() === new Date(filterValue as Date).toDateString();
          default:
            return true;
        }
      });
    });
  });

  protected editMember(member: any) {
    this.editId = member.id;
    this.editableMember = { ...member.data };
  }

  protected cancelEdit() {
    this.editId = null;
    this.editableMember = {};
  }

  protected saveEdit(id: string) {
    this.memberService.update(id, this.editableMember).subscribe(() => {
      this.members.update(ms => ms.map(m => m.id === id ? { ...m, data: { ...this.editableMember } } : m));
      this.cancelEdit();
    });
  }

  protected deleteMember(id: string) {
    if (confirm('Opravdu chcete smazat tento záznam?')) {
      this.memberService.delete(id).subscribe(() => {
        this.members.update(ms => ms.filter(m => m.id !== id));
      });
    }
  }

  // ── Detail overlay ────────────────────────────────────────────────

  protected openDetail(member: any) {
    this.detailMember.set(member);
    this.overlayEditMode = false;
    this.overlayEditData = {};
  }

  protected closeDetail() {
    this.detailMember.set(null);
    this.overlayEditMode = false;
    this.overlayEditData = {};
  }

  protected startOverlayEdit(member: any) {
    this.overlayEditData = { ...member.data };
    this.overlayEditMode = true;
  }

  protected cancelOverlayEdit() {
    this.overlayEditMode = false;
    this.overlayEditData = {};
  }

  protected saveOverlayEdit(memberId: string) {
    this.memberService.update(memberId, this.overlayEditData).subscribe(() => {
      const updated = { ...this.detailMember()!, data: { ...this.overlayEditData } };
      this.members.update(ms => ms.map(m => m.id === memberId ? updated : m));
      this.detailMember.set(updated);
      this.overlayEditMode = false;
    });
  }

  protected deleteFromDetail(memberId: string) {
    if (confirm('Opravdu chcete smazat tento záznam?')) {
      this.memberService.delete(memberId).subscribe(() => {
        this.members.update(ms => ms.filter(m => m.id !== memberId));
        this.closeDetail();
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────

  protected isAutoFilled(attr: MemberAttribute): boolean {
    return !!attr.isAutoId || !!attr.isCreatedAt;
  }

  protected isOptionSelected(data: Record<string, any>, attrName: string, option: string): boolean {
    const val = data[attrName];
    return Array.isArray(val) && val.includes(option);
  }

  protected toggleOptionInData(data: Record<string, any>, attrName: string, option: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current: string[] = Array.isArray(data[attrName]) ? [...data[attrName]] : [];
    data[attrName] = checked ? [...current, option] : current.filter(o => o !== option);
  }

  protected displayValue(attr: MemberAttribute, value: any): string {
    if (value == null || value === '') return '—';
    if (attr.isCreatedAt) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d.toLocaleString('cs-CZ', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    if (attr.type === 'date') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (attr.type === 'boolean') return value ? 'Ano' : 'Ne';
    if (attr.type === 'multi-select') return Array.isArray(value) ? value.join(', ') || '—' : '—';
    return String(value);
  }

  protected exportToPdf(selectedType?: MemberType | null) {
    if (!selectedType) return;
    const cols = this.visibleColumns().map(a => a.name);
    const rows = this.filteredMembers().map(m =>
      this.visibleColumns().map(a => this.displayValue(a, m.data[a.name]))
    );
    const doc = new jsPDF();
    autoTable(doc, {
      head: [cols], body: rows, theme: 'grid',
      styles: { fontSize: 10 }, headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`${selectedType.name}_clenove.pdf`);
  }

  private resetToggleFilters() {
    this.toggleSwitches().forEach(t => t.setState('indeterminate'));
  }
}

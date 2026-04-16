import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {MemberAttribute, MemberType, MemberTypeService} from '../../shared/member-type.service';
import {MemberService} from '../../shared/member.service';
import {FormField} from '../form-field/form-field';
import {Button} from '../button/button';

@Component({
  selector: 'hxt-member-form',
  imports: [CommonModule, FormsModule, FormField, Button],
  templateUrl: './member-form.html',
  styleUrl: './member-form.scss',
})
export class MemberForm implements OnInit {
  private memberTypeService = inject(MemberTypeService);
  private memberService = inject(MemberService);

  protected memberTypes: MemberType[] = [];
  protected selectedTypeId = '';
  protected selectedType: MemberType | null = null;
  protected formData: Record<string, any> = {};

  protected aresLoading = false;
  protected aresError = '';

  ngOnInit() {
    this.memberTypeService.getAll().subscribe(types => {
      this.memberTypes = types;
    });
  }

  protected onTypeChange() {
    this.selectedType = this.memberTypes.find(t => t.id === this.selectedTypeId) || null;
    this.aresError = '';
    this.resetFormData();
  }

  protected isAutoFilled(attr: MemberAttribute): boolean {
    return !!attr.isAutoId || !!attr.isCreatedAt;
  }

  protected get autoFilledAttrs(): MemberAttribute[] {
    return this.selectedType?.attributes.filter(a => a.isAutoId || a.isCreatedAt) ?? [];
  }

  protected get aresSourceAttr(): MemberAttribute | undefined {
    return this.selectedType?.attributes.find(a => a.isAresSource);
  }

  protected get hasAres(): boolean {
    return !!(this.selectedType?.aresEnabled && this.aresSourceAttr);
  }

  protected isOptionSelected(attrName: string, option: string): boolean {
    const val = this.formData[attrName];
    return Array.isArray(val) && val.includes(option);
  }

  protected toggleOption(attrName: string, option: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current: string[] = Array.isArray(this.formData[attrName]) ? [...this.formData[attrName]] : [];
    this.formData[attrName] = checked ? [...current, option] : current.filter(o => o !== option);
  }

  protected async fillFromAres() {
    const sourceAttr = this.aresSourceAttr;
    if (!sourceAttr) return;

    const ico = (this.formData[sourceAttr.name] ?? '').toString().trim();
    if (!ico) {
      this.aresError = 'Zadejte IČO';
      return;
    }

    this.aresLoading = true;
    this.aresError = '';

    try {
      const res = await fetch(
        `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`
      );

      if (res.status === 404) {
        this.aresError = 'Subjekt s tímto IČO nebyl v ARESu nalezen.';
        return;
      }
      if (!res.ok) {
        this.aresError = `Chyba ARES (${res.status}). Zkuste to znovu.`;
        return;
      }

      const data = await res.json();

      let filled = 0;
      this.selectedType?.attributes.forEach(attr => {
        if (attr.aresKey) {
          const value = this.resolveAresKey(data, attr.aresKey);
          if (value !== undefined && value !== null) {
            this.formData[attr.name] = String(value);
            filled++;
          }
        }
      });

      if (filled === 0) {
        this.aresError = 'Data nalezena, ale žádné pole nemá nastavený ARES klíč.';
      }
    } catch {
      this.aresError = 'Nepodařilo se připojit k ARESu. Zkontrolujte připojení.';
    } finally {
      this.aresLoading = false;
    }
  }

  private resolveAresKey(data: any, key: string): any {
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], data);
  }

  protected async submit() {
    if (!this.selectedTypeId || !this.selectedType) return;

    const autoIdAttr = this.selectedType.attributes.find(a => a.isAutoId);
    const createdAtAttr = this.selectedType.attributes.find(a => a.isCreatedAt);

    if (autoIdAttr) {
      const max = await firstValueFrom(
        this.memberService.getMaxAttributeValue(this.selectedTypeId, autoIdAttr.name)
      );
      this.formData[autoIdAttr.name] = max + 1;
    }

    if (createdAtAttr) {
      this.formData[createdAtAttr.name] = new Date().toISOString();
    }

    this.memberService.create({
      memberTypeId: this.selectedTypeId,
      data: this.formData,
    }).subscribe({
      next: () => { this.aresError = ''; this.resetFormData(); },
      error: (error) => { console.error('Chyba při ukládání člena:', error); }
    });
  }

  private resetFormData() {
    this.formData = {};
    if (this.selectedType) {
      for (const attr of this.selectedType.attributes) {
        if (attr.isAutoId || attr.isCreatedAt) continue;
        if (attr.type === 'boolean') this.formData[attr.name] = false;
        else if (attr.type === 'multi-select') this.formData[attr.name] = [];
        else this.formData[attr.name] = null;
      }
    }
  }
}

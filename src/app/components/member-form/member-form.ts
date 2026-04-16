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

  ngOnInit() {
    this.memberTypeService.getAll().subscribe(types => {
      this.memberTypes = types;
    });
  }

  protected onTypeChange() {
    this.selectedType = this.memberTypes.find(t => t.id === this.selectedTypeId) || null;
    this.resetFormData();
  }

  protected isAutoFilled(attr: MemberAttribute): boolean {
    return !!attr.isAutoId || !!attr.isCreatedAt;
  }

  protected get autoFilledAttrs(): MemberAttribute[] {
    return this.selectedType?.attributes.filter(a => a.isAutoId || a.isCreatedAt) ?? [];
  }

  protected async submit() {
    if (!this.selectedTypeId || !this.selectedType) return;

    const autoIdAttr = this.selectedType.attributes.find(a => a.isAutoId);
    const createdAtAttr = this.selectedType.attributes.find(a => a.isCreatedAt);

    // Auto-increment ID
    if (autoIdAttr) {
      const max = await firstValueFrom(
        this.memberService.getMaxAttributeValue(this.selectedTypeId, autoIdAttr.name)
      );
      this.formData[autoIdAttr.name] = max + 1;
    }

    // Auto created-at timestamp
    if (createdAtAttr) {
      this.formData[createdAtAttr.name] = new Date().toISOString();
    }

    this.memberService.create({
      memberTypeId: this.selectedTypeId,
      data: this.formData,
    }).subscribe({
      next: () => {
        this.resetFormData();
      },
      error: (error) => {
        console.error('Chyba při ukládání člena:', error);
      }
    });
  }

  private resetFormData() {
    this.formData = {};
    if (this.selectedType) {
      for (let attr of this.selectedType.attributes) {
        if (attr.isAutoId || attr.isCreatedAt) continue;
        if (attr.type === 'boolean') {
          this.formData[attr.name] = false;
        } else {
          this.formData[attr.name] = null;
        }
      }
    }
  }
}

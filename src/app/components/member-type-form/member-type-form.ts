import {Component, computed, effect, inject, input, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  MemberAttribute,
  MemberType,
  MemberTypeInit,
  MemberTypeService
} from '../../shared/member-type.service';
import {FormField} from '../form-field/form-field';
import {Button} from '../button/button';
import {MemberService} from '../../shared/member.service';

@Component({
  selector: 'hxt-member-type-form',
  imports: [CommonModule, FormsModule, FormField, Button, DragDropModule],
  templateUrl: './member-type-form.html',
  styleUrl: './member-type-form.scss',
})
export class MemberTypeForm {
  private readonly memberTypeService = inject(MemberTypeService);
  private readonly memberService = inject(MemberService);

  readonly memberType = input<MemberType | null | undefined>(null);
  readonly submittedSuccessfully = output();

  private readonly memberTypeId = computed(() => this.memberType()?.id);

  protected name = '';
  protected attributes: MemberAttribute[] = [];
  protected aresEnabled = false;

  protected isSelectType(attr: MemberAttribute): boolean {
    return attr.type === 'single-select' || attr.type === 'multi-select';
  }

  private readonly setFormData = effect(() => {
    const memberType = this.memberType();
    if (memberType) {
      this.name = memberType.name;
      this.aresEnabled = memberType.aresEnabled ?? false;
      this.attributes = memberType.attributes.map(attr => ({
        ...attr,
        visible: attr.visible ?? true,
        options: attr.options ? [...attr.options] : [],
        aresKey: attr.aresKey ?? '',
        isAresSource: attr.isAresSource ?? false,
      }));
    }
  });

  public resetForm() {
    const memberType = this.memberType();
    if (memberType) {
      this.name = memberType.name;
      this.aresEnabled = memberType.aresEnabled ?? false;
      this.attributes = memberType.attributes.map(attr => ({
        ...attr,
        visible: attr.visible ?? true,
        options: attr.options ? [...attr.options] : [],
        aresKey: attr.aresKey ?? '',
        isAresSource: attr.isAresSource ?? false,
      }));
      return;
    }
    this.name = '';
    this.aresEnabled = false;
    this.attributes = [];
  }

  protected addAttribute() {
    this.attributes.push({
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      visible: true,
      options: [],
      aresKey: '',
      isAresSource: false,
    });
  }

  protected removeAttribute(index: number) {
    this.attributes.splice(index, 1);
  }

  protected drop(event: CdkDragDrop<MemberAttribute[]>) {
    moveItemInArray(this.attributes, event.previousIndex, event.currentIndex);
  }

  protected onAttrTypeChange(attr: MemberAttribute) {
    if (this.isSelectType(attr) && !attr.options?.length) {
      attr.options = [];
    }
  }

  protected onAutoIdChange(attr: MemberAttribute) {
    if (attr.isAutoId) {
      this.attributes.forEach(a => { if (a.id !== attr.id) a.isAutoId = false; });
      attr.type = 'number';
      attr.isCreatedAt = false;
      attr.isAresSource = false;
      if (!attr.name) attr.name = 'ID';
    }
  }

  protected onCreatedAtChange(attr: MemberAttribute) {
    if (attr.isCreatedAt) {
      this.attributes.forEach(a => { if (a.id !== attr.id) a.isCreatedAt = false; });
      attr.isAutoId = false;
      attr.isAresSource = false;
      if (!attr.name) attr.name = 'Vytvořeno';
    }
  }

  protected onAresSourceChange(attr: MemberAttribute) {
    if (attr.isAresSource) {
      this.attributes.forEach(a => { if (a.id !== attr.id) a.isAresSource = false; });
      attr.isAutoId = false;
      attr.isCreatedAt = false;
      attr.aresKey = '';
      if (!attr.name) attr.name = 'IČO';
    }
  }

  protected addOption(attr: MemberAttribute) {
    if (!attr.options) attr.options = [];
    attr.options.push('');
  }

  protected removeOption(attr: MemberAttribute, index: number) {
    attr.options?.splice(index, 1);
  }

  protected submit() {
    if (!this.name || this.attributes.some(attr => !attr.name || !attr.type)) {
      alert('Vyplň název a všechny atributy!');
      return;
    }
    if (this.attributes.some(a => this.isSelectType(a) && (!a.options || a.options.length === 0))) {
      alert('Výběrové atributy musí mít alespoň jednu možnost!');
      return;
    }
    if (this.aresEnabled && !this.attributes.find(a => a.isAresSource)) {
      alert('Při aktivní integraci s ARESem musí být označeno jedno pole jako "Pole IČO".');
      return;
    }

    const memberTypeId = this.memberTypeId();

    const memberType: MemberTypeInit = {
      name: this.name,
      attributes: this.attributes,
      aresEnabled: this.aresEnabled,
    };

    if (!memberTypeId) {
      this.memberTypeService.create(memberType).subscribe({
        next: () => { this.resetForm(); this.submittedSuccessfully.emit(); },
        error: err => { console.error(err); alert('Něco se pokazilo při ukládání!'); }
      });
      return;
    }

    const memberTypeAttrsOriginal = this.memberType()?.attributes;

    if (memberTypeAttrsOriginal) {
      const originalMap = new Map(memberTypeAttrsOriginal.map(attr => {
        if (!this.attributes.find(a => a.id === attr.id)) {
          this.memberService.removeAttributeFromMembers(memberTypeId, attr.name).subscribe({
            error: err => console.error(err)
          });
        }
        return [attr.id, attr.name];
      }));

      this.attributes.forEach(attr => {
        const originalName = originalMap.get(attr.id);
        if (originalName != undefined && originalName !== attr.name) {
          this.memberService.renameAttributeInMembers(memberTypeId, originalName, attr.name).subscribe({
            error: err => console.error(err)
          });
        } else if (!originalName) {
          let defaultValue: any = null;
          if (attr.type === 'boolean') defaultValue = false;
          else if (attr.type === 'multi-select') defaultValue = [];
          else if (attr.type === 'single-select') defaultValue = '';
          if (defaultValue !== null || attr.type === 'single-select') {
            this.memberService.addAttributeToAllMembers(memberTypeId, attr.name, defaultValue).subscribe({
              error: err => console.error(err)
            });
          }
        }
      });
    }

    this.memberTypeService.update(memberTypeId, memberType).subscribe({
      next: () => { this.resetForm(); this.submittedSuccessfully.emit(); },
      error: err => { console.error(err); alert('Něco se pokazilo při ukládání!'); }
    });
  }
}

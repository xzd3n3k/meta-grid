import {Component, computed, effect, inject, input, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, FormField, Button],
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

  private readonly setFormData = effect(() => {
    const memberType = this.memberType();

    if (memberType) {
      this.name = memberType.name;
      this.attributes = memberType.attributes.map(attr => ({ ...attr }));
    }
  })

  public resetForm() {
    const memberType = this.memberType();

    if (memberType) {
      this.name = memberType.name;
      this.attributes = memberType.attributes.map(attr => ({ ...attr }));
      return;
    }

    this.name = '';
    this.attributes = [];
  }

  protected addAttribute() {
    this.attributes.push({ id: crypto.randomUUID(), name: '', type: 'text' });
  }

  protected removeAttribute(index: number) {
    this.attributes.splice(index, 1);
  }

  protected submit() {
    if (!this.name || this.attributes.some(attr => !attr.name || !attr.type)) {
      alert('Vyplň název a všechny atributy!');
      return;
    }

    const memberTypeId = this.memberTypeId();

    const memberType: MemberTypeInit = {
      name: this.name,
      attributes: this.attributes,
    };

    if (!memberTypeId) {

      this.memberTypeService.create(memberType).subscribe({
        next: () => {
          this.resetForm();
          this.submittedSuccessfully.emit();
        },
        error: err => {
          console.error('Error creating member type:', err);
          alert('Něco se pokazilo při ukládání!');
        }
      });

      return;
    }

    const memberTypeAttrsOriginal = this.memberType()?.attributes;

    if (memberTypeAttrsOriginal) {
      const originalMap = new Map(memberTypeAttrsOriginal.map(attr => {
        if (!this.attributes.find(attribute => attribute.id === attr.id)) {
          this.memberService.removeAttributeFromMembers(memberTypeId, attr.name).subscribe({
            next: () => {},
            error: err => {
              console.error('Error updating member type:', err);
            }
          });
        }
        return [attr.id, attr.name]
      }));

      this.attributes.forEach(attr => {
        const originalName = originalMap.get(attr.id);

        if (originalName !== undefined && originalName !== attr.name) {
          this.memberService.renameAttributeInMembers(memberTypeId, originalName, attr.name).subscribe({
            next: () => {},
            error: err => {
              console.error('Error updating member type:', err);
            }
          });
        }
      });
    }

    this.memberTypeService.update(memberTypeId, memberType).subscribe({
      next: () => {
        this.resetForm();
        this.submittedSuccessfully.emit();
      },
      error: err => {
        console.error('Error updating member type:', err);
        alert('Něco se pokazilo při ukládání!');
      }
    });

  }
}

import {Component, computed, effect, inject, input, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MemberAttribute, MemberType, MemberTypeInit, MemberTypeService} from '../../shared/member-type.service';

@Component({
  selector: 'app-member-type-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-type-form.html',
  styleUrl: './member-type-form.scss',
})
export class MemberTypeForm {
  private memberTypeService = inject(MemberTypeService);

  readonly memberType = input<MemberType | null | undefined>(null);

  readonly submittedSuccessfully = output();

  private readonly memberTypeId = computed(() => this.memberType()?.id);

  protected name = '';
  protected attributes: MemberAttribute[] = [];

  private readonly setFormData = effect(() => {
    const memberType = this.memberType();

    if (memberType) {
      this.name = memberType.name;
      this.attributes = memberType.attributes;
    }
  })

  protected addAttribute() {
    this.attributes.push({ name: '', type: 'text' });
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
          this.name = '';
          this.attributes = [];
          this.submittedSuccessfully.emit();
        },
        error: err => {
          console.error('Error creating member type:', err);
          alert('Něco se pokazilo při ukládání!');
        }
      });

      return;
    }

    this.memberTypeService.update(memberTypeId, memberType).subscribe({
      next: () => {
        this.name = '';
        this.attributes = [];
        this.submittedSuccessfully.emit();
      },
      error: err => {
        console.error('Error updating member type:', err);
        alert('Něco se pokazilo při ukládání!');
      }
    });

  }
}

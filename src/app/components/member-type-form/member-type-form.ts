import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MemberAttribute, MemberTypeInit, MemberTypeService} from '../../shared/member-type.service';

@Component({
  selector: 'app-member-type-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-type-form.html',
  styleUrl: './member-type-form.scss',
})
export class MemberTypeForm {
  private service = inject(MemberTypeService);

  protected name = '';
  protected attributes: MemberAttribute[] = [];

  protected addAttribute() {
    this.attributes.push({ name: '', type: 'text' });
  }

  protected removeAttribute(index: number) {
    this.attributes.splice(index, 1);
  }

  submit() {
    if (!this.name || this.attributes.some(attr => !attr.name || !attr.type)) {
      alert('Vyplň název a všechny atributy!');
      return;
    }

    const memberType: MemberTypeInit = {
      name: this.name,
      attributes: this.attributes,
    };

    this.service.create(memberType).subscribe({
      next: () => {
        this.name = '';
        this.attributes = [];
      },
      error: err => {
        console.error('Error creating member type:', err);
        alert('Něco se pokazilo při ukládání!');
      }
    });
  }
}

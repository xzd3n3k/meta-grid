import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MemberType, MemberTypeService} from '../../shared/member-type.service';
import {MemberService} from '../../shared/member.service';


@Component({
  selector: 'app-member-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-form.html',
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
    this.formData = {};

    if (this.selectedType) {
      for (let attr of this.selectedType.attributes) {
        if (attr.type === 'boolean') {
          this.formData[attr.name] = false;
        } else {
          this.formData[attr.name] = null;
        }
      }
    }
  }

  protected submit() {
    if (!this.selectedTypeId || !this.selectedType) return;

    this.memberService.create({
      memberTypeId: this.selectedTypeId,
      data: this.formData,
    }).subscribe({
      next: () => {
        this.formData = {};
      },
      error: (error) => {
        console.error('Chyba při ukládání člena:', error);
      }
    });
  }

}

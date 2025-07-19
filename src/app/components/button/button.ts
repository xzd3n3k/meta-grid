import {Component, input} from '@angular/core';
import {ButtonAppearance, ButtonShape, ButtonSize, ButtonSeverity} from '../../shared/button.types';
import {NgClass} from '@angular/common';

@Component({
  selector: 'hxt-button',
  imports: [
    NgClass
  ],
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class Button {
  readonly severity = input<ButtonSeverity>('primary');
  readonly appearance = input<ButtonAppearance>('fill');
  readonly shape = input<ButtonShape>('rounded');
  readonly size = input<ButtonSize>('medium');
  readonly disabled = input(false);
}

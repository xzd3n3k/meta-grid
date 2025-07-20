import {Component, input} from '@angular/core';

@Component({
  selector: 'hxt-form-field',
  imports: [],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss'
})
export class FormField {
  readonly label = input('');
}

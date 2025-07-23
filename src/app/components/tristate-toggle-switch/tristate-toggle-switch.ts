import {Component, computed, input, Input, output, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {TristateToggleSwitchLabel} from '../../shared/tristate-toggle-switch-label.type';

export type TriState = 'on' | 'off' | 'indeterminate';


@Component({
  selector: 'hxt-tristate-toggle-switch',
  imports: [
    NgClass
  ],
  templateUrl: './tristate-toggle-switch.html',
  styleUrl: './tristate-toggle-switch.scss'
})
export class TristateToggleSwitch {
  readonly label = input<TristateToggleSwitchLabel>();

  readonly stateChange = output<TriState>();
  readonly stateChangeBoolean = output<boolean | null>();

  protected readonly state$ = computed(() => this._state());
  private readonly _state = signal<TriState>('indeterminate');

  private states: TriState[] = ['off', 'indeterminate', 'on'];

  public setState(state: TriState) {
    this._state.set(state);

    let stateToEmit: boolean | null = null;
    if (state === 'on') {
      stateToEmit = true;
    } else if (state === 'off') {
      stateToEmit = false;
    }

    this.stateChangeBoolean.emit(stateToEmit);
    this.stateChange.emit(state);
  }

  protected nextState() {
    const currentIndex = this.states.indexOf(this._state());
    const nextIndex = (currentIndex + 1) % this.states.length;
    const next = this.states[nextIndex];
    this._state.set(next);
    let stateToEmit: boolean | null = null;

    if (next === 'on') {
      stateToEmit = true;
    } else if (next === 'off') {
      stateToEmit = false;
    }

    this.stateChangeBoolean.emit(stateToEmit);
    this.stateChange.emit(next);
  }

  protected sliderPosition: Record<TriState, string> = {
    off: '2px',
    indeterminate: '12px',
    on: '22px',
  };
}

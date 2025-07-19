import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss'
})
export class Dialog {
  readonly backdrop = input(true);
  readonly closable = input(true);

  readonly closed = output();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDivElement>>('dialog');

  protected readonly opened = signal(false);

  public open() {
    this.opened.set(true);
  }

  public close() {
    if (this.closable()) {
      this.opened.set(false);
      this.closed.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent) {
    if (this.closable() && (event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close();
    }
  }
}

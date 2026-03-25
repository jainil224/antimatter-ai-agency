import { Component, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  templateUrl: './custom-cursor.component.html',
  styleUrl: './custom-cursor.component.scss'
})
export class CustomCursorComponent implements AfterViewInit {
  @ViewChild('cursor') cursor!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorDot') cursorDot!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {}

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.cursor && this.cursorDot) {
      this.cursor.nativeElement.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      this.cursorDot.nativeElement.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;

      const target = e.target as HTMLElement;
      if (target && target.closest) {
        if (target.closest('a, .service-card, .case-item, .btn-pill')) {
          this.cursor.nativeElement.classList.add('hover');
        } else {
          this.cursor.nativeElement.classList.remove('hover');
        }
      }
    }
  }
}

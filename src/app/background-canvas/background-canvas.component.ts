import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy, NgZone } from '@angular/core';

@Component({
  selector: 'app-background-canvas',
  standalone: true,
  template: '<canvas #bgCanvas id="bg-canvas"></canvas>',
  styles: [`
    #bg-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
    }
  `]
})
export class BackgroundCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D | null;
  private animationFrameId: number = 0;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    
    // Run animation outside Angular zone to prevent constant change detection
    this.ngZone.runOutsideAngular(() => {
      this.animate(0);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private animate(time: number) {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // Sine wave opacity (slow cycle)
    const opacity = 0.015 + Math.sin(time * 0.001) * 0.005; 
    
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, opacity)})`;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    const step = 50;
    for (let x = 0; x <= w; x += step) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
    }
    this.ctx.stroke();

    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

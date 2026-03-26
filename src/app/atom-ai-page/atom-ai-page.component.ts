import { Component, AfterViewInit } from '@angular/core';
import gsap from 'gsap';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { BackgroundCanvasComponent } from '../background-canvas/background-canvas.component';

@Component({
  selector: 'app-atom-ai-page',
  standalone: true,
  imports: [ThreeSceneComponent, BackgroundCanvasComponent],
  templateUrl: './atom-ai-page.component.html',
  styleUrl: './atom-ai-page.component.scss'
})
export class AtomAiPageComponent implements AfterViewInit {

  ngAfterViewInit() {
    // 1. Update global 3D morph target to CodeText (shape id 2)
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0; // centered
      threeState.scrollShapeTarget = 2; // CodeText shape
    }

    // 2. Entrance Animation
    gsap.fromTo('.text-panel > *',
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );

    gsap.fromTo('.terminal-panel',
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power4.out', delay: 0.5 }
    );
  }
}

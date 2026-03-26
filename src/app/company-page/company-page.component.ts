import { Component, AfterViewInit } from '@angular/core';
import gsap from 'gsap';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { BackgroundCanvasComponent } from '../background-canvas/background-canvas.component';

@Component({
  selector: 'app-company-page',
  standalone: true,
  imports: [ThreeSceneComponent, BackgroundCanvasComponent],
  templateUrl: './company-page.component.html',
  styleUrl: './company-page.component.scss'
})
export class CompanyPageComponent implements AfterViewInit {

  ngAfterViewInit() {
    // 1. Update global 3D morph target to Blob (shape id 5)
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0; // centered
      threeState.scrollShapeTarget = 5; // Use Blob shape
    }

    // 2. Entrance Animation
    gsap.fromTo('.header-content',
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.1 }
    );

    gsap.fromTo('.manifesto-card',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
    );

    // Animate the line widths
    gsap.to('.manifesto-card .line', {
      width: '100%',
      duration: 1.5,
      ease: 'power4.out',
      delay: 0.6,
      stagger: 0.15
    });

    gsap.fromTo('.team-card',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)', delay: 0.5 }
    );
  }
}

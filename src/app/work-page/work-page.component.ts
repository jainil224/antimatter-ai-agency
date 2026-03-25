import { Component, AfterViewInit } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-work-page',
  standalone: true,
  imports: [],
  templateUrl: './work-page.component.html',
  styleUrl: './work-page.component.scss'
})
export class WorkPageComponent implements AfterViewInit {

  ngAfterViewInit() {
    // 1. Update global 3D morph target to Cube (shape id 1 or 2)
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0; // centered
      threeState.scrollShapeTarget = 3; // Let's use shape 3 (DNA) for Work page
    }

    // 2. Entrance Animation
    gsap.fromTo('.header-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1 }
    );

    gsap.fromTo('.project-card',
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
    );
  }
}

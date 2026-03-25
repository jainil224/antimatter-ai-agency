import { Component, AfterViewInit } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent implements AfterViewInit {

  ngAfterViewInit() {
    // 1. Update global 3D morph target to Sparkle (shape id 4)
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0; // centered
      threeState.scrollShapeTarget = 4; // Sparkle shape
    }

    // 2. Entrance Animation
    gsap.fromTo('.text-panel > *',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
    );

    gsap.fromTo('.form-panel',
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.4 }
    );
  }
}

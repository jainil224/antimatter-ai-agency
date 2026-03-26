import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { BackgroundCanvasComponent } from '../background-canvas/background-canvas.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-work-page',
  standalone: true,
  imports: [ThreeSceneComponent, BackgroundCanvasComponent],
  templateUrl: './work-page.component.html',
  styleUrl: './work-page.component.scss'
})
export class WorkPageComponent implements AfterViewInit, OnDestroy {

  ngAfterViewInit() {
    // Entrance animation for header
    gsap.fromTo('.header-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1 }
    );

    // Scroll-driven parallax for each card — reveals with depth as it enters view
    document.querySelectorAll<HTMLElement>('.project-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 80, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 40%',
            scrub: false,
            toggleActions: 'play none none reverse',
          },
          delay: i * 0.08
        }
      );

      // Subtle Y-shift parallax as card scrolls through viewport
      gsap.to(card, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });
    });

    setTimeout(() => {
      const state = (window as any).threeSceneState;
      if (!state) return;

      // Enable mouse parallax on Work page only
      state.enableMouseParallax = true;

      // Shift DNA to the left blank space
      state.ptsPosTarget = -4.5;
      state.scrollShapeTarget = 3; // DNA shape

      // GSAP ScrollTrigger — drives DNA position, rotation, scale on scroll
      ScrollTrigger.create({
        trigger: '.work-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate(self: any) {
          const p = self.progress;
          state.posYTarget = -p * 3;
          state.scrollRotationOffsetTarget = p * Math.PI * 2;
          state.scaleTarget = 0.78 - p * 0.20;
        },
        onLeaveBack() {
          state.posYTarget = 0;
          state.scrollRotationOffsetTarget = 0;
          state.scaleTarget = 0.78;
        }
      });

      // As the user scrolls through the 4 project cards, morph through shapes:
      // 3 = DNA → 4 = Sparkle → 5 = Blob → 6 = Sphere
      ScrollTrigger.create({
        trigger: '.projects-grid',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
        onUpdate(self: any) {
          // Map progress 0→1 to shape index 3→6
          state.scrollShapeTarget = 3 + self.progress * 3;
        },
        onLeaveBack() {
          state.scrollShapeTarget = 3; // Back to DNA at top
        }
      });

      ScrollTrigger.refresh();
    }, 300);
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(t => t.kill());
    const state = (window as any).threeSceneState;
    if (state) {
      state.enableMouseParallax = false;
      state.posYTarget = 0;
      state.scrollRotationOffsetTarget = 0;
      state.scaleTarget = 0.78;
      state.ptsPosTarget = 2.8;
    }
  }
}

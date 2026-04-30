import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { ServicesSectionComponent } from '../services-section/services-section.component';
import { CaseStudiesSectionComponent } from '../case-studies-section/case-studies-section.component';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';
import { BackgroundCanvasComponent } from '../background-canvas/background-canvas.component';
import { InteractiveSectionComponent } from '../interactive-section/interactive-section.component';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    ServicesSectionComponent,
    CaseStudiesSectionComponent,
    ThreeSceneComponent,
    BackgroundCanvasComponent,
    InteractiveSectionComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  public activeStep = 0;
  public activeOp = 'Search';
  public opDescription = 'Watch how data is accessed and manipulated in real-time as you scroll through the memory blocks.';
  public timeComplexity = 'O(n)';
  public spaceComplexity = 'O(1)';
  public opStatus = 'Searching...';
  
  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit() {
    setTimeout(() => {
      const threeState = (window as any).threeSceneState;

      // 1. Hero → Services approach
      this.triggers.push(ScrollTrigger.create({
        trigger: '.services-section',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            threeState.ptsPosTarget = 3.2 - self.progress * 7.7;
            threeState.scrollShapeTarget = self.progress; 
          }
        }
      }));

      // 2. Services horizontal scroll pin
      const track = document.getElementById('services-track');
      const right = document.getElementById('services-right');
      if (track && right) {
        const cardWrappers = Array.from(document.querySelectorAll('.service-card-wrapper')) as HTMLElement[];
        const numCards = cardWrappers.length;

        const lastCard = cardWrappers[numCards - 1];
        const panelRect = right.getBoundingClientRect();
        const panelCenterX = panelRect.left + panelRect.width / 2;
        const lastCardRect = lastCard.getBoundingClientRect(); 
        const lastCardCenterX0 = lastCardRect.left + lastCardRect.width / 2;
        const endShift = lastCardCenterX0 - panelCenterX;
        const scrollLength = numCards * 500;

        const highlightCenteredCard = () => {
          const panelCX = right.getBoundingClientRect().left + right.getBoundingClientRect().width / 2;
          let closestIdx = 0;
          let closestDist = Infinity;
          cardWrappers.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const cardCX = r.left + r.width / 2;
            const dist = Math.abs(cardCX - panelCX);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          });
          cardWrappers.forEach((el, i) => {
            if (i === closestIdx) {
              el.classList.add('scroll-active');
              el.classList.remove('scroll-dim');
            } else {
              el.classList.remove('scroll-active');
              el.classList.add('scroll-dim');
            }
          });
          return closestIdx;
        };

        const firstCard = cardWrappers[0];
        const firstCardRect = firstCard.getBoundingClientRect();
        const firstCardCenterX0 = firstCardRect.left + firstCardRect.width / 2;
        const startShift = firstCardCenterX0 - panelCenterX;

        gsap.set(track, { x: -startShift });
        cardWrappers[0].classList.add('scroll-active');
        cardWrappers.slice(1).forEach(el => el.classList.add('scroll-dim'));

        const pinningAnim = gsap.fromTo(track,
          { x: -startShift },
          {
          x: -endShift,
          ease: 'none',
          scrollTrigger: {
            trigger: '.services-section',
            start: 'top top',
            end: `+=${scrollLength}`,
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              if (threeState) {
                threeState.ptsPosTarget = -4.5;
                threeState.scrollShapeTarget = 1 + self.progress * (numCards - 1);
              }
              highlightCenteredCard();
            }
          }
        });
        if (pinningAnim.scrollTrigger) this.triggers.push(pinningAnim.scrollTrigger);
      }

      // 3. Services entrance
      const entranceAnim = gsap.fromTo('#services-header', 
        { opacity: 0, x: '-40vw', y: '30vh', scale: 1.4 },
        { 
          opacity: 1, x: 0, y: 0, scale: 1, power: 'power3.out', duration: 1.4,
          scrollTrigger: {
            trigger: '.services-section',
            start: 'top 75%'
          }
        }
      );
      if (entranceAnim.scrollTrigger) this.triggers.push(entranceAnim.scrollTrigger);

      // 4. Services cards entrance
      const cardsAnim = gsap.fromTo('.service-card-wrapper',
        { opacity: 0, y: 60, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, power: 'power3.out', duration: 0.8, stagger: 0.12,
          scrollTrigger: {
            trigger: '.services-section',
            start: 'top 65%'
          }
        }
      );
      if (cardsAnim.scrollTrigger) this.triggers.push(cardsAnim.scrollTrigger);

      // 5. Case studies blast
      this.triggers.push(ScrollTrigger.create({
        trigger: '.case-studies',
        start: 'top 65%',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: (self) => {
          if (threeState) {
            threeState.blastProgress = self.progress;
            threeState.ptsPosTarget = -4.5 + (4.5 * self.progress);
          }
        }
      }));

      // 6. Interactive Section simulation (3 Phases + Pinning)
      this.triggers.push(ScrollTrigger.create({
        trigger: '.interactive-section',
        start: 'top top',
        end: '+=200%', // Triple the scroll length for phases
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            threeState.scrollShapeTarget = 7;
            threeState.ptsPosTarget = -2.8; // Slightly more right
            threeState.posYTarget = -0.4;   // Move down to align with content
            threeState.scaleTarget = 0.95;  // Make it larger
            
            const p = self.progress;
            
            // Phase 0: Settle into position (0 - 15%)
            if (p < 0.15) {
              this.activeOp = 'Settling';
              this.opDescription = 'Preparing memory for live simulation...';
              this.opStatus = 'Standby';
              threeState.interactiveCell = -1;
              return;
            }

            // Remap 0.15-1.0 to 0.0-1.0 for the 3 operations
            const activeP = (p - 0.15) / 0.85;

            if (activeP < 0.33) {
              // PHASE 1: SEARCH
              this.activeOp = 'Search';
              this.opDescription = 'Linear Search: Scanning each memory address until the target value is found.';
              this.timeComplexity = 'O(n)';
              this.spaceComplexity = 'O(1)';
              
              const localP = activeP / 0.33;
              const step = Math.floor(localP * 11);
              this.activeStep = step;
              this.opStatus = 'Searching Index #' + (step - 1 >= 0 ? step - 1 : 0);
              threeState.interactiveCell = step - 1;
            } else if (activeP < 0.66) {
              // PHASE 2: INSERTION
              this.activeOp = 'Insertion';
              this.opDescription = 'Insertion: Shifting elements to create space and allocating a new memory block.';
              this.timeComplexity = 'O(n)';
              this.spaceComplexity = 'O(1)';
              
              const localP = (activeP - 0.33) / 0.33;
              this.activeStep = Math.floor(localP * 10);
              const targetIdx = 4;
              this.opStatus = 'Inserting at Index #' + targetIdx;
              threeState.interactiveCell = targetIdx;
            } else {
              // PHASE 3: DELETION
              this.activeOp = 'Deletion';
              this.opDescription = 'Deletion: Removing an element and shifting subsequent items to maintain continuity.';
              this.timeComplexity = 'O(n)';
              this.spaceComplexity = 'O(1)';
              
              const localP = (activeP - 0.66) / 0.34;
              this.activeStep = Math.floor(localP * 10);
              const targetIdx = 2;
              this.opStatus = 'Deleting Index #' + targetIdx;
              threeState.interactiveCell = targetIdx;
            }
          }
        },
        onLeave: () => { if (threeState) threeState.interactiveCell = -1; },
        onLeaveBack: () => { if (threeState) threeState.interactiveCell = -1; }
      }));

      ScrollTrigger.refresh();
    }, 100);
  }

  ngOnDestroy() {
    this.triggers.forEach(t => t.kill());
    ScrollTrigger.refresh();
    
    // Reset any global ThreeJS states when navigating away from Home
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0; // Center scene
      threeState.blastProgress = 0;
      threeState.scrollShapeTarget = 0; // Sphere
    }
  }
}

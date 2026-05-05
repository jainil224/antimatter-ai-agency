import { Component, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
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
  public activeDS = 'Array';
  public activeStep = 0;
  public activeOp = 'Insertion';
  public opDescription = 'Watch how data is accessed and manipulated in real-time as you scroll through the memory blocks.';
  public timeComplexity = 'O(n)';
  public spaceComplexity = 'O(1)';
  public opStatus = 'Searching...';
  
  private triggers: any[] = [];

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

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
            threeState.ptsPosTarget = 3.2 - self.progress * 8.5; // Shifted further left
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
                threeState.ptsPosTarget = -5.5;
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
          opacity: 1, x: 0, y: 0, scale: 1, ease: 'power3.out', duration: 1.4,
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
          opacity: 1, y: 0, scale: 1, ease: 'power3.out', duration: 0.8, stagger: 0.12,
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
      // 6. UNIFIED Interactive Section (Array -> Morph -> Stack)
      this.triggers.push(ScrollTrigger.create({
        trigger: '.interactive-section',
        start: 'top top',
        end: '+=450%', // optimized for better engagement
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            const p = self.progress;
            threeState.ptsPosTarget = -5.2;
            threeState.posYTarget = -0.4;
            threeState.scaleTarget = 0.95;

            this.ngZone.run(() => {
              // --- PHASE 1: ARRAY OPERATIONS (0.0 - 0.45) ---
              if (p < 0.45) {
                this.activeDS = 'Array';
                threeState.scrollShapeTarget = 7; 
                
                const localP = p / 0.45;
                if (localP < 0.05) {
                  this.activeOp = 'Settling';
                  this.opDescription = 'Preparing Array memory blocks...';
                  this.opStatus = 'Standby';
                  threeState.interactiveCell = -1;
                } else {
                  const opP = (localP - 0.05) / 0.95;
                  if (opP < 0.50) {

                    this.activeOp = 'Insertion';
                    this.opDescription = 'Insertion: Shifting elements for new data...';
                    this.timeComplexity = 'O(n)'; this.spaceComplexity = 'O(1)';
                    const innerP = opP / 0.50;
                    const step = Math.floor(innerP * 12);
                    this.activeStep = step;
                    
                    if (step <= 1) {
                      this.opStatus = 'Initializing...';
                      threeState.interactiveCells = [-1, -1];
                    } else if (step <= 8) {
                      // Shifting phase (highlighting 9 down to 4)
                      const shiftIdx = 9 - (step - 2);
                      this.opStatus = `Shifting Index ${shiftIdx} → ${shiftIdx + 1}`;
                      threeState.interactiveCells = [shiftIdx, -1];
                    } else {
                      this.opStatus = 'Inserting at Index #4';
                      threeState.interactiveCells = [4, -1];
                    }
                  } else {
                    this.activeOp = 'Deletion';
                    this.opDescription = 'Deletion: Removing element and shifting back...';
                    this.timeComplexity = 'O(n)'; this.spaceComplexity = 'O(1)';
                    const innerP = (opP - 0.50) / 0.50;
                    const step = Math.floor(innerP * 12);
                    this.activeStep = step;
                    
                    if (step <= 2) {
                      this.opStatus = 'Removing Index #2';
                      threeState.interactiveCells = [2, -1];
                    } else if (step <= 10) {
                      // Shift back phase (highlighting 3 up to 9)
                      const shiftIdx = step - 1;
                      this.opStatus = `Shifting Index ${shiftIdx} → ${shiftIdx - 1}`;
                      threeState.interactiveCells = [shiftIdx, -1];
                    } else {
                      this.opStatus = 'Clean up';
                      threeState.interactiveCells = [-1, -1];
                    }
                  }
                }
              } 
              // --- PHASE 2: MORPH TRANSITION (0.45 - 0.50) ---
              else if (p < 0.50) {
                this.activeDS = 'Stack';
                this.activeOp = 'Morphing';
                this.opDescription = 'Converting Array to Stack (LIFO)...';
                this.opStatus = 'Restructuring...';
                threeState.scrollShapeTarget = 8; 
                threeState.interactiveCells = [-1, -1];
              }
              // --- PHASE 3: STACK OPERATIONS (0.50 - 1.0) ---
              else {
                this.activeDS = 'Stack';
                threeState.scrollShapeTarget = 8; 
                threeState.blastProgress = 0; // Explicitly kill any blast during simulation
                
                const localP = (p - 0.50) / 0.50;
                const step = Math.floor(localP * 12);
                this.activeStep = step;

                if (step <= 2) {
                  this.activeOp = 'Push';
                  this.opDescription = 'Push: Adding element to the TOP.';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Pushing 10 to TOP';
                  
                  const pPush = Math.min(1, step / 2.5);
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0x22D3EE); 
                  threeState.activeCellScale = 0.3 + 0.7 * pPush;
                  threeState.activeCellOpacity = pPush;
                } else if (step <= 5) {
                  this.activeOp = 'Pop';
                  this.opDescription = 'Pop: Removing element from TOP (LIFO).';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Popping TOP element';
                  
                  const pPop = Math.min(1, (step - 3) / 2.5);
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0xF87171); // Explicit Red for Pop
                  threeState.activeCellScale = 1.0 - 0.4 * pPop;
                  threeState.activeCellOpacity = 1.0 - pPop;
                } else if (step <= 10) {
                  this.activeOp = 'Search';
                  this.opDescription = 'Search: Iterating from TOP to find a value.';
                  this.timeComplexity = 'O(n)'; this.spaceComplexity = 'O(1)';
                  const searchIdx = Math.min(3, step - 6);
                  this.opStatus = `Searching block #${searchIdx}`;
                  
                  threeState.interactiveCells = [searchIdx, -1];
                  threeState.activeHighlightColor.setHex(0xFACC15);
                  threeState.activeCellScale = 1.05; // Subtle pop when searching
                  threeState.activeCellOpacity = 1.0;
                } else {
                  this.activeOp = 'Peek';
                  this.opDescription = 'Peek: Viewing the TOP element.';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Peeking at TOP: 40';
                  
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0xA855F7);
                  threeState.activeCellScale = 1.0;
                  threeState.activeCellOpacity = 1.0;
                }
              }
              this.cdr.detectChanges();
            });
          }
        },
        onLeave: () => { if (threeState) threeState.interactiveCells = [-1, -1]; },
        onLeaveBack: () => { if (threeState) threeState.interactiveCells = [-1, -1]; }
      }));

      ScrollTrigger.refresh();
    }, 100);
  }

  public getStatusColor(): string {
    switch (this.activeOp) {
      case 'Push': return '#22D3EE';
      case 'Pop': return '#F87171';
      case 'Search': return '#FACC15';
      case 'Peek': return '#A855F7';
      default: return '#FACC15';
    }
  }

  ngOnDestroy() {
    this.triggers.forEach(t => t.kill());
    ScrollTrigger.refresh();
    
    const threeState = (window as any).threeSceneState;
    if (threeState) {
      threeState.ptsPosTarget = 0;
      threeState.blastProgress = 0;
      threeState.scrollShapeTarget = 0;
    }
  }
}

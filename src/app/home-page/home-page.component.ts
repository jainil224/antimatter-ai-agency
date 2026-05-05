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
            threeState.ptsPosTarget = 0 - (4.5 * self.progress); // Interactive is at 0, case studies shifts it left
          }
        }
      }));

      // 5.5. Transition from Services to Interactive
      this.triggers.push(ScrollTrigger.create({
        trigger: '.interactive-section',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            // Smoothly move from -5.5 (Services left) to 0 (Interactive center)
            threeState.ptsPosTarget = -5.5 + (5.5 * self.progress);
            // Smoothly morph from 5 (Queue) to 7 (Array)
            threeState.scrollShapeTarget = 5 + (2 * self.progress);
            // Interpolate position and scale
            threeState.posYTarget = 0 - (0.4 * self.progress);
            threeState.scaleTarget = 0.78 + (0.17 * self.progress);
          }
        }
      }));

      // 6. UNIFIED Interactive Section (Array -> Morph -> Stack -> Morph -> Tree)
      this.triggers.push(ScrollTrigger.create({
        trigger: '.interactive-section',
        start: 'top top',
        end: '+=600%', // Increased for Tree operations
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            const p = self.progress;
            threeState.ptsPosTarget = 0;
            threeState.posYTarget = -0.4;
            threeState.scaleTarget = 0.95;

            this.ngZone.run(() => {
              // --- PHASE 1: ARRAY OPERATIONS (0.0 - 0.35) ---
              if (p < 0.35) {
                this.activeDS = 'Array';
                threeState.scrollShapeTarget = 7; 
                
                const localP = p / 0.35;
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
                      threeState.operationType = 'none';
                      threeState.highlightedCellIndex = -1;
                    } else if (step <= 7) {
                      // Shifting phase — highlight the cell being shifted (cyan, neutral)
                      const shiftIdx = Math.min(6, 7 - (step - 2));
                      this.opStatus = `Shifting Index ${shiftIdx} → ${shiftIdx + 1}`;
                      threeState.interactiveCells = [shiftIdx, -1];
                      threeState.operationType = 'search'; // use cyan for shifting
                      threeState.highlightedCellIndex = shiftIdx;
                    } else {
                      // Final insertion — the new block is GREEN
                      this.opStatus = 'Inserting new block at Index #4 ✓';
                      threeState.interactiveCells = [4, -1];
                      threeState.operationType = 'insert';
                      threeState.highlightedCellIndex = 4;
                    }
                  } else {
                    this.activeOp = 'Deletion';
                    this.opDescription = 'Deletion: Removing element and shifting back...';
                    this.timeComplexity = 'O(n)'; this.spaceComplexity = 'O(1)';
                    const innerP = (opP - 0.50) / 0.50;
                    const step = Math.floor(innerP * 12);
                    this.activeStep = step;

                    if (step <= 2) {
                      // Target block turns RED before deletion
                      this.opStatus = 'Marking Index #2 for removal...';
                      threeState.interactiveCells = [2, -1];
                      threeState.operationType = 'delete';
                      threeState.highlightedCellIndex = 2;
                    } else if (step <= 10) {
                      // Shift back phase — highlight shifting cell in cyan
                      const shiftIdx = Math.min(6, step - 1);
                      this.opStatus = `Shifting Index ${shiftIdx} → ${shiftIdx - 1}`;
                      threeState.interactiveCells = [shiftIdx, -1];
                      threeState.operationType = 'search';
                      threeState.highlightedCellIndex = shiftIdx;
                    } else {
                      this.opStatus = 'Array compacted ✓';
                      threeState.interactiveCells = [-1, -1];
                      threeState.operationType = 'none';
                      threeState.highlightedCellIndex = -1;
                    }
                  }
                }
              } 
              // --- PHASE 2: MORPH TRANSITION TO STACK (0.35 - 0.40) ---
              else if (p < 0.40) {
                this.activeDS = 'Stack';
                this.activeOp = 'Morphing';
                this.opDescription = 'Converting Array to Stack (LIFO)...';
                this.opStatus = 'Restructuring...';
                
                const localP = (p - 0.35) / 0.05;
                threeState.scrollShapeTarget = 7 + localP; // Tie transition to scroll progress
                threeState.interactiveCells = [-1, -1];
              }
              // --- PHASE 3: STACK OPERATIONS (0.40 - 0.70) ---
              else if (p < 0.70) {
                this.activeDS = 'Stack';
                threeState.scrollShapeTarget = 8; 
                threeState.blastProgress = 0; 
                
                const localP = (p - 0.40) / 0.30;
                const step = Math.floor(localP * 12);
                this.activeStep = step;

                if (step <= 2) {
                  this.activeOp = 'Push';
                  this.opDescription = 'Push: Adding element to the TOP.';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Pushing 25 to TOP';
                  
                  const pPush = Math.min(1, step / 2.0);
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0x00FF88); 
                  threeState.activeCellScale = 0.3 + 0.7 * pPush;
                  threeState.activeCellOpacity = pPush;
                  threeState.operationType = 'insert';
                  threeState.highlightedCellIndex = 0;
                } else if (step <= 5) {
                  this.activeOp = 'Pop';
                  this.opDescription = 'Pop: Removing element from TOP (LIFO).';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Popping TOP element';
                  
                  const pPop = Math.min(1, (step - 3) / 2.0);
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0xFF3333); // Explicit Red for Pop
                  threeState.activeCellScale = 1.0 - 0.4 * pPop;
                  threeState.activeCellOpacity = 1.0 - pPop;
                  threeState.operationType = 'delete';
                  threeState.highlightedCellIndex = 0;
                } else if (step <= 10) {
                  this.activeOp = 'Search';
                  this.opDescription = 'Search: Iterating from TOP to find a value.';
                  this.timeComplexity = 'O(n)'; this.spaceComplexity = 'O(1)';
                  const searchIdx = Math.min(4, step - 6);
                  this.opStatus = `Searching block #${searchIdx}`;
                  
                  threeState.interactiveCells = [searchIdx, -1];
                  threeState.activeHighlightColor.setHex(0xFACC15);
                  threeState.activeCellScale = 1.05; // Subtle pop when searching
                  threeState.activeCellOpacity = 1.0;
                  threeState.operationType = 'search';
                  threeState.highlightedCellIndex = searchIdx;
                } else {
                  this.activeOp = 'Peek';
                  this.opDescription = 'Peek: Viewing the TOP element.';
                  this.timeComplexity = 'O(1)'; this.spaceComplexity = 'O(1)';
                  this.opStatus = 'Peeking at TOP: 25';
                  
                  threeState.interactiveCells = [0, -1];
                  threeState.activeHighlightColor.setHex(0xA855F7);
                  threeState.activeCellScale = 1.0;
                  threeState.activeCellOpacity = 1.0;
                  threeState.operationType = 'search'; // Using search style for peek
                  threeState.highlightedCellIndex = 0;
                }
              }
              // --- PHASE 4: MORPH TRANSITION TO TREE (0.70 - 0.75) ---
              else if (p < 0.75) {
                this.activeDS = 'Tree';
                this.activeOp = 'Morphing';
                this.opDescription = 'Converting Stack to Binary Tree...';
                this.opStatus = 'Restructuring...';
                
                const localP = (p - 0.70) / 0.05;
                threeState.scrollShapeTarget = 8 + localP; // Tie transition to scroll progress
                threeState.interactiveCells = [-1, -1];
                threeState.operationType = 'none';
              }
              // --- PHASE 5: TREE OPERATIONS (0.75 - 1.0) ---
              else {
                this.activeDS = 'Tree';
                threeState.scrollShapeTarget = 9; 
                threeState.blastProgress = 0; 
                
                const localP = (p - 0.75) / 0.25;
                const step = Math.floor(localP * 12);
                this.activeStep = step;

                if (step <= 5) {
                  this.activeOp = 'Insert';
                  this.opDescription = 'Insert: Adding a new node to the BST';
                  this.timeComplexity = 'O(log n)'; this.spaceComplexity = 'O(1)';
                  
                  // Mock insert path for value 10: Root(12) -> Left(9) -> Right(10)
                  const insertPath = [0, 1, 4]; 
                  const tIdx = Math.min(2, Math.floor(step / 2));
                  const nodeIdx = insertPath[tIdx];
                  this.opStatus = tIdx === 2 ? `Inserted node 10!` : `Traversing to insert 10...`;
                  
                  threeState.interactiveCells = [nodeIdx, -1];
                  threeState.activeHighlightColor.setHex(0x00FF88); // Green
                  threeState.activeCellScale = tIdx === 2 ? 1.2 : 1.05;
                  threeState.activeCellOpacity = 1.0;
                  threeState.operationType = 'insert';
                  threeState.highlightedCellIndex = nodeIdx;
                } else {
                  this.activeOp = 'Delete';
                  this.opDescription = 'Delete: Removing a node from the BST';
                  this.timeComplexity = 'O(log n)'; this.spaceComplexity = 'O(1)';
                  
                  // Mock delete path for value 99: Root(12) -> Right(40) -> Right(99)
                  const deletePath = [0, 2, 6]; 
                  const sIdx = Math.min(2, Math.floor((step - 6) / 2));
                  const nodeIdx = deletePath[sIdx];
                  this.opStatus = sIdx === 2 ? `Deleted node 99!` : `Traversing to delete 99...`;
                  
                  threeState.interactiveCells = [nodeIdx, -1];
                  threeState.activeHighlightColor.setHex(0xFF3333); // Red
                  threeState.activeCellScale = sIdx === 2 ? 1.2 : 1.05;
                  threeState.activeCellOpacity = 1.0;
                  threeState.operationType = 'delete';
                  threeState.highlightedCellIndex = nodeIdx;
                }
              }
              this.cdr.detectChanges();
            });
          }
        },
        onLeave: () => {
          if (threeState) {
            threeState.interactiveCells = [-1, -1];
            threeState.operationType = 'none';
            threeState.highlightedCellIndex = -1;
          }
        },
        onLeaveBack: () => {
          if (threeState) {
            threeState.interactiveCells = [-1, -1];
            threeState.operationType = 'none';
            threeState.highlightedCellIndex = -1;
          }
        }
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

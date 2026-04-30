/* REBUILD_TRIGGER_HASH: 123456789 */
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-interactive-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="interactive-section" id="interactive-array">
      <div class="content-container">
        <div class="header">
          <span class="label">LIVE SIMULATION</span>
          <h2>Interactive Array <span>Operations</span></h2>
          <p>Watch how data is accessed and manipulated in real-time as you scroll through the memory blocks.</p>
        </div>

        <div class="operation-card glass">
          <div class="status-bar">
            <div class="dot red"></div>
            <div class="dot yellow"></div>
            <div class="dot green"></div>
            <span class="filename">array_ops.py</span>
          </div>
          <div class="code-view">
            <div class="line" [class.active]="activeStep === 0"><span>1</span> <span class="keyword">def</span> <span class="func">search</span>(arr, target):</div>
            <div class="line" [class.active]="activeStep >= 1 && activeStep <= 10"><span>2</span> &nbsp;&nbsp;&nbsp;&nbsp;<span class="keyword">for</span> i <span class="keyword">in</span> <span class="func">range</span>(<span class="func">len</span>(arr)):</div>
            <div class="line" [class.active]="activeStep > 0 && activeStep <= 10"><span>3</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="comment"># Accessing index [{{ activeStep - 1 >= 0 ? activeStep - 1 : 0 }}]</span></div>
            <div class="line" [class.active]="activeStep === 11"><span>4</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="keyword">if</span> arr[i] == target: <span class="keyword">return</span> i</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box glass">
            <span class="stat-label">TIME COMPLEXITY</span>
            <span class="stat-value">O(n)</span>
          </div>
          <div class="stat-box glass">
            <span class="stat-label">SPACE COMPLEXITY</span>
            <span class="stat-value">O(1)</span>
          </div>
          <div class="stat-box glass">
            <span class="stat-label">CURRENT INDEX</span>
            <span class="stat-value">#{{ activeStep - 1 >= 0 ? activeStep - 1 : 'NULL' }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .interactive-section {
      min-height: 180vh; /* Increased height */
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 150px 5%;
      position: relative;
      z-index: 20; /* Increased z-index */
      background: #01040F;
    }
    .content-container {
      max-width: 1200px;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }
    .header {
      .label {
        color: #22D3EE;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        letter-spacing: 2px;
        display: block;
        margin-bottom: 10px;
      }
      h2 {
        font-size: 48px;
        color: white;
        margin-bottom: 20px;
        span {
          background: linear-gradient(to right, #22D3EE, #38BDF8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
      p {
        color: #94A3B8;
        font-size: 18px;
        line-height: 1.6;
        max-width: 500px;
      }
    }
    .operation-card {
      border-radius: 12px;
      overflow: hidden;
      font-family: 'JetBrains Mono', monospace;
      .status-bar {
        background: rgba(255,255,255,0.05);
        padding: 10px 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(56,189,248,0.2);
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #FF5F56; }
        .yellow { background: #FFBD2E; }
        .green { background: #27C93F; }
        .filename { color: #64748B; font-size: 12px; margin-left: 10px; }
      }
      .code-view {
        padding: 20px;
        background: rgba(2, 6, 23, 0.8);
        .line {
          color: #94A3B8;
          font-size: 15px;
          margin-bottom: 8px;
          transition: all 0.3s;
          span:first-child { color: #475569; margin-right: 20px; user-select: none; }
          &.active {
            color: #FACC15;
            transform: translateX(10px);
            background: rgba(250, 204, 21, 0.05);
          }
        }
        .keyword { color: #38BDF8; }
        .func { color: #22D3EE; }
        .comment { color: #475569; font-style: italic; }
      }
    }
    .stats-grid {
      grid-column: 1 / span 2;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
    }
    .stat-box {
      padding: 30px;
      text-align: center;
      .stat-label { color: #64748B; font-size: 12px; letter-spacing: 1px; display: block; margin-bottom: 10px; }
      .stat-value { color: #22D3EE; font-size: 32px; font-weight: bold; }
    }
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    @media (max-width: 900px) {
      .content-container { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InteractiveSectionComponent implements AfterViewInit, OnDestroy {
  activeStep = 0;
  private trigger: ScrollTrigger | null = null;

  ngAfterViewInit() {
    setTimeout(() => {
      const threeState = (window as any).threeSceneState;
      
      this.trigger = ScrollTrigger.create({
        trigger: '.interactive-section',
        start: 'top 30%',
        end: 'bottom 70%',
        scrub: true,
        onUpdate: (self) => {
          if (threeState) {
            // Force shape 7 (Interactive Array)
            threeState.scrollShapeTarget = 7;
            threeState.ptsPosTarget = 0; // Center it
            
            // Map progress to 10 blocks (0-9)
            const step = Math.floor(self.progress * 11);
            this.activeStep = step;
            threeState.interactiveCell = step - 1; // Highlight previous index during the "step"
          }
        }
      });
    }, 150);
  }

  ngOnDestroy() {
    if (this.trigger) this.trigger.kill();
  }
}

import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { ThreeService } from '../three.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [CommonModule],
  template: '<canvas #webglCanvas class="webgl-canvas"></canvas>',
  styles: [`
    .webgl-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
    }
  `]
})
export class ThreeSceneComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private animFrameId: number = 0;

  private N = 15000;
  private pts!: THREE.Points;
  private mat!: THREE.ShaderMaterial;
  private geo!: THREE.BufferGeometry;

  private shapes: Float32Array[] = [];
  private highlights: Float32Array[] = [];
  private blastDir!: Float32Array;

  // STATE
  private morphTarget = 0;
  private morphSmooth = 0;
  public ptsPosTarget = 2.8;
  private ptsPosSmooth = 2.8;
  public blastProgress = 0;
  private blastSmooth = 0;
  public dnaRotation = 0;
  private dnaRotationSmooth = 0;
  // Scroll parallax state (driven from WorkPageComponent via window.threeSceneState)
  public scrollRotationOffsetTarget = 0;
  private scrollRotationOffsetSmooth = 0;
  public posYTarget = 0;
  private posYSmooth = 0;
  public scaleTarget = 0.78;
  private scaleSmooth = 0.78;
  public enableMouseParallax = false;
  // Per-frame rotation accumulator (replaces elapsed * constant)
  private frameRotation = 0;
  private mouse = new THREE.Vector2(-10, -10);

  public scrollShapeTarget = 0;
  private lastScrollShapeTarget = 0;
  private scrollActiveFrames = 0;
  private cardHovered = -1;
  private sub!: Subscription;

  constructor(
    private ngZone: NgZone,
    private threeService: ThreeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initThree();
    this.generateShapes();
    this.initParticles();

    this.sub = this.threeService.activeMorphTarget$.subscribe(target => {
      this.cardHovered = target;
    });

    // Share access to this component via global window for ScrollTrigger manipulation
    // In Angular, doing it this way is perfectly aligned for quick GSAP coupling without NgRx overhead
    (window as any).threeSceneState = this;

    this.ngZone.runOutsideAngular(() => {
      this.animate(0);
    });
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  @HostListener('window:resize')
  onResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(3, 0, 9);

    this.scene = new THREE.Scene();
  }

  private generateShapes() {
    const N = this.N;

    // 1 & 7. Sphere
    const getSphere = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        let r = 2.2;
        if (Math.random() < 0.15) r *= Math.random();
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      return pos;
    };

    // 2. Array
    const getArray = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 10;
      const size = 0.8;
      const values = [10, 25, 40, 5, 8, 99, 12, 33, 41, 7];
      
      const textPointsByCell: {x: number, y: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 100; cvs.height = 180;
      const ctx = cvs.getContext('2d')!;
      
      for(let c=0; c<numCells; c++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 100, 180);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('INDEX', 50, 10);
        ctx.font = 'bold 22px Arial';
        ctx.fillText(c.toString(), 50, 30);
        ctx.font = 'bold 45px Arial';
        ctx.textBaseline = 'middle';
        ctx.fillText(values[c].toString(), 50, 120);
        
        const imgData = ctx.getImageData(0, 0, 100, 180).data;
        const cellXOffset = (c - (numCells - 1) / 2) * size;
        for (let y = 0; y < 180; y += 1) {
          for (let x = 0; x < 100; x += 1) {
            if (imgData[(y * 100 + x) * 4] > 128) {
              textPointsByCell.push({ x: (x - 50) * 0.007 + cellXOffset, y: -(y - 120) * 0.007 });
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let px, py, pz, h = 0;
        
        if (r < 0.55 && textPointsByCell.length > 0) {
          const p = textPointsByCell[Math.floor(Math.random() * textPointsByCell.length)];
          px = p.x; py = p.y; pz = 0;
          h = 1.0;
        } else {
          const cell = Math.floor(Math.random() * numCells);
          const cellXOffset = (cell - (numCells - 1) / 2) * size;
          const edge = Math.floor(Math.random() * 12);
          px = (Math.random() - 0.5) * size;
          py = (Math.random() - 0.5) * size;
          pz = (Math.random() - 0.5) * size;
          if (edge === 0) { py = size/2; pz = size/2; }
          else if (edge === 1) { py = size/2; pz = -size/2; }
          else if (edge === 2) { py = -size/2; pz = size/2; }
          else if (edge === 3) { py = -size/2; pz = -size/2; }
          else if (edge === 4) { px = size/2; pz = size/2; }
          else if (edge === 5) { px = size/2; pz = -size/2; }
          else if (edge === 6) { px = -size/2; pz = size/2; }
          else if (edge === 7) { px = -size/2; pz = -size/2; }
          else if (edge === 8) { px = size/2; py = size/2; }
          else if (edge === 9) { px = size/2; py = -size/2; }
          else if (edge === 10) { px = -size/2; py = size/2; }
          else if (edge === 11) { px = -size/2; py = -size/2; }
          px += cellXOffset;
        }
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    // 3. Stack
    const getStack = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 6;
      const sizeX = 1.6;
      const sizeY = 0.7;
      const sizeZ = 0.7;
      const values = [40, 55, 22, 30, 20, 10];
      
      const textPoints: {x: number, y: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 100; cvs.height = 100;
      const ctx = cvs.getContext('2d')!;
      
      for(let c=0; c<numCells; c++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(values[c].toString(), 50, 50);
        const imgData = ctx.getImageData(0, 0, 100, 100).data;
        const cellYOffset = ((numCells - 1) / 2 - c) * sizeY;
        for (let y = 0; y < 100; y += 1) {
          for (let x = 0; x < 100; x += 1) {
            if (imgData[(y * 100 + x) * 4] > 128) {
              textPoints.push({ x: (x - 50) * 0.008, y: -(y - 50) * 0.008 + cellYOffset });
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let px, py, pz, h = 0;
        
        if (r < 0.55 && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          px = p.x; py = p.y; pz = 0;
          h = 1.0;
        } else {
          const cell = Math.floor(Math.random() * numCells);
          const edge = Math.floor(Math.random() * 12);
          px = (Math.random() - 0.5) * sizeX;
          py = (Math.random() - 0.5) * sizeY;
          pz = (Math.random() - 0.5) * sizeZ;
          if (edge === 0) { py = sizeY/2; pz = sizeZ/2; }
          else if (edge === 1) { py = sizeY/2; pz = -sizeZ/2; }
          else if (edge === 2) { py = -sizeY/2; pz = sizeZ/2; }
          else if (edge === 3) { py = -sizeY/2; pz = -sizeZ/2; }
          else if (edge === 4) { px = sizeX/2; pz = sizeZ/2; }
          else if (edge === 5) { px = sizeX/2; pz = -sizeZ/2; }
          else if (edge === 6) { px = -sizeX/2; pz = sizeZ/2; }
          else if (edge === 7) { px = -sizeX/2; pz = -sizeZ/2; }
          else if (edge === 8) { px = sizeX/2; py = sizeY/2; }
          else if (edge === 9) { px = sizeX/2; py = -sizeY/2; }
          else if (edge === 10) { px = -sizeX/2; py = sizeY/2; }
          else if (edge === 11) { px = -sizeX/2; py = -sizeY/2; }
          const cellYOffset = ((numCells - 1) / 2 - cell) * sizeY;
          py += cellYOffset;
        }
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    // 4. Binary Tree
    const getTree = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      
      const nodes = [
        { id: 0, val: 8, x: 0, y: 1.5 },
        { id: 1, val: 4, x: -1.2, y: 0.5 },
        { id: 2, val: 12, x: 1.2, y: 0.5 },
        { id: 3, val: 2, x: -1.8, y: -0.5 },
        { id: 4, val: 14, x: 1.8, y: -0.5 },
        { id: 5, val: 1, x: -2.4, y: -1.5 },
        { id: 6, val: 3, x: -1.2, y: -1.5 },
        { id: 7, val: 13, x: 1.2, y: -1.5 },
        { id: 8, val: 15, x: 2.4, y: -1.5 },
      ];
      const edges = [
        [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [3, 6], [4, 7], [4, 8]
      ];
      
      const textPoints: {x: number, y: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 100; cvs.height = 100;
      const ctx = cvs.getContext('2d')!;
      
      for(let i=0; i<nodes.length; i++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(nodes[i].val.toString(), 50, 50);
        const imgData = ctx.getImageData(0, 0, 100, 100).data;
        for (let y = 0; y < 100; y += 1) {
          for (let x = 0; x < 100; x += 1) {
            if (imgData[(y * 100 + x) * 4] > 128) {
              textPoints.push({ x: nodes[i].x + (x - 50) * 0.005, y: nodes[i].y + -(y - 50) * 0.005 });
            }
          }
        }
      }
      
      const radius = 0.35;
      for (let i = 0; i < N; i++) {
        let px, py, pz, h = 0;
        const r = Math.random();
        
        if (r < 0.6 && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          px = p.x; py = p.y; pz = 0;
          h = 1.0;
        } else if (r < 0.8) {
          const nodeIdx = Math.floor(Math.random() * nodes.length);
          const n = nodes[nodeIdx];
          const isLatitude = Math.random() < 0.5;
          let cx, cy, cz;
          if (isLatitude) {
             const lats = [-0.6, -0.3, 0, 0.3, 0.6];
             const sinPhi = lats[Math.floor(Math.random() * lats.length)];
             const cosPhi = Math.sqrt(1 - sinPhi * sinPhi);
             const theta = Math.random() * Math.PI * 2;
             cx = cosPhi * Math.cos(theta) * radius;
             cy = sinPhi * radius;
             cz = cosPhi * Math.sin(theta) * radius;
          } else {
             const numLong = 8;
             const lonIdx = Math.floor(Math.random() * numLong);
             const theta = (lonIdx / numLong) * Math.PI;
             const phi = Math.random() * Math.PI * 2;
             const circleX = Math.cos(phi) * radius;
             const circleY = Math.sin(phi) * radius;
             cx = circleX * Math.cos(theta); cy = circleY; cz = -circleX * Math.sin(theta);
          }
          px = n.x + cx; py = n.y + cy; pz = cz;
        } else {
          const edgeIdx = Math.floor(Math.random() * edges.length);
          const e = edges[edgeIdx];
          const n1 = nodes[e[0]]; const n2 = nodes[e[1]];
          const dx = n2.x - n1.x; const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const tStart = radius / dist; const tEnd = 1.0 - (radius / dist);
          const t = tStart + Math.random() * (tEnd - tStart);
          px = n1.x + dx * t; py = n1.y + dy * t; pz = 0;
        }
        pos[i * 3] = px * 1.5;
        pos[i * 3 + 1] = py * 1.5;
        pos[i * 3 + 2] = pz * 1.5;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    // 5. LinkedList
    const getLinkedList = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 6;
      const size = 0.9;
      const spacing = 1.4;
      const values = [40, 39, 86, 48, 21, 10];
      
      const textPoints: {x: number, y: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 150; cvs.height = 200;
      const ctx = cvs.getContext('2d')!;
      
      for(let c=0; c<numCells; c++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 150, 200);
        ctx.fillStyle = '#fff';
        if (c === 0) { ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('HEAD', 75, 10); }
        ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(values[c].toString(), 75, 120);
        const imgData = ctx.getImageData(0, 0, 150, 200).data;
        const cellXOffset = (c - (numCells - 1) / 2) * spacing;
        for (let y = 0; y < 200; y += 1) {
          for (let x = 0; x < 150; x += 1) {
            if (imgData[(y * 150 + x) * 4] > 128) {
              textPoints.push({ x: (x - 75) * 0.007 + cellXOffset, y: -(y - 120) * 0.007 });
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let px, py, pz, h = 0;
        if (r < 0.30 && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          px = p.x; py = p.y; pz = 0;
          h = 1.0;
        } else if (r < 0.35) {
          const arrowIdx = Math.floor(Math.random() * (numCells - 1));
          const cellXOffset = (arrowIdx - (numCells - 1) / 2) * spacing;
          const gapStart = cellXOffset + size/2 + 0.1; const gapEnd = cellXOffset + spacing - size/2 - 0.1;
          const arrowPart = Math.random();
          if (arrowPart < 0.6) { px = gapStart + Math.random() * (gapEnd - gapStart); py = 0; pz = 0; }
          else { let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; } px = gapEnd + u * (-0.2) + v * (-0.2); py = u * 0.15 + v * (-0.15); pz = 0; }
        } else if (r < 0.80) {
          const cell = Math.floor(Math.random() * numCells);
          const edge = Math.floor(Math.random() * 12);
          px = (Math.random() - 0.5) * size; py = (Math.random() - 0.5) * size; pz = (Math.random() - 0.5) * size;
          if (edge === 0) { py = size/2; pz = size/2; }
          else if (edge === 1) { py = size/2; pz = -size/2; }
          else if (edge === 2) { py = -size/2; pz = size/2; }
          else if (edge === 3) { py = -size/2; pz = -size/2; }
          else if (edge === 4) { px = size/2; pz = size/2; }
          else if (edge === 5) { px = size/2; pz = -size/2; }
          else if (edge === 6) { px = -size/2; pz = size/2; }
          else if (edge === 7) { px = -size/2; pz = -size/2; }
          else if (edge === 8) { px = size/2; py = size/2; }
          else if (edge === 9) { px = size/2; py = -size/2; }
          else if (edge === 10) { px = -size/2; py = size/2; }
          else if (edge === 11) { px = -size/2; py = -size/2; }
          const cellXOffset = (cell - (numCells - 1) / 2) * spacing; px += cellXOffset;
        } else {
          const cell = Math.floor(Math.random() * numCells);
          const cellXOffset = (cell - (numCells - 1) / 2) * spacing;
          px = cellXOffset + (Math.random() - 0.5) * size * 0.9; py = (Math.random() - 0.5) * size * 0.9; pz = (Math.random() - 0.5) * size * 0.9;
        }
        pos[i * 3] = px * 1.1; pos[i * 3 + 1] = py * 1.1; pos[i * 3 + 2] = pz * 1.1;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    // 6. Blob
    const getBlob = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2.0 * Math.random() - 1.0);
        let r = 1.6 + Math.sin(u * 4) * 0.45 + Math.cos(v * 3) * 0.45;
        pos[i * 3] = r * Math.sin(v) * Math.cos(u);
        pos[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
        pos[i * 3 + 2] = r * Math.cos(v);
      }
      return pos;
    };

    const getQueue = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 7;
      const size = 0.8;
      const spacing = 1.1;
      const values = [10, 12, 15, 20, 16, 20, 25];
      
      const textPoints: {x: number, y: number, highlight: boolean}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 150; cvs.height = 150;
      const ctx = cvs.getContext('2d')!;
      
      // Labels: FRONT and REAR
      const drawText = (txt: string, xOff: number) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, 75, 75);
        const imgData = ctx.getImageData(0, 0, 150, 150).data;
        for (let y = 0; y < 150; y += 2) {
          for (let x = 0; x < 150; x += 2) {
            if (imgData[(y * 150 + x) * 4] > 128) {
              textPoints.push({ x: (x - 75) * 0.008 + xOff, y: -(y - 75) * 0.008, highlight: true });
            }
          }
        }
      };
      
      drawText('FRONT', -((numCells - 1) / 2 + 1.2) * spacing);
      drawText('REAR', ((numCells - 1) / 2 + 1.2) * spacing);
      
      // Numbers
      for(let c=0; c<numCells; c++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(values[c].toString(), 75, 75);
        const imgData = ctx.getImageData(0, 0, 150, 150).data;
        const cellX = (c - (numCells - 1) / 2) * spacing;
        for (let y = 0; y < 150; y += 2) {
          for (let x = 0; x < 150; x += 2) {
            if (imgData[(y * 150 + x) * 4] > 128) {
              textPoints.push({ x: (x - 75) * 0.008 + cellX, y: -(y - 75) * 0.008, highlight: true });
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let px, py, pz, h = 0;
        
        if (r < 0.4 && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          px = p.x; py = p.y; pz = 0;
          h = 1.0;
        } else {
          // Octahedron cells
          const cell = Math.floor(Math.random() * numCells);
          const cellX = (cell - (numCells - 1) / 2) * spacing;
          
          // Octahedron vertices: (±1,0,0), (0,±1,0), (0,0,±1)
          const vertices = [
            [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]
          ];
          const edges = [
            [0,2],[0,3],[0,4],[0,5],
            [1,2],[1,3],[1,4],[1,5],
            [2,4],[4,3],[3,5],[5,2]
          ];
          
          const edgeIdx = Math.floor(Math.random() * edges.length);
          const v1 = vertices[edges[edgeIdx][0]];
          const v2 = vertices[edges[edgeIdx][1]];
          const t = Math.random();
          const s = size * 0.6;
          px = cellX + (v1[0] + (v2[0] - v1[0]) * t) * s;
          py = (v1[1] + (v2[1] - v1[1]) * t) * s;
          pz = (v1[2] + (v2[2] - v1[2]) * t) * s;
        }
        
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    const getHash = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numBuckets = 7;
      const spacing = 1.8; // Increased spacing for clarity
      const boxSize = { w: 1.1, h: 0.7, d: 0.6 };
      const chains = [[10], [20, 22], [50], [80, 85, 88], [90], [55, 66], [60]];
      
      const textPoints: {x: number, y: number, z: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 150; cvs.height = 100;
      const ctx = cvs.getContext('2d')!;
      
      // Generate text points for each box and base
      for (let b = 0; b < numBuckets; b++) {
        const baseX = (b - (numBuckets - 1) / 2) * spacing;
        
        // Base index number - Larger and cleaner
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 150, 100);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 55px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.toString(), 75, 50);
        const baseImg = ctx.getImageData(0, 0, 150, 100).data;
        for (let y = 0; y < 100; y += 1) { // Higher resolution
          for (let x = 0; x < 150; x += 1) {
            if (baseImg[(y * 150 + x) * 4] > 128) {
              textPoints.push({ x: baseX + (x - 75) * 0.007, y: -0.9 + -(y - 50) * 0.007, z: 0.05 });
            }
          }
        }
        
        // Chain boxes
        for (let j = 0; j < chains[b].length; j++) {
          const val = chains[b][j];
          const key = b + 2;
          const txt = `${key}:${val}`;
          
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 150, 100);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 42px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, 75, 50);
          const boxImg = ctx.getImageData(0, 0, 150, 100).data;
          
          const boxY = j * (boxSize.h + 0.15);
          for (let y = 0; y < 100; y += 1) {
            for (let x = 0; x < 150; x += 1) {
              if (boxImg[(y * 150 + x) * 4] > 128) {
                textPoints.push({ x: baseX + (x - 75) * 0.007, y: boxY + -(y - 50) * 0.007, z: 0.1 });
              }
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const r = Math.random();
        let px, py, pz, h = 0;
        
        // 65% for text for maximum clarity
        if (r < 0.65 && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          px = p.x; py = p.y; pz = p.z;
          h = 1.0;
        } else {
          // Wireframe boxes - Sparse and clean
          const b = Math.floor(Math.random() * numBuckets);
          const chainIdx = Math.floor(Math.random() * (chains[b].length + 1));
          const baseX = (b - (numBuckets - 1) / 2) * spacing;
          
          if (chainIdx === chains[b].length) {
            // Base plate wireframe (flat box)
            const edge = Math.floor(Math.random() * 12);
            const bw = boxSize.w * 0.9; const bh = 0.15; const bd = boxSize.d * 0.9;
            px = (Math.random() - 0.5) * bw;
            py = (Math.random() - 0.5) * bh;
            pz = (Math.random() - 0.5) * bd;
            if (edge<4) py = bh/2; else if (edge<8) py = -bh/2;
            else if (edge===8) { px=bw/2; py=bh/2; }
            px += baseX; py -= 0.9;
          } else {
            // Stacked box wireframe
            const edge = Math.floor(Math.random() * 12);
            px = (Math.random() - 0.5) * boxSize.w;
            py = (Math.random() - 0.5) * boxSize.h;
            pz = (Math.random() - 0.5) * boxSize.d;
            
            if (edge === 0) { py = boxSize.h/2; pz = boxSize.d/2; }
            else if (edge === 1) { py = boxSize.h/2; pz = -boxSize.d/2; }
            else if (edge === 2) { py = -boxSize.h/2; pz = boxSize.d/2; }
            else if (edge === 3) { py = -boxSize.h/2; pz = -boxSize.d/2; }
            else if (edge === 4) { px = boxSize.w/2; pz = boxSize.d/2; }
            else if (edge === 5) { px = boxSize.w/2; pz = -boxSize.d/2; }
            else if (edge === 6) { px = -boxSize.w/2; pz = boxSize.d/2; }
            else if (edge === 7) { px = -boxSize.w/2; pz = -boxSize.d/2; }
            else if (edge === 8) { px = boxSize.w/2; py = boxSize.h/2; }
            else if (edge === 9) { px = boxSize.w/2; py = -boxSize.h/2; }
            else if (edge === 10) { px = -boxSize.w/2; py = boxSize.h/2; }
            else if (edge === 11) { px = -boxSize.w/2; py = -boxSize.h/2; }
            
            const boxY = chainIdx * (boxSize.h + 0.15);
            px += baseX; py += boxY;
          }
          pz += (Math.random() - 0.5) * 0.05;
        }
        
        pos[i * 3] = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
        hlt[i] = h;
      }
      return { pos, hlt };
    };

    const s0 = getSphere();
    const s1 = getArray();
    const s2 = getStack();
    const s3 = getTree();
    const s4 = getLinkedList();
    const s5 = getQueue();
    const s6 = getHash();
    const s7 = getSphere();

    const emptyHlt = new Float32Array(this.N);
    this.shapes = [s0, s1.pos, s2.pos, s3.pos, s4.pos, s5.pos, s6.pos, s7];
    this.highlights = [emptyHlt, s1.hlt, s2.hlt, s3.hlt, s4.hlt, s5.hlt, s6.hlt, emptyHlt];

    this.blastDir = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2.0 * Math.random() - 1.0);
      const r = 8 + Math.random() * 16;
      this.blastDir[i * 3] = r * Math.sin(v) * Math.cos(u);
      this.blastDir[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
      this.blastDir[i * 3 + 2] = r * Math.cos(v);
    }
  }

  private initParticles() {
    this.geo = new THREE.BufferGeometry();
    const pos = new Float32Array([...this.shapes[0]]);
    const sizes = new Float32Array(this.N);
    const aRnd = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) {
      sizes[i] = 0.5 + Math.random() * 2.0;
      aRnd[i] = Math.random();
    }
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geo.setAttribute('aRnd', new THREE.BufferAttribute(aRnd, 1));
    this.geo.setAttribute('aHighlight', new THREE.BufferAttribute(new Float32Array(this.N), 1));

    const vertexShader = `
      attribute float size;
      attribute float aRnd;
      attribute float aHighlight;
      varying float vOp;
      varying float vHighlight;
      uniform float uTime;
      void main() {
        vOp = 0.45 + 0.55 * sin(uTime * 1.8 + aRnd * 9.0);
        vHighlight = aHighlight;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (32.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform vec3 uColor;
      uniform vec3 uGlow;
      uniform float uBlast;
      varying float vOp;
      varying float vHighlight;
      void main() {
        vec2 pt = gl_PointCoord - vec2(0.5);
        float d = length(pt);
        if (d > 0.5) discard;
        float core = exp(-d * 7.0);
        float glow = exp(-d * 3.0) * 0.5;
        vec3 highlightCol = vec3(0.98, 0.8, 0.08); // #FACC15 Yellow
        vec3 baseCol = mix(uGlow, uColor, core);
        vec3 col = mix(baseCol, highlightCol, vHighlight);
        float blastFade = mix(1.0, 0.35, uBlast);
        gl_FragColor = vec4(col, (core + glow) * vOp * blastFade);
      }
    `;

    this.mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) },
        uGlow: { value: new THREE.Color(0x06B6D4) },
        uBlast: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.pts = new THREE.Points(this.geo, this.mat);
    this.pts.scale.set(0.78, 0.78, 0.78);
    this.scene.add(this.pts);
  }

  private lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  private ease3(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  private animate(time: number) {
    if (!this.pts) return;
    const elapsed = time * 0.001;
    this.mat.uniforms['uTime'].value = elapsed;

    this.blastSmooth = this.lerp(this.blastSmooth, this.blastProgress, 0.06);
    this.mat.uniforms['uBlast'].value = this.blastSmooth;

    // 1. Y-axis auto rotation
    // Slow down and snap to face forward (nearest multiple of 2*PI) when shape is the Array (1), Stack (2), Tree (3), or LinkedList (4)
    let arrayness1 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 1.0));
    let arrayness2 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 2.0));
    let arrayness3 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 3.0));
    let arrayness4 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 4.0));
    let arrayness5 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 5.0));
    let arrayness6 = 1.0 - Math.min(1.0, Math.abs(this.morphSmooth - 6.0));
    let staticness = Math.max(arrayness1, arrayness2, arrayness3, arrayness4, arrayness5, arrayness6);
    
    if (staticness > 0.01) {
      const nearestMultiple = Math.round(this.frameRotation / (Math.PI * 2)) * (Math.PI * 2);
      this.frameRotation = this.lerp(this.frameRotation, nearestMultiple, 0.1 * staticness);
      // Only add a tiny bit of rotation if we are not fully snapped
      this.frameRotation += 0.003 * (1.0 - staticness);
    } else {
      this.frameRotation += 0.01;
    }

    // 2. Smooth the scroll-driven extra rotation offset
    this.scrollRotationOffsetSmooth = this.lerp(
      this.scrollRotationOffsetSmooth,
      this.scrollRotationOffsetTarget,
      0.05
    );

    // Combine: base frame spin + smoothed scroll boost
    this.pts.rotation.y = this.frameRotation + this.scrollRotationOffsetSmooth;

    // 3. Horizontal position (left/right shift per page)
    this.ptsPosSmooth = this.lerp(this.ptsPosSmooth, this.ptsPosTarget, 0.05);

    // 4. Mouse parallax depth effect (only on Work page when enabled)
    if (this.enableMouseParallax) {
      this.pts.position.x = this.lerp(this.pts.position.x, this.ptsPosSmooth + this.mouse.x * 0.5, 0.05);
    } else {
      this.pts.position.x = this.ptsPosSmooth;
    }

    // 5. Scroll-driven Y position (DNA moves up as user scrolls)
    this.posYSmooth = this.lerp(this.posYSmooth, this.posYTarget, 0.08);
    this.pts.position.y = this.posYSmooth;
    if (this.enableMouseParallax) {
      this.pts.position.y = this.lerp(this.pts.position.y, this.posYSmooth + (-this.mouse.y * 0.3), 0.05);
    }

    // 6. Scroll-driven scale + subtle breathing pulse
    this.scaleSmooth = this.lerp(this.scaleSmooth, this.scaleTarget, 0.08);
    const breathePulse = Math.sin(elapsed * 2.0) * 0.04;
    const finalScale = this.scaleSmooth + breathePulse;
    this.pts.scale.set(finalScale, finalScale, finalScale);

    this.camera.position.x = this.mouse.x * 0.3;
    this.camera.position.y = -this.mouse.y * 0.3;
    this.camera.lookAt(0, 0, 0);

    // Detect active scrolling to prevent hover-lock
    if (Math.abs(this.scrollShapeTarget - this.lastScrollShapeTarget) > 0.001) {
      this.scrollActiveFrames = 30; // Stay in scroll-priority mode for ~0.5s after last move
    }
    if (this.scrollActiveFrames > 0) this.scrollActiveFrames--;
    this.lastScrollShapeTarget = this.scrollShapeTarget;

    const activeTarget = (this.cardHovered !== -1 && this.scrollActiveFrames <= 0) ? this.cardHovered : this.scrollShapeTarget;
    // Single fast lerp â€” ease3 is applied at the bi/lam step below
    this.morphSmooth = this.lerp(this.morphSmooth, activeTarget, 0.06);

    // Bounded index interpolation
    let bi = Math.floor(this.morphSmooth);
    if (bi < 0) bi = 0;
    if (bi > this.shapes.length - 2) bi = this.shapes.length - 2;
    let ni = bi + 1;
    let lam = this.ease3(this.morphSmooth - bi);

    const s1 = this.shapes[bi];
    const s2 = this.shapes[ni];
    const positions = this.geo.attributes['position'].array as Float32Array;

    const smBl = this.blastSmooth * this.blastSmooth * (3 - 2 * this.blastSmooth);

    for (let i = 0; i < this.N; i++) {
      let x = this.lerp(s1[i * 3], s2[i * 3], lam);
      let y = this.lerp(s1[i * 3 + 1], s2[i * 3 + 1], lam);
      let z = this.lerp(s1[i * 3 + 2], s2[i * 3 + 2], lam);

      // Calculate Vortex Repulsion if not blasting
      if (this.blastSmooth < 0.2) {
        // Unproject mouse position to world space approximate to origin z=0
        const mx = this.mouse.x * window.innerWidth / 100 * 0.3;
        const my = this.mouse.y * window.innerHeight / 100 * 0.3;
        // The prompt says: "Mouse vortex repulsion (swirl): if bl < 0.2, within radius sqrt(2.5), apply force dx+dy*1.5 / dy-dx*1.5"
        // For simplicity, we apply a rudimentary radius check and twist
        const dx = x - (mx - this.ptsPosSmooth);
        const dy = y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 2.5) {
          const force = (2.5 - distSq) * 0.1;
          x += (dx + dy * 1.5) * force;
          y += (dy - dx * 1.5) * force;
        }
      }

      let tx = this.lerp(x, this.blastDir[i * 3], smBl);
      let ty = this.lerp(y, this.blastDir[i * 3 + 1], smBl);
      let tz = this.lerp(z, this.blastDir[i * 3 + 2], smBl);

      positions[i * 3] = this.lerp(positions[i * 3], tx, 0.14);
      positions[i * 3 + 1] = this.lerp(positions[i * 3 + 1], ty, 0.14);
      positions[i * 3 + 2] = this.lerp(positions[i * 3 + 2], tz, 0.14);
      
      // Update Highlights
      const h1 = this.highlights[bi][i];
      const h2 = this.highlights[ni][i];
      const targetH = this.lerp(h1, h2, lam);
      const highlights = this.geo.attributes['aHighlight'].array as Float32Array;
      highlights[i] = this.lerp(highlights[i], targetH, 0.14);
    }

    this.geo.attributes['position'].needsUpdate = true;
    this.geo.attributes['aHighlight'].needsUpdate = true;
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}


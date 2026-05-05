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

  // Solid Meshes for Array & Stack
  private arrayGroup!: THREE.Group;
  private stackGroup!: THREE.Group;
  private treeGroup!: THREE.Group;
  private arrayCubes: THREE.LineSegments[] = [];
  private stackCubes: THREE.LineSegments[] = [];
  private treeNodes: THREE.LineSegments[] = [];
  private treeEdges: THREE.Line[] = [];
  private arrayLabels: THREE.Sprite[] = [];
  private arrayIndices: THREE.Sprite[] = [];
  private stackLabels: THREE.Sprite[] = [];
  private treeLabels: THREE.Sprite[] = [];
  private arrayHeaderLabels: THREE.Sprite[] = [];
  private stackIndices: THREE.Sprite[] = [];

  private linkedListGroup!: THREE.Group;
  private linkedListCubes: THREE.LineSegments[] = [];
  private linkedListLabels: THREE.Sprite[] = [];
  private linkedListArrows: THREE.Group[] = [];
  private headLabel!: THREE.Sprite;

  private queueGroup!: THREE.Group;
  private queueNodes: THREE.LineSegments[] = [];
  private queueLabels: THREE.Sprite[] = [];
  private frontLabel!: THREE.Sprite;
  private rearLabel!: THREE.Sprite;

  private N = 25000; // Increased from 15000 for higher detail
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
  public interactiveCells: number[] = [-1, -1]; // Supports up to 2 highlights
  public activeHighlightColor = new THREE.Color(0xFACC15); 
  public activeCellOpacity = 1.0;
  public activeCellScale = 1.0;
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
    this.createSolidArray(); 
    this.createSolidStack(); 
    this.createSolidTree(); 
    this.createSolidLinkedList(); 
    this.createSolidQueue(); 
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
    
    // Lighting from demo scene (Keeping the lights, removing the grid)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
  }

  private createSolidArray() {
    this.arrayGroup = new THREE.Group();
    this.arrayGroup.visible = false;
    this.scene.add(this.arrayGroup);

    const numCells = 7;
    const size = 1.42; // Subtle gap for better definition
    const spacing = 1.5;
    const values = [10, 25, 40, 5, 8, 99, 12];

    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.9, linewidth: 2 });

    for (let i = 0; i < numCells; i++) {
      const cube = new THREE.LineSegments(edgesGeo, lineMat);
      const x = (i - (numCells - 1) / 2) * spacing;
      cube.position.set(x, 0, 0);
      this.arrayCubes.push(cube);
      this.arrayGroup.add(cube);

      // Value Label (Yellow) - Centered and Bold
      const valSprite = this.createLabelSprite(values[i].toString(), '#FACC15', 140);
      valSprite.position.set(x, 0, 0.1); // Slightly forward to avoid clipping
      valSprite.scale.set(1.4, 1.4, 1);
      this.arrayLabels.push(valSprite);
      this.arrayGroup.add(valSprite);

      // "INDEX" Header - Small and Grey
      const headerLabel = this.createLabelSprite('INDEX', '#94A3B8', 50);
      headerLabel.position.set(x, 1.45, 0);
      headerLabel.scale.set(0.5, 0.5, 1);
      this.arrayHeaderLabels.push(headerLabel);
      this.arrayGroup.add(headerLabel);
    }
  }

  private createLabelSprite(text: string, color: string, fontSize: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px "Outfit", sans-serif`; // Sharper premium font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16; // Max sharpness
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    return new THREE.Sprite(mat);
  }

  private createSolidStack() {
    this.stackGroup = new THREE.Group();
    this.stackGroup.visible = false;
    this.scene.add(this.stackGroup);

    const numCells = 7;
    const width = 1.42; // Matches Array cube size
    const height = 1.42; 
    const depth = 1.42; 
    const spacing = 1.5; 
    const values = [10, 25, 40, 5, 8, 99, 12]; // Matches Array values

    const boxGeo = new THREE.BoxGeometry(width, height, depth);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.9, linewidth: 2 });

    for (let i = 0; i < numCells; i++) {
      const cube = new THREE.LineSegments(edgesGeo, lineMat);
      const y = (3 - i) * spacing; // Centered for 7 cells
      cube.position.set(0, y, 0);
      this.stackCubes.push(cube);
      this.stackGroup.add(cube);

      // Value Label (Yellow)
      const valSprite = this.createLabelSprite(values[i].toString(), '#FACC15', 140);
      valSprite.position.set(0, y, 0.1);
      valSprite.scale.set(1.4, 1.4, 1);
      this.stackLabels.push(valSprite);
      this.stackGroup.add(valSprite);
    }
  }

  private createSolidTree() {
    this.treeGroup = new THREE.Group();
    this.treeGroup.visible = false;
    this.scene.add(this.treeGroup);

    const numCells = 7;
    const radius = 0.8;
    const values = [12, 9, 40, 5, 10, 25, 99];
    const positions = [
      { x: 0, y: 1.8 },      // Root (0)
      { x: -1.8, y: 0.4 },   // L1 (1)
      { x: 1.8, y: 0.4 },    // L1 (2)
      { x: -2.7, y: -1.0 },  // L2 (3)
      { x: -0.9, y: -1.0 },  // L2 (4)
      { x: 0.9, y: -1.0 },   // L2 (5)
      { x: 2.7, y: -1.0 }    // L2 (6)
    ];

    const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);
    const edgesGeo = new THREE.EdgesGeometry(sphereGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.9 });

    for (let i = 0; i < numCells; i++) {
      const node = new THREE.LineSegments(edgesGeo, lineMat);
      node.position.set(positions[i].x, positions[i].y, 0);
      this.treeNodes.push(node);
      this.treeGroup.add(node);

      const valSprite = this.createLabelSprite(values[i].toString(), '#FFFFFF', 140); // White text as per image
      valSprite.position.set(positions[i].x, positions[i].y, 0.1);
      valSprite.scale.set(1.4, 1.4, 1);
      this.treeLabels.push(valSprite);
      this.treeGroup.add(valSprite);
    }

    // Add Edges (Lines)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8, linewidth: 2 });
    const connections = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    
    connections.forEach(([p, c]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(positions[p].x, positions[p].y, 0),
        new THREE.Vector3(positions[c].x, positions[c].y, 0)
      ]);
      const line = new THREE.Line(geo, edgeMat);
      this.treeEdges.push(line);
      this.treeGroup.add(line);
    });
  }

  private createSolidLinkedList() {
    this.linkedListGroup = new THREE.Group();
    this.linkedListGroup.visible = false;
    this.scene.add(this.linkedListGroup);

    const numCells = 5;
    const size = 1.42;
    const spacing = 2.2; 
    const values = [5, 25, 30, 20, 10];

    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.9, linewidth: 2 });

    for (let i = 0; i < numCells; i++) {
      const cube = new THREE.LineSegments(edgesGeo, lineMat);
      const x = (i - (numCells - 1) / 2) * spacing;
      cube.position.set(x, 0, 0);
      this.linkedListCubes.push(cube);
      this.linkedListGroup.add(cube);

      const valSprite = this.createLabelSprite(values[i].toString(), '#FACC15', 140);
      valSprite.position.set(x, 0, 0.1);
      valSprite.scale.set(1.4, 1.4, 1);
      this.linkedListLabels.push(valSprite);
      this.linkedListGroup.add(valSprite);

      // Add Arrow (except for last node)
      if (i < numCells - 1) {
        const arrowGroup = new THREE.Group();
        const arrowBodyGeo = new THREE.BoxGeometry(0.6, 0.08, 0.08);
        const arrowBody = new THREE.Mesh(arrowBodyGeo, new THREE.MeshBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.8 }));
        
        const arrowHeadGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
        const arrowHead = new THREE.Mesh(arrowHeadGeo, new THREE.MeshBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.8 }));
        arrowHead.rotation.z = -Math.PI / 2;
        arrowHead.position.x = 0.35;

        arrowGroup.add(arrowBody);
        arrowGroup.add(arrowHead);
        arrowGroup.position.set(x + spacing / 2, 0, 0);
        this.linkedListArrows.push(arrowGroup);
        this.linkedListGroup.add(arrowGroup);
      }
    }

    // "HEAD" Label
    this.headLabel = this.createLabelSprite('HEAD', '#FACC15', 80);
    this.headLabel.position.set(-(numCells - 1) / 2 * spacing, 1.4, 0);
    this.headLabel.scale.set(1.0, 1.0, 1);
    this.linkedListGroup.add(this.headLabel);
  }

  private createSolidQueue() {
    this.queueGroup = new THREE.Group();
    this.queueGroup.visible = false;
    this.scene.add(this.queueGroup);

    const numCells = 5;
    const radius = 0.85;
    const spacing = 1.6; 
    const values = [5, 25, 30, 20, 10];

    const icosaGeo = new THREE.IcosahedronGeometry(radius, 1);
    const edgesGeo = new THREE.EdgesGeometry(icosaGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.9, linewidth: 2 });

    for (let i = 0; i < numCells; i++) {
      const node = new THREE.LineSegments(edgesGeo, lineMat);
      const x = (i - (numCells - 1) / 2) * spacing;
      node.position.set(x, 0, 0);
      this.queueNodes.push(node);
      this.queueGroup.add(node);

      const valSprite = this.createLabelSprite(values[i].toString(), '#FACC15', 140);
      valSprite.position.set(x, 0, 0.1);
      valSprite.scale.set(1.4, 1.4, 1);
      this.queueLabels.push(valSprite);
      this.queueGroup.add(valSprite);
    }

    this.frontLabel = this.createLabelSprite('FRONT', '#FACC15', 80);
    this.frontLabel.position.set(-(numCells / 2) * spacing - 0.8, 0, 0);
    this.frontLabel.scale.set(1.2, 1.2, 1);
    this.queueGroup.add(this.frontLabel);

    this.rearLabel = this.createLabelSprite('REAR', '#FACC15', 80);
    this.rearLabel.position.set((numCells / 2) * spacing + 0.8, 0, 0);
    this.rearLabel.scale.set(1.2, 1.2, 1);
    this.queueGroup.add(this.rearLabel);
  }

  private getPointsForText(text: string, scale: number, cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D): {x: number, y: number}[] {
    const pts: {x: number, y: number}[] = [];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#fff';
    
    const lines = text.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, cvs.width / 2, cvs.height / 2 + (i - (lines.length - 1) / 2) * (cvs.height / 4));
    });
    
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
    for (let y = 0; y < cvs.height; y += 2) {
      for (let x = 0; x < cvs.width; x += 2) {
        if (imgData[(y * cvs.width + x) * 4] > 128) {
          pts.push({ 
            x: (x - cvs.width / 2) * 0.01 * scale, 
            y: -(y - cvs.height / 2) * 0.01 * scale 
          });
        }
      }
    }
    return pts.length > 0 ? pts : [{ x: 0, y: 0 }];
  }

  private resetSolidPositions() {
    const arraySpacing = 1.5;
    this.arrayCubes.forEach((cube, i) => {
        const x = (i - 3) * arraySpacing;
        cube.position.set(x, 0, 0);
        cube.rotation.set(0, 0, 0);
        cube.scale.set(1, 1, 1);
        if (this.arrayLabels[i]) {
            this.arrayLabels[i].position.set(x, 0, 0.1);
            this.arrayLabels[i].scale.set(1.4, 1.4, 1);
        }
        if (this.arrayHeaderLabels[i]) {
            this.arrayHeaderLabels[i].position.set(x, 1.45, 0);
            this.arrayHeaderLabels[i].scale.set(0.5, 0.5, 1);
        }
    });

    const stackSpacing = 1.5;
    this.stackCubes.forEach((cube, i) => {
        const y = (3 - i) * stackSpacing;
        cube.position.set(0, y, 0);
        cube.scale.set(1, 1, 1);
        if (this.stackLabels[i]) {
            this.stackLabels[i].position.set(0, y, 0.1);
            this.stackLabels[i].scale.set(1.4, 1.4, 1);
        }
    });

    const treePos = [
      { x: 0, y: 1.8 }, { x: -1.8, y: 0.4 }, { x: 1.8, y: 0.4 },
      { x: -2.7, y: -1.0 }, { x: -0.9, y: -1.0 }, { x: 0.9, y: -1.0 }, { x: 2.7, y: -1.0 }
    ];
    this.treeNodes.forEach((node, i) => {
        const pos = treePos[i];
        node.position.set(pos.x, pos.y, 0);
        node.scale.set(1, 1, 1);
        if (this.treeLabels[i]) {
            this.treeLabels[i].position.set(pos.x, pos.y, 0.1);
            this.treeLabels[i].scale.set(1.4, 1.4, 1);
        }
    });

    const llSpacing = 2.2;
    this.linkedListCubes.forEach((cube, i) => {
        const x = (i - 2) * llSpacing;
        cube.position.set(x, 0, 0);
        cube.scale.set(1, 1, 1);
        if (this.linkedListLabels[i]) {
            this.linkedListLabels[i].position.set(x, 0, 0.1);
            this.linkedListLabels[i].scale.set(1.4, 1.4, 1);
        }
    });

    const qSpacing = 1.6;
    this.queueNodes.forEach((node, i) => {
        const x = (i - 2) * qSpacing;
        node.position.set(x, 0, 0);
        node.scale.set(1, 1, 1);
        if (this.queueLabels[i]) {
            this.queueLabels[i].position.set(x, 0, 0.1);
            this.queueLabels[i].scale.set(1.4, 1.4, 1);
        }
    });
  }

  private morphArrayToStack(lam: number) {
    const arraySpacing = 1.5;
    const stackSpacing = 1.5;
    const stackWidth = 1.42;
    const stackHeight = 1.42;
    const arraySize = 1.42;

    // We morph all 7 cubes from Array into Stack positions
    for (let i = 0; i < 7; i++) {
        const arrayX = (i - 3) * arraySpacing;
        const stackY = (3 - i) * stackSpacing;

        // Position interpolation
        const tx = this.lerp(arrayX, 0, lam);
        const ty = this.lerp(0, stackY, lam);
        
        // Shape interpolation (Both are now cubes)
        const tw = this.lerp(1, stackWidth / arraySize, lam);
        const th = this.lerp(1, stackHeight / arraySize, lam);

        if (this.arrayCubes[i]) {
            this.arrayCubes[i].position.set(tx, ty, 0);
            this.arrayCubes[i].scale.set(tw, th, 1);
        }
        if (this.arrayLabels[i]) {
            this.arrayLabels[i].position.set(tx, ty, 0.1);
            this.arrayLabels[i].scale.set(1.4, 1.4, 1);
        }
        
        if (this.stackCubes[i]) {
            this.stackCubes[i].position.set(tx, ty, 0);
            this.stackCubes[i].scale.set(tw, th, 1);
        }
        if (this.stackLabels[i]) {
            this.stackLabels[i].position.set(tx, ty, 0.1);
            this.stackLabels[i].scale.set(1.4, 1.4, 1);
        }
    }
  }

  private morphStackToTree(lam: number) {
    const stackSpacing = 1.5;
    const treePos = [
      { x: 0, y: 1.8 }, { x: -1.8, y: 0.4 }, { x: 1.8, y: 0.4 },
      { x: -2.7, y: -1.0 }, { x: -0.9, y: -1.0 }, { x: 0.9, y: -1.0 }, { x: 2.7, y: -1.0 }
    ];

    for (let i = 0; i < 7; i++) {
        const stackY = (3 - i) * stackSpacing;
        const tx = this.lerp(0, treePos[i].x, lam);
        const ty = this.lerp(stackY, treePos[i].y, lam);

        if (this.stackCubes[i]) {
            this.stackCubes[i].position.set(tx, ty, 0);
        }
        if (this.stackLabels[i]) {
            this.stackLabels[i].position.set(tx, ty, 0.1);
        }
        if (this.treeNodes[i]) {
            this.treeNodes[i].position.set(tx, ty, 0);
        }
        if (this.treeLabels[i]) {
            this.treeLabels[i].position.set(tx, ty, 0.1);
        }
    }
  }

  private morphTreeToLinkedList(lam: number) {
    const treePos = [
      { x: 0, y: 1.8 }, { x: -1.8, y: 0.4 }, { x: 1.8, y: 0.4 },
      { x: -2.7, y: -1.0 }, { x: -0.9, y: -1.0 }, { x: 0.9, y: -1.0 }, { x: 2.7, y: -1.0 }
    ];
    const llSpacing = 2.2;
    const llPositions = [
      { x: -2 * llSpacing, y: 0 }, { x: -1 * llSpacing, y: 0 }, { x: 0, y: 0 },
      { x: 1 * llSpacing, y: 0 }, { x: 2 * llSpacing, y: 0 }
    ];

    for (let i = 0; i < 7; i++) {
        // First 5 nodes morph to LL positions, last 2 fade/shrink
        const targetX = i < 5 ? llPositions[i].x : llPositions[4].x + 1;
        const targetY = i < 5 ? llPositions[i].y : 0;
        const targetScale = i < 5 ? 1 : 0.001;

        const tx = this.lerp(treePos[i].x, targetX, lam);
        const ty = this.lerp(treePos[i].y, targetY, lam);
        const ts = this.lerp(1, targetScale, lam);

        if (this.treeNodes[i]) {
            this.treeNodes[i].position.set(tx, ty, 0);
            this.treeNodes[i].scale.set(ts, ts, ts);
        }
        if (this.treeLabels[i]) {
            this.treeLabels[i].position.set(tx, ty, 0.1);
            this.treeLabels[i].scale.set(ts * 1.4, ts * 1.4, 1);
        }

        if (i < 5) {
            if (this.linkedListCubes[i]) {
                this.linkedListCubes[i].position.set(tx, ty, 0);
                this.linkedListCubes[i].scale.set(ts, ts, ts);
            }
            if (this.linkedListLabels[i]) {
                this.linkedListLabels[i].position.set(tx, ty, 0.1);
                this.linkedListLabels[i].scale.set(ts * 1.4, ts * 1.4, 1);
            }
        }
    }
    
    // Head label placement
    if (this.headLabel) {
        const headX = this.lerp(treePos[0].x, llPositions[0].x, lam);
        const headY = this.lerp(1.8 + 0.8, 1.4, lam);
        this.headLabel.position.set(headX, headY, 0);
        (this.headLabel.material as any).opacity = lam;
    }
  }

  private morphLinkedListToQueue(lam: number) {
    const llSpacing = 2.2;
    const qSpacing = 1.6;
    
    for (let i = 0; i < 5; i++) {
        const llX = (i - 2) * llSpacing;
        const qX = (i - 2) * qSpacing;
        
        const tx = this.lerp(llX, qX, lam);
        
        if (this.linkedListCubes[i]) {
            this.linkedListCubes[i].position.set(tx, 0, 0);
            this.linkedListCubes[i].scale.set(1 - lam * 0.5, 1 - lam * 0.5, 1 - lam * 0.5);
            (this.linkedListCubes[i].material as any).opacity = (1.0 - lam);
        }
        
        if (this.queueNodes[i]) {
            this.queueNodes[i].position.set(tx, 0, 0);
            (this.queueNodes[i].material as any).opacity = lam;
        }
        if (this.queueLabels[i]) {
            this.queueLabels[i].position.set(tx, 0, 0.1);
            (this.queueLabels[i].material as any).opacity = lam;
        }
    }
    
    // Fade out LL arrows and head label
    this.linkedListArrows.forEach(arrow => {
        arrow.children.forEach((child: any) => {
            if (child.material) (child.material as any).opacity = (1.0 - lam);
        });
    });
    if (this.headLabel) (this.headLabel.material as any).opacity = (1.0 - lam);
    
    // Fade in FRONT/REAR labels
    if (this.frontLabel) (this.frontLabel.material as any).opacity = lam;
    if (this.rearLabel) (this.rearLabel.material as any).opacity = lam;
  }

  private generateShapes() {
    const N = this.N;
    const cvs = document.createElement('canvas');
    cvs.width = 500;
    cvs.height = 500;
    const ctx = cvs.getContext('2d')!;

    const getSphere = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      }
      return pos;
    };

    const getArray = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 4;
      const size = 1.2;
      const values = [2, 7, 11, 15];
      
      const textPointsByCell: {x: number, y: number}[] = [];
      const cvs = document.createElement('canvas');
      cvs.width = 300; cvs.height = 450;
      const ctx = cvs.getContext('2d')!;
      
      for(let c=0; c<numCells; c++) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 300, 450);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('INDEX', 150, 20);
        ctx.font = 'bold 60px monospace';
        ctx.fillText(c.toString(), 150, 70);
        ctx.font = 'bold 110px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(values[c].toString(), 150, 280);
        
        const imgData = ctx.getImageData(0, 0, 300, 450).data;
        const cellXOffset = (c - (numCells - 1) / 2) * size;
        for (let y = 0; y < 450; y += 1) {
          for (let x = 0; x < 300; x += 1) {
            if (imgData[(y * 300 + x) * 4] > 128) {
              textPointsByCell.push({ x: (x - 150) * 0.0025 + cellXOffset, y: -(y - 280) * 0.0025 });
            }
          }
        }
      }
      
      for (let i = 0; i < N; i++) {
        const p = textPointsByCell[i % textPointsByCell.length];
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = 0;
        hlt[i] = 1.0;
      }
      return { pos, hlt };
    };

    const getStack = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const idx = new Float32Array(N).fill(-1);
      const numCells = 7;
      const values = [10, 25, 40, 5, 8, 99, 12];
      const cvs = document.createElement('canvas'); cvs.width = 200; cvs.height = 200;
      const ctx = cvs.getContext('2d')!;
      
      let currentIdx = 0;
      const ptsPerCell = Math.floor(N / numCells);
      for(let c=0; c<numCells; c++) {
        const points = this.getPointsForText(values[c].toString(), 0.8, cvs, ctx);
        const cellYOffset = (3 - c) * 0.75;
        for(let j=0; j<ptsPerCell; j++) {
            const p = points[j % points.length];
            pos[currentIdx * 3] = p.x; pos[currentIdx * 3 + 1] = p.y + cellYOffset; pos[currentIdx * 3 + 2] = 0;
            hlt[currentIdx] = 1.0; idx[currentIdx] = c;
            currentIdx++;
        }
      }
      return { pos, hlt, idx };
    };

    const getTree = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const values = [12, 9, 40, 5, 10, 25, 99];
      const nodes = [
        { id: 0, val: values[0], x: 0, y: 1.8, z: 0 },
        { id: 1, val: values[1], x: -1.8, y: 0.4, z: 0 },
        { id: 2, val: values[2], x: 1.8, y: 0.4, z: 0 },
        { id: 3, val: values[3], x: -2.7, y: -1.0, z: 0 },
        { id: 4, val: values[4], x: -0.9, y: -1.0, z: 0 },
        { id: 5, val: values[5], x: 0.9, y: -1.0, z: 0 },
        { id: 6, val: values[6], x: 2.7, y: -1.0, z: 0 },
      ];
      
      const cvs = document.createElement('canvas'); cvs.width = 100; cvs.height = 100;
      const ctx = cvs.getContext('2d')!;
      let currentIdx = 0;
      const ptsPerLabel = Math.floor(N / nodes.length);
      nodes.forEach((node) => {
        const textPts = this.getPointsForText(node.val.toString(), 0.5, cvs, ctx);
        for (let i = 0; i < ptsPerLabel; i++) {
          const tPt = textPts[i % textPts.length];
          pos[currentIdx * 3] = node.x + tPt.x;
          pos[currentIdx * 3 + 1] = node.y + tPt.y;
          pos[currentIdx * 3 + 2] = node.z;
          hlt[currentIdx] = 1.0;
          currentIdx++;
        }
      });
      return { pos, hlt };
    };

    const getLinkedList = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const numCells = 6;
      const spacing = 1.4;
      const values = [40, 39, 86, 48, 21, 10];
      const cvs = document.createElement('canvas'); cvs.width = 400; cvs.height = 500;
      const ctx = cvs.getContext('2d')!;
      
      let currentIdx = 0;
      const ptsPerCell = Math.floor(N / numCells);
      for(let c=0; c<numCells; c++) {
        const points = this.getPointsForText(values[c].toString(), 0.6, cvs, ctx);
        const cellXOffset = (c - (numCells - 1) / 2) * spacing;
        for(let j=0; j<ptsPerCell; j++) {
            const p = points[j % points.length];
            pos[currentIdx * 3] = p.x + cellXOffset; pos[currentIdx * 3 + 1] = p.y; pos[currentIdx * 3 + 2] = 0;
            hlt[currentIdx] = 1.0;
            currentIdx++;
        }
      }
      return { pos, hlt };
    };

    const getBlob = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      }
      return pos;
    };

    const getQueue = () => {
      const pos = new Float32Array(N * 3);
      const hlt = new Float32Array(N);
      const values = [10, 12, 15, 20, 16, 20, 25];
      
      let currentIdx = 0;
      const ptsPerLabel = Math.floor(N / (values.length + 2)); // +2 for FRONT/REAR
      
      const labels = ['FRONT', ...values.map(v => v.toString()), 'REAR'];
      const xPositions = [
        -((values.length - 1) / 2 + 1.2) * 1.1,
        ...values.map((_, i) => (i - (values.length - 1) / 2) * 1.1),
        ((values.length - 1) / 2 + 1.2) * 1.1
      ];

      labels.forEach((label, idx) => {
        const textPts = this.getPointsForText(label, idx === 0 || idx === labels.length - 1 ? 0.3 : 0.5, cvs, ctx);
        const xOff = xPositions[idx];
        for (let j = 0; j < ptsPerLabel; j++) {
          const tPt = textPts[j % textPts.length];
          pos[currentIdx * 3] = xOff + tPt.x;
          pos[currentIdx * 3 + 1] = tPt.y;
          pos[currentIdx * 3 + 2] = 0;
          hlt[currentIdx] = 1.0;
          currentIdx++;
        }
      });

      while (currentIdx < N) {
        pos[currentIdx * 3] = 0; pos[currentIdx * 3 + 1] = 0; pos[currentIdx * 3 + 2] = 0;
        currentIdx++;
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
      
      let currentIdx = 0;
      const ptsPerBucket = Math.floor(N / numBuckets);
      
      for (let b = 0; b < numBuckets; b++) {
        const baseX = (b - (numBuckets - 1) / 2) * spacing;
        
        // Key-Value Labels
        const chainTexts = chains[b].map(v => `${b}:${v}`).join('\n');
        const textPts = this.getPointsForText(`${b}\n---\n${chainTexts}`, 0.35, cvs, ctx);
        
        for (let j = 0; j < ptsPerBucket; j++) {
          const tPt = textPts[j % textPts.length];
          pos[currentIdx * 3] = baseX + tPt.x;
          pos[currentIdx * 3 + 1] = tPt.y;
          pos[currentIdx * 3 + 2] = 0;
          hlt[currentIdx] = 1.0;
          currentIdx++;
        }
      }
      
      while (currentIdx < N) {
        pos[currentIdx * 3] = 0; pos[currentIdx * 3 + 1] = 0; pos[currentIdx * 3 + 2] = 0;
        currentIdx++;
      }
      return { pos, hlt };
    };

    const getInteractiveArray = () => {
      const res = getArray();
      const cellIdxs = new Float32Array(N);
      const size = 1.2;
      const numCells = 4;
      for (let i = 0; i < N; i++) {
        // Calculate cell index based on x position for highlighting
        const px = res.pos[i * 3];
        const c = Math.floor((px / size) + (numCells / 2));
        cellIdxs[i] = Math.max(0, Math.min(numCells - 1, c));
      }
      return { ...res, cellIdxs };
    };

    const s0 = getSphere();
    const s1 = getArray();
    const s2 = getStack();
    const s3 = getTree();
    const s4 = getLinkedList();
    const s5 = getQueue();
    const s6 = getHash();
    const s7 = getInteractiveArray();
    const s8 = getStack(); // Interactive Stack (Duplicate of s2)

    const emptyHlt = new Float32Array(this.N);
    const emptyCells = new Float32Array(this.N).fill(-1);

    this.shapes = [s0, s1.pos, s2.pos, s3.pos, s4.pos, s5.pos, s6.pos, s7.pos, s8.pos];
    this.highlights = [emptyHlt, s1.hlt, s2.hlt, s3.hlt, s4.hlt, s5.hlt, s6.hlt, s7.hlt, s8.hlt];
    
    // Store cell indices for the interactive array (shape 7) and stack (shape 8)
    (this as any).cellData = [emptyCells, emptyCells, s2.idx, emptyCells, emptyCells, emptyCells, emptyCells, s7.cellIdxs, s8.idx];

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
    this.geo.setAttribute('aCellIndex', new THREE.BufferAttribute(new Float32Array(this.N), 1));

    const vertexShader = `
      attribute float size;
      attribute float aRnd;
      attribute float aHighlight;
      attribute float aCellIndex;
      varying float vOp;
      varying float vHighlight;
      varying float vCellIdx;
      uniform float uTime;
      uniform float uActiveCell1;
      uniform float uActiveCell2;
      uniform float uActiveCellScale;
      uniform float uGlobalOpacity;
      void main() {
        vOp = 1.0; // Remove shimmer, make solid
        vHighlight = aHighlight;
        vCellIdx = aCellIndex;
        
        vec3 pos = position;
        // Scale effect for the active cells (e.g. during Push/Pop or Two Sum)
        bool isActive = (uActiveCell1 >= 0.0 && abs(vCellIdx - uActiveCell1) < 0.1) || 
                        (uActiveCell2 >= 0.0 && abs(vCellIdx - uActiveCell2) < 0.1);
        if (isActive) {
          float cellY = (3.0 - vCellIdx) * 0.75; // Centered for 7 cells
          pos.y -= cellY;
          pos *= uActiveCellScale;
          pos.y += cellY;
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (32.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform vec3 uColor;
      uniform vec3 uGlow;
      uniform vec3 uHighlightColor;
      uniform float uBlast;
      uniform float uActiveCell1;
      uniform float uActiveCell2;
      uniform float uActiveCellOpacity;
      uniform float uGlobalOpacity;
      varying float vOp;
      varying float vHighlight;
      varying float vCellIdx;
      void main() {
        vec2 pt = gl_PointCoord - vec2(0.5);
        float d = length(pt);
        if (d > 0.5) discard;
        
        // Sharper core, no glow
        float core = smoothstep(0.5, 0.45, d); 
        
        vec3 highlightCol = uHighlightColor;
        
        // Interactive cell highlight logic
        bool isActive = (uActiveCell1 >= 0.0 && abs(vCellIdx - uActiveCell1) < 0.1) || 
                        (uActiveCell2 >= 0.0 && abs(vCellIdx - uActiveCell2) < 0.1);
        float isCellActive = isActive ? 1.0 : 0.0;
        
        vec3 baseCol = mix(uGlow, uColor, core);
        vec3 col = mix(baseCol, highlightCol, max(vHighlight, isCellActive));
        
        float blastFade = mix(1.0, 0.35, uBlast);
        float cellFade = isActive ? uActiveCellOpacity : 1.0;
        float alpha = core * vOp * blastFade * cellFade * uGlobalOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `;

    this.mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) },
        uGlow: { value: new THREE.Color(0x06B6D4) },
        uHighlightColor: { value: new THREE.Color(0xFACC15) },
        uBlast: { value: 0 },
        uActiveCell1: { value: -1.0 },
        uActiveCell2: { value: -1.0 },
        uActiveCellOpacity: { value: 1.0 },
        uActiveCellScale: { value: 1.0 },
        uGlobalOpacity: { value: 0.0 }
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
    this.mat.uniforms['uActiveCell1'].value = this.interactiveCells[0] !== undefined ? this.interactiveCells[0] : -1;
    this.mat.uniforms['uActiveCell2'].value = this.interactiveCells[1] !== undefined ? this.interactiveCells[1] : -1;
    this.mat.uniforms['uHighlightColor'].value = this.activeHighlightColor;
    this.mat.uniforms['uActiveCellOpacity'].value = this.activeCellOpacity;
    this.mat.uniforms['uActiveCellScale'].value = this.activeCellScale;
    
    // Global opacity: 0 at the very top (Hero), fades in as we scroll to services/data structures
    const globalOpacity = Math.min(1.0, Math.max(0.0, (this.morphSmooth - 0.05) * 4.0));
    this.mat.uniforms['uGlobalOpacity'].value = globalOpacity;

    // 1. Y-axis auto rotation - DISABLED (Static scene)
    this.frameRotation = 0;

    // 2. Smooth the scroll-driven extra rotation offset
    this.scrollRotationOffsetSmooth = this.lerp(
      this.scrollRotationOffsetSmooth,
      this.scrollRotationOffsetTarget,
      0.05
    );

    this.pts.rotation.y = this.frameRotation + this.scrollRotationOffsetSmooth;
    // Restore 3D tilt for the 'premium' image look
    const baseTiltX = 0.15;
    const baseTiltY = 0.2;
    
    this.arrayGroup.rotation.x = baseTiltX; 
    this.arrayGroup.rotation.y = baseTiltY; 
    this.stackGroup.rotation.x = baseTiltX;
    this.stackGroup.rotation.y = baseTiltY;
    this.treeGroup.rotation.x = baseTiltX;
    this.treeGroup.rotation.y = baseTiltY;
    this.linkedListGroup.rotation.x = baseTiltX;
    this.linkedListGroup.rotation.y = baseTiltY;
    this.queueGroup.rotation.x = baseTiltX;
    this.queueGroup.rotation.y = baseTiltY;

    // Visibility Logic - Ensure both are visible during the transition to prevent "jumping"
    const isArraySection = (this.morphSmooth > 0.5 && this.morphSmooth < 1.8) || (this.morphSmooth > 6.5 && this.morphSmooth < 7.8);
    const isStackSection = (this.morphSmooth > 1.2 && this.morphSmooth < 2.8) || (this.morphSmooth > 7.2);
    const isTreeSection = (this.morphSmooth > 2.2 && this.morphSmooth < 3.8);
    
    this.arrayGroup.visible = isArraySection;
    this.stackGroup.visible = isStackSection;
    this.treeGroup.visible = isTreeSection;
    const isLinkedListSection = (this.morphSmooth > 3.2 && this.morphSmooth < 4.8);
    this.linkedListGroup.visible = isLinkedListSection;
    const isQueueSection = (this.morphSmooth > 4.2 && this.morphSmooth < 5.8);
    this.queueGroup.visible = isQueueSection;
    
    // Fade Logic
    let arrayOpacity = 0;
    let stackOpacity = 0;
    let treeOpacity = 0;
    let llOpacity = 0;
    let qOpacity = 0;

    // NEW: Continuous visibility logic for Array and Stack
    if (this.morphSmooth >= 0.5 && this.morphSmooth <= 1.2) {
      // Array is solid and fully visible
      arrayOpacity = 1.0;
      stackOpacity = 0;
      this.resetSolidPositions();
    } else if (this.morphSmooth > 1.2 && this.morphSmooth < 1.8) {
      // TRANSITION: Array morphs into Stack (No fade out, just morph)
      const transitionLam = (this.morphSmooth - 1.2) / 0.6;
      arrayOpacity = 1.0 - transitionLam;
      stackOpacity = transitionLam;
      this.morphArrayToStack(transitionLam);
    } else if (this.morphSmooth >= 1.8 && this.morphSmooth <= 2.2) {
      // Stack is solid and fully visible
      arrayOpacity = 0;
      stackOpacity = 1.0;
      this.morphArrayToStack(1.0);
    } else if (this.morphSmooth > 2.2 && this.morphSmooth < 2.8) {
      // TRANSITION: Stack morphs into Tree
      const transitionLam = (this.morphSmooth - 2.2) / 0.6;
      stackOpacity = 1.0 - transitionLam;
      treeOpacity = transitionLam;
      this.morphStackToTree(transitionLam);
    } else if (this.morphSmooth >= 2.8 && this.morphSmooth <= 3.2) {
      // Tree is solid and fully visible
      stackOpacity = 0;
      treeOpacity = 1.0;
      this.morphStackToTree(1.0);
    } else if (this.morphSmooth > 3.2 && this.morphSmooth < 3.8) {
      // TRANSITION: Tree morphs into Linked List
      const transitionLam = (this.morphSmooth - 3.2) / 0.6;
      treeOpacity = 1.0 - transitionLam;
      llOpacity = transitionLam;
      this.morphTreeToLinkedList(transitionLam);
    } else if (this.morphSmooth >= 3.8 && this.morphSmooth <= 4.2) {
      // Linked List is solid and fully visible
      treeOpacity = 0;
      llOpacity = 1.0;
      this.morphTreeToLinkedList(1.0);
    } else if (this.morphSmooth > 4.2 && this.morphSmooth < 4.8) {
      // TRANSITION: Linked List morphs into Queue
      const transitionLam = (this.morphSmooth - 4.2) / 0.6;
      this.morphLinkedListToQueue(transitionLam);
      llOpacity = 1.0 - transitionLam;
      qOpacity = transitionLam;
    } else if (this.morphSmooth >= 4.8 && this.morphSmooth <= 5.2) {
      // Queue is solid and fully visible
      this.morphLinkedListToQueue(1.0);
      qOpacity = 1.0;
    }
 else if (this.morphSmooth >= 6.5 && this.morphSmooth <= 7.2) {
      // Interactive Array (Fully visible)
      arrayOpacity = 1.0;
      stackOpacity = 0;
      this.resetSolidPositions();
    } else if (this.morphSmooth > 7.2 && this.morphSmooth < 7.8) {
      // Interactive Transition (7 -> 8)
      const transitionLam = (this.morphSmooth - 7.2) / 0.6;
      arrayOpacity = 1.0 - transitionLam;
      stackOpacity = transitionLam;
      this.morphArrayToStack(transitionLam);
    } else if (this.morphSmooth >= 7.8) {
      // Interactive Stack (Fully visible)
      arrayOpacity = 0;
      stackOpacity = 1.0;
      this.morphArrayToStack(1.0);
    }
    
    arrayOpacity = Math.max(0, Math.min(1, arrayOpacity));
    stackOpacity = Math.max(0, Math.min(1, stackOpacity));
    
    this.arrayGroup.children.forEach((child: any) => {
      if (child.material) (child.material as any).opacity = arrayOpacity * globalOpacity;
    });
    this.stackGroup.children.forEach((child: any) => {
      if (child.material) (child.material as any).opacity = stackOpacity * globalOpacity;
    });
    this.treeGroup.children.forEach((child: any) => {
      if (child.material) (child.material as any).opacity = treeOpacity * globalOpacity;
    });
    this.linkedListGroup.children.forEach((child: any) => {
      if (child.material) (child.material as any).opacity = llOpacity * globalOpacity;
    });
    this.queueGroup.children.forEach((child: any) => {
      if (child.material) (child.material as any).opacity = qOpacity * globalOpacity;
    });

    // Handle Tree Edge (Line) Opacity
    this.treeEdges.forEach(line => {
      if (line.material) (line.material as THREE.LineBasicMaterial).opacity = treeOpacity * globalOpacity * 0.8;
    });

    // Aggressively hide particles when in solid Array, Stack or Tree sections
    const nearArray1 = Math.abs(this.morphSmooth - 1.0) < 0.5;
    const nearStack2 = Math.abs(this.morphSmooth - 2.0) < 0.5;
    const nearTree3 = Math.abs(this.morphSmooth - 3.0) < 0.5;
    const nearLL4 = Math.abs(this.morphSmooth - 4.0) < 0.5;
    const nearQueue5 = Math.abs(this.morphSmooth - 5.0) < 0.5;
    const nearArray7 = this.morphSmooth > 6.5;
    if (nearArray1 || nearStack2 || nearTree3 || nearLL4 || nearQueue5 || nearArray7) {
        this.mat.uniforms['uGlobalOpacity'].value = 0.0;
    } else {
        this.mat.uniforms['uGlobalOpacity'].value = globalOpacity;
    }

    // 3. Horizontal position
    this.ptsPosSmooth = this.lerp(this.ptsPosSmooth, this.ptsPosTarget, 0.05);

    // 4. Mouse parallax & Position
    const mx = this.enableMouseParallax ? this.mouse.x * 0.5 : 0;
    const my = this.enableMouseParallax ? -this.mouse.y * 0.3 : 0;

    this.pts.position.x = this.ptsPosSmooth + mx;
    this.arrayGroup.position.x = this.ptsPosSmooth + mx;
    this.stackGroup.position.x = this.ptsPosSmooth + mx;
    this.treeGroup.position.x = this.ptsPosSmooth + mx;
    this.linkedListGroup.position.x = this.ptsPosSmooth + mx;
    this.queueGroup.position.x = this.ptsPosSmooth + mx;

    this.posYSmooth = this.lerp(this.posYSmooth, this.posYTarget, 0.08);
    this.pts.position.y = this.posYSmooth + my;
    this.arrayGroup.position.y = this.posYSmooth + my;
    this.stackGroup.position.y = this.posYSmooth + my;
    this.treeGroup.position.y = this.posYSmooth + my;
    this.linkedListGroup.position.y = this.posYSmooth + my;
    this.queueGroup.position.y = this.posYSmooth + my;

    // 6. Scroll-driven scale
    this.scaleSmooth = this.lerp(this.scaleSmooth, this.scaleTarget, 0.08);
    const finalScale = this.scaleSmooth;
    this.pts.scale.set(finalScale, finalScale, finalScale);
    
    // Solid versions scale - Increased for the thick block look
    const solidScale = finalScale * 0.85; 
    this.arrayGroup.scale.set(solidScale, solidScale, solidScale);
    this.stackGroup.scale.set(solidScale, solidScale, solidScale);
    this.treeGroup.scale.set(solidScale, solidScale, solidScale);
    this.linkedListGroup.scale.set(solidScale, solidScale, solidScale);
    this.queueGroup.scale.set(solidScale, solidScale, solidScale);

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
    // Single fast lerp â€” increased factor from 0.06 to 0.1 for snappier transitions
    this.morphSmooth = this.lerp(this.morphSmooth, activeTarget, 0.1);

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

      // Vortex Repulsion DISABLED

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

      // Update Cell Indices (for interactive shape 7)
      const c1 = (this as any).cellData[bi][i];
      const c2 = (this as any).cellData[ni][i];
      const targetC = this.lerp(c1, c2, lam);
      const cellIndices = this.geo.attributes['aCellIndex'].array as Float32Array;
      cellIndices[i] = targetC;
    }

    this.geo.attributes['position'].needsUpdate = true;
    this.geo.attributes['aHighlight'].needsUpdate = true;
    this.geo.attributes['aCellIndex'].needsUpdate = true;
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}


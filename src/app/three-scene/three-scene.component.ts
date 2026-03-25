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

  private N = 6000;
  private pts!: THREE.Points;
  private mat!: THREE.ShaderMaterial;
  private geo!: THREE.BufferGeometry;

  private shapes: Float32Array[] = [];
  private blastDir!: Float32Array;

  // STATE
  private morphTarget = 0;
  private morphSmooth = 0;
  private ptsPosTarget = 2.8;
  private ptsPosSmooth = 2.8;
  public blastProgress = 0; // Managed externally or via global scroll sync
  private blastSmooth = 0;
  private mouse = new THREE.Vector2(-10, -10);

  public scrollShapeTarget = 0;
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

    // 2. Cube
    const getCube = () => {
      const pos = new Float32Array(N * 3);
      const size = 4;
      for (let i = 0; i < N; i++) {
        const face = Math.floor(Math.random() * 6);
        let x = (Math.random() - 0.5) * size;
        let y = (Math.random() - 0.5) * size;
        let z = size / 2 + (Math.random() - 0.5) * 0.36;
        let px = x, py = y, pz = z;
        if (face === 1) pz = -z;
        else if (face === 2) { px = z; pz = x; }
        else if (face === 3) { px = -z; pz = x; }
        else if (face === 4) { py = z; pz = y; }
        else if (face === 5) { py = -z; pz = y; }
        pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
      }
      return pos;
    };

    // 3. Code Text
    const getCodeText = () => {
      const pos = new Float32Array(N * 3);
      const cvs = document.createElement('canvas');
      cvs.width = 400; cvs.height = 400;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 200px "Courier New"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('</>', 200, 200);
      const imgData = ctx.getImageData(0, 0, 400, 400).data;
      const lit = [];
      for (let y = 0; y < 400; y += 2) {
        for (let x = 0; x < 400; x += 2) {
          if (imgData[(y * 400 + x) * 4] > 128) lit.push({ x: x - 200, y: -(y - 200) });
        }
      }
      for (let i = 0; i < N; i++) {
        const p = lit[i % lit.length];
        pos[i * 3] = (p.x + (Math.random() - 0.5) * 2) * 0.015;
        pos[i * 3 + 1] = (p.y + (Math.random() - 0.5) * 2) * 0.015;
        pos[i * 3 + 2] = ((Math.random() - 0.5) * 4) * 0.015;
      }
      return pos;
    };

    // 4. DNA
    const getDna = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        let type = Math.random();
        let y = (Math.random() - 0.5) * 7.5;
        let angle = y * 2.0;
        let r = 1.15;
        let x = 0, z = 0;
        if (type < 0.4) {
          x = Math.sin(angle) * r; z = Math.cos(angle) * r;
        } else if (type < 0.8) {
          x = Math.sin(angle + Math.PI) * r; z = Math.cos(angle + Math.PI) * r;
        } else {
          let stepY = Math.round(y * 1.5) / 1.5;
          let stepAngle = stepY * 2.0;
          let lerp = Math.random();
          let x1 = Math.sin(stepAngle) * r, z1 = Math.cos(stepAngle) * r;
          let x2 = Math.sin(stepAngle + Math.PI) * r, z2 = Math.cos(stepAngle + Math.PI) * r;
          x = x1 + (x2 - x1) * lerp; z = z1 + (z2 - z1) * lerp;
          y = stepY;
          x += (Math.random() - 0.5) * 0.1; y += (Math.random() - 0.5) * 0.1; z += (Math.random() - 0.5) * 0.1;
        }
        if (type < 0.8) {
          x += (Math.random() - 0.5) * 0.15; y += (Math.random() - 0.5) * 0.15; z += (Math.random() - 0.5) * 0.15;
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      }
      return pos;
    };

    // 5. Sparkle
    const getSparkle = () => {
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const c = Math.random();
        let bs = 2.0, ox = 0, oy = 0, oz = 0;
        if (c > 0.6) { bs = 0.8; ox = 1.8; oy = 1.2; oz = -0.5; }
        else if (c > 0.8) { bs = 0.5; ox = -1.5; oy = -1.5; oz = 0.8; }
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const cu = Math.cos(u), su = Math.sin(u);
        const cv = Math.cos(v), sv = Math.sin(v);
        let x = Math.pow(Math.abs(cu), 3) * Math.sign(cu) * Math.pow(Math.abs(cv), 3) * Math.sign(cv);
        let y = Math.pow(Math.abs(su), 3) * Math.sign(su) * Math.pow(Math.abs(cv), 3) * Math.sign(cv);
        let z = Math.pow(Math.abs(sv), 3) * Math.sign(sv);
        let r = Math.random() * bs;
        pos[i * 3] = x * r + ox; pos[i * 3 + 1] = y * r + oy; pos[i * 3 + 2] = z * r + oz;
      }
      return pos;
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

    this.shapes = [getSphere(), getCube(), getCodeText(), getDna(), getSparkle(), getBlob(), getSphere()];

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

    const vertexShader = `
      attribute float size;
      attribute float aRnd;
      varying float vOp;
      uniform float uTime;
      void main() {
        vOp = 0.45 + 0.55 * sin(uTime * 1.8 + aRnd * 9.0);
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
      void main() {
        vec2 pt = gl_PointCoord - vec2(0.5);
        float d = length(pt);
        if (d > 0.5) discard;
        float core = exp(-d * 7.0);
        float glow = exp(-d * 3.0) * 0.5;
        vec3 col = mix(uGlow, uColor, core);
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
        uGlow: { value: new THREE.Color(0x7B5EFB) },
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

    this.ptsPosSmooth = this.lerp(this.ptsPosSmooth, this.ptsPosTarget, 0.05);
    this.pts.position.x = this.ptsPosSmooth;

    this.camera.position.x = this.mouse.x * 0.3;
    this.camera.position.y = -this.mouse.y * 0.3;
    this.camera.lookAt(0, 0, 0);

    const activeTarget = this.cardHovered !== -1 ? this.cardHovered : this.scrollShapeTarget;
    // Single fast lerp — ease3 is applied at the bi/lam step below
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
    }

    this.geo.attributes['position'].needsUpdate = true;
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}

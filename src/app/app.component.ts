import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomCursorComponent } from './custom-cursor/custom-cursor.component';
import { BackgroundCanvasComponent } from './background-canvas/background-canvas.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ThreeSceneComponent } from './three-scene/three-scene.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CustomCursorComponent, 
    BackgroundCanvasComponent,
    NavbarComponent,
    ThreeSceneComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'antimatter-ai-agency';
}

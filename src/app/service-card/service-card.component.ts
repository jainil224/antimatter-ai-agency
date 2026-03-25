import { Component, Input, HostListener, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeService } from '../three.service';
import { Subscription } from 'rxjs';

export interface ServiceData {
  num: string;
  title: string;
  desc: string;
  services: string[];
  tools: string[];
  shape: number;
  shadowInset: string;
  shadowOuter: string;
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ServiceCardComponent implements OnInit, OnDestroy {
  @Input() data!: ServiceData;
  @Input() index!: number;

  isActive = false;
  private sub!: Subscription;

  constructor(private threeService: ThreeService) {}

  ngOnInit() {
    this.sub = this.threeService.activeCardIndex$.subscribe(idx => {
      this.isActive = (this.index === idx);
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.threeService.setMorphTarget(this.data.shape);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.threeService.setMorphTarget(-1);
  }
}

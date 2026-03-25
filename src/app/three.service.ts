import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  private activeMorphTargetSubject = new BehaviorSubject<number>(-1);
  activeMorphTarget$ = this.activeMorphTargetSubject.asObservable();

  private activeCardIndexSubject = new BehaviorSubject<number>(-1);
  activeCardIndex$ = this.activeCardIndexSubject.asObservable();

  setMorphTarget(target: number) {
    this.activeMorphTargetSubject.next(target);
  }

  setActiveCardIndex(index: number) {
    this.activeCardIndexSubject.next(index);
  }
}

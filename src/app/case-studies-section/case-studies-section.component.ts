import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-case-studies-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-studies-section.component.html',
  styleUrl: './case-studies-section.component.scss'
})
export class CaseStudiesSectionComponent {
  cases = [
    { num: '01', name: 'Clinix AI', tags: ['Web Design', 'App Design', 'AI Development', 'GTM'] },
    { num: '02', name: 'Synergies4', tags: ['App Design', 'AI Development'] },
    { num: '03', name: 'Curshire', tags: ['Web Design', 'Development'] },
    { num: '04', name: 'OWASP Foundation', tags: ['Web Design', 'Development'] },
    { num: '05', name: 'Feature', tags: ['App Design', 'GTM'] }
  ];
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCardComponent, ServiceData } from '../service-card/service-card.component';

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services-section.component.html',
  styleUrl: './services-section.component.scss'
})
export class ServicesSectionComponent {
  services: ServiceData[] = [
    {
      num: '01',
      title: 'Product Design',
      desc: 'UI/UX Design, Wireframing & Prototyping, Brand Identity & Design Systems, User Research & Testing',
      services: ['UI/UX Design', 'Wireframing & Prototyping', 'Brand Identity', 'Design Systems', 'User Research', 'Testing'],
      tools: ['Figma', 'Framer', 'Maze', 'Notion'],
      shape: 1,
      shadowInset: 'inset 0 -140px 140px -70px rgba(6, 182, 212, 0.2)',
      shadowOuter: '0 0 40px rgba(6, 182, 212, 0.15)'
    },
    {
      num: '02',
      title: 'Development',
      desc: 'Frontend (React/Next.js), Backend & API Engineering, Cloud Infrastructure & DevOps, Mobile Apps (iOS/Android)',
      services: ['Frontend (React/Next.js)', 'Backend & API Engineering', 'Cloud Infrastructure & DevOps', 'Mobile Apps (iOS/Android)'],
      tools: ['React', 'Node', 'AWS', 'Docker', 'Vercel'],
      shape: 2,
      shadowInset: 'inset 0 -140px 140px -70px rgba(56, 189, 248, 0.2)',
      shadowOuter: '0 0 40px rgba(56, 189, 248, 0.15)'
    },
    {
      num: '03',
      title: 'GTM Strategy',
      desc: 'ICP & Segmentation, Positioning Narrative & Messaging, Pricing & Packaging, Demand Gen & Content Engine',
      services: ['ICP & Segmentation', 'Positioning Narrative & Messaging', 'Pricing & Packaging', 'Demand Gen & Content Engine'],
      tools: ['HubSpot', 'Apollo', 'GA4', 'Mixpanel'],
      shape: 3,
      shadowInset: 'inset 0 -140px 140px -70px rgba(22, 200, 160, 0.2)',
      shadowOuter: '0 0 40px rgba(22, 200, 160, 0.15)'
    },
    {
      num: '04',
      title: 'Healthcare Apps',
      desc: 'Patient Portal & Telehealth, EHR/HL7/FHIR Integration, HIPAA Compliance Engineering, Clinical Workflow Automation',
      services: ['Patient Portal & Telehealth', 'EHR/HL7/FHIR Integration', 'HIPAA Compliance Engineering', 'Clinical Workflow Automation'],
      tools: ['Epic', 'HL7 FHIR', 'AWS HIPAA', 'Twilio'],
      shape: 4,
      shadowInset: 'inset 0 -140px 140px -70px rgba(250, 100, 80, 0.2)',
      shadowOuter: '0 0 40px rgba(250, 100, 80, 0.15)'
    },
    {
      num: '05',
      title: 'Queue',
      desc: 'First-In-First-Out (FIFO) Data Structure, Enqueue & Dequeue Operations, Linear Data Management, Sequential Processing',
      services: ['FIFO Structure', 'Enqueue Operation', 'Dequeue Operation', 'Peek & Search', 'Circular Queue', 'Priority Queue'],
      tools: ['Arrays', 'Linked Lists', 'Heaps', 'Processing'],
      shape: 5,
      shadowInset: 'inset 0 -140px 140px -70px rgba(255, 180, 0, 0.2)',
      shadowOuter: '0 0 40px rgba(255, 180, 0, 0.15)'
    },
    {
      num: '06',
      title: 'IoT Development',
      desc: 'Embedded Firmware & Hardware, Real-time Data Streaming, Edge Computing & MQTT, IoT Security & OTA Updates',
      services: ['Embedded Firmware & Hardware', 'Real-time Data Streaming', 'Edge Computing & MQTT', 'IoT Security & OTA Updates'],
      tools: ['Arduino', 'MQTT', 'AWS IoT', 'Raspberry Pi'],
      shape: 6,
      shadowInset: 'inset 0 -140px 140px -70px rgba(0, 210, 255, 0.2)',
      shadowOuter: '0 0 40px rgba(0, 210, 255, 0.15)'
    }
  ];
}

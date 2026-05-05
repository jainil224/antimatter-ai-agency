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
      title: 'Array',
      desc: 'Linear Data Structure, Contiguous Memory Allocation, Index-based Access, Sequential Storage',
      services: ['Constant-time Access O(1)', 'Search & Insertion', 'Sorting Algorithms', 'Dynamic Array Logic', 'Buffer Management'],
      tools: ['Static Arrays', 'Vectors', 'Buffers'],
      shape: 1,
      shadowInset: 'inset 0 -140px 140px -70px rgba(6, 182, 212, 0.2)',
      shadowOuter: '0 0 40px rgba(6, 182, 212, 0.15)'
    },
    {
      num: '02',
      title: 'Stack',
      desc: 'Last-In-First-Out (LIFO) Structure, Push & Pop Operations, Expression Parsing, Recursion Management',
      services: ['LIFO Operations', 'Expression Parsing', 'Undo/Redo Logic', 'Function Call Stacks', 'Memory Management'],
      tools: ['Stack Buffers', 'Call Stack', 'Push/Pop'],
      shape: 2,
      shadowInset: 'inset 0 -140px 140px -70px rgba(56, 189, 248, 0.2)',
      shadowOuter: '0 0 40px rgba(56, 189, 248, 0.15)'
    },
    {
      num: '03',
      title: 'Binary Tree',
      desc: 'Hierarchical Data Structure, Parent-Child Relationships, Recursive Traversals, Decision Trees',
      services: ['BFS & DFS Traversal', 'Tree Balancing (AVL/Red-Black)', 'Search & Insertion', 'Hierarchical Mapping', 'Heaps'],
      tools: ['BST', 'Min/Max Heaps', 'Decision Trees'],
      shape: 3,
      shadowInset: 'inset 0 -140px 140px -70px rgba(22, 200, 160, 0.2)',
      shadowOuter: '0 0 40px rgba(22, 200, 160, 0.15)'
    },
    {
      num: '04',
      title: 'Linked List',
      desc: 'Linear Sequential Collection, Pointer-based Nodes, Dynamic Memory Allocation, Singly & Doubly Linked',
      services: ['Dynamic Insertion/Deletion', 'Node Management', 'Memory Pointers', 'Sequential Access', 'Circular Lists'],
      tools: ['Singly Linked', 'Doubly Linked', 'Circular Lists'],
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
    }
  ];
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ReviewerOption {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-reviewer-typeahead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviewer-typeahead.html',
  styleUrl: './reviewer-typeahead.css',
})
export class ReviewerTypeahead {
  @Input() options: ReviewerOption[] = [];
  @Input() selected: ReviewerOption[] = [];
  @Output() selectedChange = new EventEmitter<ReviewerOption[]>();

  query = '';
  isOpen = false;

  get filteredOptions(): ReviewerOption[] {
    const selectedIds = new Set(this.selected.map((reviewer) => reviewer.id));
    const search = this.query.trim().toLowerCase();

    return this.options.filter((reviewer) => {
      if (selectedIds.has(reviewer.id)) return false;
      if (!search) return true;
      return (
        reviewer.name.toLowerCase().includes(search) ||
        reviewer.email.toLowerCase().includes(search) ||
        (reviewer.role ?? '').toLowerCase().includes(search)
      );
    });
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  addReviewer(reviewer: ReviewerOption): void {
    this.selectedChange.emit([...this.selected, reviewer]);
    this.query = '';
    this.isOpen = true;
  }

  removeReviewer(id: string): void {
    this.selectedChange.emit(this.selected.filter((reviewer) => reviewer.id !== id));
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
}

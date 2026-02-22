import { Component, EventEmitter, Input, Output } from '@angular/core';

export type FilterDropdownName = 'status' | 'category' | 'priority' | 'evergreen' | 'sort';
export type FilterOption = { value: string; label: string };

@Component({
  selector: 'app-post-list-filters',
  standalone: true,
  templateUrl: './post-list-filters.html',
  styleUrl: './post-list-filters.css',
})
export class PostListFilters {
  @Input() searchQuery = '';
  @Input() statusFilter = 'all';
  @Input() categoryFilter = 'all';
  @Input() priorityFilter = 'all';
  @Input() evergreenFilter = 'all';
  @Input() sortBy = 'newest';

  @Input() statusOptions: FilterOption[] = [];
  @Input() categoryOptions: FilterOption[] = [];
  @Input() priorityOptions: FilterOption[] = [];
  @Input() evergreenOptions: FilterOption[] = [];
  @Input() sortOptions: FilterOption[] = [];

  @Output() searchChanged = new EventEmitter<string>();
  @Output() statusChanged = new EventEmitter<string>();
  @Output() categoryChanged = new EventEmitter<string>();
  @Output() priorityChanged = new EventEmitter<string>();
  @Output() evergreenChanged = new EventEmitter<string>();
  @Output() sortChanged = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  openDropdown: FilterDropdownName | null = null;

  toggleDropdown(name: FilterDropdownName): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  closeDropdowns(): void {
    this.openDropdown = null;
  }

  selectStatus(value: string): void {
    this.closeDropdowns();
    this.statusChanged.emit(value);
  }

  selectCategory(value: string): void {
    this.closeDropdowns();
    this.categoryChanged.emit(value);
  }

  selectPriority(value: string): void {
    this.closeDropdowns();
    this.priorityChanged.emit(value);
  }

  selectEvergreen(value: string): void {
    this.closeDropdowns();
    this.evergreenChanged.emit(value);
  }

  selectSort(value: string): void {
    this.closeDropdowns();
    this.sortChanged.emit(value);
  }

  onSearchInput(value: string): void {
    this.searchChanged.emit(value);
  }

  getOptionLabel(options: FilterOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';
  }
}

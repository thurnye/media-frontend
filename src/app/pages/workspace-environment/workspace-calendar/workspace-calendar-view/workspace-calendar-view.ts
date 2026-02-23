import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarEvent = {
  postId: string;
  title: string;
  platform?: string;
  type: 'scheduled' | 'published' | 'other';
  status: string;
  at: Date;
};

@Component({
  selector: 'app-workspace-calendar-view',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workspace-calendar-view.html',
  styleUrl: './workspace-calendar-view.css',
})
export class WorkspaceCalendarView {
  @Input({ required: true }) monthLabel!: string;
  @Input({ required: true }) weekdayLabels!: string[];
  @Input({ required: true }) calendarDays!: CalendarDay[];
  @Input({ required: true }) selectedDate!: Date;
  @Input({ required: true }) selectedDateEvents!: CalendarEvent[];
  @Input({ required: true }) eventsByDay!: Record<string, CalendarEvent[]>;
  @Input({ required: true }) loadingEvents!: boolean;
  @Input({ required: true }) totalEvents!: number;
  @Input({ required: true }) workspaceId!: string;

  @Output() previousMonth = new EventEmitter<void>();
  @Output() nextMonth = new EventEmitter<void>();
  @Output() selectDate = new EventEmitter<Date>();

  onPreviousMonth(): void {
    this.previousMonth.emit();
  }

  onNextMonth(): void {
    this.nextMonth.emit();
  }

  onSelectDate(date: Date): void {
    this.selectDate.emit(date);
  }

  isSelected(date: Date): boolean {
    return (
      this.selectedDate.getFullYear() === date.getFullYear() &&
      this.selectedDate.getMonth() === date.getMonth() &&
      this.selectedDate.getDate() === date.getDate()
    );
  }

  eventCountForDate(date: Date): number {
    return (this.eventsByDay[this.getDayKey(date)] ?? []).length;
  }

  hasScheduledEvent(date: Date): boolean {
    return (this.eventsByDay[this.getDayKey(date)] ?? []).some((event) => event.type === 'scheduled');
  }

  hasPublishedEvent(date: Date): boolean {
    return (this.eventsByDay[this.getDayKey(date)] ?? []).some((event) => event.type === 'published');
  }

  hasOtherEvent(date: Date): boolean {
    return (this.eventsByDay[this.getDayKey(date)] ?? []).some((event) => event.type === 'other');
  }

  trackEvent(_: number, event: CalendarEvent): string {
    return `${event.postId}:${event.type}:${event.at.toISOString()}:${event.platform ?? 'none'}`;
  }

  trackCalendarDay(_: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  formatEventDate(date: Date): string {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getEventTypeLabel(event: CalendarEvent): string {
    const value = event.type === 'other' ? event.status : event.type;
    return value.replace(/_/g, ' ');
  }

  private getDayKey(date: Date): string {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const y = day.getFullYear();
    const m = `${day.getMonth() + 1}`.padStart(2, '0');
    const d = `${day.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}


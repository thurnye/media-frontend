import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { IPlatformPost } from '../../../core/interfaces/platform';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';

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
  selector: 'app-workspace-calendar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workspace-calendar.html',
  styleUrl: './workspace-calendar.css',
})
export class WorkspaceCalendar implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private platformGql = inject(PlatformGqlService);
  private destroy$ = new Subject<void>();

  private readonly today = this.startOfDay(new Date());
  currentMonth = signal(this.startOfMonth(this.today));
  selectedDate = signal(this.today);
  loadingEvents = signal(false);
  workspaceId = signal('');
  private eventsByDay = signal<Record<string, CalendarEvent[]>>({});

  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthLabel = computed(() =>
    this.currentMonth().toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const monthStart = this.currentMonth();
    const firstWeekday = monthStart.getDay();
    const daysInMonth = this.getDaysInMonth(monthStart.getFullYear(), monthStart.getMonth());
    const prevMonthStart = this.startOfMonth(
      new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1),
    );
    const prevMonthDays = this.getDaysInMonth(
      prevMonthStart.getFullYear(),
      prevMonthStart.getMonth(),
    );

    const days: CalendarDay[] = [];

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      const date = this.startOfDay(
        new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), prevMonthDays - i),
      );
      days.push({
        date,
        inCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = this.startOfDay(
        new Date(monthStart.getFullYear(), monthStart.getMonth(), day),
      );
      days.push({
        date,
        inCurrentMonth: true,
        isToday: this.isSameDay(date, this.today),
      });
    }

    while (days.length < 42) {
      const nextDayNumber = days.length - (firstWeekday + daysInMonth) + 1;
      const date = this.startOfDay(
        new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, nextDayNumber),
      );
      days.push({
        date,
        inCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
      });
    }

    return days;
  });

  selectedDateEvents = computed<CalendarEvent[]>(() => {
    const events = this.eventsByDay()[this.getDayKey(this.selectedDate())] ?? [];
    return [...events].sort((a, b) => +a.at - +b.at);
  });

  totalEvents = computed<number>(() =>
    Object.values(this.eventsByDay()).reduce((total, events) => total + events.length, 0),
  );

  ngOnInit(): void {
    const workspaceId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    this.workspaceId.set(workspaceId);
    this.loadEventsForDate(this.selectedDate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  previousMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(this.startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)));
  }

  nextMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(this.startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)));
  }

  selectDate(date: Date): void {
    const normalizedDate = this.startOfDay(date);
    this.selectedDate.set(normalizedDate);
    if (
      date.getFullYear() !== this.currentMonth().getFullYear() ||
      date.getMonth() !== this.currentMonth().getMonth()
    ) {
      this.currentMonth.set(this.startOfMonth(date));
    }
    this.loadEventsForDate(normalizedDate);
  }

  isSelected(date: Date): boolean {
    return this.isSameDay(this.selectedDate(), date);
  }

  eventCountForDate(date: Date): number {
    return (this.eventsByDay()[this.getDayKey(date)] ?? []).length;
  }

  hasScheduledEvent(date: Date): boolean {
    return (this.eventsByDay()[this.getDayKey(date)] ?? []).some((event) => event.type === 'scheduled');
  }

  hasPublishedEvent(date: Date): boolean {
    return (this.eventsByDay()[this.getDayKey(date)] ?? []).some((event) => event.type === 'published');
  }

  hasOtherEvent(date: Date): boolean {
    return (this.eventsByDay()[this.getDayKey(date)] ?? []).some((event) => event.type === 'other');
  }

  trackEvent(_: number, event: CalendarEvent): string {
    return `${event.postId}:${event.type}:${event.at.toISOString()}:${event.platform ?? 'none'}`;
  }

  formatEventDate(date: Date): string {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getEventTypeLabel(event: CalendarEvent): string {
    const value = event.type === 'other' ? event.status : event.type;
    return value.replace(/_/g, ' ');
  }

  trackCalendarDay(_: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  private loadEventsForDate(targetDate: Date): void {
    const workspaceId = this.workspaceId();
    if (!workspaceId) {
      this.eventsByDay.set({});
      return;
    }

    this.loadingEvents.set(true);

    this.platformGql
      .getWorkspacePlatformPostsByDay(workspaceId, this.formatDateForQuery(targetDate))
      .pipe(
        catchError(() => of([] as IPlatformPost[])),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (platformPosts) => {
          const events = this.mapPlatformPostsToEvents(platformPosts, targetDate);
          const key = this.getDayKey(targetDate);
          this.eventsByDay.update((current) => ({
            ...current,
            [key]: events,
          }));
          this.loadingEvents.set(false);
        },
        error: () => {
          const key = this.getDayKey(targetDate);
          this.eventsByDay.update((current) => ({
            ...current,
            [key]: [],
          }));
          this.loadingEvents.set(false);
        },
      });
  }

  private mapPlatformPostsToEvents(platformPosts: IPlatformPost[], fallbackDate: Date): CalendarEvent[] {
    return (platformPosts ?? []).flatMap((platformPost): CalendarEvent[] => {
      if (!platformPost?.postId) return [];

      const status = platformPost.publishing?.status ?? 'draft';
      const at = this.resolveEventDate(platformPost) ?? fallbackDate;
      const title = platformPost.content?.caption?.trim() || `Post ${platformPost.postId}`;

      const type: CalendarEvent['type'] =
        status === 'scheduled'
          ? 'scheduled'
          : status === 'published'
            ? 'published'
            : 'other';

      return [{
        postId: platformPost.postId,
        title,
        platform: platformPost.platform,
        type,
        status,
        at,
      }];
    });
  }

  private resolveEventDate(platformPost: IPlatformPost): Date | null {
    const publishedAt = this.parseDateValue(platformPost.publishing?.publishedAt);
    const scheduledAt = this.parseDateValue(platformPost.publishing?.scheduledAt);

    const candidates = [publishedAt, scheduledAt].filter(
      (date): date is Date => !!date && !Number.isNaN(date.getTime()),
    );

    return candidates[0] ?? null;
  }

  private parseDateValue(value: string | undefined): Date | null {
    if (!value) return null;

    // Avoid timezone day-shift for date-only payloads.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yearRaw, monthRaw, dayRaw] = value.split('-');
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      const day = Number(dayRaw);
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return null;
      }
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getDayKey(date: Date): string {
    const day = this.startOfDay(date);
    const y = day.getFullYear();
    const m = `${day.getMonth() + 1}`.padStart(2, '0');
    const d = `${day.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDateForQuery(date: Date): string {
    const day = this.startOfDay(date);
    const year = day.getFullYear();
    const month = `${day.getMonth() + 1}`.padStart(2, '0');
    const dayOfMonth = `${day.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
}

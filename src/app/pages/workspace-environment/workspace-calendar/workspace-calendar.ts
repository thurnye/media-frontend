import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IPlatformPost } from '../../../core/interfaces/platform';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { WorkspaceCalendarView } from './workspace-calendar-view/workspace-calendar-view';

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
  imports: [WorkspaceCalendarView],
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
  eventsByDay = signal<Record<string, CalendarEvent[]>>({});

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
    this.loadEventsForMonth(this.currentMonth());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  previousMonth(): void {
    const month = this.currentMonth();
    const newMonth = this.startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    this.currentMonth.set(newMonth);
    this.loadEventsForMonth(newMonth);
  }

  nextMonth(): void {
    const month = this.currentMonth();
    const newMonth = this.startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    this.currentMonth.set(newMonth);
    this.loadEventsForMonth(newMonth);
  }

  selectDate(date: Date): void {
    const normalizedDate = this.startOfDay(date);
    this.selectedDate.set(normalizedDate);
    const selectedMonth = this.startOfMonth(normalizedDate);
    const didMonthChange =
      selectedMonth.getFullYear() !== this.currentMonth().getFullYear() ||
      selectedMonth.getMonth() !== this.currentMonth().getMonth();

    if (
      date.getFullYear() !== this.currentMonth().getFullYear() ||
      date.getMonth() !== this.currentMonth().getMonth()
    ) {
      this.currentMonth.set(selectedMonth);
    }

    if (didMonthChange) {
      this.loadEventsForMonth(selectedMonth);
    }
  }

  private loadEventsForMonth(targetMonth: Date): void {
    const workspaceId = this.workspaceId();
    if (!workspaceId) {
      this.eventsByDay.set({});
      return;
    }

    this.loadingEvents.set(true);

    const monthStart = this.startOfMonth(targetMonth);
    const targetMonthKey = this.getMonthKey(monthStart);

    this.platformGql
      .getWorkspacePlatformPostsByMonth(workspaceId, this.formatMonthForQuery(monthStart))
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (platformPosts) => {
          const monthEvents = this.mapPlatformPostsToEvents(platformPosts, monthStart);
          const nextByDay = this.groupEventsByDay(monthEvents);
          this.eventsByDay.set(nextByDay);
          this.ensureSelectedDateHasData(targetMonthKey, nextByDay);
          this.loadingEvents.set(false);
        },
        error: () => {
          // Keep this visible during integration so backend/query issues are not silently swallowed.
          // eslint-disable-next-line no-console
          console.error('Failed to load workspace platform posts by month');
          this.eventsByDay.set({});
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

    if (/^\d{13}$/.test(value)) {
      const parsedFromTimestamp = new Date(Number(value));
      return Number.isNaN(parsedFromTimestamp.getTime()) ? null : parsedFromTimestamp;
    }

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

  private getMonthKey(date: Date): string {
    const day = this.startOfDay(date);
    const year = day.getFullYear();
    const month = `${day.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatMonthForQuery(date: Date): string {
    const day = this.startOfDay(date);
    const year = day.getFullYear();
    const month = `${day.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  private groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
    const byDay: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dayKey = this.getDayKey(event.at);
      byDay[dayKey] = byDay[dayKey] ?? [];
      byDay[dayKey].push(event);
    }
    return byDay;
  }

  private ensureSelectedDateHasData(
    targetMonthKey: string,
    byDay: Record<string, CalendarEvent[]>,
  ): void {
    const selectedDayKey = this.getDayKey(this.selectedDate());
    const selectedMonthKey = this.getMonthKey(this.selectedDate());
    const hasSelectedData = (byDay[selectedDayKey] ?? []).length > 0;
    if (selectedMonthKey === targetMonthKey && hasSelectedData) return;

    const firstEventDayKey = Object.keys(byDay).sort()[0];
    if (!firstEventDayKey) return;
    const [year, month, day] = firstEventDayKey.split('-').map(Number);
    if (!year || !month || !day) return;
    this.selectedDate.set(new Date(year, month - 1, day));
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

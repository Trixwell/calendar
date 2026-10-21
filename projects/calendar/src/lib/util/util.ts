import {addMonths} from 'date-fns';
import type {CalendarLabels} from '../i18n/calendar-labels';
import {MasterTask, User} from '../calendar/core/entity';
import {CalendarEvent} from '../contracts/calendar-event';
import type {CalendarDayHours} from '../contracts/calendar-user-context';

export function shiftMonthRange(date: Date, delta: number): { start: Date; end: Date } {
    const target = addMonths(date, delta);

    return {
        start: new Date(target.getFullYear(), target.getMonth(), 1),
        end: new Date(target.getFullYear(), target.getMonth() + 1, 0),
    };
}

export function getPrimaryVioletColor(): string {
    if (typeof window === 'undefined' || typeof document === 'undefined') return '#6C7DE6';
    const value = getComputedStyle(document.documentElement).getPropertyValue('--primary-violet').trim();
    return value || '#6C7DE6';
}

export function normalizeCategoryColor(value: string | null | undefined): string {
    const raw = (value ?? '').trim().replace(/['"]/g, '');
    if (raw === '') return getPrimaryVioletColor();
    if (/^#[0-9a-fA-F]{3}$/.test(raw) || /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
    return getPrimaryVioletColor();
}

/**
 * @deprecated prefer `event.getColor()`. Kept for events that predate the `MasterTask.color`
 * field and still need the category-based lookup as a fallback.
 */
export function getColor(event: MasterTask, user: User): string {
    const type = user.categoryList
        .find(tt => tt.id === event.taskType.category);

    return normalizeCategoryColor(type?.color);
}

export function isFullDayOff(day: Date, taskList: CalendarEvent[]): boolean {
    const task = (taskList ?? []).find(t =>
        t.isBlocking() &&
        t.isAllDay() &&
        t.getStart().toDateString() === day.toDateString()
    );

    return !!task;
}

export function isTimeOffBlock(event: CalendarEvent): boolean {
    return event.isBlocking() && !event.isAllDay();
}

export function hasRecord(day: Date, taskList: CalendarEvent[]): boolean {
    return (taskList ?? []).some(t =>
        t.getStart().toDateString() === day.toDateString()
    );
}

export function getDayOffComment(date: Date, taskList: CalendarEvent[], labels?: CalendarLabels): string | null {
    const task = (taskList ?? []).find(t =>
        t.isBlocking() &&
        t.isAllDay() &&
        t.getStart().toDateString() === date.toDateString()
    );

    return task ? task.getTitle(labels) : null;
}

export function isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return d < today;
}

export function quantizeStartY(y: number, hourHeight: number): number {
    const step = hourHeight / 4;
    return Math.floor(y / step) * step;
}

export function quantizeEndY(y: number, hourHeight: number): number {
    const step = hourHeight / 4;
    return Math.ceil(y / step) * step;
}

function atMinuteOfDay(day: Date, minuteOfDay: number): Date {
    const date = new Date(day);
    date.setHours(0, 0, 0, 0);
    date.setMinutes(Math.round(minuteOfDay));
    return date;
}

export function dateFromY(
    day: Date,
    y: number,
    startHour: number,
    endHour: number,
    hourHeight: number,
): Date {
    const frac = Math.max(startHour, Math.min(endHour, startHour + y / hourHeight));

    return atMinuteOfDay(day, frac * 60);
}

export function clampToRange(
    day: Date,
    start: Date,
    end: Date,
    startHour: number,
    endHour: number,
): [Date, Date] {
    const minTs = atMinuteOfDay(day, startHour * 60).getTime();
    const maxTs = atMinuteOfDay(day, endHour * 60).getTime();

    const startTs = Math.max(start.getTime(), minTs);
    const endTs = Math.min(end.getTime(), maxTs);

    return [new Date(startTs), new Date(endTs)];
}

export function mapStatusesByDate(events: CalendarEvent[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    events.forEach(event => {
        const s = event.getStart();
        const date = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
        map[date] = map[date] || [];
        map[date].push(...event.getStatusClasses());
    });
    return map;
}

export function getStatusClassesForDay(
    day: number,
    currentDate: Date,
    statusMap: Record<string, string[]>
): string[] {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return statusMap[`${yyyy}-${mm}-${dd}`] || [];
}

export function minuteOfDay(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

/** Grid bounds in hours: whole one-hour cells anchored at the schedule start (fallback 8-20 without a schedule). */
export function gridHoursFor(hours: CalendarDayHours | null, fallbackStart = 8, fallbackEnd = 20): [number, number] {
    if (!hours) return [fallbackStart, fallbackEnd];

    const start = hours.startMinutes / 60;
    return [start, start + Math.ceil((hours.endMinutes - hours.startMinutes) / 60)];
}

/**
 * Dimmed (non-working) blocks of a day column, not already covered by a time-off event.
 * A working day is dimmed only before its own start and after its own end within the shared
 * work range [gridStartMinute, workEndMinute]; a non-working day is dimmed across the whole grid.
 */
export function scheduleBlocksFor(
    hours: CalendarDayHours | null | undefined,
    day: Date,
    gridStartMinute: number,
    workEndMinute: number,
    gridEndMinute: number,
    hourHeight: number,
    taskList: CalendarEvent[],
): { top: number; height: number }[] {
    const gridStart = gridStartMinute;
    const isWorking = !!hours?.isWorkingDay && hours.endMinutes > hours.startMinutes;
    const segments: [number, number][] = isWorking
        ? [[gridStart, Math.min(hours.startMinutes, workEndMinute)], [Math.max(hours.endMinutes, gridStart), workEndMinute]]
        : [[gridStart, gridEndMinute]];
    const timeOffs = taskList.filter(t => isTimeOffBlock(t) && t.getStart().toDateString() === day.toDateString());

    return segments
        .filter(([from, to]) => to > from)
        .filter(([from, to]) => !timeOffs.some(t => minuteOfDay(t.getStart()) <= from && minuteOfDay(t.getEnd()) >= to))
        .map(([from, to]) => ({
            top: (from - gridStart) / 60 * hourHeight,
            height: (to - from) / 60 * hourHeight,
        }));
}

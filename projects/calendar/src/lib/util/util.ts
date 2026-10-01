import {addMonths} from 'date-fns';
import {MasterTask, User} from '../calendar/core/entity';
import {CalendarEvent} from '../contracts/calendar-event';

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

export function getDayOffComment(date: Date, taskList: CalendarEvent[]): string | null {
    const task = (taskList ?? []).find(t =>
        t.isBlocking() &&
        t.isAllDay() &&
        t.getStart().toDateString() === date.toDateString()
    );

    return task ? task.getTitle() : null;
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

export function dateFromY(
    day: Date,
    y: number,
    startHour: number,
    endHour: number,
    hourHeight: number,
): Date {
    const frac = Math.max(startHour, Math.min(endHour, startHour + y / hourHeight));

    const date = new Date(day);
    const hour = Math.floor(frac);
    const minutes = Math.round((frac - hour) * 60);

    date.setHours(hour, minutes, 0, 0);
    return date;
}

export function clampToRange(
    day: Date,
    start: Date,
    end: Date,
    startHour: number,
    endHour: number,
): [Date, Date] {
    const minTs = new Date(day).setHours(startHour, 0, 0, 0);
    const maxTs = new Date(day).setHours(endHour, 0, 0, 0);

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

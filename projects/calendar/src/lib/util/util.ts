import {addMonths} from 'date-fns';
import {MasterTask, TaskStatusEnum, User} from '../calendar/core/entity';

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

export function getColor(event: MasterTask, user: User): string {
    const type = user.categoryList
        .find(tt => tt.id === event.taskType.category);

    return normalizeCategoryColor(type?.color);
}

export function isFullDayOff(day: Date, taskList: MasterTask[]): boolean {
    const task = (taskList ?? []).find(t =>
        t.taskType.isTimeOff() &&
        Number(t.duration) <= 0 &&
        new Date(t.assign_time).toDateString() === day.toDateString()
    );

    return !!task;
}

export function isTimeOffBlock(event: MasterTask): boolean {
    return event.taskType.isTimeOff() && Number(event.duration) > 0;
}

const DAY_STATUS_COMMENT_CODES = new Set(['dayOff', 'vacation', 'sick', 'partial']);

export function getEventTitle(event: MasterTask): string {
    if (!event.taskType.isTimeOff()) return event.taskType.name;
    return DAY_STATUS_COMMENT_CODES.has(event.comment) ? 'Вихідний' : 'Заблокований час';
}

export function hasRecord(day: Date, taskList: MasterTask[]): boolean {
    return (taskList ?? []).some(t =>
        new Date(t.assign_time).toDateString() === day.toDateString()
    );
}

export function getDayOffComment(date: Date, taskList: MasterTask[]): string | null {
    const task = (taskList ?? []).find(t =>
        t.taskType.isTimeOff() &&
        Number(t.duration) <= 0 &&
        new Date(t.assign_time).toDateString() === date.toDateString()
    );

    return task ? task.taskType.name ?? '' : null;
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

export function mapStatusesByDate(tasks: MasterTask[]): Record<string, TaskStatusEnum[]> {
    const map: Record<string, TaskStatusEnum[]> = {};
    tasks.forEach(task => {
        const date = task.assign_time.substring(0, 10);
        map[date] = map[date] || [];
        map[date].push(task.status);
    });
    return map;
}

export function getStatusClassesForDay(
    day: number,
    currentDate: Date,
    statusMap: Record<string, TaskStatusEnum[]>
): string[] {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const statuses = statusMap[`${yyyy}-${mm}-${dd}`] || [];
    return statuses.map(s => `status-${TaskStatusEnum[s].toLowerCase()}`);
}

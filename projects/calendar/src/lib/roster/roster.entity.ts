import {CalendarEvent} from '../contracts/calendar-event';

export interface RosterColumn {
    date: Date;
    isWeekend: boolean;
    isHoliday: boolean;
}

export interface RosterRow {
    id: number | string;
    title: string;
    depth: number;
    total: number | null;
    cells: Map<string, CalendarEvent[]>;
}

export interface RosterDayType {
    id: number | string;
    name: string;
}

export function rosterDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

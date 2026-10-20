import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {CalendarEvent} from '../contracts/calendar-event';
import {CalendarDayHours} from '../contracts/calendar-user-context';

export interface CalendarDataProvider {
    getTasks(startISO: string, endISO: string): Observable<CalendarEvent[]>;
    getDayHoursOverrides?(startISO: string, endISO: string): Observable<Record<string, CalendarDayHours | null>>;
}

export const CALENDAR_DATA = new InjectionToken<CalendarDataProvider>('CALENDAR_DATA');

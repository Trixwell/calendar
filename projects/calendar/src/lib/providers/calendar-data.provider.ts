import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {CalendarEvent} from '../contracts/calendar-event';

export interface CalendarDataProvider {
    getTasks(startISO: string, endISO: string): Observable<CalendarEvent[]>;
}

export const CALENDAR_DATA = new InjectionToken<CalendarDataProvider>('CALENDAR_DATA');

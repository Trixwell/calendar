import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {MasterTask} from '../calendar/core/entity';

export interface CalendarDataProvider {
    getTasks(startISO: string, endISO: string): Observable<MasterTask[]>;
}

export const CALENDAR_DATA = new InjectionToken<CalendarDataProvider>('CALENDAR_DATA');

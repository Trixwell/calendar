import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {CalendarUserContext} from '../contracts/calendar-user-context';

export interface CalendarUserProvider {
    profile$: Observable<CalendarUserContext | null>;
}

export const CALENDAR_USER = new InjectionToken<CalendarUserProvider>('CALENDAR_USER');

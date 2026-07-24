import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../calendar/core/entity';

export interface CalendarUserProvider {
    profile$: Observable<User | null>;
}

export const CALENDAR_USER = new InjectionToken<CalendarUserProvider>('CALENDAR_USER');

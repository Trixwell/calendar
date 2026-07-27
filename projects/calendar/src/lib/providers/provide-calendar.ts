import {InjectionToken, Provider, Type} from '@angular/core';
import {CALENDAR_DATA, CalendarDataProvider} from './calendar-data.provider';
import {CALENDAR_USER, CalendarUserProvider} from './calendar-user.provider';
import {
    CALENDAR_VIEWPORT,
    CalendarViewportProvider,
    DefaultCalendarViewportProvider,
} from './calendar-viewport.provider';

export interface CalendarConfig {
    data: Type<CalendarDataProvider> | CalendarDataProvider;
    user: Type<CalendarUserProvider> | CalendarUserProvider;
    viewport?: Type<CalendarViewportProvider> | CalendarViewportProvider;
}

function bind<T>(token: InjectionToken<T>, value: Type<T> | T): Provider {
    return typeof value === 'function'
        ? {provide: token, useExisting: value as Type<T>}
        : {provide: token, useValue: value};
}

export function provideCalendar(config: CalendarConfig): Provider[] {
    return [
        bind(CALENDAR_DATA, config.data),
        bind(CALENDAR_USER, config.user),
        bind(CALENDAR_VIEWPORT, config.viewport ?? DefaultCalendarViewportProvider),
    ];
}

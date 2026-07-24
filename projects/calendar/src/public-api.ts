/*
 * Public API Surface of calendar
 */

export {CalendarComponent} from './lib/calendar/calendar.component';

export * from './lib/calendar/core/entity';

export {CALENDAR_DATA, type CalendarDataProvider} from './lib/providers/calendar-data.provider';
export {CALENDAR_USER, type CalendarUserProvider} from './lib/providers/calendar-user.provider';
export {
    CALENDAR_VIEWPORT,
    type CalendarViewportProvider,
    DefaultCalendarViewportProvider,
} from './lib/providers/calendar-viewport.provider';
export {provideCalendar, type CalendarConfig} from './lib/providers/provide-calendar';

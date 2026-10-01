/*
 * Public API Surface of calendar
 */

export {CalendarComponent} from './lib/calendar/calendar.component';

export * from './lib/calendar/core/entity';

export type {CalendarEvent} from './lib/contracts/calendar-event';
export type {CalendarUserContext, CalendarDayHours} from './lib/contracts/calendar-user-context';

export {CALENDAR_DATA, type CalendarDataProvider} from './lib/providers/calendar-data.provider';
export {CALENDAR_USER, type CalendarUserProvider} from './lib/providers/calendar-user.provider';
export {
    CALENDAR_VIEWPORT,
    type CalendarViewportProvider,
    DefaultCalendarViewportProvider,
} from './lib/providers/calendar-viewport.provider';
export {provideCalendar, type CalendarConfig} from './lib/providers/provide-calendar';

export {RosterGridComponent, type RosterSelectedCell} from './lib/roster/roster-grid.component';
export {
    RosterCellEditor,
    type RosterCellEditorLabels,
    type RosterCellEditorSavePayload,
} from './lib/roster/roster-cell-editor.component';
export type {RosterColumn, RosterRow, RosterDayType} from './lib/roster/roster.entity';

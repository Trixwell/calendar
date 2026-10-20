import {WritableSignal} from '@angular/core';

export interface CalendarDayHours {
    isWorkingDay: boolean;
    startMinutes: number;
    endMinutes: number;
}

export interface CalendarUserContext {
    readonly dayHoursOverrides: WritableSignal<Record<string, CalendarDayHours | null>>;
    getDayHours(date: Date): CalendarDayHours | null;
    getSlotIds(): number[];
}

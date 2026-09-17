export interface CalendarDayHours {
    isWorkingDay: boolean;
    startMinutes: number;
    endMinutes: number;
}

export interface CalendarUserContext {
    getDayHours(date: Date): CalendarDayHours | null;
    getSlotIds(): number[];
}

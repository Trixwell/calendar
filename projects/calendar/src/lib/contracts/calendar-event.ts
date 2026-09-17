export interface CalendarEvent {
    getId(): number | string;
    getStart(): Date;
    getEnd(): Date;
    getDurationMinutes(): number;
    isAllDay(): boolean;
    isBlocking(): boolean;
    getTitle(): string;
    getColor(): string | null;
    getIcon(): string | null;
    getStatusClasses(): string[];
    getSlotId(): number | null;
    getAmount(): number;
    getComment(): string;
    getCategoryId(): number | string | null;
}

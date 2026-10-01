export interface CalendarRosterEditorLabels {
    title: string;
    dayType: string;
    hours: string;
    comment: string;
    save: string;
    delete: string;
    dayTypePlaceholder: string;
    hoursPlaceholder: string;
    commentPlaceholder: string;
}

export interface CalendarLabels {
    'header.title': string;

    'view.year': string;
    'view.month': string;
    'view.week': string;
    'view.day': string;
    'view.today': string;

    'setupDays.action': string;
    'setupDays.hint': string;
    'setupDays.cancel': string;
    'setupDays.next': string;
    'selectedDays': (n: number) => string;

    'grid.time': string;

    'month.freeSlots': string;
    'month.more': (n: number) => string;

    'records.total': string;

    'taskStatus.planned': string;
    'taskStatus.deleted': string;
    'taskStatus.cancelled': string;
    'taskStatus.completed': string;

    'paymentStatus.paid': string;
    'paymentStatus.notPaid': string;
    'paymentStatus.refund': string;
    'paymentStatus.inProgress': string;

    'task.dayOff': string;
    'task.blockedTime': string;

    'rangeSelection.hint': string;
    'rangeSelection.select': string;

    'datePicker.title': string;
    'datePicker.setupDays': string;

    'roster.corner': string;
    'roster.total': string;

    rosterEditor: CalendarRosterEditorLabels;
}

export type CalendarLabelsOverride = Partial<Omit<CalendarLabels, 'rosterEditor'>> & {
    rosterEditor?: Partial<CalendarRosterEditorLabels>;
};

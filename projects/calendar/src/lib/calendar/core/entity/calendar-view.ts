export interface DateParts {
    full_date: string;
    year: string | null;
    month: string | null;
    date: string | null;
}

export enum CalendarView {
    YEAR = 'year',
    MONTH = 'month',
    WEEK = 'week',
    DAY = 'day'
}

export type Weekday = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const WEEKDAY_NAMES: Weekday[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

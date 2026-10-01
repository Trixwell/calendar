import {CalendarLabels} from './calendar-labels';

const pluralRules = new Intl.PluralRules('en');

export const LABELS_EN: CalendarLabels = {
    'header.title': 'Calendar',

    'view.year': 'Year',
    'view.month': 'Month',
    'view.week': 'Week',
    'view.day': 'Day',
    'view.today': 'Today',

    'setupDays.action': 'Set up days',
    'setupDays.hint': 'Select days to set up',
    'setupDays.cancel': 'Cancel',
    'setupDays.next': 'Next',
    'selectedDays': (n) => `${n} ${pluralRules.select(n) === 'one' ? 'day' : 'days'} selected`,

    'grid.time': 'Time',

    'month.freeSlots': 'Free slots',
    'month.more': (n) => `${n} more`,

    'records.total': 'Records:',

    'taskStatus.planned': 'Scheduled',
    'taskStatus.deleted': 'Deleted',
    'taskStatus.cancelled': 'Cancelled',
    'taskStatus.completed': 'Completed',

    'paymentStatus.paid': 'Paid',
    'paymentStatus.notPaid': 'Not paid',
    'paymentStatus.refund': 'Refunded',
    'paymentStatus.inProgress': 'In progress',

    'task.dayOff': 'Day off',
    'task.blockedTime': 'Blocked time',

    'rangeSelection.hint': 'Drag to select a time range',
    'rangeSelection.select': 'Select',

    'datePicker.title': 'Go to date',
    'datePicker.setupDays': 'Set up days',
};

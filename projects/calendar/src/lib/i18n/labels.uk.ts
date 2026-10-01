import {CalendarLabels} from './calendar-labels';

const pluralRules = new Intl.PluralRules('uk');

function days(n: number): string {
    switch (pluralRules.select(n)) {
        case 'one':
            return 'день';
        case 'few':
            return 'дні';
        default:
            return 'днів';
    }
}

export const LABELS_UK: CalendarLabels = {
    'header.title': 'Календар',

    'view.year': 'Рік',
    'view.month': 'Місяць',
    'view.week': 'Тиждень',
    'view.day': 'День',
    'view.today': 'Сьогодні',

    'setupDays.action': 'Налаштувати дні',
    'setupDays.hint': 'Оберіть дні та налаштуйте',
    'setupDays.cancel': 'Скасувати',
    'setupDays.next': 'Далі',
    'selectedDays': (n) => `Обрано ${n} ${days(n)}`,

    'grid.time': 'Час',

    'month.freeSlots': 'Віконець',
    'month.more': (n) => `Ще ${n}`,

    'records.total': 'Записів:',

    'taskStatus.planned': 'Заплановано',
    'taskStatus.deleted': 'Видалено',
    'taskStatus.cancelled': 'Скасовано',
    'taskStatus.completed': 'Завершено',

    'paymentStatus.paid': 'Оплачено',
    'paymentStatus.notPaid': 'Не оплачено',
    'paymentStatus.refund': 'Повернено',
    'paymentStatus.inProgress': 'В процесі',

    'task.dayOff': 'Вихідний',
    'task.blockedTime': 'Заблокований час',

    'rangeSelection.hint': 'Потягніть, щоб обрати діапазон часу',
    'rangeSelection.select': 'Обрати',

    'datePicker.title': 'Перейти до дати',
    'datePicker.setupDays': 'Налаштувати дні',

    'roster.corner': 'Співробітник',
    'roster.total': 'Всього',

    rosterEditor: {
        title: 'Редагувати запис',
        dayType: 'Тип дня',
        hours: 'Години',
        comment: 'Коментар',
        save: 'Зберегти',
        delete: 'Видалити',
        dayTypePlaceholder: 'Оберіть',
        hoursPlaceholder: '00',
        commentPlaceholder: 'Введіть коментар',
    },
};

import {Component, output, signal, ViewChild} from '@angular/core';
import {endOfMonth, startOfMonth} from 'date-fns';
import {MatButton} from '@angular/material/button';
import {ModalDialogComponent} from '../modal-dialog/modal-dialog.component';
import {CalendarMonthComponent} from '../../../../year/month/calendar-month.component';
import {ToggleDateBarComponent} from '../../toggle-date-bar/toggle-date-bar.component';
import {CalendarView} from '../../../entity';

@Component({
    selector: 'app-date-picker-modal',
    imports: [
        MatButton,
        ModalDialogComponent,
        CalendarMonthComponent,
        ToggleDateBarComponent,
    ],
    templateUrl: './date-picker-modal.component.html',
    styleUrl: './date-picker-modal.component.scss'
})
export class DatePickerModalComponent {
    dateChosen = output<Date>();
    adjustDays = output<void>();

    viewDate = signal<Date>(startOfMonth(new Date()));
    pickerView = signal<CalendarView>(CalendarView.MONTH);
    pickerYear = signal<number | null>(this.viewDate().getFullYear());
    pickerStart = signal<Date>(this.viewDate());
    pickerEnd = signal<Date>(endOfMonth(this.viewDate()));

    @ViewChild('modal') modal!: ModalDialogComponent;

    open(): void {
        const today = startOfMonth(new Date());
        this.viewDate.set(today);
        this.pickerYear.set(today.getFullYear());
        this.pickerStart.set(today);
        this.pickerEnd.set(endOfMonth(today));
        this.modal.open();
    }

    selectDay(): (date: Date, unset: boolean) => void {
        return (date, unset) => {
            if (unset) return;
            this.dateChosen.emit(date);
            this.modal.close();
        };
    }

    onAdjustDaysClick(): void {
        this.adjustDays.emit();
        this.modal.close();
    }
}

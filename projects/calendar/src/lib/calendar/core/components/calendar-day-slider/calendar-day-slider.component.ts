import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {DatePipe} from '@angular/common';
import {eachDayOfInterval, endOfMonth, startOfDay, startOfMonth} from 'date-fns';
import {MasterTask} from '../../entity';
import {LoadPercentComponent} from './load-percent/load-percent.component';
import {hasRecord as hasRecordUtil} from '../../../../util/util';

@Component({
    selector: 'app-calendar-day-slider',
    imports: [
        DatePipe,
        LoadPercentComponent,
    ],
    templateUrl: './calendar-day-slider.component.html',
    styleUrl: './calendar-day-slider.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDaySliderComponent {
    day = model.required<Date>();
    taskList = input<MasterTask[]>([]);

    get monthDays(): Date[] {
        const day = startOfDay(this.day());
        return eachDayOfInterval({ start: startOfMonth(day), end: endOfMonth(day) });
    }

    isSelectedDay(date: Date): boolean {
        return date.toDateString() === this.day().toDateString();
    }

    hasRecord(date: Date): boolean {
        return hasRecordUtil(date, this.taskList());
    }
}

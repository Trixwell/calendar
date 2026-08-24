import {ChangeDetectionStrategy, Component, computed, input, linkedSignal, model} from '@angular/core';
import {DatePipe} from '@angular/common';
import {addDays, differenceInCalendarDays, eachDayOfInterval, startOfDay} from 'date-fns';
import {MasterTask} from '../../entity';
import {LoadPercentComponent} from './load-percent/load-percent.component';
import {hasRecord as hasRecordUtil} from '../../../../util/util';

const VISIBLE_DAYS = 7;

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

    private readonly anchor = linkedSignal<Date, Date>({
        source: () => startOfDay(this.day()),
        computation: (selected, previous) => {
            if (!previous) {
                return selected;
            }

            const offset = differenceInCalendarDays(selected, previous.value);

            return offset >= 0 && offset < VISIBLE_DAYS ? previous.value : selected;
        },
    });

    protected readonly visibleDays = computed<Date[]>(() => {
        const start = this.anchor();

        return eachDayOfInterval({ start, end: addDays(start, VISIBLE_DAYS - 1) });
    });

    isSelectedDay(date: Date): boolean {
        return date.toDateString() === this.day().toDateString();
    }

    hasRecord(date: Date): boolean {
        return hasRecordUtil(date, this.taskList());
    }
}

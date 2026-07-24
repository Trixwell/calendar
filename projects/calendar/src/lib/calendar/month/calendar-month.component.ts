import {ChangeDetectionStrategy, Component, computed, inject, input, model} from '@angular/core';
import {MasterTask} from "../core/entity";
import {User} from "../core/entity";
import {CalendarGridMonthComponent} from "../core/components/grid/month/calendar-grid-month.component";
import {DatePipe} from "@angular/common";
import {LoadIndicatorComponent} from "../core/components/load-indicator/load-indicator.component";
import {LoadPercentComponent} from "../core/components/calendar-day-slider/load-percent/load-percent.component";
import {RecordsSummaryComponent} from "../core/components/records-summary/records-summary.component";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {CalendarView} from "../core/entity";
import {getColor} from "../../util/util";
import {CALENDAR_VIEWPORT} from "../../providers/calendar-viewport.provider";


@Component({
  selector: 'app-calendar-month',
    imports: [
        CalendarGridMonthComponent,
        DatePipe,
        LoadIndicatorComponent,
        LoadPercentComponent,
        RecordsSummaryComponent,
        CalendarEventComponent,
    ],
  templateUrl: './calendar-month.component.html',
  styleUrl: './calendar-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarMonthComponent {
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    startDate = input<Date>(new Date());
    endDate = input<Date>(new Date());
    day = model.required<Date>();
    view = model.required<CalendarView>();
    selectionMode = input<boolean>(false);

    selectedDays = model<Date[]>([]);
    isMobile;
    maxVisible;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor() {
        this.isMobile = this.viewport.isMobile;
        this.maxVisible = computed(() => this.isMobile() ? 1 : 3);
    }

    periodTaskList = computed(() => {
        const start = this.startDate().getTime();
        const end = this.endDate().getTime();
        return this.taskList().filter(t => {
            const time = new Date(t.assign_time).getTime();
            return time >= start && time <= end;
        });
    });

    onDayDbl = (date: Date) => {
        if (this.selectionMode()) return;
        this.day.set(date);
        this.view.set(CalendarView.DAY);
    };

    onEventOpen = (_event: MasterTask, _date: Date) => {};

    timeFreeSlotsCount(): number {
        const used = new Set(this.taskList().map(task => task.time_slot_id));
        return this.user().timeSlotList.filter(slot => !used.has(slot.id)).length;
    }

    protected readonly CalendarView = CalendarView;
    protected readonly getColor = getColor;
}

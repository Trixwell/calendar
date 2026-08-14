import {ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal} from '@angular/core';
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
import {SwipeDirection, SwipeDirective} from "../core/directives/swipe.directive";


@Component({
  selector: 'app-calendar-month',
    imports: [
        CalendarGridMonthComponent,
        DatePipe,
        LoadIndicatorComponent,
        LoadPercentComponent,
        RecordsSummaryComponent,
        CalendarEventComponent,
        SwipeDirective,
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
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    moreOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    monthShift = output<number>();
    isMobile;
    maxVisible;
    slide = signal<'prev' | 'next' | null>(null);

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

    onSwipe(direction: SwipeDirection): void {
        const delta = direction === 'left' ? 1 : -1;

        this.slide.set(delta > 0 ? 'next' : 'prev');
        this.monthShift.emit(delta);
    }

    onSlideEnd(event: AnimationEvent): void {
        if (event.target !== event.currentTarget) return;
        this.slide.set(null);
    }

    onEventClick = (task: MasterTask, date: Date, event: MouseEvent): void => {
        this.eventOpen.emit({ task, date, anchor: event.currentTarget as HTMLElement });
    };

    onMoreClick = (task: MasterTask, date: Date, event: MouseEvent): void => {
        this.moreOpen.emit({ task, date, anchor: event.currentTarget as HTMLElement });
    };

    timeFreeSlotsCount(): number {
        const used = new Set(this.taskList().map(task => task.time_slot_id));
        return (this.user()?.timeSlotList ?? []).filter(slot => !used.has(slot.id)).length;
    }

    protected readonly CalendarView = CalendarView;
    protected readonly getColor = getColor;
}

import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, ViewChild} from '@angular/core';
import {MasterTask} from "../core/entity";
import {DaySchedule, User} from "../core/entity";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CdkDrag} from "@angular/cdk/drag-drop";
import {getColor, getDayOffComment, isFullDayOff} from "../../util/util";
import {CalendarView, Weekday} from "../core/entity";
import {CALENDAR_VIEWPORT} from "../../providers/calendar-viewport.provider";
import {RecordsSummaryComponent} from "../core/components/records-summary/records-summary.component";

@Component({
  selector: 'app-calendar-week',
    imports: [
        CalendarEventComponent,
        CalendarGridComponent,
        CdkDrag,
        RecordsSummaryComponent,
    ],
  templateUrl: './calendar-week.component.html',
  styleUrl: './calendar-week.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarWeekComponent implements OnInit{
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    startDate = input<Date>(new Date());
    endDate = input<Date>(new Date());
    isMobile;

    @ViewChild(CalendarGridComponent) calendarGrid!: CalendarGridComponent;

    todaySchedule: DaySchedule | undefined = undefined;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor() {
        this.isMobile = this.viewport.isMobile;
    }

    ngOnInit(){
        this.setTodaySchedule();
    }

    weekDays = computed(() => {
        const days: Date[] = [];
        const end = this.endDate();

        for (let d = new Date(this.startDate()); d <= end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }

        return days;
    });

    periodTaskList = computed(() => {
        const start = this.startDate().getTime();
        const end = this.endDate().getTime();
        return this.taskList().filter(t => {
            const time = new Date(t.assign_time).getTime();
            return time >= start && time <= end;
        });
    });

    setTodaySchedule(): this {
        const dayName = new Intl.DateTimeFormat('en-US',{weekday:'long'})
            .format(this.startDate())
            .toLowerCase() as Weekday;

        this.todaySchedule = this.user()?.schedule[dayName];
        return this;
    }

    onSlotClick = input<(date: Date) => void>(() => {});
    onEventDrop = input<(task: MasterTask, oldStart: Date, newStart: Date) => void>(() => {});
    onDayHeader = input<(date: Date) => void>(() => {});
    onRangeSelect = input<(start: Date, end: Date) => void>(() => {});

    toHour(fullTime: string): number {
        const hourStr = fullTime.split(':')[0];
        return parseInt(hourStr, 10);
    }

    protected readonly getColor = getColor;
    protected readonly CalendarView = CalendarView;
    protected readonly isFullDayOff = isFullDayOff;
    protected readonly getDayOffComment = getDayOffComment;
}

import {ChangeDetectionStrategy, Component, computed, inject, input, Input, OnInit, output, WritableSignal} from '@angular/core';
import {MasterTask} from "../core/entity";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {DaySchedule, User} from "../core/entity";
import {getColor, getDayOffComment, isFullDayOff} from "../../util/util";
import {CalendarView, Weekday} from "../core/entity";
import {CALENDAR_VIEWPORT} from "../../providers/calendar-viewport.provider";
import {RecordsSummaryComponent} from "../core/components/records-summary/records-summary.component";

@Component({
  selector: 'app-calendar-day',
    imports: [
        CalendarGridComponent,
        CalendarEventComponent,
        RecordsSummaryComponent,
    ],
  templateUrl: './calendar-day.component.html',
  styleUrl: './calendar-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDayComponent implements OnInit{
    @Input() day!: WritableSignal<Date>;
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();

    todaySchedule: DaySchedule | undefined = undefined;
    isMobile;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor() {
        this.isMobile = this.viewport.isMobile;
    }

    ngOnInit(){
        this.setTodaySchedule();
    }

    setTodaySchedule(): this {
        const dayName = new Intl.DateTimeFormat('en-US',{weekday:'long'})
            .format(this.day())
            .toLowerCase() as Weekday;

        this.todaySchedule = this.user()?.schedule[dayName];
        return this;
    }

    dayTaskList = computed(() => {
        const d = this.day();
        const isoDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return this.taskList().filter(t => t.assign_time.startsWith(isoDay));
    });

    onEventClick = (task: MasterTask, date: Date, event: MouseEvent): void => {
        this.eventOpen.emit({ task, date, anchor: event.currentTarget as HTMLElement });
    };

    onSlotClick = input<(date: Date) => void>(() => {});
    onDayHeader = input<(date: Date) => void>((date: Date) => this.day.set(date));
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

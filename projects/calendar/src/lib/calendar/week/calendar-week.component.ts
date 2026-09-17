import {ChangeDetectionStrategy, Component, computed, inject, input, model, OnInit, output, ViewChild} from '@angular/core';
import {MasterTask} from "../core/entity";
import {User} from "../core/entity";
import {CalendarEvent} from "../../contracts/calendar-event";
import {CalendarDayHours} from "../../contracts/calendar-user-context";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CdkDrag} from "@angular/cdk/drag-drop";
import {getColor, getDayOffComment, isFullDayOff, isTimeOffBlock} from "../../util/util";
import {CalendarView} from "../core/entity";
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
    selectedDays = model<Date[]>([]);
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    isMobile;

    @ViewChild(CalendarGridComponent) calendarGrid!: CalendarGridComponent;

    todaySchedule: CalendarDayHours | null = null;

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
            const time = t.getStart().getTime();
            return time >= start && time <= end;
        });
    });

    setTodaySchedule(): this {
        this.todaySchedule = this.user().getDayHours(this.startDate()) ?? null;
        return this;
    }

    onEventClick = (event: CalendarEvent, date: Date, mouseEvent: MouseEvent): void => {
        this.eventOpen.emit({ task: event as MasterTask, date, anchor: mouseEvent.currentTarget as HTMLElement });
    };

    handleEventDrop = (event: CalendarEvent, oldStart: Date, newStart: Date): void => {
        this.onEventDrop()(event as MasterTask, oldStart, newStart);
    };

    onSlotClick = input<(date: Date) => void>(() => {});
    onEventDrop = input<(task: MasterTask, oldStart: Date, newStart: Date) => void>(() => {});
    onDayHeader = input<(date: Date) => void>(() => {});
    onRangeSelect = input<(start: Date, end: Date) => void>(() => {});

    startHourOf(fallback = 8): number {
        return this.todaySchedule ? Math.floor(this.todaySchedule.startMinutes / 60) : fallback;
    }

    endHourOf(fallback = 20): number {
        return this.todaySchedule ? Math.floor(this.todaySchedule.endMinutes / 60) : fallback;
    }

    /** @deprecated fallback for events without their own color once `event.getColor()` is populated */
    resolveColor(event: CalendarEvent): string {
        return event.getColor() ?? getColor(event as MasterTask, this.user());
    }

    protected readonly CalendarView = CalendarView;
    protected readonly isFullDayOff = isFullDayOff;
    protected readonly getDayOffComment = getDayOffComment;
    protected readonly isTimeOffBlock = isTimeOffBlock;
}

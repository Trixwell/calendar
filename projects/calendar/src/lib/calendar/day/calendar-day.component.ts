import {ChangeDetectionStrategy, Component, computed, inject, input, Input, model, OnInit, output, WritableSignal} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MasterTask} from "../core/entity";
import {CalendarEvent} from "../../contracts/calendar-event";
import {CalendarDayHours} from "../../contracts/calendar-user-context";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {User} from "../core/entity";
import {getColor, getDayOffComment, isFullDayOff, isTimeOffBlock} from "../../util/util";
import {CalendarView} from "../core/entity";
import {CALENDAR_VIEWPORT} from "../../providers/calendar-viewport.provider";
import {RecordsSummaryComponent} from "../core/components/records-summary/records-summary.component";

@Component({
  selector: 'app-calendar-day',
    imports: [
        CalendarGridComponent,
        CalendarEventComponent,
        RecordsSummaryComponent,
        DatePipe,
    ],
  templateUrl: './calendar-day.component.html',
  styleUrl: './calendar-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDayComponent implements OnInit{
    @Input() day!: WritableSignal<Date>;
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    selectedDays = model<Date[]>([]);
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();

    todaySchedule: CalendarDayHours | null = null;
    isMobile;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor() {
        this.isMobile = this.viewport.isMobile;
    }

    ngOnInit(){
        this.setTodaySchedule();
    }

    setTodaySchedule(): this {
        this.todaySchedule = this.user().getDayHours(this.day()) ?? null;
        return this;
    }

    dayTaskList = computed(() => {
        const d = this.day();
        return this.taskList().filter(t => t.getStart().toDateString() === d.toDateString());
    });

    onEventClick = (event: CalendarEvent, date: Date, mouseEvent: MouseEvent): void => {
        this.eventOpen.emit({ task: event as MasterTask, date, anchor: mouseEvent.currentTarget as HTMLElement });
    };

    onSlotClick = input<(date: Date) => void>(() => {});
    onDayHeader = input<(date: Date) => void>((date: Date) => this.day.set(date));
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

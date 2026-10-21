import {ChangeDetectionStrategy, Component, computed, inject, input, model, output, ViewChild} from '@angular/core';
import {MasterTask} from "../core/entity";
import {User} from "../core/entity";
import {CalendarEvent} from "../../contracts/calendar-event";
import {CalendarDayHours} from "../../contracts/calendar-user-context";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CdkDrag} from "@angular/cdk/drag-drop";
import {getColor, getDayOffComment, gridHoursFor, isFullDayOff, isTimeOffBlock, scheduleBlocksFor} from "../../util/util";
import {CalendarView} from "../core/entity";
import {CalendarLocale} from "../../i18n/calendar-locale";
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
export class CalendarWeekComponent {
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    startDate = input<Date>(new Date());
    endDate = input<Date>(new Date());
    selectedDays = model<Date[]>([]);
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    isMobile;

    @ViewChild(CalendarGridComponent) calendarGrid!: CalendarGridComponent;

    todaySchedule = computed<CalendarDayHours | null>(() => {
        const user = this.user();
        let start: number | null = null;
        let end: number | null = null;

        for (const day of this.weekDays()) {
            const hours = user.getDayHours(day);
            if (!hours?.isWorkingDay || hours.endMinutes <= hours.startMinutes) continue;
            start = start === null ? hours.startMinutes : Math.min(start, hours.startMinutes);
            end = end === null ? hours.endMinutes : Math.max(end, hours.endMinutes);
        }

        return start === null || end === null ? null : {isWorkingDay: true, startMinutes: start, endMinutes: end};
    });

    private readonly viewport = inject(CALENDAR_VIEWPORT);
    protected readonly locale = inject(CalendarLocale);
    protected readonly labels = this.locale.labels;

    constructor() {
        this.isMobile = this.viewport.isMobile;
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

    scheduleBlocks(day: Date): { top: number; height: number }[] {
        const gridEnd = this.endHourOf() * 60;
        const workEnd = this.todaySchedule()?.endMinutes ?? gridEnd;

        return scheduleBlocksFor(
            this.user().getDayHours(day), day, this.startHourOf() * 60, workEnd, gridEnd,
            this.isMobile() ? 56 : 60, this.taskList(),
        );
    }

    startHourOf(): number {
        return gridHoursFor(this.todaySchedule())[0];
    }

    endHourOf(): number {
        return gridHoursFor(this.todaySchedule())[1];
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

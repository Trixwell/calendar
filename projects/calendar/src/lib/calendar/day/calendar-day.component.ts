import {ChangeDetectionStrategy, Component, computed, inject, input, Input, model, output, WritableSignal} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MasterTask} from "../core/entity";
import {CalendarEvent} from "../../contracts/calendar-event";
import {format} from "date-fns";
import {CalendarDayHours} from "../../contracts/calendar-user-context";
import {CalendarGridComponent} from "../core/components/grid/calendar-grid.component";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {User} from "../core/entity";
import {getColor, getDayOffComment, gridHoursFor, isFullDayOff, isTimeOffBlock, ScheduleBlockKind} from "../../util/util";
import {CalendarView} from "../core/entity";
import {CalendarLocale} from "../../i18n/calendar-locale";
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
export class CalendarDayComponent {
    @Input() day!: WritableSignal<Date>;
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    selectedDays = model<Date[]>([]);
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();

    todaySchedule = computed<CalendarDayHours | null>(() => {
        const hours = this.user().getDayHours(this.day());
        return hours?.isWorkingDay && hours.endMinutes > hours.startMinutes ? hours : null;
    });
    isMobile;

    private readonly viewport = inject(CALENDAR_VIEWPORT);
    protected readonly locale = inject(CalendarLocale);
    protected readonly labels = this.locale.labels;

    constructor() {
        this.isMobile = this.viewport.isMobile;
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

    scheduleBlocks(day: Date): { top: number; height: number; kind: ScheduleBlockKind }[] {
        if (this.todaySchedule()) return [];

        const hourHeight = this.isMobile() ? 56 : 60;
        const kind: ScheduleBlockKind = format(day, 'yyyy-MM-dd') in this.user().dayHoursOverrides() ? 'override' : 'dayOff';
        return [{top: 0, height: (this.endHourOf() - this.startHourOf()) * hourHeight, kind}];
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

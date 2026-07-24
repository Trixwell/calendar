import {ChangeDetectionStrategy, Component, computed, ContentChild, inject, input, model, TemplateRef} from '@angular/core';
import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format, isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek
} from "date-fns";
import {MasterTask} from "../../../entity";
import {DatePipe, NgTemplateOutlet} from "@angular/common";
import {uk} from "date-fns/locale";
import {isPastDate} from "../../../../../util/util";
import {Schedule} from "../../../entity";
import {WEEKDAY_NAMES} from "../../../entity";
import {CALENDAR_VIEWPORT} from "../../../../../providers/calendar-viewport.provider";

@Component({
    selector: 'app-calendar-grid-month',
    imports: [
        NgTemplateOutlet,
        DatePipe,
    ],
    templateUrl: './calendar-grid-month.component.html',
    styleUrl: './calendar-grid-month.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridMonthComponent {
    startDate = input.required<Date>();
    taskList = input<MasterTask[]>([]);
    maxVisiblePerDay = input<number>(3);
    loadMap = input<Record<string, number>>({});
    schedule = input<Schedule | null>(null);
    selectionMode = input<boolean>(false);

    selectedKeys = model<Date[]>([]);

    onDayClick = input<(date: Date) => void>(() => {});
    onDayDblClick = input<(date: Date) => void>(() => {});
    onWeekdayHeaderClick = input<(weekday: number) => void>(() => {});
    onEventClick = input<(task: MasterTask, date: Date) => void>(() => {});
    onMoreClick = input<(date: Date) => void>(() => {});
    onEventDrop = input<(p: { task: MasterTask; from: Date; to: Date }) => void>(() => {});

    @ContentChild('monthCell', {read: TemplateRef}) monthCellTpl?: TemplateRef<any>;
    @ContentChild('monthEvent', {read: TemplateRef}) monthEventTpl?: TemplateRef<any>;

    isMobile;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor() {
        this.isMobile = this.viewport.isMobile;
    }

    weekdayNames = computed(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1, locale: uk });
        const fmt = this.isMobile() ? 'EEEEEE' : 'EEEE';
        return eachDayOfInterval({ start, end: addDays(start, 6) })
            .map(d => {
                const s = format(d, fmt, { locale: uk });
                return s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);
            });
    });

    eventsByDay = computed(() => {
        const map = new Map<string, MasterTask[]>();
        for (const t of this.taskList()) {
            const k = format(t.assign_time, 'yyyy-MM-dd');
            if (!map.has(k)) map.set(k, []);
            map.get(k)!.push(t);
        }
        return map;
    });

    gridWeeks = computed(() => {
        const mStart = startOfMonth(this.startDate());
        const mEnd = endOfMonth(this.startDate());
        const gStart = startOfWeek(mStart, {weekStartsOn: 1});
        const gEnd = endOfWeek(mEnd, {weekStartsOn: 1});

        const days: Date[] = [];
        for (let d = gStart; d <= gEnd; d = addDays(d, 1)) days.push(d);

        const weeks: Date[][] = [];
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
        return weeks;
    });

    inMonth(d: Date) {
        return isSameMonth(d, this.startDate());
    }

    today(d: Date) {
        return isToday(d);
    }

    isWorkingDay(d: Date): boolean {
        const schedule = this.schedule();
        if (!schedule) return false;

        const weekdayName = WEEKDAY_NAMES[d.getDay()];
        const day = schedule[weekdayName];
        return !!(day?.is_working_day && day?.start_time && day?.end_time);
    }

    isTimeOff(d: Date) {
        const list = this.taskList() ?? [];
        return list.some((item: MasterTask) => {
            const sameDay = isSameDay(new Date(item.assign_time), d);
            if (!sameDay) return false;

            return item.taskType.isTimeOff();
        });
    }

    weekday(d: Date) {
        return ((d.getDay() + 6) % 7) + 1;
    }

    private hasDate(list: Date[], d: Date): boolean {
        return list.some(x => isSameDay(x, d));
    }

    private removeDates(list: Date[], toRemove: Date[]): Date[] {
        return list.filter(x => !toRemove.some(y => isSameDay(x, y)));
    }

    private weekdayDates(idx: number): Date[] {
        const res: Date[] = [];
        for (const week of this.gridWeeks()) {
            for (const d of week) if (this.weekday(d) === idx && this.inMonth(d)) res.push(d);
        }
        return res;
    }

    isSelected(d: Date) {
        return this.hasDate(this.selectedKeys(), d);
    }

    toggleSelect(d: Date, event?: MouseEvent) {
        if (isPastDate(d)) return this;
        if (this.isMobile() && !this.selectionMode()) return this;

        const list = [...this.selectedKeys()];
        const hasShift = event?.shiftKey ?? false;
        const mobile = this.isMobile() || window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

        if (hasShift || mobile) {
            if (this.hasDate(list, d)) {
                this.selectedKeys.set(list.filter(x => !isSameDay(x, d)));
            } else {
                this.selectedKeys.set([...list, new Date(d)]);
            }
        } else {
            this.selectedKeys.set([new Date(d)]);
        }

        this.onDayClick()(d);

        return this;
    }

    selectWeekday(idx: number) {
        if (this.isMobile() && !this.selectionMode()) return;

        const current = [...this.selectedKeys()];
        const targets = this.weekdayDates(idx);

        if (targets.length === 0) {
            this.onWeekdayHeaderClick()(idx);
            return;
        }

        const allSelected = targets.every(t => this.hasDate(current, t));
        if (allSelected) {
            this.selectedKeys.set(this.removeDates(current, targets));
        } else {
            const merged = [...current];
            for (const t of targets) {
                if (!this.hasDate(merged, t)) merged.push(new Date(t));
            }
            this.selectedKeys.set(merged);
        }

        this.onWeekdayHeaderClick()(idx);
    }


    eventsFor(d: Date) {
        return this.eventsByDay().get(format(d, 'yyyy-MM-dd')) ?? [];
    }

    visibleEvents(d: Date) {
        return this.eventsFor(d).slice(0, this.maxVisiblePerDay());
    }

    moreCount(d: Date) {
        const total = this.eventsFor(d).length;
        return Math.max(0, total - this.maxVisiblePerDay());
    }
}

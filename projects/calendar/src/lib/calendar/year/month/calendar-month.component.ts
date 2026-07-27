import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, inject, input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NgClass, TitleCasePipe} from "@angular/common";
import {MasterTask, TaskStatusEnum} from "../../core/entity";
import {User} from "../../core/entity";
import {LoadIndicatorComponent} from "../../core/components/load-indicator/load-indicator.component";
import {isSameDay} from "date-fns";
import {getStatusClassesForDay, isPastDate, mapStatusesByDate} from "../../../util/util";
import {WEEKDAY_NAMES} from "../../core/entity";
import {CALENDAR_USER} from "../../../providers/calendar-user.provider";

@Component({
    selector: 'app-calendar-month',
    imports: [
        TitleCasePipe,
        LoadIndicatorComponent,
        NgClass
    ],
    templateUrl: './calendar-month.component.html',
    styleUrl: './calendar-month.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarMonthComponent implements OnInit, OnChanges {
    current_date = input<Date>(new Date());
    selectDay = input<(date: Date, unset: boolean) => void>(() => {});
    dayDbClick = input<(date: Date) => void>(() => {});
    task_list = input<MasterTask[]>([]);
    clear = input<(except: CalendarMonthComponent) => void>(() => {});
    singleSelect = input<boolean>(false);
    allowPastSelection = input<boolean>(false);

    days_of_week = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    days_in_month: number[] = [];
    blank_days: number[] = [];
    selected_idx: number[] = [];
    statusMap: Record<string, TaskStatusEnum[]> = {};
    private user: User | null = null;

    private readonly userProvider = inject(CALENDAR_USER);

    constructor(
        private destroyRef: DestroyRef,
        private cdr: ChangeDetectorRef,
    ) {
        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
            this.user = user;
            this.cdr.markForCheck();
        });
    }

    ngOnInit(): void {
        this.generateCalendar();
        this.buildStatusMap();
    }

    ngOnChanges(changes: SimpleChanges){
        if (changes['task_list']) {
            this.buildStatusMap();
        }
    }

    get monthName(): string {
        return <string>this.current_date()?.toLocaleString('uk-UA', {month: 'long'});
    }

    generateCalendar(): void {
        const y = this.current_date().getFullYear();
        const m = this.current_date().getMonth();

        const firstDow = new Date(y, m, 1, 12).getDay();
        const offset   = firstDow === 0 ? 6 : firstDow - 1;

        const prevDays = new Date(y, m,   0, 12).getDate();
        const currDays = new Date(y, m+1, 0, 12).getDate();

        const left  = Array.from({ length: offset }, (_, i) => prevDays - offset + 1 + i);
        const mid   = Array.from({ length: currDays }, (_, i) => i + 1);
        const used  = left.length + mid.length;
        const post  = (7 - (used % 7)) % 7;
        const right = Array.from({ length: post }, (_, i) => i + 1);

        this.blank_days   = left;
        this.days_in_month = [...left, ...mid, ...right];
    }

    selectDayInCalendar(day: number, idx: number, event?: MouseEvent) {
        const date = this.dateForCell(day, idx);

        if (this.singleSelect()) {
            this.clear()(this);
            this.emitSelectDiffIdx([idx]);
            return this;
        }

        if (!this.allowPastSelection() && isPastDate(new Date(date))) {
            return this;
        }

        const mobile = window.innerWidth <= 800
            || window.matchMedia('(pointer: coarse)').matches
            || navigator.maxTouchPoints > 0;

        if (event?.shiftKey || mobile) {
            const set = new Set(this.selected_idx);
            set.has(idx) ? set.delete(idx) : set.add(idx);
            this.emitSelectDiffIdx(Array.from(set).sort((a, b) => a - b));
            return this;
        }

        this.clear()(this);
        this.emitSelectDiffIdx([idx]);

        return this;
    }


    private emitSelectDiffIdx(newIdx: number[]) {
        const removed = this.selected_idx.filter(i => !newIdx.includes(i));
        for (const i of removed) {
            const d = this.days_in_month[i];
            this.selectDay()(this.dateForCell(d, i), true);
        }

        const added = newIdx.filter(i => !this.selected_idx.includes(i));
        for (const i of added) {
            const d = this.days_in_month[i];
            this.selectDay()(this.dateForCell(d, i), false);
        }

        this.selected_idx = newIdx;
        this.cdr.markForCheck();
    }

    public clearAllSelected(): void {
        this.emitSelectDiffIdx([]);
    }

    public resetSelection(): void {
        this.selected_idx = [];
        this.cdr.markForCheck();
    }

    selectWeekday(colIndex: number, event?: MouseEvent): void {
        if (this.singleSelect()) {
            return;
        }

        const indices = this.days_in_month
            .map((day, idx) => ({ day, idx }))
            .filter(x => {
                const date = this.dateForCell(x.day, x.idx);
                return this.isCurrIdx(x.idx)
                    && x.idx % 7 === colIndex
                    && !isPastDate(new Date(date));
            })
            .map(x => x.idx);

        if (indices.length === 0) return;

        const set = new Set(this.selected_idx);
        const allSelected = indices.every(i => set.has(i));

        const mobile = window.innerWidth <= 800
            || window.matchMedia('(pointer: coarse)').matches
            || navigator.maxTouchPoints > 0;

        if (event?.shiftKey || mobile) {
            if (allSelected) indices.forEach(i => set.delete(i));
            else indices.forEach(i => set.add(i));
            this.emitSelectDiffIdx(Array.from(set).sort((a, b) => a - b));
            return;
        }

        this.clear()(this);
        this.emitSelectDiffIdx(indices);
    }

    isWeekdaySelected(colIndex: number): boolean {
        return this.days_in_month
            .map((_, idx) => idx)
            .filter(idx => this.isCurrIdx(idx) && idx % 7 === colIndex)
            .every(idx => this.selected_idx.includes(idx));
    }

    isToday(day: number): boolean {
        const today = new Date();

        return day === today.getDate() &&
            this.current_date().getMonth() === today.getMonth() &&
            this.current_date().getFullYear() === today.getFullYear();
    }

    getFullDateByDay(day: number){
       return this.current_date().getFullYear() + '-' +
        (this.current_date().getMonth()+1).toString().padStart(2,'0') + '-' +
        day.toString().padStart(2,'0')
    }

    private buildStatusMap() {
        this.statusMap = mapStatusesByDate(this.task_list());
    }

    getStatusClasses(day: number): string[] {
        return getStatusClassesForDay(
            day,
            this.current_date(),
            this.statusMap
        );
    }

    onDayDbClickInCalendar(date: string) {
        this.dayDbClick()(new Date(date));
        return this;
    }

    isWorkingDay(day: number, idx: number): boolean {
        if (!this.user?.schedule) return false;

        const date = this.dateForCell(day, idx);
        const weekdayName = WEEKDAY_NAMES[date.getDay()];
        const scheduleDay = this.user.schedule[weekdayName];
        return !!(scheduleDay?.is_working_day && scheduleDay?.start_time && scheduleDay?.end_time);
    }

    isDayTimeOff(day: number){
        const list = this.task_list() ?? [];

        return list.some((item: MasterTask) => {
            const sameDay = isSameDay(item.assign_time.slice(0, 10), this.getFullDateByDay(day));
            if (!sameDay) return false;

            return item.taskType.isTimeOff()
        });
    }

    private dateForCell(day: number, idx: number): Date {
        let { y, m, offset, currDays } = this.monthMeta();
        if (idx < offset) {
            m = m - 1; if (m < 0) { m = 11; y--; }
        } else if (idx >= offset + currDays) {
            m = m + 1; if (m > 11) { m = 0; y++; }
        }

        return new Date(y, m, day, 12);
    }

    getFullDateByCell(day: number, idx: number): string {
        const d = this.dateForCell(day, idx);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    private monthMetaSignal = computed(() => {
        const y = this.current_date().getFullYear();
        const m = this.current_date().getMonth();
        const firstDow = new Date(y, m, 1, 12).getDay();
        const offset   = firstDow === 0 ? 6 : firstDow - 1;
        const currDays = new Date(y, m+1, 0, 12).getDate();
        return { y, m, offset, currDays };
    });

    private monthMeta() {
        return this.monthMetaSignal();
    }

    isPrevIdx(idx: number): boolean {
        const { offset } = this.monthMeta();
        return idx < offset;
    }

    isCurrIdx(idx: number): boolean {
        const { offset, currDays } = this.monthMeta();
        return idx >= offset && idx < offset + currDays;
    }

    isNextIdx(idx: number): boolean {
        const { offset, currDays } = this.monthMeta();
        return idx >= offset + currDays;
    }
}

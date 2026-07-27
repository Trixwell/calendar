import {
    AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
    Component, computed,
    ContentChild, effect,
    ElementRef, inject, input, model, OnDestroy,
    OnInit,
    signal,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {DatePipe, NgClass, NgTemplateOutlet} from "@angular/common";
import {MasterTask} from "../../entity";
import {LoadIndicatorComponent} from "../load-indicator/load-indicator.component";
import {LoadPercentComponent} from "../calendar-day-slider/load-percent/load-percent.component";
import {CALENDAR_VIEWPORT} from "../../../../providers/calendar-viewport.provider";
import {interval, Subscription} from "rxjs";
import {CalendarView} from "../../entity";
import {CdkDrag, CdkDragEnd, CdkDragStart} from "@angular/cdk/drag-drop";
import {isSameDay} from "date-fns";
import {clampToRange, dateFromY, isFullDayOff, isPastDate, quantizeEndY, quantizeStartY} from "../../../../util/util";
import {MobileRangeSelectionComponent} from "./mobile-range-selection/mobile-range-selection.component";

@Component({
  selector: 'app-calendar-grid',
    imports: [
        DatePipe,
        LoadIndicatorComponent,
        LoadPercentComponent,
        MobileRangeSelectionComponent,
        NgClass,
        NgTemplateOutlet,
    ],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridComponent implements OnInit, AfterViewInit, OnDestroy{
    mode = input<CalendarView>(CalendarView.DAY);
    dates = input<Date[]>([]);
    events = input<MasterTask[]>([]);
    startHour = input(0);
    endHour = input(24);
    hourHeight = input(60);

    onSlotClick = input<(date: Date) => void>(() => {});
    onHeaderClick = input<(day: Date) => void>(() => {});
    onRangeSelect = input<(start: Date, end: Date) => void>(() => {});
    onEventDrop = input<
        (task: MasterTask, oldStart: Date, newStart: Date) => void
    >(() => {});

    selectedDates = model<Date[]>([]);

    @ContentChild('dayCol', { static: false }) dayColTemplate!: TemplateRef<any>;
    @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;
    @ViewChild('dayHeaderContainer', { read: ElementRef, static: true })
    dayContainerRef!: ElementRef<HTMLElement>;

    timerLine!: Subscription;
    nowLineTop = 0;
    currentTimeLine = new Date();

    moved = false;
    isDragging = false;
    isSelecting = false;

    selectingDay: Date | null = null;
    activeMobileSelectionDay = signal<Date | null>(null);
    startY = 0;
    containerRect!: DOMRect;
    selectionTop = 0;
    selectionHeight = 0;
    selectionStart!: Date;
    selectionEnd!: Date;

    private gridBodyRect!: DOMRect;
    private dragPrevStart!: Date;
    private pendingDrag?: CdkDrag;

    private boundMove = this.onDocumentMove.bind(this);
    private boundUp = this.onDocumentUp.bind(this);

    @ViewChild('headerCell', { static: true }) headerCell!: ElementRef<HTMLElement>;
    headerOffset = 0;

    isMobile;

    private datesRangeKey = computed(() => this.dates().map(d => d.getTime()).join(','));

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor(protected cdr: ChangeDetectorRef) {
        this.isMobile = this.viewport.isMobile;

        effect(() => {
            this.datesRangeKey();
            this.resetSelectionState();
            this.selectedDates.set([]);
        });
    }

    hours = computed(() =>
        Array.from({ length: this.endHour() - this.startHour() }, (_, i) => this.startHour() + i)
    );

    private resetSelectionState(): void {
        this.isSelecting = false;
        this.selectingDay = null;
        this.moved = false;
        this.activeMobileSelectionDay.set(null);
        this.cdr.markForCheck();
    }

    ngOnInit(): void {
        this.timerLine = interval(60_000).subscribe(() => {
            this.currentTimeLine = new Date();
            this.updateNowLine();
            this.cdr.markForCheck();
        });
    }

    private getCellWidth(): number {
        const lbl = this.dayContainerRef.nativeElement.querySelector('.day-label') as HTMLElement;
        return lbl.getBoundingClientRect().width;
    }

    onEventDragStarted(ev: CdkDragStart) {
        this.isDragging = true;
        this.isSelecting = false;
        this.pendingDrag = ev.source;

        this.dragPrevStart = new Date(ev.source.data.assign_time);
        this.gridBodyRect = this.containerRef.nativeElement.getBoundingClientRect();
    }

    onEventDragEnded(ev: CdkDragEnd) {
        const elRect = ev.source.element.nativeElement.getBoundingClientRect();
        const relY = elRect.top  - this.gridBodyRect.top  - this.headerOffset;
        const relX = elRect.left - this.gridBodyRect.left;

        const maxY = (this.endHour() - this.startHour()) * this.hourHeight();
        const steppedTop = quantizeStartY(
            Math.max(0, Math.min(maxY, relY)), this.hourHeight()
        );

        const idx = Math.min(Math.max(
            Math.floor(relX / this.getCellWidth()
            ), 0), this.dates().length - 1);
        const day = this.dates()[idx];

        const newDate = dateFromY(day, steppedTop, this.startHour(), this.endHour(), this.hourHeight());
        newDate.setHours(newDate.getHours() - 1)

        this.onEventDrop()(ev.source.data, this.dragPrevStart, newDate);

        const kill = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
        document.addEventListener('click', kill, { capture: true, once: true });

        this.isDragging = false;
        this.cdr.markForCheck();
    }

    private positionedEventsByDay = computed(() => {
        const map = new Map<string, (MasterTask & { top: number; height: number })[]>();
        for (const e of this.events()) {
            const s = new Date(e.assign_time);
            const key = s.toDateString();
            const eDate = new Date(e.approximate_end_time);
            const top =
                (s.getHours() - this.startHour()) * this.hourHeight() +
                (s.getMinutes() / 60) * this.hourHeight();
            const height = ((eDate.getTime() - s.getTime()) / (1000 * 60 * 60)) * this.hourHeight();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push({ ...e, top, height });
        }
        return map;
    });

    generatePositionEvents(day: Date) {
        return this.positionedEventsByDay().get(day.toDateString()) ?? [];
    }

    isToday(d: Date): boolean {
        return new Date().toDateString() === d.toDateString();
    }

    isWeekend(d: Date): boolean {
        return d.getDay() === 0 || d.getDay() === 6;
    }

    private updateNowLine() {
        const now = new Date();
        const minutesSinceStart =
            (now.getHours() - this.startHour()) * 60 +
            now.getMinutes() +
            now.getSeconds() / 60;

        this.nowLineTop = (minutesSinceStart / 60) * this.hourHeight() + 20;
    }

    onSelectionStart(e: MouseEvent, day: Date) {
        if(this.isDragging){
            return;
        }

        e.preventDefault();
        const el = e.currentTarget as HTMLElement;
        this.containerRect = el.getBoundingClientRect();

        const maxY = this.containerRect.height - this.headerOffset;
        const rawY = Math.max(0, Math.min(maxY, e.clientY - this.containerRect.top - this.headerOffset));

        this.startY = quantizeStartY(rawY, this.hourHeight());

        this.selectionTop = this.startY;
        this.selectionHeight = 0;
        this.selectionStart = dateFromY(day, this.startY, this.startHour(), this.endHour(), this.hourHeight());

        this.moved = false;
        this.isSelecting = true;
        this.selectingDay = day;

        document.addEventListener('mousemove', this.boundMove);
        document.addEventListener('mouseup', this.boundUp);
    }

    private onDocumentUp(e: MouseEvent) {
        if (this.isSelecting && this.selectingDay) {
            if (this.moved) {
                const [start, end] = clampToRange(
                    this.selectingDay, this.selectionStart, this.selectionEnd, this.startHour(), this.endHour()
                );
                this.onRangeSelect()(start, end);
            } else if(!this.isDragging) {
                this.gridClick(e, this.selectingDay);
            }
        }

        this.isSelecting = false;
        this.selectingDay = null;
        this.cdr.markForCheck();

        document.removeEventListener('mousemove', this.boundMove);
        document.removeEventListener('mouseup', this.boundUp);
    }

    gridClick(e: MouseEvent, day: Date) {
        const y = e.clientY - this.containerRect.top - this.headerOffset;
        const hoursFrac = this.startHour() + y / this.hourHeight();
        if (hoursFrac < this.startHour() || hoursFrac > this.endHour()) return;

        const date = new Date(day);
        date.setHours(
            Math.floor(hoursFrac),
            Math.round((hoursFrac % 1) * 60)
        );
        this.onSlotClick()(date);
    }

    private onDocumentMove(e: MouseEvent) {
        if (!this.isSelecting || !this.selectingDay) return;
        this.moved = true;

        const maxY = this.containerRect.height - this.headerOffset;
        const rawY = Math.max(0, Math.min(maxY, e.clientY - this.containerRect.top - this.headerOffset));
        const endY = quantizeEndY(rawY, this.hourHeight());

        let topY = this.startY;
        let height = endY - this.startY;
        if (height < 0) {
            topY = endY;
            height = -height;
        }

        this.selectionTop = topY;
        this.selectionHeight = height;

        this.selectionStart = dateFromY(this.selectingDay!, topY, this.startHour(), this.endHour(), this.hourHeight());
        this.selectionEnd = dateFromY(this.selectingDay!, topY + height, this.startHour(), this.endHour(), this.hourHeight());
        this.cdr.markForCheck();
    }

    dayHeaderClick(date: Date){
        if (isPastDate(date)) return this;

        this.toggleSelectedDate(date);
        this.onHeaderClick()(date);

        return this;
    }

    private hasDate(list: Date[], d: Date): boolean {
        return list.some(x => isSameDay(x, d));
    }

    private toggleSelectedDate(date: Date): void {
        const list = this.selectedDates();
        if (this.hasDate(list, date)) {
            this.selectedDates.set(list.filter(d => !isSameDay(d, date)));
        } else {
            this.selectedDates.set([...list, new Date(date)]);
        }
    }

    isSelected(date: Date): boolean {
        return this.hasDate(this.selectedDates(), date);
    }

    showNowLine(): boolean {
        const now = new Date();
        const start = this.startHour();
        const end   = this.endHour();

        const nowH = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

        const dates = this.dates?.() ?? [];
        const todayVisible = !dates.length || dates.some(d => d.toDateString() === now.toDateString());

        return todayVisible && nowH >= start && nowH <= end;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.updateNowLine();
            this.cdr.detectChanges();
        }, 0);

        this.headerOffset = 0;
    }

    ngOnDestroy() {
        this.timerLine?.unsubscribe();
        document.removeEventListener('mousemove', this.boundMove);
        document.removeEventListener('mouseup', this.boundUp);
    }

    protected Date = Date;
    protected readonly CalendarView = CalendarView;
    protected readonly isFullDayOff = isFullDayOff;
    protected readonly isPastDate = isPastDate;
}

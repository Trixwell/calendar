import {
    ChangeDetectionStrategy, ChangeDetectorRef, computed,
    Component, DestroyRef, effect, untracked,
    inject, input,
    Input, model, OnInit, output,
    signal,
    ViewChild,
    ViewEncapsulation, WritableSignal
} from '@angular/core';
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {catchError, distinctUntilChanged, EMPTY, forkJoin, map, merge, of, Subject, switchMap, tap} from "rxjs";
import {MasterTask} from "./core/entity";
import {FormsModule} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {MatButtonModule} from "@angular/material/button";
import {CalendarYearComponent} from "./year/calendar-year.component";
import {CalendarDayComponent} from "./day/calendar-day.component";
import {ToggleDateBarComponent} from "./core/components/toggle-date-bar/toggle-date-bar.component";
import {User} from "./core/entity";
import {addDays, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear} from "date-fns";
import {CalendarWeekComponent} from "./week/calendar-week.component";
import {CalendarMonthComponent} from "./month/calendar-month.component";
import {CalendarView} from "./core/entity";
import {MatFormField} from "@angular/material/input";
import {MatOption} from "@angular/material/core";
import {MatSelect} from "@angular/material/select";
import {CALENDAR_DATA} from "../providers/calendar-data.provider";
import {CalendarDayHours} from "../contracts/calendar-user-context";
import {CALENDAR_USER} from "../providers/calendar-user.provider";
import {CALENDAR_VIEWPORT} from "../providers/calendar-viewport.provider";
import {DatePickerModalComponent} from "./core/components/modal/date-picker-modal/date-picker-modal.component";
import {shiftMonthRange} from "../util/util";
import {CalendarLocale} from "../i18n/calendar-locale";

@Component({
    selector: 'app-calendar',
    imports: [
        FormsModule,
        MatButtonToggleGroup,
        MatButtonToggle,
        CalendarYearComponent,
        CalendarDayComponent,
        ToggleDateBarComponent,
        CalendarWeekComponent,
        CalendarMonthComponent,
        MatFormField,
        MatOption,
        MatSelect,
        MatButtonModule,
        DatePickerModalComponent,
    ],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit{
    @Input() start_date: Date = new Date(new Date().getFullYear(), 0, 1);
    @Input() end_date: Date = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
    showYearView = input<boolean>(true);
    day:        WritableSignal<Date> = signal<Date>(new Date());

    task_list: WritableSignal<MasterTask[]> = signal<MasterTask[]>([]);
    year: WritableSignal<number | null> = signal<number | null>(null);
    view: WritableSignal<CalendarView> = signal<CalendarView>(CalendarView.YEAR);
    user: User | null = null;
    private loadedDayHoursOverrides: Record<string, CalendarDayHours | null> = {};
    isMobile;

    daySelectionMode = model<boolean>(false);
    selectedDays = model<Date[]>([]);
    daysConfirmed = output<Date[]>();
    dateSelected = output<Date>();
    rangeSelected = output<{ start: Date; end: Date }>();
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    moreOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    iconClick = output<void>();

    @ViewChild('datePicker') datePickerModal!: DatePickerModalComponent;

    private readonly calendarData = inject(CALENDAR_DATA);
    private readonly userProvider = inject(CALENDAR_USER);
    private readonly viewport = inject(CALENDAR_VIEWPORT);
    private readonly reload$ = new Subject<void>();
    protected readonly labels = inject(CalendarLocale).labels;

    constructor(
        protected snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private destroyRef: DestroyRef,
    ) {
        this.year.set(new Date().getFullYear());

        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
            // CALENDAR_USER now speaks the general CalendarUserContext contract, but this
            // component's own views (day/week/month) still render booking-domain fields
            // (categories, task types) that only exist on the concrete User class. Every
            // provider actually wired up for this component supplies a real User instance.
            this.user = user as User | null;
            this.user?.dayHoursOverrides.set(this.loadedDayHoursOverrides);
            this.cdr.markForCheck();
        });

        effect(() => {
            const day = this.day();
            if (this.view() === CalendarView.YEAR) return;
            untracked(() => {
                if (this.year() !== day.getFullYear()) this.year.set(day.getFullYear());
            });
        });

        merge(
            toObservable(this.visibleRange).pipe(
                distinctUntilChanged((a, b) => a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime()),
            ),
            this.reload$.pipe(map(() => this.visibleRange())),
        ).pipe(
            tap(({start, end}) => {
                this.start_date = start;
                this.end_date = end;
                this.cdr.markForCheck();
            }),
            switchMap(({start, end}) => {
                const startISO = format(start, "yyyy-MM-dd'T'HH:mm:ss");
                const endISO = format(end, "yyyy-MM-dd'T'HH:mm:ss");
                const overrides$ = this.calendarData.getDayHoursOverrides?.(startISO, endISO) ?? of({});

                return forkJoin({
                    tasks: this.calendarData.getTasks(startISO, endISO),
                    overrides: overrides$.pipe(catchError(() => of({}))),
                }).pipe(catchError(() => EMPTY));
            }),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(({tasks, overrides}) => {
            this.task_list.set(tasks as MasterTask[]);
            this.loadedDayHoursOverrides = overrides;
            this.user?.dayHoursOverrides.set(overrides);
            this.cdr.markForCheck();
        });

        this.isMobile = this.viewport.isMobile;
    }

    ngOnInit(): void {
        this.setView();
    }

    generateCalendar(): void {
        this.reload$.next();
    }

    dayDbClick = (date: Date) => {
        this.day.set(date);
        this.view.set(CalendarView.DAY);
    };

    shiftMonth(delta: number): void {
        const {start} = shiftMonthRange(this.day(), delta);

        this.day.set(start);
    }

    onRangeSelect = (start: Date, end: Date) => {
        this.rangeSelected.emit({start, end});
    };

    enterDaySelectionMode(): void {
        this.selectedDays.set([]);
        this.daySelectionMode.set(true);
    }

    cancelDaySelection(): void {
        this.daySelectionMode.set(false);
        this.selectedDays.set([]);
    }

    confirmDaySelection(): void {
        this.daysConfirmed.emit(this.selectedDays());
    }

    onEventOpen = (payload: { task: MasterTask; date: Date; anchor: HTMLElement }): void => {
        this.eventOpen.emit(payload);
    };

    onMoreOpen = (payload: { task: MasterTask; date: Date; anchor: HTMLElement }): void => {
        this.moreOpen.emit(payload);
    };

    setView(view?: CalendarView){
        if(!view){
            const stored = localStorage.getItem('calendarView') as CalendarView | null;
            const isKnown = !!stored && Object.values(CalendarView).includes(stored);

            if (!this.showYearView() && (!isKnown || stored === CalendarView.YEAR)) {
                this.setView(CalendarView.MONTH);
                return;
            }

            this.setView(isKnown ? stored! : CalendarView.YEAR);
            return;
        }

        if (view === CalendarView.YEAR && !this.showYearView()) {
            view = CalendarView.MONTH;
        }

        localStorage.setItem('calendarView', view);
        this.view.set(view);
        this.selectedDays.set([]);

        return this;
    }

    onCalendarIconClick(): void {
        if (this.isMobile()) {
            this.datePickerModal.open();
        } else {
            this.iconClick.emit();
        }
    }

    onDateChosen(date: Date): void {
        this.day.set(date);
        this.view.set(CalendarView.DAY);
        this.dateSelected.emit(date);
    }

    onWeekDayHeader = (date: Date) => {
        this.dateSelected.emit(date);
    };

    onAdjustDaysRequested(): void {
        this.view.set(CalendarView.MONTH);
        this.daySelectionMode.set(true);
        this.selectedDays.set([]);
    }

    private readonly weekStartsOn = inject(CalendarLocale).weekStartsOn;

    weekStart = computed(() => startOfWeek(this.day(), { weekStartsOn: this.weekStartsOn }));

    weekEnd = computed(() => addDays(this.weekStart(), 6));

    visibleRange = computed(() => {
        const day = this.day();
        const weekStartsOn = this.weekStartsOn;

        switch (this.view()) {
            case CalendarView.DAY:
                return {start: startOfDay(day), end: endOfDay(day)};
            case CalendarView.WEEK:
                return {start: startOfDay(this.weekStart()), end: endOfDay(this.weekEnd())};
            case CalendarView.MONTH:
                return {
                    start: startOfWeek(startOfMonth(day), {weekStartsOn}),
                    end: endOfWeek(endOfMonth(day), {weekStartsOn}),
                };
            default: {
                const year = new Date(this.year() ?? day.getFullYear(), 0, 1);
                return {start: startOfYear(year), end: endOfYear(year)};
            }
        }
    });

    monthStart = computed(() => startOfMonth(this.day()));

    monthEnd = computed(() => {
        const end = endOfMonth(this.day());
        end.setHours(23, 59, 59, 999);
        return end;
    });

    eventsByDay = computed(() => {
        const map = new Map<string, MasterTask[]>();
        for (const t of this.task_list()) {
            const k = format(t.getStart(), 'yyyy-MM-dd');
            if (!map.has(k)) map.set(k, []);
            map.get(k)!.push(t);
        }
        return map;
    });

    protected readonly CalendarView = CalendarView;
}

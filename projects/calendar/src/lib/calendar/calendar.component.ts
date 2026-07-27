import {
    ChangeDetectionStrategy, ChangeDetectorRef, computed,
    Component, DestroyRef, effect,
    inject,
    Input, OnInit, output,
    signal,
    ViewChild,
    ViewEncapsulation, WritableSignal
} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {registerLocaleData} from "@angular/common";
import localeUk from "@angular/common/locales/uk";
import {MasterTask} from "./core/entity";
import {FormsModule} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {MatButtonModule} from "@angular/material/button";
import {CalendarYearComponent} from "./year/calendar-year.component";
import {CalendarDayComponent} from "./day/calendar-day.component";
import {ToggleDateBarComponent} from "./core/components/toggle-date-bar/toggle-date-bar.component";
import {User} from "./core/entity";
import {addDays, endOfMonth, format, startOfMonth, startOfWeek} from "date-fns";
import {CalendarWeekComponent} from "./week/calendar-week.component";
import {CalendarMonthComponent} from "./month/calendar-month.component";
import {CalendarView} from "./core/entity";
import {MatFormField} from "@angular/material/input";
import {MatOption} from "@angular/material/core";
import {MatSelect} from "@angular/material/select";
import {CALENDAR_DATA} from "../providers/calendar-data.provider";
import {CALENDAR_USER} from "../providers/calendar-user.provider";
import {CALENDAR_VIEWPORT} from "../providers/calendar-viewport.provider";
import {DatePickerModalComponent} from "./core/components/modal/date-picker-modal/date-picker-modal.component";

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
    day:        WritableSignal<Date> = signal<Date>(new Date());

    task_list: MasterTask[] = [];
    year: WritableSignal<number | null> = signal<number | null>(null);
    view: WritableSignal<CalendarView> = signal<CalendarView>(CalendarView.YEAR);
    user!: User;
    isMobile;

    daySelectionMode = signal<boolean>(false);
    selectedDays = signal<Date[]>([]);
    daysConfirmed = output<Date[]>();
    dateSelected = output<Date>();
    rangeSelected = output<{ start: Date; end: Date }>();

    @ViewChild('datePicker') datePickerModal!: DatePickerModalComponent;

    private readonly calendarData = inject(CALENDAR_DATA);
    private readonly userProvider = inject(CALENDAR_USER);
    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor(
        protected snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private destroyRef: DestroyRef,
    ) {
        registerLocaleData(localeUk);

        this.year.set(new Date().getFullYear());

        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
            if(user) {
                this.user = user;
                this.cdr.markForCheck();
            }
        });

        effect(() => {
           this.changeYear();
        });

        this.isMobile = this.viewport.isMobile;
    }

    ngOnInit(): void {
        this.setView();
    }

    changeYear(): void {
        const year = this.year();
        if (!year) return;

        this.start_date = new Date(year, 0, 1);
        this.end_date   = new Date(year, 11, 31, 23, 59, 59, 999);
        this.generateCalendar();
    }

    generateCalendar(): void {
        const start      = new Date(this.start_date.getFullYear(), this.start_date.getMonth(), 1);
        const search_end = new Date(this.end_date.getFullYear(),   this.end_date.getMonth() + 1, 1);

        this.calendarData.getTasks(start.toISOString(), search_end.toISOString()).subscribe(taskList => {
            this.task_list = taskList;
            this.cdr.markForCheck();
        });
    }

    dayDbClick = (date: Date) => {
        this.day.set(date);
        this.view.set(CalendarView.DAY);
    };

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
        this.daySelectionMode.set(false);
        this.selectedDays.set([]);
    }

    setView(view?: CalendarView){
        if(!view){
            this.view.set(localStorage.getItem('calendarView') as CalendarView);
            return;
        }

        localStorage.setItem('calendarView', view);
        this.view.set(view);

        if (view === CalendarView.YEAR) {
            const y = this.year() ?? this.day().getFullYear();
            this.start_date = new Date(y, 0, 1);
            this.end_date   = new Date(y, 11, 31);
        }

        return this;
    }

    onCalendarIconClick(): void {
        this.datePickerModal.open();
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

    weekStart = computed(() => startOfWeek(this.day(), { weekStartsOn: 1 }));

    weekEnd = computed(() => addDays(this.weekStart(), 6));

    monthStart = computed(() => startOfMonth(this.day()));

    monthEnd = computed(() => {
        const end = endOfMonth(this.day());
        end.setHours(23, 59, 59, 999);
        return end;
    });

    eventsByDay = computed(() => {
        const map = new Map<string, MasterTask[]>();
        for (const t of this.task_list) {
            const k = format(t.assign_time, 'yyyy-MM-dd');
            if (!map.has(k)) map.set(k, []);
            map.get(k)!.push(t);
        }
        return map;
    });

    protected readonly CalendarView = CalendarView;
}

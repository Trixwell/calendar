import {ChangeDetectionStrategy, Component, inject, input, model} from '@angular/core';
import {MatFormField} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {CalendarView} from "../../entity";
import {FormsModule} from "@angular/forms";
import {
    addDays,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import {shiftMonthRange} from "../../../../util/util";
import {DatePipe} from "@angular/common";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {CALENDAR_VIEWPORT} from "../../../../providers/calendar-viewport.provider";
import {CalendarLocale} from "../../../../i18n/calendar-locale";
import {MasterTask} from "../../entity";
import {CalendarDaySliderComponent} from "../calendar-day-slider/calendar-day-slider.component";

@Component({
  selector: 'app-toggle-date-bar',
    imports: [
        MatFormField,
        MatOption,
        MatSelect,
        MatFormField,
        FormsModule,
        MatIcon,
        MatIconButton,
        CalendarDaySliderComponent,
    ],
    providers: [DatePipe],
  templateUrl: './toggle-date-bar.component.html',
  styleUrl: './toggle-date-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleDateBarComponent {
    view      = model.required<CalendarView>();
    day       = model.required<Date>();
    year      = model.required<number | null>();
    startDate = model.required<Date>();
    endDate   = model.required<Date>();
    taskList  = input<MasterTask[]>([]);

    readonly CalendarView = CalendarView;
    readonly years: number[];
    isMobile;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    private readonly locale = inject(CalendarLocale);

    constructor(private datePipe: DatePipe) {
        const currentYear = new Date().getFullYear();
        this.years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
        this.isMobile = this.viewport.isMobile;
    }

    prev()  { this.shift( -1 ); }
    next()  { this.shift( +1 ); }

    private shift(delta: number) {
        switch (this.view()) {
            case CalendarView.YEAR: {
                const y = (this.year() ?? new Date().getFullYear()) + delta;
                this.year.set(y);
                break;
            }
            case CalendarView.DAY: {
                this.day.set(addDays(this.day(), delta));
                break;
            }
            case CalendarView.WEEK: {
                this.day.set(addDays(this.day(), delta * 7));
                break;
            }
            case CalendarView.MONTH: {
                const {start: mStart, end: mEnd} = shiftMonthRange(this.day(), delta);

                this.day.set(mStart);
                this.startDate.set(mStart);
                this.endDate.set(mEnd);

                if (this.year() !== mStart.getFullYear()) {
                    this.year.set(mStart.getFullYear());
                }
                break;
            }
        }
    }

    get title(): string {
        const d = this.day();
        switch (this.view()) {
            case CalendarView.YEAR:
                return `${this.year()}`;
            case CalendarView.DAY:
                return this.datePipe.transform(d, 'd MMMM yyyy', undefined, this.locale.intlTag)!;
            case CalendarView.WEEK: {
                const s = startOfWeek(d, { weekStartsOn: this.locale.weekStartsOn });
                const e = endOfWeek(d,   { weekStartsOn: this.locale.weekStartsOn });

                const f1 = this.datePipe.transform(s, 'd',        undefined, this.locale.intlTag);
                const f2 = this.datePipe.transform(e, 'd MMM yyyy', undefined, this.locale.intlTag);

                return `${f1}–${f2}`;
            }
            case CalendarView.MONTH:
                return this.datePipe.transform(d, 'LLLL yyyy', undefined, this.locale.intlTag)!;
            default:
                return '';
        }
    }
}

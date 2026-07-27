import {
    ChangeDetectionStrategy,
    Component,
    effect,
    Input,
    model,
    OnChanges,
    QueryList, SimpleChanges,
    ViewChildren
} from '@angular/core';
import {CalendarMonthComponent} from "./month/calendar-month.component";
import {MasterTask} from "../core/entity";

@Component({
  selector: 'app-calendar-year',
    imports: [
        CalendarMonthComponent,
    ],
  templateUrl: './calendar-year.component.html',
  styleUrl: './calendar-year.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarYearComponent implements OnChanges {
    @Input() startDate: Date = new Date(2025, 0, 1);
    @Input() endDate:   Date = new Date(2025, 11, 1);
    @Input() taskList: MasterTask[] = [];
    @Input() dayDbClick = (date: any) => {};

    month_list: { month: number, year: number, first_date: Date }[] = [];
    selectedDays = model<Date[]>([]);

    @ViewChildren('months_components') months_components!: QueryList<CalendarMonthComponent>;

    constructor(){
        this.setMonthList();

        effect(() => {
            if (this.selectedDays().length === 0) {
                this.months_components?.forEach(m => m.resetSelection());
            }
        });
    }

    selectDay = (date: Date, unset: boolean) => {
        if (unset) {
            this.selectedDays.update(days => days.filter(d => d.getTime() !== date.getTime()));
        } else {
            this.selectedDays.update(days => [...days, date]);
        }
    };

    clearAllExcept = (except: CalendarMonthComponent) => {
        this.months_components?.forEach(m => {
            if (m !== except) m.clearAllSelected();
        });
    };


    setMonthList(){
        const start      = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
        const end        = new Date(this.endDate.getFullYear(),   this.endDate.getMonth(),   1);

        const month_list: { month: number, year: number, first_date: Date }[] = [];
        const current = new Date(start);

        while (current <= end) {
            month_list.push({
                month: current.getMonth(),
                year:  current.getFullYear(),
                first_date: new Date(current.getFullYear(), current.getMonth(), 1)
            });
            current.setMonth(current.getMonth() + 1);
        }

        this.month_list = month_list;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['startDate'] || changes['endDate']) {
            this.selectedDays.set([]);
            this.setMonthList();
        }
    }
}

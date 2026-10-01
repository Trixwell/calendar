import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, input} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NgClass} from "@angular/common";
import {CalendarEvent} from "../../../../contracts/calendar-event";
import {CalendarDayHours, CalendarUserContext} from "../../../../contracts/calendar-user-context";
import {CALENDAR_USER} from "../../../../providers/calendar-user.provider";

@Component({
  selector: 'app-load-indicator',
    imports: [
        NgClass
    ],
  templateUrl: './load-indicator.component.html',
  styleUrl: './load-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadIndicatorComponent {
    taskList = input<CalendarEvent[]>([]);
    currentDate = input<Date>(new Date());
    day = input.required<number>();

    profile!: CalendarUserContext;

    private readonly userProvider = inject(CALENDAR_USER);

    constructor(private cdr: ChangeDetectorRef, private destroyRef: DestroyRef) {
        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
            if (p) {
                this.profile = p;
                this.cdr.markForCheck();
            }
        });
    }

    private get targetDate(): Date {
        return new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), this.day());
    }

    private get daySchedule(): CalendarDayHours | null {
        return this.profile?.getDayHours(this.targetDate) ?? null;
    }

    private get totalMinutes(): number {
        const sch = this.daySchedule;
        return sch ? Math.max(0, sch.endMinutes - sch.startMinutes) : 0;
    }

    private get occupiedMinutes(): number {
        if (this.day() <= 0) return 0;
        const target = this.targetDate.toDateString();
        return this.taskList()
            .filter(t => t.getStart().toDateString() === target)
            .reduce((sum, t) => sum + t.getDurationMinutes(), 0);
    }

    private get percent(): number {
        const tot = this.totalMinutes;
        return tot > 0
            ? Math.min(100, Math.round(this.occupiedMinutes / tot * 100))
            : 0;
    }

    get hasTask(){
        const target = this.targetDate.toDateString();
        return this.taskList().some(t => t.getStart().toDateString() === target && !t.isBlocking());
    }

    get loadClass(): 'low' | 'medium' | 'high' | 'full' | null {
        if(!this.hasTask) return null;

        const p = this.percent;
        if (p === 0)      return 'low';
        if (p >= 100)     return 'full';
        if (p >= 70)      return 'high';
        if (p >= 40)      return 'medium';
        return null;
    }
}

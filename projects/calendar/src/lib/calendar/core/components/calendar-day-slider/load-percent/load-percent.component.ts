import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CalendarEvent} from '../../../../../contracts/calendar-event';
import {CalendarDayHours, CalendarUserContext} from '../../../../../contracts/calendar-user-context';
import {CALENDAR_USER} from '../../../../../providers/calendar-user.provider';

@Component({
    selector: 'app-load-percent',
    imports: [],
    templateUrl: './load-percent.component.html',
    styleUrl: './load-percent.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadPercentComponent {
    date = input.required<Date>();
    taskList = input<CalendarEvent[]>([]);

    profile!: CalendarUserContext;

    private readonly userProvider = inject(CALENDAR_USER);

    constructor(private cdr: ChangeDetectorRef, private destroyRef: DestroyRef) {
        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(profile => {
            if (profile) {
                this.profile = profile;
                this.cdr.markForCheck();
            }
        });
    }

    private get daySchedule(): CalendarDayHours | null {
        return this.profile?.getDayHours(this.date()) ?? null;
    }

    private get totalMinutes(): number {
        const sch = this.daySchedule;
        return sch ? Math.max(0, sch.endMinutes - sch.startMinutes) : 0;
    }

    private get occupiedMinutes(): number {
        const target = this.date().toDateString();
        return this.taskList()
            .filter(t => t.getStart().toDateString() === target)
            .reduce((sum, t) => sum + t.getDurationMinutes(), 0);
    }

    get percent(): number {
        const total = this.totalMinutes;
        return total > 0
            ? Math.min(100, Math.round(this.occupiedMinutes / total * 100))
            : 0;
    }

    get hasTask(): boolean {
        const target = this.date().toDateString();
        return this.taskList().some(t => t.getStart().toDateString() === target && !t.isBlocking());
    }
}

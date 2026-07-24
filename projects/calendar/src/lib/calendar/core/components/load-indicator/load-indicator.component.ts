import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, input} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MasterTask} from "../../entity";
import {NgClass} from "@angular/common";
import {DaySchedule, Schedule, User} from "../../entity";
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
    taskList = input<MasterTask[]>([]);
    currentDate = input<Date>(new Date());
    day = input.required<number>();

    profile!: User;

    private readonly userProvider = inject(CALENDAR_USER);

    constructor(private cdr: ChangeDetectorRef, private destroyRef: DestroyRef) {
        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
            if (p) {
                this.profile = p;
                this.cdr.markForCheck();
            }
        });
    }

    private get weekdayKey(): keyof Schedule {
        const dow = new Date(
            this.currentDate().getFullYear(),
            this.currentDate().getMonth(),
            this.day()
        ).getDay();
        return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][dow] as keyof Schedule;
    }

    private get daySchedule(): DaySchedule | null {
        return this.profile?.schedule?.[this.weekdayKey] ?? null;
    }

    private parseHm(hm: string): number {
        const [h, m] = hm.split(':').map(Number);
        return h * 60 + m;
    }

    private get totalMinutes(): number {
        const sch = this.daySchedule;
        if (sch?.start_time == null) return 0;
        const start = this.parseHm(sch.start_time);
        const end   = this.parseHm(sch.end_time);
        return Math.max(0, end - start);
    }

    private get isoDay(): string {
        return this.currentDate().getFullYear() + '-' +
            (this.currentDate().getMonth()+1).toString().padStart(2,'0') + '-' +
            this.day().toString().padStart(2,'0');
    }

    private get occupiedMinutes(): number {
        if (this.day() <= 0) return 0;
        return this.taskList()
            .filter(t => t.assign_time.startsWith(this.isoDay))
            .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
    }

    private get percent(): number {
        const tot = this.totalMinutes;
        return tot > 0
            ? Math.min(100, Math.round(this.occupiedMinutes / tot * 100))
            : 0;
    }

    get hasTask(){
        return this.taskList().some(t => t.assign_time.startsWith(this.isoDay) && !t.taskType.isTimeOff());
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

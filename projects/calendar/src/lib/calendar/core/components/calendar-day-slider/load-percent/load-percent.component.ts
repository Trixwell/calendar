import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MasterTask} from '../../../entity';
import {User} from '../../../entity';
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
    taskList = input<MasterTask[]>([]);

    profile!: User;

    private readonly userProvider = inject(CALENDAR_USER);

    constructor(private cdr: ChangeDetectorRef, private destroyRef: DestroyRef) {
        this.userProvider.profile$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(profile => {
            if (profile) {
                this.profile = profile;
                this.cdr.markForCheck();
            }
        });
    }

    private parseHm(hm: string): number {
        const [h, m] = hm.split(':').map(Number);
        return h * 60 + m;
    }

    private get weekdayKey(): string {
        return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][this.date().getDay()];
    }

    private get totalMinutes(): number {
        const daySchedule = this.profile?.schedule?.[this.weekdayKey];
        if (!daySchedule?.start_time) return 0;
        return Math.max(0, this.parseHm(daySchedule.end_time) - this.parseHm(daySchedule.start_time));
    }

    private get isoDay(): string {
        const d = this.date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    private get occupiedMinutes(): number {
        return this.taskList()
            .filter(t => t.assign_time.startsWith(this.isoDay))
            .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
    }

    get percent(): number {
        const total = this.totalMinutes;
        return total > 0
            ? Math.min(100, Math.round(this.occupiedMinutes / total * 100))
            : 0;
    }

    get hasTask(): boolean {
        return this.taskList().some(t => t.assign_time.startsWith(this.isoDay) && !t.taskType.isTimeOff());
    }
}

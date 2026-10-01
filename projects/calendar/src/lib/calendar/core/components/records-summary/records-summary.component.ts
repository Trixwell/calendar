import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {CalendarEvent} from '../../../../contracts/calendar-event';

@Component({
    selector: 'app-records-summary',
    imports: [],
    templateUrl: './records-summary.component.html',
    styleUrl: './records-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsSummaryComponent {
    taskList = input<CalendarEvent[]>([]);

    private records = computed(() => this.taskList().filter(t => !t.isBlocking()));

    count = computed(() => this.records().length);

    total = computed(() => this.records().reduce((sum, t) => sum + (t.getAmount() || 0), 0));

    formattedTotal(): string {
        return this.total().toLocaleString('uk-UA');
    }
}

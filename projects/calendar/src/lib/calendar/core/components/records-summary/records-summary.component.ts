import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MasterTask} from '../../entity';

@Component({
    selector: 'app-records-summary',
    imports: [],
    templateUrl: './records-summary.component.html',
    styleUrl: './records-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsSummaryComponent {
    taskList = input<MasterTask[]>([]);

    private records = computed(() => this.taskList().filter(t => !t.taskType.isTimeOff()));

    count = computed(() => this.records().length);

    total = computed(() => this.records().reduce((sum, t) => sum + (t.taskType.charge_amount || 0), 0));

    formattedTotal(): string {
        return this.total().toLocaleString('uk-UA');
    }
}

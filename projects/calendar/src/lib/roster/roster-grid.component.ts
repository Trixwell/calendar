import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {DatePipe} from '@angular/common';
import {CalendarEvent} from '../contracts/calendar-event';
import {RosterColumn, RosterRow, rosterDateKey} from './roster.entity';

export interface RosterSelectedCell {
    rowId: number | string;
    date: Date;
    anchor: HTMLElement;
}

@Component({
    selector: 'app-roster-grid',
    imports: [DatePipe],
    templateUrl: './roster-grid.component.html',
    styleUrl: './roster-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RosterGridComponent {
    columns = input<RosterColumn[]>([]);
    rows = input<RosterRow[]>([]);
    selected = input<RosterSelectedCell | null>(null);
    cornerLabel = input<string>('');
    totalLabel = input<string>('');

    cellClick = output<RosterSelectedCell>();

    protected eventsFor(row: RosterRow, column: RosterColumn): CalendarEvent[] {
        return row.cells.get(rosterDateKey(column.date)) ?? [];
    }

    protected isSelected(row: RosterRow, column: RosterColumn): boolean {
        const sel = this.selected();
        return !!sel && sel.rowId === row.id && sel.date.getTime() === column.date.getTime();
    }

    onCellClick(row: RosterRow, column: RosterColumn, mouseEvent: MouseEvent): void {
        this.cellClick.emit({
            rowId: row.id,
            date: column.date,
            anchor: mouseEvent.currentTarget as HTMLElement,
        });
    }
}

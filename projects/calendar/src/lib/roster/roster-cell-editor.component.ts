import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {CalendarEvent} from '../contracts/calendar-event';
import {CalendarRosterEditorLabels} from '../i18n/calendar-labels';
import {CalendarLocale} from '../i18n/calendar-locale';
import {RosterDayType} from './roster.entity';

export type RosterCellEditorLabels = CalendarRosterEditorLabels;

export interface RosterCellEditorSavePayload {
    dayTypeId: number | string | null;
    hours: number;
    comment: string;
}

@Component({
    selector: 'app-roster-cell-editor',
    imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatIconModule],
    templateUrl: './roster-cell-editor.component.html',
    styleUrl: './roster-cell-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RosterCellEditor {
    private readonly locale = inject(CalendarLocale);

    event = input<CalendarEvent | null>(null);
    dayTypes = input<RosterDayType[]>([]);
    labels = input<Partial<RosterCellEditorLabels>>({});
    allowDelete = input<boolean>(true);

    saved = output<RosterCellEditorSavePayload>();
    deleted = output<void>();
    closed = output<void>();

    protected dayTypeId: number | string | null = null;
    protected hours = 0;
    protected comment = '';

    protected resolvedLabels = computed<RosterCellEditorLabels>(() => ({
        ...this.locale.labels.rosterEditor,
        ...this.labels(),
    }));

    constructor() {
        effect(() => {
            const current = this.event();

            if (current) {
                this.hours = current.getDurationMinutes() / 60;
                this.comment = current.getComment();
                this.dayTypeId = current.getCategoryId();
            } else {
                this.hours = 0;
                this.comment = '';
                this.dayTypeId = this.dayTypes()[0]?.id ?? null;
            }
        });
    }

    save(): void {
        this.saved.emit({
            dayTypeId: this.dayTypeId,
            hours: this.hours,
            comment: this.comment,
        });
    }

    remove(): void {
        this.deleted.emit();
    }

    close(): void {
        this.closed.emit();
    }

    protected onHoursFocus(event: FocusEvent): void {
        (event.target as HTMLInputElement).select();
    }
}

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  CalendarComponent,
  CalendarEvent,
  ClientInfo,
  MasterTask,
  RosterCellEditor,
  RosterCellEditorSavePayload,
  RosterColumn,
  RosterDayType,
  RosterGridComponent,
  RosterRow,
  RosterSelectedCell,
  TaskPaymentStatusEnum,
  TaskPaymentTypeEnum,
  TaskStatusEnum,
  TaskType,
} from 'calendar';

function makeRosterTask(
  daysFromToday: number,
  hour: number,
  durationMin: number,
  type: TaskType,
): MasterTask {
  const start = new Date();
  start.setDate(start.getDate() + daysFromToday);
  start.setHours(hour, 0, 0, 0);

  const end = new Date(start.getTime() + durationMin * 60_000);

  return new MasterTask(
    Math.floor(Math.random() * 1_000_000),
    '',
    '',
    start.toISOString(),
    String(durationMin),
    end.toISOString(),
    end.toISOString(),
    TaskStatusEnum.Assigned,
    1,
    '',
    '',
    type,
    [] as ClientInfo[],
    TaskPaymentTypeEnum.Cash,
    TaskPaymentStatusEnum.NotPaid,
    1,
    [type],
  );
}

@Component({
  selector: 'app-root',
  imports: [CalendarComponent, RosterGridComponent, RosterCellEditor],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  protected readonly rosterColumns: RosterColumn[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dow = date.getDay();
    return { date, isWeekend: dow === 0 || dow === 6, isHoliday: false };
  });

  protected readonly rosterDayTypes: RosterDayType[] = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Day off' },
    { id: 3, name: 'Sick leave' },
  ];

  protected readonly rosterRows: RosterRow[] = (() => {
    const shift = new TaskType(1, '', '', 'Shift', '', 1, 500, '480', TaskStatusEnum.Active, null);

    return ['Alice', 'Bob', 'Carol'].map((title, idx) => {
      const cells = new Map<string, MasterTask[]>();
      const task = makeRosterTask(idx, 9, 480, shift);
      const key = `${task.getStart().getFullYear()}-${String(task.getStart().getMonth() + 1).padStart(2, '0')}-${String(task.getStart().getDate()).padStart(2, '0')}`;
      cells.set(key, [task]);

      return { id: idx + 1, title, depth: 0, total: 40, cells };
    });
  })();

  protected readonly selectedCell = signal<RosterSelectedCell | null>(null);
  protected readonly activeEvent = signal<CalendarEvent | null>(null);
  protected readonly popoverPosition = signal<{ left: number; top: number }>({ left: 0, top: 0 });

  onDaysConfirmed(days: Date[]): void {
    console.log('daysConfirmed', days);
  }

  onDateSelected(date: Date): void {
    console.log('dateSelected', date);
  }

  onRangeSelected(range: { start: Date; end: Date }): void {
    console.log('rangeSelected', range);
  }

  onRosterCellClick(cell: RosterSelectedCell): void {
    const row = this.rosterRows.find((r) => r.id === cell.rowId);
    const key = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
    const event = row?.cells.get(key)?.[0] ?? null;

    const rect = cell.anchor.getBoundingClientRect();
    this.popoverPosition.set({ left: rect.left, top: rect.bottom + 4 });
    this.selectedCell.set(cell);
    this.activeEvent.set(event);
  }

  onRosterEditorSaved(payload: RosterCellEditorSavePayload): void {
    console.log('rosterCellEditor saved', this.selectedCell(), payload);
    this.selectedCell.set(null);
    this.activeEvent.set(null);
  }

  onRosterEditorDeleted(): void {
    console.log('rosterCellEditor deleted', this.selectedCell());
    this.selectedCell.set(null);
    this.activeEvent.set(null);
  }
}

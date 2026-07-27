import { Component, signal } from '@angular/core';
import { CalendarComponent } from 'calendar';

@Component({
  selector: 'app-root',
  imports: [CalendarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  onDaysConfirmed(days: Date[]): void {
    console.log('daysConfirmed', days);
  }

  onDateSelected(date: Date): void {
    console.log('dateSelected', date);
  }

  onRangeSelected(range: { start: Date; end: Date }): void {
    console.log('rangeSelected', range);
  }
}

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
}

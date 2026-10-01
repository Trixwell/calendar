import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {CalendarView} from "../../entity";
import {CalendarEvent} from "../../../../contracts/calendar-event";
import {CalendarLocale} from "../../../../i18n/calendar-locale";

@Component({
  selector: 'app-calendar-event',
    imports: [
        DatePipe,
    ],
  templateUrl: './calendar-event.component.html',
  styleUrl: './calendar-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventComponent {
    event = input.required<CalendarEvent>();
    top = input.required<string>();
    height = input.required<string>();
    view = input<CalendarView>(CalendarView.DAY);
    color = input<string>('\'#5444dc\'');
    showDetailsModal = input<boolean>(true);

    protected readonly locale = inject(CalendarLocale);
    private readonly labels = this.locale.labels;

    lightColor = computed(() => {
        const { r, g, b } = this.hexToRgb(this.color());
        const rr = Math.round(r + (255 - r) * 0.7);
        const gg = Math.round(g + (255 - g) * 0.7);
        const bb = Math.round(b + (255 - b) * 0.7);
        return `rgb(${rr}, ${gg}, ${bb})`;
    });

    private hexToRgb(hex: string) {
        const h = hex.replace('#', '');
        const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    isPast(){
        return this.event().getEnd() < new Date();
    }

    isTimeOff(){
        return this.event().isBlocking();
    }

    title(){
        return this.event().getTitle(this.labels);
    }

    protected readonly CalendarView = CalendarView;
}

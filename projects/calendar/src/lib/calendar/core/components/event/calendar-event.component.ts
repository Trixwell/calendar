import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MasterTask} from "../../entity";
import {DatePipe} from "@angular/common";
import {RouterLink} from "@angular/router";
import {CalendarView} from "../../entity";

@Component({
  selector: 'app-calendar-event',
    imports: [
        DatePipe,
        RouterLink
    ],
  templateUrl: './calendar-event.component.html',
  styleUrl: './calendar-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventComponent {
    event = input.required<MasterTask>();
    top = input.required<string>();
    height = input.required<string>();
    view = input<CalendarView>(CalendarView.DAY);
    color = input<string>('\'#5444dc\'');
    showClient = input<boolean>(false);
    showDetailsModal = input<boolean>(true);

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
        return new Date(this.event().approximate_end_time) < new Date();
    }

    isTimeOff(){
        return this.event().taskType.isTimeOff();
    }

    title(){
        return this.isTimeOff() ? 'Заблокований час' : this.event().taskType.name;
    }

    protected readonly CalendarView = CalendarView;
}

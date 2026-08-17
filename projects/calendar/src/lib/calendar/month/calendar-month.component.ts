import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    CUSTOM_ELEMENTS_SCHEMA,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    output,
    viewChild,
} from '@angular/core';
import {MasterTask} from "../core/entity";
import {User} from "../core/entity";
import {CalendarGridMonthComponent} from "../core/components/grid/month/calendar-grid-month.component";
import {DatePipe, NgTemplateOutlet} from "@angular/common";
import {LoadIndicatorComponent} from "../core/components/load-indicator/load-indicator.component";
import {LoadPercentComponent} from "../core/components/calendar-day-slider/load-percent/load-percent.component";
import {RecordsSummaryComponent} from "../core/components/records-summary/records-summary.component";
import {CalendarEventComponent} from "../core/components/event/calendar-event.component";
import {CalendarView} from "../core/entity";
import {getColor, shiftMonthRange} from "../../util/util";
import {CALENDAR_VIEWPORT} from "../../providers/calendar-viewport.provider";
import type {Swiper} from 'swiper';
import type {SwiperContainer} from 'swiper/element';
import type {SwiperOptions} from 'swiper/types';

let swiperRegistration: Promise<void> | null = null;

/**
 * Defines <swiper-container> / <swiper-slide> once per document. Loaded on demand so desktop —
 * which renders a plain grid — never pulls the slider into the bundle.
 */
function registerSwiperElements(): Promise<void> {
    swiperRegistration ??= import('swiper/element').then(({register}) => {
        if (!customElements.get('swiper-container')) register();
    });

    return swiperRegistration;
}

/** the middle slide always holds the month on screen, the outer two are its neighbours */
const ACTIVE_SLIDE = 1;

const SWIPER_OPTIONS: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    initialSlide: ACTIVE_SLIDE,
    speed: 260,
    // month grids differ in height (five or six weeks), so the container follows the active slide
    autoHeight: true,
    threshold: 8,
    resistanceRatio: 0.6,
    watchOverflow: false,
};

@Component({
  selector: 'app-calendar-month',
    imports: [
        CalendarGridMonthComponent,
        DatePipe,
        LoadIndicatorComponent,
        LoadPercentComponent,
        RecordsSummaryComponent,
        CalendarEventComponent,
        NgTemplateOutlet,
    ],
  templateUrl: './calendar-month.component.html',
  styleUrl: './calendar-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CalendarMonthComponent {
    taskList = input<MasterTask[]>([]);
    user = input.required<User>();
    startDate = input<Date>(new Date());
    endDate = input<Date>(new Date());
    day = model.required<Date>();
    view = model.required<CalendarView>();
    selectionMode = input<boolean>(false);

    selectedDays = model<Date[]>([]);
    eventOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    moreOpen = output<{ task: MasterTask; date: Date; anchor: HTMLElement }>();
    monthShift = output<number>();
    isMobile;
    maxVisible;

    private readonly swiperRef = viewChild<ElementRef<SwiperContainer>>('swiper');
    private readonly viewport = inject(CALENDAR_VIEWPORT);
    private readonly injector = inject(Injector);

    constructor() {
        this.isMobile = this.viewport.isMobile;
        this.maxVisible = computed(() => this.isMobile() ? 1 : 3);

        // the element only exists on mobile, and it is recreated whenever the viewport flips
        effect(() => {
            const container = this.swiperRef()?.nativeElement;
            if (!container || container.swiper) return;

            void registerSwiperElements().then(() => {
                if (container.swiper || !container.isConnected) return;

                Object.assign(container, SWIPER_OPTIONS);
                container.initialize();
            });
        });
    }

    periodTaskList = computed(() => {
        const start = this.startDate().getTime();
        const end = this.endDate().getTime();
        return this.taskList().filter(t => {
            const time = new Date(t.assign_time).getTime();
            return time >= start && time <= end;
        });
    });

    onDayDbl = (date: Date) => {
        if (this.selectionMode()) return;
        this.day.set(date);
        this.view.set(CalendarView.DAY);
    };

    /** previous, current and next month — the slider always holds exactly these three */
    monthSlides = computed<Date[]>(() => {
        const current = this.startDate();

        return [
            shiftMonthRange(current, -1).start,
            current,
            shiftMonthRange(current, 1).start,
        ];
    });

    onSlideSettled(event: Event): void {
        // the element settles on the initial slide while it is still initialising, before the
        // instance is exposed on it, so the event detail is the more reliable source
        const swiper = (event as CustomEvent<[Swiper]>).detail?.[0]
            ?? (event.target as SwiperContainer).swiper;
        if (!swiper) return;

        const delta = swiper.activeIndex - ACTIVE_SLIDE;
        if (delta === 0) return;

        this.monthShift.emit(delta);

        // the slides now carry the shifted months, so the one the finger landed on has become the
        // middle slide: jump back to the centre without animating and without re-firing this event
        afterNextRender(() => swiper.slideTo(ACTIVE_SLIDE, 0, false), {injector: this.injector});
    }

    onEventClick = (task: MasterTask, date: Date, event: MouseEvent): void => {
        this.eventOpen.emit({ task, date, anchor: event.currentTarget as HTMLElement });
    };

    onMoreClick = (task: MasterTask, date: Date, event: MouseEvent): void => {
        this.moreOpen.emit({ task, date, anchor: event.currentTarget as HTMLElement });
    };

    // computed, not a method: the template reads it once per day cell, so a plain method rebuilt
    // the Set 40+ times on every change detection pass
    timeFreeSlotsCount = computed<number>(() => {
        const used = new Set(this.taskList().map(task => task.time_slot_id));
        return (this.user()?.timeSlotList ?? []).filter(slot => !used.has(slot.id)).length;
    });

    protected readonly CalendarView = CalendarView;
    protected readonly getColor = getColor;
}

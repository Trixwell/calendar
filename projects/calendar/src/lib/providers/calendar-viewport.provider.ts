import {inject, Injectable, InjectionToken, Signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs';

export interface CalendarViewportProvider {
    isMobile: Signal<boolean>;
}

export const CALENDAR_VIEWPORT = new InjectionToken<CalendarViewportProvider>('CALENDAR_VIEWPORT');

@Injectable({providedIn: 'root'})
export class DefaultCalendarViewportProvider implements CalendarViewportProvider {
    private readonly breakpointObserver = inject(BreakpointObserver);

    readonly isMobile: Signal<boolean> = toSignal(
        this.breakpointObserver.observe('(max-width: 800px)').pipe(
            map(result => result.matches),
        ),
        {initialValue: false},
    );
}

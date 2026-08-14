import {Directive, DestroyRef, ElementRef, HostListener, inject, input, output} from '@angular/core';

export type SwipeDirection = 'left' | 'right';

@Directive({
    selector: '[appSwipe]',
})
export class SwipeDirective {
    swipeEnabled = input<boolean>(true);
    swipeThreshold = input<number>(45);

    swipe = output<SwipeDirection>();

    private static readonly MAX_DURATION = 1000;
    private static readonly DIRECTION_RATIO = 1.2;
    private static readonly SCROLL_TOLERANCE = 24;
    private static readonly HORIZONTAL_LOCK = 20;
    private static readonly CLICK_SUPPRESS_MS = 500;

    private startX = 0;
    private startY = 0;
    private startTime = 0;
    private tracking = false;
    private suppressClickUntil = 0;

    private readonly host: HTMLElement = inject(ElementRef).nativeElement;

    constructor() {
        this.host.addEventListener('click', this.onClickCapture, true);
        inject(DestroyRef).onDestroy(() => {
            this.host.removeEventListener('click', this.onClickCapture, true);
        });
    }

    @HostListener('touchstart', ['$event'])
    onTouchStart(event: TouchEvent): void {
        this.tracking = false;
        if (!this.swipeEnabled() || event.touches.length !== 1) return;

        const touch = event.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startTime = Date.now();
        this.tracking = true;
    }

    @HostListener('touchmove', ['$event'])
    onTouchMove(event: TouchEvent): void {
        if (!this.tracking) return;

        if (event.touches.length !== 1) {
            this.tracking = false;
            return;
        }

        const touch = event.touches[0];
        const dx = touch.clientX - this.startX;
        const dy = touch.clientY - this.startY;

        // once the gesture is clearly horizontal it stays a swipe, whatever the finger does next
        if (Math.abs(dx) > SwipeDirective.HORIZONTAL_LOCK) return;

        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SwipeDirective.SCROLL_TOLERANCE) {
            this.tracking = false;
        }
    }

    @HostListener('touchend', ['$event'])
    onTouchEnd(event: TouchEvent): void {
        if (!this.tracking) return;
        this.tracking = false;

        const touch = event.changedTouches[0];
        if (!touch) return;

        const dx = touch.clientX - this.startX;
        const dy = touch.clientY - this.startY;

        if (Date.now() - this.startTime > SwipeDirective.MAX_DURATION) return;
        if (Math.abs(dx) < this.swipeThreshold()) return;
        if (Math.abs(dx) < Math.abs(dy) * SwipeDirective.DIRECTION_RATIO) return;

        this.suppressClickUntil = Date.now() + SwipeDirective.CLICK_SUPPRESS_MS;
        this.swipe.emit(dx < 0 ? 'left' : 'right');
    }

    @HostListener('touchcancel')
    onTouchCancel(): void {
        this.tracking = false;
    }

    private onClickCapture = (event: Event): void => {
        if (Date.now() > this.suppressClickUntil) return;

        this.suppressClickUntil = 0;
        event.stopPropagation();
        event.preventDefault();
    };
}

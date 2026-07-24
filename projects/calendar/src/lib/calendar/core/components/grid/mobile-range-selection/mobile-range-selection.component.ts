import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    input,
    OnDestroy,
    output,
} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {clampToRange, dateFromY, isPastDate, quantizeEndY, quantizeStartY} from '../../../../../util/util';

@Component({
    selector: 'app-mobile-range-selection',
    imports: [DatePipe, MatButtonModule],
    templateUrl: './mobile-range-selection.component.html',
    styleUrl: './mobile-range-selection.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileRangeSelectionComponent implements OnDestroy {
    day = input.required<Date>();
    hourHeight = input.required<number>();
    startHour = input.required<number>();
    endHour = input.required<number>();
    isDragging = input.required<boolean>();
    activeDay = input<Date | null>(null);

    rangeSelected = output<{ start: Date; end: Date }>();
    selectionOpened = output<Date>();

    mobileSelectionActive = false;
    isSelecting = false;

    selectionTop = 0;
    selectionHeight = 0;
    selectionStart!: Date;
    selectionEnd!: Date;

    private touchStartX = 0;
    private touchStartY = 0;
    private touchMoved = false;
    private startY = 0;
    private containerEl!: HTMLElement;

    private readonly TAP_MOVE_THRESHOLD = 10;
    private readonly DEFAULT_RANGE_MS = 60 * 60 * 1000;
    private readonly MIN_BOX_HEIGHT_PX = 56;

    private readonly boundBoxTouchMove = this.onBoxTouchMove.bind(this);
    private readonly boundBoxTouchEnd = this.onBoxTouchEnd.bind(this);

    constructor(private readonly cdr: ChangeDetectorRef) {
        effect(() => {
            const activeDay = this.activeDay();
            const day = this.day();

            if (!this.mobileSelectionActive || !activeDay) {
                return;
            }
            if (activeDay.getTime() !== day.getTime()) {
                this.cancelMobileSelection();
            }
        });
    }

    onCellTouchStart(e: TouchEvent): void {
        if (this.isDragging()) {
            return;
        }

        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchMoved = false;

        this.containerEl = e.currentTarget as HTMLElement;
    }

    onCellTouchMove(e: TouchEvent): void {
        if (this.isDragging()) {
            return;
        }

        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - this.touchStartX);
        const dy = Math.abs(touch.clientY - this.touchStartY);

        if (dx > this.TAP_MOVE_THRESHOLD || dy > this.TAP_MOVE_THRESHOLD) {
            this.touchMoved = true;
        }
    }

    onCellTouchEnd(e: TouchEvent): void {
        if (this.isDragging()) {
            return;
        }

        if (this.touchMoved) {
            this.touchMoved = false;
            return;
        }

        this.openMobileSelection(e.changedTouches[0].clientY);
    }

    private openMobileSelection(clientY: number): void {
        const day = this.day();
        if (isPastDate(day)) return;

        const containerRect = this.containerEl.getBoundingClientRect();
        const maxY = containerRect.height;
        const rawY = Math.max(0, Math.min(maxY, clientY - containerRect.top));
        const startY = quantizeStartY(rawY, this.hourHeight());
        this.startY = startY;

        const defaultHeight = (this.DEFAULT_RANGE_MS / (60 * 60 * 1000)) * this.hourHeight();
        const height = Math.max(this.MIN_BOX_HEIGHT_PX, defaultHeight);
        let top = startY;
        if (top + height > maxY) {
            top = Math.max(0, maxY - height);
        }
        this.startY = top;

        this.selectionTop = top;
        this.selectionHeight = height;

        this.selectionStart = dateFromY(day, top, this.startHour(), this.endHour(), this.hourHeight());
        this.selectionEnd = dateFromY(day, top + height, this.startHour(), this.endHour(), this.hourHeight());

        this.mobileSelectionActive = true;
        this.selectionOpened.emit(day);
        this.cdr.markForCheck();
    }

    onBoxTouchStart(e: TouchEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this.isSelecting = true;

        document.addEventListener('touchmove', this.boundBoxTouchMove, {passive: false});
        document.addEventListener('touchend', this.boundBoxTouchEnd);
    }

    private onBoxTouchMove(e: TouchEvent): void {
        if (!this.isSelecting) return;
        e.preventDefault();
        e.stopPropagation();

        const day = this.day();
        const touch = e.touches[0];
        const containerRect = this.containerEl.getBoundingClientRect();
        const maxY = containerRect.height;
        const rawY = Math.max(0, Math.min(maxY, touch.clientY - containerRect.top));
        const endY = quantizeEndY(rawY, this.hourHeight());

        let topY = this.startY;
        let height = endY - this.startY;
        if (height < 0) {
            topY = endY;
            height = -height;
        }

        height = Math.max(this.MIN_BOX_HEIGHT_PX, height);
        if (topY + height > maxY) {
            topY = Math.max(0, maxY - height);
        }

        this.selectionTop = topY;
        this.selectionHeight = height;

        this.selectionStart = dateFromY(day, topY, this.startHour(), this.endHour(), this.hourHeight());
        this.selectionEnd = dateFromY(day, topY + height, this.startHour(), this.endHour(), this.hourHeight());
        this.cdr.markForCheck();
    }

    protected onBoxTouchEnd(): void {
        if (!this.isSelecting) return;

        document.removeEventListener('touchmove', this.boundBoxTouchMove);
        document.removeEventListener('touchend', this.boundBoxTouchEnd);

        this.isSelecting = false;
        this.cdr.markForCheck();
    }

    confirmMobileSelection(): void {
        const [start, end] = clampToRange(
            this.day(),
            this.selectionStart,
            this.selectionEnd,
            this.startHour(),
            this.endHour(),
        );
        this.rangeSelected.emit({start, end});

        this.cancelMobileSelection();
    }

    cancelMobileSelection(): void {
        document.removeEventListener('touchmove', this.boundBoxTouchMove);
        document.removeEventListener('touchend', this.boundBoxTouchEnd);

        this.mobileSelectionActive = false;
        this.isSelecting = false;
        this.cdr.markForCheck();
    }

    ngOnDestroy(): void {
        document.removeEventListener('touchmove', this.boundBoxTouchMove);
        document.removeEventListener('touchend', this.boundBoxTouchEnd);
    }
}

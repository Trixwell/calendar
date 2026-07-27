import {Component, ElementRef, HostListener, inject, input, output, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {ThanosSnapAnimation} from "../../../entity/animations/thanos-snap";
import {AnimationService} from "../../../service/animation.service";
import {AnimationEnum, AnimationPhase} from "../../../entity/animations/animation";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {NgTemplateOutlet} from "@angular/common";
import {CALENDAR_VIEWPORT} from "../../../../../providers/calendar-viewport.provider";
import {BottomSheetModalComponent} from "../bottom-sheet-modal/bottom-sheet-modal.component";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-modal',
    imports: [
        MatIcon,
        MatIconButton,
        NgTemplateOutlet,
        BottomSheetModalComponent,
    ],
    templateUrl: './modal-dialog.component.html',
    styleUrl: './modal-dialog.component.scss'
})
export class ModalDialogComponent implements OnInit, OnDestroy {
    allowClose = input<boolean>(true);
    closed = output<void>();

    @ViewChild('bottomSheet') bottomSheet!: BottomSheetModalComponent;

    readonly element: HTMLElement;
    isOpen = false;
    private clickHandler!: (event: Event) => void;
    private mousedownHandler!: (event: Event) => void;
    private mousedownTarget: HTMLElement | null = null;

    private readonly viewport = inject(CALENDAR_VIEWPORT);

    constructor(
        el: ElementRef,
        protected animationService: AnimationService,
    ) {
        this.element = el.nativeElement as HTMLElement;
        this.initAnimations();
    }

    get isMobile() {
        return this.viewport.isMobile;
    }

    private isBackdrop(target: HTMLElement): boolean {
        return target.classList.contains('modal');
    }

    ngOnInit(): void {
        document.body.appendChild(this.element);

        this.mousedownHandler = (event: Event) => {
            this.mousedownTarget = event.target as HTMLElement;
        };

        this.clickHandler = (event: Event) => {
            const target = event.target as HTMLElement;
            const clickedOnBackdrop = this.isBackdrop(target);
            const mousedownWasOnBackdrop = this.mousedownTarget !== null && this.isBackdrop(this.mousedownTarget);
            if (clickedOnBackdrop && mousedownWasOnBackdrop && this.allowClose()) {
                this.close();
            }
        };

        this.element.addEventListener('mousedown', this.mousedownHandler);
        this.element.addEventListener('click', this.clickHandler);
    }

    ngOnDestroy(): void {
        this.element.removeEventListener('mousedown', this.mousedownHandler);
        this.element.removeEventListener('click', this.clickHandler);
        this.element.remove();
    }

    disableBackdropClose() {
        this.element.removeEventListener('mousedown', this.mousedownHandler);
        this.element.removeEventListener('click', this.clickHandler);
    }

    resize(): void {
        if (this.isMobile() && this.isOpen) {
            this.bottomSheet.resize();
        }
    }

    open(): void {
        if (this.isMobile()) {
            this.bottomSheet.open();
            this.isOpen = true;
            return;
        }

        this.element.style.display = 'block';
        document.body.classList.add('modal-open');
        this.isOpen = true;
    }

    async close() {
        if (this.isMobile()) {
            this.bottomSheet.close();
            this.isOpen = false;
            this.closed.emit();
            return;
        }

        const modalBody = this.element.querySelector('.content') as HTMLElement | null;

        if (modalBody) {
            await this.animationService.jsAsync(AnimationEnum.THANOS_SNAP, AnimationPhase.LEAVE, modalBody);
        }

        this.element.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.isOpen = false;
        this.closed.emit();
    }

    onBottomSheetClosed(): void {
        this.isOpen = false;
        this.closed.emit();
    }

    @HostListener('document:keydown.escape')
    async onEscapePress() {
        if (this.isOpen && this.allowClose()) {
            await this.close();
        }
    }

    initAnimations() {
        this.animationService.register(
            new ThanosSnapAnimation()
        );

        return this;
    }
}

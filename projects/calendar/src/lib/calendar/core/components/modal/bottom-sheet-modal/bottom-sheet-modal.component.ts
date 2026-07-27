import {Component, ElementRef, HostListener, input, output, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

const FULL_HEIGHT = 92;

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-bottom-sheet-modal',
    standalone: true,
    imports: [MatIcon, MatIconButton],
    templateUrl: './bottom-sheet-modal.component.html',
    styleUrl: './bottom-sheet-modal.component.scss'
})
export class BottomSheetModalComponent implements OnInit, OnDestroy {
    allowClose = input<boolean>(true);
    closed = output<void>();

    @ViewChild('sheet', {static: true}) sheetRef!: ElementRef<HTMLElement>;

    isOpen = false;
    isFullscreen = false;

    private readonly element: HTMLElement;
    private startY = 0;
    private contentHeightVh = 0;
    private startHeightVh = 0;
    private currentHeightVh = 0;
    private isDragging = false;

    constructor(el: ElementRef) {
        this.element = el.nativeElement as HTMLElement;
    }

    ngOnInit(): void {
        document.body.appendChild(this.element);
    }

    ngOnDestroy(): void {
        document.body.classList.remove('modal-open');
        this.element.remove();
    }

    open(): void {
        this.element.style.display = 'block';
        document.body.classList.add('modal-open');
        this.isOpen = true;
        this.isFullscreen = false;

        const sheet = this.sheetRef.nativeElement;
        sheet.style.transition = 'none';
        sheet.style.height = 'auto';
        sheet.style.transform = '';

        requestAnimationFrame(() => {
            const contentPx = sheet.scrollHeight;
            this.contentHeightVh = Math.min((contentPx / window.innerHeight) * 100, FULL_HEIGHT);
            sheet.style.height = '0';

            requestAnimationFrame(() => {
                sheet.style.transition = 'height 0.3s ease';
                sheet.style.height = `${this.contentHeightVh}vh`;
                this.currentHeightVh = this.contentHeightVh;
            });
        });
    }

    resize(): void {
        if (!this.isOpen) {
            return;
        }

        const sheet = this.sheetRef.nativeElement;
        sheet.style.transition = 'none';
        sheet.style.height = 'auto';

        requestAnimationFrame(() => {
            const contentPx = sheet.scrollHeight;
            this.contentHeightVh = Math.min((contentPx / window.innerHeight) * 100, FULL_HEIGHT);
            sheet.style.height = `${this.contentHeightVh}vh`;
            this.currentHeightVh = this.contentHeightVh;

            requestAnimationFrame(() => {
                sheet.style.transition = 'height 0.3s ease';
            });
        });
    }

    close(): void {
        const sheet = this.sheetRef.nativeElement;
        sheet.style.transition = 'height 0.3s ease';
        sheet.style.height = '0';

        setTimeout(() => {
            this.element.style.display = 'none';
            document.body.classList.remove('modal-open');
            this.isOpen = false;
            this.isFullscreen = false;
            this.closed.emit();
        }, 300);
    }

    onOverlayClick(event: Event): void {
        if ((event.target as HTMLElement).classList.contains('overlay') && this.allowClose()) {
            this.close();
        }
    }

    onDragStart(event: TouchEvent): void {
        this.isDragging = true;
        this.startY = event.touches[0].clientY;
        this.startHeightVh = this.currentHeightVh;
        this.sheetRef.nativeElement.style.transition = 'none';
    }

    onDragMove(event: TouchEvent): void {
        if (!this.isDragging) return;

        const deltaY = this.startY - event.touches[0].clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const newHeight = Math.max(0, Math.min(FULL_HEIGHT, this.startHeightVh + deltaVh));

        this.currentHeightVh = newHeight;
        this.sheetRef.nativeElement.style.height = `${newHeight}vh`;
    }

    onDragEnd(): void {
        if (!this.isDragging) return;
        this.isDragging = false;

        const sheet = this.sheetRef.nativeElement;
        sheet.style.transition = 'height 0.3s ease';

        const threshold = 15;
        const draggedVh = this.currentHeightVh - this.startHeightVh;

        if (this.isFullscreen) {
            if (draggedVh < -threshold) {
                this.isFullscreen = false;
                this.currentHeightVh = this.contentHeightVh;
                sheet.style.height = `${this.contentHeightVh}vh`;
            } else {
                this.currentHeightVh = FULL_HEIGHT;
                sheet.style.height = `${FULL_HEIGHT}vh`;
            }
        } else {
            if (draggedVh > threshold) {
                this.isFullscreen = true;
                this.currentHeightVh = FULL_HEIGHT;
                sheet.style.height = `${FULL_HEIGHT}vh`;
            } else if (draggedVh < -threshold) {
                this.close();
            } else {
                this.currentHeightVh = this.contentHeightVh;
                sheet.style.height = `${this.contentHeightVh}vh`;
            }
        }
    }

    @HostListener('document:keydown.escape')
    onEscapePress(): void {
        if (this.isOpen && this.allowClose()) {
            this.close();
        }
    }
}

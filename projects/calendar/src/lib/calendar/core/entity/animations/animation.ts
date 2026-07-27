export enum AnimationEnum {
    FADE_ULTRASOFT = 'fade-ultrasoft',
    THANOS_SNAP = 'thanos-snap',
    ZOOM_SOFT = 'zoom-soft',
    SLIDE_UP_SOFT = 'slide-up-soft',
    COUNT_UP = 'count-up',
}

export enum AnimationPhase {
    ENTER = 'enter',
    LEAVE = 'leave'
}

export interface Animation {
    name: AnimationEnum;
    isCss(): boolean;
}

export interface CssAnimatable extends Animation {
    getClass(phase: AnimationPhase): string;
}

export interface JsAnimatable extends Animation {
    animate(phase: AnimationPhase, element: HTMLElement): Promise<void> | void;
}

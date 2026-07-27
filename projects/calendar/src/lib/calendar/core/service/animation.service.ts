import { Injectable } from '@angular/core';
import {AnimationEnum, AnimationPhase, CssAnimatable, JsAnimatable, Animation} from "../entity/animations/animation";

@Injectable({
    providedIn: 'root'
})
export class AnimationService {
    private animations = new Map<AnimationEnum, Animation>();

    register(animation: Animation): this {
        this.animations.set(animation.name, animation);
        return this;
    }

    private isCssAnimation(anim: Animation): anim is CssAnimatable {
        return anim.isCss();
    }

    private isJsAnimation(anim: Animation): anim is JsAnimatable {
        return !anim.isCss();
    }

    css(name: AnimationEnum, phase: AnimationPhase): string {
        const anim = this.animations.get(name);

        if (!anim) {
            console.warn(`Animation "${name}" not found`);
            return '';
        }

        if (!this.isCssAnimation(anim)) {
            console.warn(`Animation "${name}" is not a CSS animation`);
            return '';
        }

        return anim.getClass(phase);
    }

    js(name: AnimationEnum, phase: AnimationPhase, element: HTMLElement): void {
        const anim = this.animations.get(name);

        if (!anim) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        if (!this.isJsAnimation(anim)) {
            console.warn(`Animation "${name}" is not a JS animation`);
            return;
        }

        const result = anim.animate(phase, element);
        if (result instanceof Promise) {
            result.catch(err => console.error('Animation error:', err));
        }
    }

    async jsAsync(name: AnimationEnum, phase: AnimationPhase, element: HTMLElement): Promise<void> {
        const anim = this.animations.get(name);

        if (!anim) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        if (!this.isJsAnimation(anim)) {
            console.warn(`Animation "${name}" is not a JS animation`);
            return;
        }

        await anim.animate(phase, element);
    }

    randomCss(phase: AnimationPhase): string {
        const cssAnimations = Array.from(this.animations.values())
            .filter(this.isCssAnimation);

        if (!cssAnimations.length) return '';

        const random = cssAnimations[Math.floor(Math.random() * cssAnimations.length)];
        return random.getClass(phase);
    }

    randomJs(phase: AnimationPhase, element: HTMLElement): void {
        const jsAnimations = Array.from(this.animations.values())
            .filter(this.isJsAnimation);

        if (!jsAnimations.length) return;

        const random = jsAnimations[Math.floor(Math.random() * jsAnimations.length)];
        const result = random.animate(phase, element);

        if (result instanceof Promise) {
            result.catch(err => console.error('Animation error:', err));
        }
    }

    async randomJsAsync(phase: AnimationPhase, element: HTMLElement): Promise<void> {
        const jsAnimations = Array.from(this.animations.values())
            .filter(this.isJsAnimation);

        if (!jsAnimations.length) return;

        const random = jsAnimations[Math.floor(Math.random() * jsAnimations.length)];
        await random.animate(phase, element);
    }

    getAll(): Animation[] {
        return Array.from(this.animations.values());
    }
}

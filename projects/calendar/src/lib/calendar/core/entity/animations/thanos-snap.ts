import {AnimationEnum, AnimationPhase, JsAnimatable} from "./animation";

export class ThanosSnapAnimation implements JsAnimatable {
    public readonly name = AnimationEnum.THANOS_SNAP;
    protected config = {
        d: 490,
        max: 1200,
        ease: (t: number) => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
    }

    isCss(): boolean {
        return false;
    }

    async animate(phase: AnimationPhase, element: HTMLElement): Promise<void> {
        if (!element) return;

        const filter = document.querySelector<SVGFilterElement>('#jwDissolveFilter');
        if (!filter) return;

        const disp = filter.querySelector<SVGFEDisplacementMapElement>('feDisplacementMap');
        const noise = filter.querySelector<SVGFETurbulenceElement>('feTurbulence[result="bigNoise"]');
        if (!disp || !noise) return;

        element.classList.add('jw-dissolve-target');

        noise.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
        disp.setAttribute('scale', '0');

        await new Promise<void>((resolve) => {
            const start = performance.now();

            const step = (now: number) => {
                const t = Math.min((now - start) / this.config.d, 1);
                const e = this.config.ease(t);

                disp.setAttribute('scale', String(e * this.config.max));
                element.style.transform = `scale(${1 + 0.06 * e})`;
                element.style.opacity = t < 0.5 ? '1' : String(1 - (t - 0.5) / 0.5);

                if (t < 1) requestAnimationFrame(step);
                else resolve();
            };

            requestAnimationFrame(step);
        });

        element.style.transform = '';
        element.style.opacity = '';
        disp.setAttribute('scale', '0');
        element.classList.remove('jw-dissolve-target');
    }
}

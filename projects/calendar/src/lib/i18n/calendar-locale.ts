import {registerLocaleData} from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeUk from '@angular/common/locales/uk';
import {inject, Injectable, InjectionToken, LOCALE_ID} from '@angular/core';
import {enUS, uk} from 'date-fns/locale';
import type {Locale} from 'date-fns';
import {CalendarLabels} from './calendar-labels';
import {LABELS_EN} from './labels.en';
import {LABELS_UK} from './labels.uk';

export type CalendarLanguage = 'uk' | 'en';

export const CALENDAR_LABELS = new InjectionToken<Partial<CalendarLabels>>('CALENDAR_LABELS');

export function normalizeCalendarLocale(localeId: string | null | undefined): CalendarLanguage {
    const language = (localeId ?? '').toLowerCase().split(/[-_]/)[0];
    return language === 'en' ? 'en' : 'uk';
}

let localeDataRegistered = false;

function registerLocaleDataOnce(): void {
    if (localeDataRegistered) return;
    registerLocaleData(localeUk);
    registerLocaleData(localeEn);
    localeDataRegistered = true;
}

@Injectable({providedIn: 'root'})
export class CalendarLocale {
    readonly code: CalendarLanguage;
    readonly intlTag: 'uk-UA' | 'en-US';
    readonly dateFnsLocale: Locale;
    readonly weekStartsOn = 1 as const;
    readonly labels: CalendarLabels;

    constructor() {
        registerLocaleDataOnce();

        this.code = normalizeCalendarLocale(inject(LOCALE_ID));
        this.intlTag = this.code === 'en' ? 'en-US' : 'uk-UA';
        this.dateFnsLocale = this.code === 'en' ? enUS : uk;

        const base = this.code === 'en' ? LABELS_EN : LABELS_UK;
        const override = inject(CALENDAR_LABELS, {optional: true}) ?? {};
        this.labels = {...base, ...override};
    }
}

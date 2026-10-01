import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCalendar } from 'calendar';

import { routes } from './app.routes';
import { MockCalendarDataProvider, MockCalendarUserProvider } from './mock-calendar-providers';

const demoLocale = new URLSearchParams(globalThis.location?.search).get('lang') === 'en' ? 'en' : 'uk';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: demoLocale },
    provideRouter(routes),
    provideAnimations(),
    provideCalendar({
      data: MockCalendarDataProvider,
      user: MockCalendarUserProvider,
    }),
  ],
};

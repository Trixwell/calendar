import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCalendar } from 'calendar';

import { routes } from './app.routes';
import { MockCalendarDataProvider, MockCalendarUserProvider } from './mock-calendar-providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideCalendar({
      data: MockCalendarDataProvider,
      user: MockCalendarUserProvider,
    }),
  ],
};

# @trixwell/calendar

Angular calendar / scheduler library — year, month, week, and day views with
drag-to-select, mobile touch selection, and a date-picker modal, built on
Angular Material.

## Install

```bash
npm install @trixwell/calendar @angular/material @angular/cdk date-fns
```

`@angular/material`, `@angular/cdk`, and `date-fns` are **peer dependencies** —
they are not bundled and must be installed in the consuming app.

You'll also need:

- An animations provider registered in your app config (`provideAnimations()`
  or `provideAnimationsAsync()` from `@angular/platform-browser/animations`) —
  required by Angular Material.
- The Material Icons font, since components use `<mat-icon>` ligature icons.
  Add this to your `index.html`:
  ```html
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
  ```

## Theme setup

Add the library's theme (Material theming + button/select overrides) to your
global stylesheet:

```scss
@use '@trixwell/calendar/styles/theme';
```

This single `@use` sets up `mat.theme(...)` plus light/dark button and select
styling. If you only want the design tokens (colors, spacing, radii, fonts)
without the Material overrides, `@use` `@trixwell/calendar/styles/tokens` and
`@trixwell/calendar/styles/dark-tokens` directly instead.

## App setup

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCalendar } from '@trixwell/calendar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideCalendar({
      data: MyCalendarDataProvider,   // implements CalendarDataProvider
      user: MyCalendarUserProvider,   // implements CalendarUserProvider
      // viewport is optional — defaults to a BreakpointObserver-based provider
    }),
  ],
};
```

`CalendarDataProvider` and `CalendarUserProvider` are interfaces you implement
against your own backend:

```ts
interface CalendarDataProvider {
  getTasks(startISO: string, endISO: string): Observable<MasterTask[]>;
}

interface CalendarUserProvider {
  profile$: Observable<User | null>;
}
```

## Usage

```html
<app-calendar
  (daysConfirmed)="onDaysConfirmed($event)"
  (dateSelected)="onDateSelected($event)"
  (rangeSelected)="onRangeSelected($event)">
</app-calendar>
```

```ts
onDaysConfirmed(days: Date[]): void {
  // user confirmed which days to configure (mobile day-selection flow)
}

onDateSelected(date: Date): void {
  // user picked a date (date-picker modal, or a day header in week view)
}

onRangeSelected(range: { start: Date; end: Date }): void {
  // user selected a time range in day/week view (desktop drag or mobile touch)
}
```

## Public API

Exported from the package entry point:

- `CalendarComponent` — the top-level `<app-calendar>` facade
- `provideCalendar(config)` and `CalendarConfig` — app-level DI setup
- `CALENDAR_DATA`, `CALENDAR_USER`, `CALENDAR_VIEWPORT` — injection tokens for
  the three provider interfaces (`CalendarDataProvider`, `CalendarUserProvider`,
  `CalendarViewportProvider`)
- `DefaultCalendarViewportProvider` — the default `BreakpointObserver`-based
  viewport provider
- Entity types (`MasterTask`, `User`, `CalendarView`, etc.) from
  `./lib/calendar/core/entity`

## License

[LGPL-3.0-only](./LICENSE)

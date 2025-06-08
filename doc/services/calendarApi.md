# CalendarAPI Service (`src/services/calendarApi.ts`)

## Purpose

The `CalendarAPI` service is responsible for fetching calendar data from iCalendar (`.ics`) URLs, parsing this data, and transforming it into a format usable by the Time Ruler plugin. It handles both single and recurring events, including exceptions and overrides for recurrences, and then updates the global application state with these processed events.

## Class Definition

### `CalendarAPI extends Component`

The service is structured as a class that extends Obsidian's `Component` class, allowing it to potentially leverage Obsidian's lifecycle management if used as a child component (though in this snippet, it's instantiated directly).

#### Constructor

*   **`constructor(settings: [TimeRulerPlugin['settings']](../../types.md#timerulersettings), removeCalendar: (calendar: string) => void)`**:
    *   `settings`: The Time Ruler plugin's settings object, which contains the list of calendar URLs (`settings.calendars`).
    *   `removeCalendar`: A callback function (though not used in the provided `loadEvents` method snippet) likely intended for removing a calendar URL if it's invalid or causes issues.

#### Properties

*   **`settings: [TimeRulerPlugin['settings']](../../types.md#timerulersettings)`**: Stores the plugin settings.
*   **`removeCalendar: (calendar: string) => void`**: Stores the callback for removing calendars.

## Public API

The primary public method of this class is:

*   **`async loadEvents()`**:
    *   This asynchronous method fetches and processes events from all calendar URLs defined in `this.settings.calendars`.
    *   It updates the global store with the processed events via `setters.set({ events })`.

## Functionality

1.  **Online Check**:
    *   Initially checks `window.navigator.onLine`. If offline, it logs a warning and returns, preventing further processing.

2.  **Date Bounding**:
    *   Determines `dateBounds` (a start and end `DateTime`) based on `searchWithinWeeks` and `showingPastDates` from the global store ([`getters.get()`](../../store.md#getters)). This range is used to filter which instances of recurring events are generated.

3.  **Fetching and Parsing Calendars**:
    *   Iterates through each calendar URL in `this.settings.calendars`.
    *   For each URL:
        *   Uses Obsidian's `request()` function to fetch the iCalendar data.
        *   Parses the ICS data using `ical.parseICS(data)`.
        *   Extracts the calendar name (`CALNAME`) from the ICS data, defaulting to "Default".

4.  **Event Processing**:
    *   Iterates through each event (`VEVENT`) from the parsed ICS data.
    *   **Recurring Events (`event.rrule`)**:
        *   If an event has an RRule (recurrence rule):
            *   Generates occurrences within the `dateBounds` using `event.rrule.between()`.
            *   Applies a timezone offset patch for events that span across daylight saving time changes relative to the current time.
            *   Includes explicit `event.recurrences` (overridden instances) if they fall within `dateBounds`.
            *   Calculates the base `duration` of the event.
            *   For each generated `date` (occurrence):
                *   Checks for recurrence overrides (`event.recurrences[dateLookupKey]`) for that specific date. If found, uses the override's start, end, and title.
                *   Checks for recurrence exceptions (`event.exdate[dateLookupKey]`). If found, skips this occurrence.
                *   Otherwise, uses the base event details and the generated `date` for the occurrence's start, calculating the end based on `duration`.
                *   Formats `startISO` and `endISO` (as full ISO strings or ISO dates if `event.start['dateOnly']` is true).
                *   Creates an `[EventProps](../../types.md#eventprops)` object and adds it to the local `events` collection.
    *   **Single (Non-Recurring) Events**:
        *   If the event does not have an RRule:
            *   Checks if the event's `end` time is before `dateBounds[0]` or `start` time is after `dateBounds[1]`. If so, skips the event.
            *   Formats `startISO` and `endISO`.
            *   Creates an `[EventProps](../../types.md#eventprops)` object and adds it to the local `events` collection.

5.  **Error Handling and Offline Notification**:
    *   Uses a `try...catch` block for each calendar fetch and parse operation.
    *   If an error occurs, it logs the error and sets an `offline` flag.
    *   If `offline` is true and `reportedOffline` (a module-level flag) is false, it shows an Obsidian `Notice` ("Time Ruler: calendars offline.") and sets `reportedOffline = true` to prevent repeated notices.

6.  **Updating Global Store**:
    *   After attempting to load all calendars (using `Promise.all(calendarLoads)`), it calls [`setters.set({ events })`](../../store.md#setters-actions) to update the application's global state with all the collected and processed events.

## Data Types and Interfaces

While not explicitly defined in this file, the code implies the existence of an `[EventProps](../../types.md#eventprops)` interface/type, which likely includes:

*   `id: string`
*   `title: string`
*   `startISO: string` (ISO datetime string or ISO date string)
*   `endISO: string` (ISO datetime string or ISO date string)
*   `type: 'event'`
*   `calendarId: string` (index of the calendar in the settings array)
*   `calendarName: string`
*   `color: string` (seems to be initialized as empty)
*   `notes: string | undefined` (from `event.description`)
*   `location: string | undefined` (from `event.location`)

The service uses `ical` and `ical2json` (though `ical2json` is imported but not directly used in the snippet) libraries for parsing iCalendar data.

## Usage

The `CalendarAPI` is typically instantiated once, and its `loadEvents()` method is called when the plugin loads or when calendar data needs to be refreshed.

```typescript
// Example instantiation (likely in main.ts or a similar central place)
// Assuming 'this.settings' is the plugin settings and 'this.removeCalendarFromSettings' is a method to update settings
const calendarAPI = new CalendarAPI(this.settings, this.removeCalendarFromSettings);

// To load events:
await calendarAPI.loadEvents();
```

This service is crucial for integrating external calendar data into the Time Ruler plugin, providing users with a unified view of their scheduled tasks and events.

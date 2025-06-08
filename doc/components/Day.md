# Day Component (`src/components/Day.tsx`)

## Purpose

The `Day` component is responsible for rendering the entire view for a single day within the Time Ruler. This includes:
*   Displaying the date and providing a way to navigate to the corresponding daily note.
*   Showing all-day tasks and events.
*   Displaying tasks and events scheduled for specific times throughout the day, organized into blocks.
*   Handling tasks that were scheduled in the past (if `showingPastDates` is true or `showCompleted` for today is true).
*   Showing upcoming tasks (due today but not yet scheduled for a specific time).
*   Integrating a timer display if it's the current day (`isNow`).
*   Providing a "focus on now" feature to collapse past items for the current day.

## Props

*   **`startISO`** (`string`): The ISO string representation of the start time for this day (typically the beginning of the day, e.g., `YYYY-MM-DDTHH:mm:ss.sssZ`).
*   **`endISO`** (`string`): The ISO string representation of the end time for this day (typically the end of the day or start of the next day).
*   **`type`** (`TimeSpanTypes` from `./Minutes.tsx`): Likely indicates the granularity or type of time span being represented (e.g., 'minutes', 'hours'). This seems to be primarily passed down to the `Hours` component.
*   **`dragContainer`** (`string`): An identifier for the drag context, used to scope drag-and-drop operations for items within this day.
*   **`isNow`** (optional, `boolean`): A flag indicating if this `Day` component represents the current day.

## State (managed via `useAppStore` and local state/refs)

*   **`showingPastDates`**: Global state, boolean indicating if past dates are being displayed.
*   **`now`**: Local state, the current time rounded to the nearest minute, in ISO format.
*   **`showCompleted`**: Global state, boolean indicating if completed tasks should be shown for today.
*   **Derived Task/Event Categories (from `useAppStore`)**:
    *   **`allDay`**: `BlockProps` object containing tasks and events scheduled for the entire day (startISO is a date without time).
    *   **`blocksByTime`**: An object where keys are ISO timestamps and values are `BlockProps` objects, grouping tasks and events by their specific scheduled times.
    *   **`pastTasks`**: `BlockProps` object for tasks scheduled before the current day/view when `showingPastDates` is active or for tasks completed today if `showCompleted` is active.
    *   **`upcoming`**: `BlockProps` object for tasks due today but not yet scheduled for a specific time.
    *   This derivation logic is complex, iterating through all `state.tasks` and `state.events` to categorize them based on their `scheduled` and `due` dates, completion status, and the current view settings (`isNow`, `showingPastDates`, `showCompleted`, `startISO`, `endISO`).
*   **`blocks`**: Local variable, an array of `BlockProps` derived from `blocksByTime`, sorted by time.
*   **`viewMode`**: Global state, current view mode ('hour', 'day', 'week').
*   **`calendarMode`**: Local boolean, true if `viewMode` is 'week'.
*   **`title`**: Local string, formatted date title (e.g., "Mon, Jan 1" or "Mon 1" in week view).
*   **`collapsed`**: Global state (`state.collapsed[id]`), boolean indicating if the all-day/upcoming section of this day is collapsed. `id` is the `startDate`.
*   **`foundTaskInAllDay`**: Global state (`state.findingTask`), stores the ID of a task if it's being searched for and found within the `allDay` tasks of this component.
*   **`allDayFrame`**: `useRef` for the DOM element containing all-day tasks, possibly for measurement or direct manipulation (though not explicitly shown in the provided snippet beyond `ref` assignment).
*   **`wide`**: Global state (`state.childWidth > 1`), boolean indicating if the view columns are wide.
*   **`focus`**: Global state (`state.collapsed[TR_NOW]`), boolean indicating if "focus on now" mode is active for the current day. `TR_NOW` is a constant "TR::NOW".

## Functionality

### Task and Event Processing:

*   Filters and categorizes all tasks and events from the global store (`state.tasks`, `state.events`) into `allDay`, `blocksByTime`, `pastTasks`, and `upcoming` based on their dates, completion status, and current view settings.
*   Sorts the time-specific blocks (`blocksByTime`) chronologically.

### Rendering the Day Header:

*   Displays the formatted `title` (date).
*   The title area is a `Droppable` target, allowing items to be dropped onto it to be scheduled for this day (specifically, `startDate`).
*   Includes a collapse/expand `Button` for the all-day/upcoming tasks section.
*   Clicking the title opens the corresponding daily note in Obsidian. If the note doesn't exist, it's created first.

### Rendering "Now" Specifics (if `isNow` is true):

*   **`Timer` Component**: Renders the `Timer` component.
*   **"Now" Line and Focus**:
    *   Displays a horizontal line indicating the current time ("Now"). This line is also a `Droppable` target for scheduling items to the current time.
    *   Provides a "focus on now" `Button` (`maximize-2` / `minimize-2` icon).
        *   When activated (`focus` is true), it visually highlights the "now" section, potentially hides future blocks for the day by adjusting `endISO` for the `Hours` component, and filters `blocks` to only show those up to `now`.
        *   It also collapses the main all-day/upcoming section for the current day.

### Rendering Task/Event Sections:

*   **All-Day/Past/Upcoming Section**:
    *   If not `collapsed` and there are relevant tasks/events, this section is rendered.
    *   It can be a `resize-y` container in 'hour' view if not `wide`.
    *   Renders separate `Block` components for:
        *   `pastTasks` (if any, titled "past").
        *   Each `allDay` event (type 'event').
        *   `allDay` tasks (if any, type 'all-day', titled "today").
        *   `upcoming` tasks (if any, type 'upcoming', titled "upcoming").
*   **Timed Blocks Section (`Hours` component)**:
    *   Renders the `Hours` component, passing it the processed `blocks`, `startISO`, `endISO`, `type`, and `dragContainer`. The `Hours` component is responsible for rendering the individual time slots and the `Block` components within them.
    *   The layout of this section (flex direction, overflow) changes based on `viewMode` and `wide` status.
    *   Includes a final `Droppable` area at the end of the timeline for the day.

### Auto-Expanding for Found Tasks:

*   An `useEffect` hook monitors `foundTaskInAllDay`. If a task being searched for is found in the `allDay` section and this section is `collapsed`, it automatically expands it and then triggers `openTaskInRuler` to highlight the task.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`getters`, `setters`, `useAppStore`)**:
    *   Extensively uses the store to get tasks, events, settings (`showingPastDates`, `showCompleted`, `viewMode`, `childWidth`, `collapsed`, `findingTask`).
    *   Uses `setters.patchCollapsed` to toggle the collapsed state of the day's sections and the "focus on now" mode.
    *   Uses `setters.set({ findingTask: null })` after handling a found task.
    *   Uses `getters.get('dailyNoteInfo')`, `getters.getApp()`, `getters.getObsidianAPI()` for daily note interactions.
*   **`src/services/obsidianApi.ts`**:
    *   `openTaskInRuler`: To highlight a specific task.
    *   `createFileFromPath` (via `getters.getObsidianAPI()`): To create daily notes.
*   **`src/services/util.ts`**:
    *   `getStartDate`, `isDateISO`, `parsePathFromDate`, `parseTaskDate`, `roundMinutes`, `toISO`.
*   **Child Components**:
    *   `Block`: Used to render all-day tasks, past tasks, upcoming tasks, and calendar events within the top section. The `Hours` component will also render `Block` components for timed items.
    *   `Button`: For collapse/expand and "focus on now" buttons.
    *   `Droppable`: Makes various parts of the day (header, "now" line, end of timeline) drop targets.
    *   `[Hours](./Hours.md)`: Renders the main timeline for tasks with specific times.
    *   `[Timer](./Timer.md)`: Displays the timer if `isNow` is true.
*   **Parent Components**:
    *   Likely rendered by a component that manages a list of days (e.g., `[App.tsx](./App.md)` or a week/month view component).

The `Day` component is a major hub for displaying and interacting with a day's agenda, combining data from various sources and responding to global state changes.

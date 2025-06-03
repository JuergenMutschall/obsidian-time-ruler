# App Component (`src/components/App.tsx`)

## Purpose

The `App` component is the root UI component for the Time Ruler plugin. It orchestrates the entire user interface, including rendering the timeline, tasks, unscheduled tasks, buttons for interaction, and handling drag-and-drop functionality. It also initializes and manages the plugin's state and settings.

## Props

*   `apis`: An object containing references to various APIs required by the component. This includes:
    *   `obsidian`: API for interacting with Obsidian (e.g., loading settings, tasks).
    *   `calendar`: API for loading calendar events.
    *   `[others]`: Potentially other APIs needed for the plugin's functionality.
    *   It's noted that these are stored in the app's store to maintain references.

## State (managed via `useAppStore` and local `useState`)

The component manages a significant amount of state, including:

*   **`now`**: The current date and time, updated every minute.
*   **`weeksShownState`**: Number of weeks to display in the calendar view.
*   **`activeDrag`**: Information about the currently dragged item (task, block, group, etc.).
*   **`scrollViews`**: An array defining the range of currently visible date sections in the scrollable timeline, used for performance optimization (virtualization).
*   **`showingModal`**: Boolean to control the visibility of the main settings/actions modal.

It also heavily relies on a global Zustand store (`useAppStore`, `getters`, `setters`) for managing:

*   **`settings`**: Various plugin settings (e.g., `muted`, `twentyFourHourFormat`, `groupBy`, `viewMode`).
*   **`dailyNoteInfo`**: Information about the daily note.
*   **`tasks`**: The list of tasks.
*   **`calendarEvents`**: Events loaded from calendars.
*   **`dragData`**: Data related to the active drag operation.
*   **`showingPastDates`**: Boolean indicating if past dates are being shown.
*   **`searchWithinWeeks`**: Range of weeks to include in search.
*   **`searchStatus`**: Boolean indicating if the search interface is active.
*   **`timer`**: State of the built-in timer (start time, duration, playing status).
*   **`childWidth`**: Width of individual day/time columns, used for layout calculations.
*   **`dragOffset`**: Offset for positioning the drag overlay.

## Functionality

### Initialization and Data Loading:

*   On mount (`useEffect`), it calls the `reload` function.
*   `reload()`:
    *   Ensures Dataview plugin is initialized.
    *   Reloads Obsidian settings via `apis.obsidian.reload()`.
    *   Fetches daily note information.
    *   Updates the global store with these settings and data using `setters.set()`.
    *   Loads calendar events via `apis.calendar.loadEvents()`.
    *   Loads tasks via `apis.obsidian.loadTasks()`.

### Rendering the Timeline:

*   Calculates the `times` array, which defines the sections to be rendered (unscheduled, current day/time, future/past days).
*   The rendering of days is virtualized: only the `Day` components within the `scrollViews` range are actually rendered.
*   Supports different view modes (`hour`, `day`, `week`).
*   Handles displaying past dates based on `showingPastDates` state.

### Drag and Drop:

*   Uses `@dnd-kit/core` for drag-and-drop functionality.
*   `DndContext` wraps the main layout to enable dragging of tasks, blocks, and groups.
*   `DragOverlay` displays a custom preview of the dragged item.
*   `onDragStart` and `onDragEnd` (imported from `src/services/dragging.ts`) handle the logic for starting and completing drag operations, updating the store accordingly.
*   `Droppable` components are used for drop targets (e.g., day sections, buttons).

### Timer:

*   Manages an interval timer (`checkTimer`) to monitor the active timer state from the store.
*   When a timer completes, it updates the timer state (e.g., sets `negative: true`) and triggers a notification (sound or system notification based on settings).

### UI Interactions:

*   **Buttons Component (`Buttons`)**:
    *   Provides buttons for navigation (next/previous week/day), opening the settings/actions modal, toggling past/future dates, reloading, toggling time visibility, changing grouping, and layout modes.
    *   Allows users to jump to specific dates using `scrollToSection`.
    *   Includes a `NewTask` button.
*   **Search**:
    *   A `Search` component is rendered if `searchStatus` is true.
*   **Scrolling**:
    *   Implements auto-scrolling to the current day/time on initial load.
    *   `useAutoScroll` hook likely handles scrolling during drag operations.
    *   Manages horizontal scrolling of the timeline and updates `scrollViews` to render only visible items.

### Styling and Layout:

*   Uses Tailwind CSS classes extensively for styling.
*   Dynamically adjusts layout based on `viewMode` (e.g., `calendarMode`).
*   `childClass` and `childWidth` are used to manage the width of columns in the timeline.
*   Applies specific styles to the parent container of `#time-ruler` to ensure proper overflow and padding.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`getters`, `setters`, `useAppStore`)**: Heavily interacts with the global Zustand store to read state and update it.
*   **`src/services/dragging.ts` (`onDragStart`, `onDragEnd`)**: Delegates drag event handling.
*   **`src/services/obsidianApi.ts`**: Uses `getDailyNoteInfo`, `loadTasks`, `reload` (for settings).
*   **`src/services/calendarApi.ts`**: Uses `loadEvents`.
*   **`src/services/util.ts`**: Uses utility functions like `getStartDate`, `getToday`, `roundMinutes`, `scrollToSection`, `toISO`, `useChildWidth`.
*   **`src/services/autoScroll.ts` (`useAutoScroll`)**: For automatic scrolling during drag operations.
*   **`@dnd-kit/core`**: For all drag-and-drop functionality.
*   **`obsidian-dataview`**: Uses `getAPI()` to interact with the Dataview plugin, primarily to ensure its index is ready before loading tasks.
*   **`jquery`**: Used for DOM manipulation, specifically for measuring elements during drag operations and scrolling.
*   **Child Components**:
    *   `Day`: Renders individual day columns in the timeline.
    *   `Unscheduled`: Renders the section for unscheduled tasks.
    *   `Task`: Renders individual task items.
    *   `Block`: Renders time blocks.
    *   `Group`: Renders task groups (if grouping is enabled).
    *   `NewTask`: Component for creating new tasks.
    *   `Search`: Component for the search interface.
    *   `Button`: Reusable button component.
    *   `Logo`: For displaying icons.
    *   `Droppable`: Wrapper for drop targets.
*   **`src/assets/assets.ts` (`sounds`)**: Plays sounds for timer events.

## Key useEffect Hooks

*   **Initial Load & API Change**: Reloads data and settings when the component mounts or `apis` prop changes.
*   **Current Time Update**: Sets up an interval to update the `now` state every minute for the live clock.
*   **Timer Check**: Sets up an interval to check the status of the active timer every second.
*   **Initial Scroll**: Scrolls to the "today" section after a short delay on mount.
*   **Task Loading on View Change**: Reloads tasks when `weeksShownState` or `showingPastDates` changes.
*   **Search Range Update**: Adjusts `searchWithinWeeks` based on `showingPastDates` and `weeksShownState`.
*   **Scroll Virtualization**: Updates `scrollViews` based on scroll position to optimize rendering.
*   **Layout Adjustments**:
    *   Scrolls to the first visible element when `calendarMode` or `showingPastDates` changes.
    *   Adjusts parent container styles for overflow and padding.
*   **Modal Click-Away Listener**: Manages showing/hiding the main actions modal.

This component is central to the plugin's functionality, acting as the main controller and view layer.

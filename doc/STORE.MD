# Zustand Store (`src/app/store.ts`)

This document details the Zustand store implementation used in the Time Ruler plugin. The store is central to managing the application's state, providing a single source of truth for UI components and services.

## Overview

The store is created using Zustand's `createWithEqualityFn` for optimized re-renders, particularly useful when subscribing to parts of the state. It also leverages `immer` (via `produce`) for immutable state updates, making state modifications safer and more predictable.

```typescript
import { produce } from 'immer';
import { createWithEqualityFn } from 'zustand/traditional';
// ... other imports

export const useAppStore = createWithEqualityFn<AppState>(() => ({
  // ... initial state
}));

const modify = (modifier: (state: AppState) => void) =>
  useAppStore.setState(produce(modifier));
```

## `AppState` Interface

The `AppState` interface defines the shape of the global state managed by Zustand.

```typescript
export type AppState = {
  tasks: Record<string, TaskProps>;
  events: Record<string, EventProps>;
  apis: {
    obsidian?: ObsidianAPI;
    calendar?: CalendarAPI;
  };
  dragData: DragData | null;
  dragMode: 'ripple' | 'normal';
  findingTask: string | null;
  inScroll: number;
  searchStatus: boolean;
  dailyNoteInfo: {
    format: string;
    folder: string;
    template: string;
  };
  fileOrder: string[];
  newTask: null | { task: Partial<TaskProps>; type: 'new' | 'move' };
  settings: Pick<TimeRulerPlugin['settings'],
    | 'dayStartEnd' | 'groupBy' | 'muted' // ... and other settings
  >;
  collapsed: Record<string, boolean>;
  showingPastDates: boolean;
  searchWithinWeeks: [number, number];
  childWidth: number;
  timer: {
    negative: boolean;
    maxSeconds: number | null;
    startISO?: string;
    playing: boolean;
  };
  recreateWindow: number;
  dragOffset: number;
};
```

### Key State Slices and Their Purpose:

-   **`tasks: Record<string, TaskProps>`**:
    *   Stores all loaded tasks from the vault, indexed by their unique ID (typically `filePath::lineNumber` or a custom ID for page tasks).
    *   `TaskProps` contains all information about a task (title, scheduled time, duration, completion status, etc.).
-   **`events: Record<string, EventProps>`**:
    *   Stores all calendar events fetched from iCalendar feeds, indexed by event ID.
    *   `EventProps` contains details like summary, start/end times, and associated calendar.
-   **`apis: { obsidian?: ObsidianAPI; calendar?: CalendarAPI }`**:
    *   Holds instances of the core API services (`ObsidianAPI` for vault interactions, `CalendarAPI` for calendar fetching). These are initialized in `TimeRulerView` and set here.
-   **`dragData: DragData | null`**:
    *   Contains information about the item currently being dragged in the UI (e.g., a task, a block, a new task button). Includes `dragType` and the data of the dragged item.
    *   Set to `null` when no drag operation is active.
-   **`dragMode: 'ripple' | 'normal'`**:
    *   Defines the behavior of other tasks when one is being dragged (e.g., 'ripple' might shift subsequent tasks).
-   **`findingTask: string | null`**:
    *   Stores the ID of a task that the user is trying to locate (e.g., via "Reveal in Time Ruler"). Used to highlight the task in the UI.
-   **`inScroll: number`**:
    *   Likely used to manage scroll states or trigger actions based on scroll activity, possibly for performance optimizations or UI effects. The exact usage needs context from components consuming it.
-   **`searchStatus: boolean`**:
    *   `true` if the search modal/UI is currently active/visible, `false` otherwise.
-   **`dailyNoteInfo: { format: string; folder: string; template: string }`**:
    *   Stores Obsidian's daily note configuration (date format, folder path, template path), which is used when creating tasks in daily notes.
-   **`fileOrder: string[]`**:
    *   An array of file paths or unique identifiers representing the user-defined order of files/sections in the Time Ruler view.
-   **`newTask: null | { task: Partial<TaskProps>; type: 'new' | 'move' }`**:
    *   Holds temporary data for a task being created or moved.
    *   `task`: Contains partial properties of the new task.
    *   `type`: Indicates if it's a 'new' task or an existing task being 'move'd (though 'move' type might be conceptual here).
    *   Used to control the display and pre-fill data in the new task modal.
-   **`settings: Pick<TimeRulerPlugin['settings'], ...>`**:
    *   A subset of the main `TimeRulerSettings` from `src/main.ts`. This slice contains settings that directly affect the React UI and its behavior, allowing components to reactively update when these settings change.
-   **`collapsed: Record<string, boolean>`**:
    *   Stores the collapsed/expanded state of various UI elements (e.g., groups, sections), indexed by a unique identifier for that element. `true` if collapsed, `false` if expanded.
-   **`showingPastDates: boolean`**:
    *   If `true`, the timeline view includes past dates. If `false`, it starts from the current day/time.
-   **`searchWithinWeeks: [number, number]`**:
    *   Defines the window of weeks (relative to the current date) for which tasks are loaded and displayed. E.g., `[-1, 1]` might mean one week in the past and one week in the future.
-   **`childWidth: number`**:
    *   Represents the number of columns or logical children displayed in the timeline view (e.g., 1 for day view, 7 for week view). Used for layout calculations.
-   **`timer: { negative: boolean; maxSeconds: number | null; startISO?: string; playing: boolean }`**:
    *   Manages the state of the countdown timer feature.
    *   `negative`: If the timer has gone past zero.
    *   `maxSeconds`: The initial duration of the timer in seconds.
    *   `startISO`: The ISO timestamp when the timer was started.
    *   `playing`: `true` if the timer is currently running.
-   **`recreateWindow: number`**:
    *   A counter that, when changed, might trigger a re-creation or full refresh of certain windowed views or components. Useful for forcing updates when underlying data structures change in ways that might not be picked up by normal reactivity.
-   **`dragOffset: number`**:
    *   Stores the pixel offset for positioning the drag overlay, particularly for tasks, to ensure it aligns correctly with the mouse cursor during drag operations.

## Setters (Actions)

The `setters` object provides functions to modify the store's state. These are akin to actions or reducers in other state management patterns.

```typescript
export const setters = {
  set: (newState: Partial<AppState>) => modify(() => newState),
  // ... other setters
};
```

-   **`set(newState: Partial<AppState>)`**:
    *   A generic setter that merges the provided `newState` object into the current state.
    *   Uses the `modify` helper, which wraps `useAppStore.setState` with `produce` for immutability.
    *   Example: `setters.set({ searchStatus: true })`

-   **`patchTasks(ids: string[], task: Partial<TaskProps>)`**:
    *   Updates one or more tasks specified by `ids` with the new properties in `task`.
    *   It retrieves the `ObsidianAPI` instance using `getters.getObsidianAPI()`.
    *   For each task ID, it merges the new data with the existing task data (`getters.getTask(id)`).
    *   Handles a special case: if `task.scheduled` is `TaskActions.DELETE`, it removes the `scheduled` property from the task.
    *   Crucially, it calls `obsidianAPI.saveTask(savedTask)` for each modified task to persist the changes to the Markdown files.
    *   If `task.completion` is being set (i.e., a task is completed), it calls `obsidianAPI.playComplete()` to play a sound.
    *   **Note**: This setter directly triggers side effects (saving to disk, playing sound) via the `ObsidianAPI`.

-   **`patchCollapsed(ids: string[], collapsed: boolean)`**:
    *   Updates the `collapsed` state for multiple UI elements.
    *   Iterates through the provided `ids` and sets `state.collapsed[id] = collapsed`.

-   **`updateFileOrder(file: string, beforeFile: string)`**:
    *   Calls `obsidianAPI.updateFileOrder(file, beforeFile)` to persist changes to the user-defined file order. This setter delegates the actual state update of `fileOrder` to the `ObsidianAPI`'s internal logic, which would then likely call `setters.set` to update the store.

-   **`patchTimer(timer: Partial<AppState['timer']>)`**:
    *   Merges the provided partial timer state into the existing `state.timer` object.
    *   Example: `setters.patchTimer({ playing: true, startISO: DateTime.now().toISO() })`

## Getters

The `getters` object provides functions to access specific parts of the state or derived data.

```typescript
export const getters = {
  getEvent: (id: string) => useAppStore.getState().events[id],
  getTask: (id: string) => useAppStore.getState().tasks[id],
  // ... other getters
};
```

-   **`getEvent(id: string)`**: Returns a specific calendar event by its ID from the `events` slice.
-   **`getTask(id: string)`**: Returns a specific task by its ID from the `tasks` slice.
-   **`getObsidianAPI()`**: Returns the `ObsidianAPI` instance stored in `state.apis.obsidian`.
-   **`getCalendarAPI()`**: Returns the `CalendarAPI` instance stored in `state.apis.calendar`.
-   **`get<T extends keyof AppState>(key: T)`**: A generic getter to retrieve any top-level property from the state by its key.
-   **`getApp()`**: Returns the Obsidian `App` object, accessed via `state.apis.obsidian!.app`.

These getters use `useAppStore.getState()` to access the current state directly, which is suitable for use outside of React components (e.g., in service layers or utility functions). Within React components, `useAppStore(state => state.someValue)` is preferred for reactive updates.

## `useAppStoreRef` Hook

```typescript
export const useAppStoreRef = <T>(callback: (state: AppState) => T) => {
  const storeValue = useAppStore(callback);
  const storeValueRef = useRef<T>(storeValue);
  storeValueRef.current = storeValue;
  return [storeValue, storeValueRef] as [
    typeof storeValue,
    typeof storeValueRef
  ];
};
```
This custom hook provides both the reactive `storeValue` (obtained via `useAppStore(callback)`) and a `ref` (`storeValueRef`) that always holds the latest version of that selected state. This is particularly useful for event handlers or asynchronous operations defined within React components where you need to access the latest state value without causing re-renders if only the ref is used, or ensuring that closures capture the most recent state.

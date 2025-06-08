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
  tasks: Record<string, [TaskProps](../types.md#taskprops)>;
  events: Record<string, [EventProps](../types.md#eventprops)>;
  apis: {
    obsidian?: [ObsidianAPI](../services/obsidianApi.md);
    calendar?: [CalendarAPI](../services/calendarApi.md);
  };
  dragData: [DragData](../types.md#dragdata) | null;
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
  newTask: null | { task: Partial<[TaskProps](../types.md#taskprops)>; type: 'new' | 'move' };
  settings: Pick<[TimeRulerPlugin['settings']](../types.md#timerulersettings),
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

-   **`tasks: Record<string, [TaskProps](../types.md#taskprops)>`**:
    *   Stores all loaded tasks from the vault, indexed by their unique ID (typically `filePath::lineNumber` or a custom ID for page tasks).
    *   `[TaskProps](../types.md#taskprops)` contains all information about a task (title, scheduled time, duration, completion status, etc.).
-   **`events: Record<string, [EventProps](../types.md#eventprops)>`**:
    *   Stores all calendar events fetched from iCalendar feeds, indexed by event ID.
    *   `[EventProps](../types.md#eventprops)` contains details like summary, start/end times, and associated calendar.
-   **`apis: { obsidian?: [ObsidianAPI](../services/obsidianApi.md); calendar?: [CalendarAPI](../services/calendarApi.md) }`**:
    *   Holds instances of the core API services (`[ObsidianAPI](../services/obsidianApi.md)` for vault interactions, `[CalendarAPI](../services/calendarApi.md)` for calendar fetching). These are initialized in `TimeRulerView` and set here.
-   **`dragData: [DragData](../types.md#dragdata) | null`**:
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
-   **`newTask: null | { task: Partial<[TaskProps](../types.md#taskprops)>; type: 'new' | 'move' }`**:
    *   Holds temporary data for a task being created or moved.
    *   `task`: Contains partial properties of the new task.
    *   `type`: Indicates if it's a 'new' task or an existing task being 'move'd (though 'move' type might be conceptual here).
    *   Used to control the display and pre-fill data in the new task modal.
-   **`settings: Pick<[TimeRulerPlugin['settings']](../types.md#timerulersettings), ...>`**:
    *   A subset of the main `[TimeRulerSettings](../types.md#timerulersettings)` from `src/main.ts`. This slice contains settings that directly affect the React UI and its behavior, allowing components to reactively update when these settings change.
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

-   **`patchTasks(ids: string[], task: Partial<[TaskProps](../types.md#taskprops)>)`**:
    *   Updates one or more tasks specified by `ids` with the new properties in `task`.
    *   It retrieves the `[ObsidianAPI](../services/obsidianApi.md)` instance using `getters.getObsidianAPI()`.
    *   For each task ID, it merges the new data with the existing task data (`getters.getTask(id)`).
    *   Handles a special case: if `task.scheduled` is `[TaskActions](../types.md#taskactions).DELETE`, it removes the `scheduled` property from the task.
    *   Crucially, it calls `obsidianAPI.saveTask(savedTask)` for each modified task to persist the changes to the Markdown files.
    *   If `task.completion` is being set (i.e., a task is completed), it calls `obsidianAPI.playComplete()` to play a sound.
    *   **Note**: This setter directly triggers side effects (saving to disk, playing sound) via the `[ObsidianAPI](../services/obsidianApi.md)`.

-   **`patchCollapsed(ids: string[], collapsed: boolean)`**:
    *   Updates the `collapsed` state for multiple UI elements.
    *   Iterates through the provided `ids` and sets `state.collapsed[id] = collapsed`.

-   **`updateFileOrder(file: string, beforeFile: string)`**:
    *   Calls `obsidianAPI.updateFileOrder(file, beforeFile)` to persist changes to the user-defined file order. This setter delegates the actual state update of `fileOrder` to the `[ObsidianAPI](../services/obsidianApi.md)`'s internal logic, which would then likely call `setters.set` to update the store.

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
-   **`getObsidianAPI()`**: Returns the `[ObsidianAPI](../services/obsidianApi.md)` instance stored in `state.apis.obsidian`.
-   **`getCalendarAPI()`**: Returns the `[CalendarAPI](../services/calendarApi.md)` instance stored in `state.apis.calendar`.
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

# Store Mechanism (`src/app/store.ts`)

This document explains the state management mechanism used in this application, primarily centered around the `src/app/store.ts` file. The store is built using [Zustand](https://github.com/pmndrs/zustand) as the state management library and [Immer](https://immerjs.github.io/immer/) for handling immutable state updates.

## Overview

The `store.ts` file is responsible for:

- Defining the shape of the global application state.
- Initializing the store with default values.
- Providing functions to modify the state in an immutable way.
- Providing functions to access or get data from the state.

## Store Definition and Hook

### `useAppStore` (Zustand Hook)

This is the main hook generated by Zustand using `createWithEqualityFn`. It initializes the store with a default state (all the properties defined in `AppState` set to their initial values).

- `createWithEqualityFn`: This specific creator from Zustand is used to create the store. It helps in optimizing re-renders by allowing custom equality functions if needed, though the default behavior often works well.

To use the store in a React component, you would typically import `useAppStore` and then select the parts of the state your component needs.

*   **`useAppStore = createWithEqualityFn<AppState>(() => ({ ...initialState }))`**:
    *   Creates the Zustand store using `createWithEqualityFn`. The `equalityFn` is not specified in the snippet but typically defaults to `Object.is` or can be customized (e.g., `shallow` from `zustand/shallow` for partial subscriptions).
    *   The store is initialized with a default `AppState` object.

###  `useAppStoreRef` (Custom Hook)

This is a utility hook that provides a React ref (`useRef`) to a value selected from the store.
- It takes a callback function that selects a part of the state.
- It returns an array containing the current state value and a ref object whose `.current` property will always hold the latest state value.
- This is particularly useful for accessing the latest state within callbacks or effects without causing re-renders if the state value itself hasn't changed according to the component's perspective, or when you need to pass the latest state to a non-reactive part of the system.

*   **`useAppStoreRef<T>(callback: (state: AppState) => T)`**:
    *   A custom hook that provides both the reactive store value (like `useAppStore(callback)`) and a `ref` (`storeValueRef`) that always holds the latest version of that selected state. This can be useful to avoid stale closures in callbacks or effects that don't re-subscribe on every render.
    *   Returns `[storeValue, storeValueRef]`.

###  `modify` (Function)

A helper function designed to simplify state updates.
- It takes a `modifier` function as an argument. This `modifier` function receives a draft of the current state (provided by Immer).
- Inside the `modifier` function, you can "mutate" the draft state directly. Immer handles the complexities of turning these "mutations" into safe, immutable updates to the actual state.
- `useAppStore.setState(produce(modifier))`: This is where Zustand's `setState` is called with Immer's `produce` to apply the changes.

## `AppState` Type Definition

This type defines the shape of the global state:

*   **`tasks: Record<string, TaskProps>`**: An object where keys are task IDs and values are `TaskProps` objects representing individual tasks.
*   **`events: Record<string, EventProps>`**: An object where keys are event IDs and values are `EventProps` objects representing calendar events.
*   **`apis: { obsidian?: ObsidianAPI; calendar?: CalendarAPI }`**: Holds instances of the core API service classes (`ObsidianAPI` and `CalendarAPI`).
*   **`dragData: DragData | null`**: Stores data about the currently dragged item (task, block, group, etc.) during a drag-and-drop operation. `null` if nothing is being dragged.
*   **`dragMode: 'ripple' | 'normal'`**: Defines the drag behavior mode (e.g., how dragging affects other items).
*   **`findingTask: string | null`**: Stores the ID of a task that the application is currently trying to find and reveal in the UI.
*   **`inScroll: number`**: (Usage not entirely clear from context, possibly related to scroll state or a counter).
*   **`searchStatus: boolean`**: True if the search modal/UI is currently active.
*   **`dailyNoteInfo: { format: string; folder: string; template: string }`**: Stores Obsidian's daily note configuration.
*   **`fileOrder: string[]`**: An array of file paths, defining a custom sort order for files/groups in some views.
*   **`newTask: null | { task: Partial<TaskProps>; type: 'new' | 'move' }`**: Holds temporary data for a task being created or moved via the `NewTask` component modal.
*   **`settings: Pick<TimeRulerPlugin['settings'], ...>`**: A subset of the main plugin settings (`TimeRulerPlugin['settings']`) that are relevant to the reactive UI components. Includes:
    *   `dayStartEnd: [number, number]`
    *   `groupBy: 'path' | 'priority' | 'hybrid' | 'tags' | false`
    *   `muted: boolean`
    *   `timerEvent: 'notification' | 'sound'`
    *   `twentyFourHourFormat: boolean`
    *   `showCompleted: boolean`
    *   `extendBlocks: boolean`
    *   `hideTimes: boolean`
    *   `borders: boolean`
    *   `viewMode: 'hour' | 'day' | 'week'`
    *   `scheduledSubtasks: boolean`
*   **`collapsed: Record<string, boolean>`**: An object where keys are IDs (e.g., task IDs for subtask visibility, group heading paths, or special IDs like `TR_NOW`) and values are booleans indicating if the corresponding UI section is collapsed.
*   **`showingPastDates: boolean`**: True if the UI should display past dates; false for current/future dates.
*   **`searchWithinWeeks: [number, number]`**: A tuple representing the range of weeks (relative to today) to include in searches or data loading [past weeks, future weeks].
*   **`childWidth: number`**: Represents the calculated number of logical columns that can fit in certain UI areas (e.g., for day view).
*   **`timer: { negative: boolean; maxSeconds: number | null; startISO?: string; playing: boolean }`**: State for the built-in timer/stopwatch.
    *   `negative`: True if timer has passed zero and is counting up.
    *   `maxSeconds`: Total duration for a countdown; `null` for stopwatch.
    *   `startISO`: Expiry ISO for countdown; start ISO for stopwatch.
    *   `playing`: True if currently running.
*   **`recreateWindow: number`**: A counter that, when changed, might signal components (like `useChildWidth`) to re-evaluate dimensions, typically after a layout change or window resize.
*   **`dragOffset: number`**: Stores the horizontal offset calculated during task drag initiation, used for positioning the drag overlay.

## Initial State

The store is initialized with default values for all `AppState` properties, including empty objects for `tasks` and `events`, default settings values (some imported from `DEFAULT_SETTINGS` in `main.ts`), and sensible defaults for UI states.

## `setters` Object

This object provides functions to modify the store's state. It uses `immer`'s `produce` for safe and immutable updates.

*   **`set(newState: Partial<AppState>)`**: A generic setter that merges a partial state into the current state.
*   **`patchTasks(ids: string[], task: Partial<TaskProps>)`**:
    *   Updates one or more tasks by their `ids` with the provided partial `task` data.
    *   For each task, it merges the existing task data with the new partial data.
    *   If `task.scheduled === TaskActions.DELETE` (a special enum value), it removes the `scheduled` property from the task.
    *   Calls `obsidianAPI.saveTask()` for each modified task to persist changes to Markdown.
    *   If `task.completion` is set (i.e., task completed), calls `obsidianAPI.playComplete()` for sound feedback.
*   **`patchCollapsed(ids: string[], collapsed: boolean)`**: Updates the `collapsed` status for multiple IDs.
*   **`updateFileOrder(file: string, beforeFile: string)`**: Calls `obsidianAPI.updateFileOrder()` to handle the logic of reordering files (which then likely updates the `fileOrder` state via `setSetting` in `ObsidianAPI`).
*   **`patchTimer(timer: Partial<AppState['timer']>)`**: Merges partial updates into the `timer` state object.

## `getters` Object

This object provides functions to directly access parts of the store's state or derived data. It uses `useAppStore.getState()` to get the current state non-reactively.

*   **`getEvent(id: string): EventProps | undefined`**: Retrieves a specific event by its ID.
*   **`getTask(id: string): TaskProps | undefined`**: Retrieves a specific task by its ID.
*   **`getObsidianAPI(): ObsidianAPI`**: Returns the `ObsidianAPI` instance.
*   **`getCalendarAPI(): CalendarAPI`**: Returns the `CalendarAPI` instance.
*   **`get<T extends keyof AppState>(key: T): AppState[T]`**: Retrieves any top-level state property by its key.
*   **`getApp(): App`**: Returns the Obsidian `App` instance (via `apis.obsidian.app`).

## Usage

Components throughout the application use the `useAppStore` hook to subscribe to state changes and select specific parts of the state they need.

```tsx
// Example in a React component
import { useAppStore, setters, getters } from 'src/app/store';

function MyComponent() {
  const tasks = useAppStore(state => state.tasks);
  const settings = useAppStore(state => state.settings);
  const dragData = useAppStore(state => state.dragData);

  const handleCompleteTask = (taskId: string) => {
    setters.patchTasks([taskId], { completed: true, completion: new Date().toISOString() });
  };

  // Non-reactive access if needed in a callback
  const someCallback = () => {
    const currentDragData = getters.get('dragData');
    // ...
  };

  return (
    // ... UI using tasks, settings, dragData ...
  );
}
```

The store acts as the single source of truth for the plugin, facilitating communication between different components and services and managing the overall application state in a structured way.
```
This custom hook provides both the reactive `storeValue` (obtained via `useAppStore(callback)`) and a `ref` (`storeValueRef`) that always holds the latest version of that selected state. This is particularly useful for event handlers or asynchronous operations defined within React components where you need to access the latest state value without causing re-renders if only the ref is used, or ensuring that closures capture the most recent state.

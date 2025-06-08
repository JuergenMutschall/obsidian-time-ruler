# AppInitializer Component (`src/components/AppInitializer.tsx`)

## Purpose

The `AppInitializer` is a "headless" React component (it renders `null`) that serves a crucial role in the Time Ruler plugin's startup and ongoing operation. Its primary responsibilities include:

1.  Triggering the initial loading of data (tasks, events, settings) when the application mounts.
2.  Managing global timer logic, including checking for timer completion and firing notifications.
3.  Orchestrating initial UI behaviors like scrolling the timeline to the current day.
4.  Synchronizing certain aspects of the application state (like `weeksShownState` and `searchWithinWeeks`) based on user interactions or mode changes (e.g., `calendarMode`).
5.  Reloading tasks when the visible date range or search parameters change.

It encapsulates setup logic and side effects that need to occur at the application level but are not directly tied to a specific visual element.

## Props

The component receives the following props, primarily from its parent [`App.tsx`](./App.md):

*   **`reload: () => Promise<void>`**:
    *   A function (passed from [`App.tsx`](./App.md)) that orchestrates the main data loading sequence (settings, daily note info, tasks, calendar events) into the Zustand store.
*   **`weeksShownState: number`**:
    *   The current number of weeks being displayed in the [`TimelineView`](./TimelineView.md).
*   **`setWeeksShown: (weeks: number) => void`**:
    *   A callback function (from [`App.tsx`](./App.md)'s `useState`) to update the `weeksShownState`.
*   **`showingPastDates: boolean`**:
    *   Indicates whether the timeline view is currently displaying past dates.
*   **`searchWithinWeeks: [number, number]`**:
    *   The current range of weeks (e.g., `[-1, 2]` for one week past, two weeks future) used by `[ObsidianAPI](../../services/obsidianApi.md)` to load tasks.
*   **`calendarMode: boolean`**:
    *   `true` if the [`TimelineView`](./TimelineView.md) is in a week/calendar layout, `false` otherwise (e.g., day or hour view).
*   **`timelineViewRef: React.RefObject<[TimelineViewHandle](./TimelineViewHandle.md) | undefined>`**:
    *   A React ref pointing to the [`TimelineView`](./TimelineView.md) component instance. This allows `AppInitializer` to call imperative methods on [`TimelineView`](./TimelineView.md), such as `scrollTo()`.

## Key Functionalities and `useEffect` Hooks

The component's logic is entirely contained within `useEffect` hooks, reflecting its role in managing side effects.

1.  **Initial Data Load**:
    *   `useEffect(() => { reload(); }, [reload]);`
    *   **Action**: Calls the `reload` prop function on component mount.
    *   **Purpose**: This is the primary trigger for populating the Zustand store with essential data (plugin settings, daily note configuration, tasks from the vault, and calendar events) when the Time Ruler view is first opened or refreshed.

2.  **Global Timer Management**:
    *   `useEffect(() => { /* ... */ }, []);` (runs once on mount)
    *   **Action**:
        *   Sets up an interval (`update`) to call `setNow(DateTime.now())` every 60 seconds. While `setNow` updates a local state variable, this `now` is not directly used for rendering other components after recent refactoring; its main purpose here is to keep the effect active for the `checkTimer` interval.
        *   Sets up a second interval (`checkTimer`) that runs every 1000ms.
        *   `checkTimer` retrieves the current timer state (`startISO`, `maxSeconds`, `playing`) from the Zustand store via `getters.get('timer')`.
        *   If the timer is `playing` and conditions indicate it has completed (i.e., `startISO` exists and the current time is past the intended end time), it:
            *   Updates the timer state in the store using `setters.patchTimer()` to mark it as completed (`maxSeconds: null`), potentially negative (overtime), and still `playing` (perhaps to indicate it has finished and is now in overtime).
            *   Triggers a notification: plays a sound (`sounds.timer.play()`) and shows an Obsidian `Notice` on mobile. On desktop, it either creates a system `Notification` or plays a sound with a `Notice`, based on the `settings.timerEvent` from the store.
    *   **Cleanup**: Clears both intervals when the component unmounts.
    *   **Purpose**: Manages the active countdown timer, detects when it finishes, and notifies the user.

3.  **Initial Scroll to Today**:
    *   `useEffect(() => { /* ... */ }, [timelineViewRef]);`
    *   **Action**: After a 1-second timeout (to allow [`TimelineView`](./TimelineView.md)'s DOM to render), it checks if `timelineViewRef.current` exists. If so, it calls `timelineViewRef.current.scrollTo(getToday())`.
    *   **Purpose**: Ensures that when the Time Ruler is opened, the timeline view automatically scrolls to the current day's section, providing immediate context to the user.

4.  **Adjust `weeksShownState` for Calendar Mode**:
    *   `useEffect(() => { /* ... */ }, [calendarMode, setWeeksShown]);`
    *   **Action**: If `calendarMode` is true, it calls `setWeeksShown(4)` (to show 4 weeks). Otherwise, it calls `setWeeksShown(1)`.
    *   **Purpose**: Automatically adjusts the number of visible weeks when switching between day/hour views and the week/calendar view.

5.  **Reload Tasks on Date Span Changes**:
    *   `useEffect(() => { getters.getObsidianAPI()?.loadTasks('', showingPastDates); }, [weeksShownState, showingPastDates]);`
    *   **Action**: Calls `loadTasks` on the `[ObsidianAPI](../../services/obsidianApi.md)` service whenever `weeksShownState` (number of weeks visible) or `showingPastDates` (toggle for past dates) changes.
    *   **Purpose**: Refreshes the displayed tasks to match the new visible date range.

6.  **Reload Tasks on `searchWithinWeeks` Changes**:
    *   `useEffect(() => { getters.getObsidianAPI()?.loadTasks('', showingPastDates); }, [searchWithinWeeks, showingPastDates]);`
    *   **Action**: Calls `loadTasks` on the `[ObsidianAPI](../../services/obsidianApi.md)` service whenever the `searchWithinWeeks` range (the actual window for task loading, which might be wider than just `weeksShownState`) changes.
    *   **Purpose**: Ensures tasks are reloaded if the underlying search/load window is modified. This might seem redundant with the previous effect if `searchWithinWeeks` is only changed by `weeksShownState`, but allows for other potential modifiers of `searchWithinWeeks`.

7.  **Synchronize `searchWithinWeeks` with `weeksShownState`**:
    *   `useEffect(() => { /* ... */ }, [showingPastDates, weeksShownState, searchWithinWeeks]);`
    *   **Action**: Adjusts the `searchWithinWeeks` array in the Zustand store (`setters.set({ searchWithinWeeks: ... })`) to ensure its boundaries are at least as wide as the displayed `weeksShownState`. If `showingPastDates` is true, it adjusts the past boundary; otherwise, it adjusts the future boundary.
    *   **Purpose**: Keeps the task loading window (`searchWithinWeeks`) consistent with the user-visible date span (`weeksShownState`), ensuring all displayed dates have their tasks potentially loaded.

## Interactions

*   **Parent Component ([`App.tsx`](./App.md))**:
    *   Receives critical functions (`reload`, `setWeeksShown`) and state (`weeksShownState`, `showingPastDates`, etc.) as props.
*   **Zustand Store ([`src/app/store.ts`](../../store.md))**:
    *   Reads timer state and settings using `getters`.
    *   Updates timer state and `searchWithinWeeks` using `setters`.
*   **Services**:
    *   Indirectly triggers `[ObsidianAPI](../../services/obsidianApi.md).loadTasks()` and `[CalendarAPI](../../services/calendarApi.md).loadEvents()` via the `reload` prop.
    *   Directly calls `getters.getObsidianAPI().loadTasks()` in response to date span changes.
*   **[`TimelineView`](./TimelineView.md) Component**:
    *   Interacts via `timelineViewRef` to call its `scrollTo` method.
*   **Obsidian API**:
    *   Uses `new Notice()` for timer completion notifications.
    *   Uses system `Notification` API on desktop.
*   **Assets**:
    *   Plays sounds from `src/assets/assets.ts` for timer events.

As a headless component, `AppInitializer` is a key piece of the application's architecture for managing setup, background processes like the timer, and reactive data loading logic that doesn't belong to a specific visual component.

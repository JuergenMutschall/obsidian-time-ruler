# TimeRulerHeader Component (`src/components/TimeRulerHeader.tsx`)

## Purpose

The `TimeRulerHeader` component serves as the primary interactive control panel for the Time Ruler view. It provides a comprehensive set of functionalities including navigation through the timeline (next/previous periods, jumping to specific dates/sections), view mode and appearance settings (layout, grouping, past/future dates, hiding time information), initiating a search, and creating new tasks.

## Props

The component accepts the following props:

*   **`times: SimplifiedTimesType[]`**: An array of objects used to render the date navigation buttons. Each object has a `startISO?: string` (for specific dates) and a `type: 'unscheduled' | string` (where string type usually corresponds to `startISO`).
*   **`weeksShownState: number`**: The current number of weeks or periods being displayed in the timeline.
*   **`setWeeksShown: (weeks: number) => void`**: A callback function to update the `weeksShownState`, effectively changing the visible range of the timeline.
*   **`setupStore: () => void`**: A callback function used to reload or reinitialize store data. This is typically invoked after significant settings changes that require a data refresh.
*   **`showingPastDates: boolean`**: A boolean indicating whether past dates are currently being displayed in the timeline.
*   **`timelineViewRef?: React.RefObject<[TimelineViewHandle](./TimelineViewHandle.md) | undefined>`**: A React ref object pointing to the `[TimelineView](./TimelineView.md)` component's imperative handle. This is used to programmatically scroll the timeline to specific sections.
*   **`datesShown: number`**: The number of individual dates (or columns) currently shown in the timeline view. (Note: While a prop, its direct usage within the header's own logic isn't prominent in the provided snippet, but it's passed by the parent.)

## Functionality

*   **Settings Dropdown Menu**:
    *   Accessed via a "more-horizontal" icon `[Button](./Button.md)`.
    *   Controls visibility of a dropdown menu (`tr-menu`).
    *   **Toggle Past/Future Dates**: A button to toggle the `showingPastDates` state (via `setters.set({ showingPastDates: !showingPastDates })`). The button text and icon change accordingly ("Future" with chevron-right, "Past" with chevron-left).
    *   **Reload**: A "Reload" button that calls the `setupStore()` prop function.
    *   **Hide/Show Times**: Toggles the `hideTimes` setting in the global store via `getters.getObsidianAPI().setSetting({ hideTimes: !hideTimes })`.
    *   **Group By**: Provides buttons for different grouping options (`Path`, `Priority`, `Hybrid`, `Tags`, `None`). Clicking an option updates the `groupBy` setting in the global store via `getters.getObsidianAPI().setSetting({ groupBy: ... })`.
    *   **Layout**: Offers buttons to change the timeline layout (`Hours`, `Days`, `Weeks`). Clicking an option updates the `viewMode` setting in the global store via `getters.getObsidianAPI().setSetting({ viewMode: ... })`.
    *   The dropdown closes if a click occurs outside its frame.
*   **Search Button**:
    *   An icon `[Button](./Button.md)` with a "search" icon.
    *   When clicked, it sets `searchStatus: true` in the global application store (via `setters.set`), which typically triggers a search modal or interface.
*   **New Task Button**:
    *   Renders the `[NewTask](./NewTask.md)` component, allowing for quick task creation.
    *   Its placement depends on `calendarMode` (derived from `viewMode === 'week'`):
        *   In `calendarMode` (week view), it's placed within the left control group.
        *   Otherwise (hour/day view), it's placed at the far right of the header.
*   **Date Navigation Buttons**:
    *   A scrollable horizontal list of `[Button](./Button.md)` components is rendered based on the `times` prop.
    *   Each button represents a date period or the "None" section for unscheduled tasks.
    *   The button text displays "None" for unscheduled or a formatted date (e.g., "Mon Nov 25") for specific periods.
    *   Clicking a date button scrolls the `[TimelineView](./TimelineView.md)` to the corresponding section using `timelineViewRef.current.scrollTo(sectionId)`.
    *   These buttons are also `[Droppable](./Droppable.md)` targets, allowing tasks to be dragged onto them to schedule.
*   **Next/Previous Period Buttons**:
    *   "chevron-right" (next) and "chevron-left" (previous) icon `[Button](./Button.md)`s.
    *   These call `setWeeksShown` to change the visible period. The increment/decrement step is 4 if `calendarMode` is true (week view), and 1 otherwise. The "chevron-left" button is only shown if `weeksShownState` is greater than the minimum.
*   **Initial Scroll**:
    *   An `useEffect` hook attempts to scroll the timeline to the section corresponding to the current day (`time-ruler-${getToday()}`) on component mount or when `viewMode` or `showingPastDates` props change. (Note: The original implementation used jQuery for this, but the component aims to use `timelineViewRef` for scrolling to date sections clicked by the user).

## State

*   **Local State**:
    *   `showingModal: boolean`: Manages the visibility of the settings dropdown menu. Initialized to `false`.
    *   `modalFrame: React.RefObject<HTMLDivElement>`: A ref attached to the settings dropdown `div` to detect outside clicks for closing it.
*   **Global State (via `useAppStore`, `getters`, `setters`)**:
    *   `settings.viewMode: string`: The current layout mode ('hour', 'day', 'week'). Used to determine `calendarMode` and for setting new layout preferences.
    *   `settings.hideTimes: boolean`: Whether time details are hidden in the timeline. Read and toggled.
    *   `settings.groupBy: string | false`: The current task grouping strategy. Read and updated.
    *   `showingPastDates: boolean`: (Though also a prop) it's toggled via `setters.set` from the settings menu.
    *   `apis.obsidian`: Used to access the `[ObsidianAPI](../../services/obsidianApi.md)` for updating settings.
    *   `isMobile: boolean`: (via `getters.getApp().isMobile`) Used to adjust button sizes in the settings menu.
    *   `searchStatus: boolean`: Set to `true` to initiate search.

## Interactions with Other Components and Services

*   **Child Components**:
    *   `[Button](./Button.md)`: Used extensively for all interactive elements (settings, navigation, date buttons).
    *   `[Droppable](./Droppable.md)`: Wraps each date navigation button to make it a valid drop target for tasks.
    *   `[Logo](./Logo.md)`: Used for icons within the settings dropdown menu.
    *   `[NewTask](./NewTask.md)`: Embedded for creating new tasks.
*   **`[TimelineViewHandle](./TimelineViewHandle.md)` (via `timelineViewRef`)**: The header interacts with the `[TimelineView](./TimelineView.md)` component by calling its `scrollTo(sectionId)` method to navigate the timeline.
*   **Zustand Store ([`../app/store`](../../store.md))**:
    *   `useAppStore`: Subscribes to parts of the global application state (`settings.viewMode`, `settings.hideTimes`).
    *   `getters`: Used to access various parts of the store, including the `[ObsidianAPI](../../services/obsidianApi.md)` instance (`getters.getObsidianAPI()`) and application status (`getters.getApp().isMobile`).
    *   `setters`: Used to modify global state, such as `setters.set({ showingPastDates: ... })` and `setters.set({ searchStatus: true })`.
*   **Obsidian API**: Settings changes (like `hideTimes`, `groupBy`, `viewMode`) are persisted by calling `getters.getObsidianAPI().setSetting(...)`. (Note: `getters.getObsidianAPI()` here refers to the service instance).
*   **Luxon `DateTime` library**: Used for date manipulations, particularly for formatting dates on the navigation buttons (`DateTime.fromISO(...).toFormat('EEE MMM d')`).
*   **`getToday` utility (`../services/util`)**: Used to get the ISO string for the current day, primarily for the initial scroll effect.

## Usage Example

```tsx
// Conceptual usage within a parent component like App.tsx

import React, { useRef, useState, useEffect } from 'react';
import TimeRulerHeader from './TimeRulerHeader';
import TimelineView, { TimelineViewHandle } from './TimelineView'; // Assuming TimelineView and its handle
import { useAppStore, getters, setters, AppState } from '../app/store'; // Assuming store setup
import { SimplifiedTimesType } from './TimeRulerHeader'; // Or from a shared types file

const MainAppView = () => {
  const timelineViewRef = useRef<[TimelineViewHandle](./TimelineViewHandle.md) | undefined>(null);
  const [weeksShown, setWeeksShown] = useState(4); // Example state
  const showingPastDates = useAppStore(state => state.showingPastDates); // From global store

  // Dummy times data for example
  const exampleTimes: SimplifiedTimesType = [
    { type: 'unscheduled' },
    { startISO: '2023-11-20', type: '2023-11-20' },
    { startISO: '2023-11-21', type: '2023-11-21' },
    // ... more dates
  ];

  const handleSetupStore = () => {
    console.log("Reloading store data...");
    // Actual logic to re-fetch tasks, events, etc.
  };

  // Dummy datesShown for example
  const datesShown = 7 * weeksShown;


  return (
    <div>
      <TimeRulerHeader
        times={exampleTimes}
        weeksShownState={weeksShown}
        setWeeksShown={setWeeksShown}
        setupStore={handleSetupStore}
        showingPastDates={showingPastDates}
        timelineViewRef={timelineViewRef}
        datesShown={datesShown}
      />
      {/* <TimelineView ref={timelineViewRef} ...otherProps /> */}
    </div>
  );
};
```
The `TimeRulerHeader` is a central hub for controlling and interacting with the Time Ruler plugin's display and data.

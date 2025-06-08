# TimelineView Component (`src/components/TimelineView.tsx`)

## Purpose

The `TimelineView` component is the core scrollable area of the Time Ruler, responsible for displaying tasks and events organized by time periods. It renders a series of `Day` components (for individual days or time slots) and an `Unscheduled` component for tasks without a specific date. A key feature is its implementation of a virtualization mechanism to efficiently render only the items currently or near the viewport, which is crucial for performance with large datasets. It also exposes an imperative handle allowing parent components to programmatically scroll specific sections into view.

## Props

The component accepts the following props:

*   **`times: ActualTimesType[]`**: An array of configuration objects. Each object can either be props for a `[Day](./Day.md)` component (including `startISO`, `type`, tasks, events, etc.) or an object with `type: 'unscheduled'` for the unscheduled tasks section.
*   **`calendarMode: boolean`**: A boolean flag. If `true`, the timeline is in "week" view mode, which affects layout (potentially a grid-like structure) and scrolling behavior.
*   **`childWidth: number`**: Represents the number of logical columns the view is divided into (e.g., 1 for day view, 7 for week view). This is used in virtualization calculations.
*   **`childClass: string`**: A CSS class string (e.g., `w-day`, `w-hour`) applied to child elements to control their width within the timeline.
*   **`showingPastDates: boolean`**: Indicates if past dates are being displayed. This can influence the initial scroll position of the timeline.
*   **`borders: [AppState](../../store.md#appstate-interface)['settings']['borders']`**: A boolean from global application settings that controls whether individual items (days/unscheduled) within the timeline have visible borders.

## [`TimelineViewHandle`](./TimelineViewHandle.md) (Exposed via `ref`)

Parent components can obtain a ref to `TimelineView` to access the following imperative methods:

*   **`scrollTo(sectionId: string): void`**:
    *   Scrolls the timeline to bring a specific section into view.
    *   `sectionId` can be an ISO date string (e.g., "YYYY-MM-DD") corresponding to a `[Day](./Day.md)` component, or the string `'unscheduled'` to target the `[Unscheduled](./Unscheduled.md)` component.
    *   The scrolling behavior is smooth (`behavior: 'smooth'`).

## Functionality

*   **Virtualization**:
    *   To optimize performance, `TimelineView` only renders items (days or the unscheduled section) that are currently or nearly visible in the scroll viewport.
    *   It uses a local state variable `scrollViews: [number, number]`, which stores a range `[leftLevel, rightLevel]` representing the indices of the `times` array that should be rendered.
    *   The `updateScroll` function is responsible for calculating this range. It considers the current horizontal scroll position (`scroller.current.scrollLeft`), the effective width of each item (derived from `scrollWidth / childWidth`), and the width of the "unscheduled" section if present.
    *   `updateScroll` is triggered:
        *   On component mount.
        *   During scroll events on the main scrollable `div`.
        *   When props like `childWidth`, `calendarMode`, or the `times` array itself change, as these can affect layout and item visibility.
*   **Rendering**:
    *   The component maps over the `times` prop array.
    *   For each item in `times`:
        *   If the item's index `i` falls within the `scrollViews` range (`i >= scrollViews[0] && i <= scrollViews[1]`), the corresponding component (`[Day](./Day.md)` or `[Unscheduled](./Unscheduled.md)`) is rendered.
        *   Otherwise (if outside the `scrollViews` range), nothing is rendered for that item's slot, effectively "virtualizing" it out of the DOM.
    *   Each rendered section (a day or the unscheduled panel) is wrapped in a `div`. This wrapper is given a unique `id` attribute:
        *   For days: `time-ruler-YYYY-MM-DD` (e.g., `time-ruler-2023-11-25`), derived using `getStartDate`.
        *   For the unscheduled section: `time-ruler-unscheduled`.
        These IDs are essential for the `scrollTo` method to locate and scroll to the correct element.
    *   A common styling class `frameClass` is applied, which includes padding and background. If `props.borders` is true, it also adds border styling.
    *   In `calendarMode` (week view), if a rendered day is a Sunday (`DateTime.fromISO(time.startISO).weekday === 7`), an additional small, empty `div` (`!h-0 !w-1`) is rendered. This might serve as a layout spacer or visual separator in a grid-like week display.
*   **Initial Scroll Behavior**:
    *   An `useEffect` hook manages the initial scroll position when the component mounts or when key props (`calendarMode`, `showingPastDates`, `childWidth`, `times`) change.
    *   It determines a target element:
        *   If `showingPastDates` is true, it targets the second to last element (or the first if fewer than two).
        *   Otherwise (not showing past dates), it targets the second element (or the first if fewer than two).
    *   It then attempts to scroll this target element into view by directly setting `scroller.current.scrollLeft`. This is a non-smooth, direct scroll, distinct from the user-initiated or `scrollTo` imperative scrolling.
*   **Layout**:
    *   The main scrollable container (`div` with ref `scroller`) is a flexbox (`flex h-full w-full`).
    *   It has `!overflow-x-auto` (enabling horizontal scrolling) and `overflow-y-clip` (clipping vertical overflow).
    *   `snap-x` and `child:snap-start` classes enable snap-scrolling behavior, where scrolling tends to align items to the start of the viewport.
    *   The `childClass` prop (e.g., `w-day`, `w-hour`) is applied to the container to influence the width of its children via CSS.

## State

*   **Local State**:
    *   `scroller: React.RefObject<HTMLDivElement>`: A ref attached to the main scrollable `div` element. Used to access scroll properties and query child elements.
    *   `scrollViews: [number, number]`: An array storing two numbers `[leftLevel, rightLevel]`. This defines the range of indices from the `times` prop that are currently rendered due to virtualization. Initialized to `[-1, 1]`.

*   **Global State**: The `TimelineView` component itself does not directly subscribe to global state via `useAppStore` in the provided snippet, but it receives settings like `borders` via props, which originate from the global state.

## Interactions with Other Components and Services

*   **`[Day](./Day.md)` Component (`./Day.tsx`)**: `TimelineView` renders multiple instances of the `[Day](./Day.md)` component, passing parts of the `times` array items as props to each `[Day](./Day.md)`.
*   **`[Unscheduled](./Unscheduled.md)` Component (`./Unscheduled.tsx`)**: `TimelineView` renders one instance of the `[Unscheduled](./Unscheduled.md)` component if it's included in the `times` prop.
*   **`getStartDate` Utility (`../services/util`)**: Used to format the date part of the `id` for `[Day](./Day.md)` component wrappers, ensuring consistent ID generation for scrolling.
*   **`[TimelineViewHandle](./TimelineViewHandle.md)` Type (`./TimelineViewHandle.ts`)**: Defines the shape of the imperative handle exposed by this component via `ref`.
*   **`ActualTimesType` Type**: Defines the expected structure of the `times` prop array.
*   **`[AppState](../../store.md#appstate-interface)['settings']['borders']`**: Consumes this part of the application settings (passed as a prop) to conditionally apply borders to items.

## Usage Example

```tsx
// Conceptual usage within a parent component (e.g., App.tsx or a main layout component)
import React, { useRef, useEffect } from 'react';
import TimelineView, { TimelineViewProps, ActualTimesType, TimelineViewHandle } from './TimelineView';
import { useAppStore } from '../app/store'; // Assuming AppState is available via store

const MyTimelineContainer = () => {
  const timelineViewRef = useRef<[TimelineViewHandle](./TimelineViewHandle.md)>(null);
  const settings = useAppStore(state => state.settings);
  const calendarMode = settings.viewMode === 'week';
  const childWidth = calendarMode ? 7 : 1; // Example logic
  const childClass = calendarMode ? 'w-1/7' : 'w-full'; // Example CSS class logic

  // Example 'times' data structure
  const exampleTimes: ActualTimesType = [
    { type: 'unscheduled', tasks: [], events: [] }, // Placeholder for Unscheduled component props
    { type: 'day', startISO: '2023-11-25', tasks: [], events: [], /* ...other DayProps */ },
    { type: 'day', startISO: '2023-11-26', tasks: [], events: [], /* ...other DayProps */ },
    // ... more day objects
  ];

  const showingPastDates = useAppStore(state => state.showingPastDates);

  useEffect(() => {
    // Example of using the imperative handle to scroll after mount or on some event
    if (timelineViewRef.current) {
      // Scroll to a specific date after a delay, or based on some condition
      setTimeout(() => {
        timelineViewRef.current?.scrollTo('2023-11-26');
      }, 1000);
    }
  }, []);

  const timelineProps: TimelineViewProps = {
    times: exampleTimes,
    calendarMode: calendarMode,
    childWidth: childWidth,
    childClass: childClass,
    showingPastDates: showingPastDates,
    borders: settings.borders,
  };

  return (
    <div style={{ height: '500px', width: '100%' }}> {/* Ensure container has dimensions */}
      <TimelineView ref={timelineViewRef} {...timelineProps} />
    </div>
  );
};
```
The `TimelineView` component is a sophisticated piece of the UI, balancing performance with rich display capabilities for time-based data. Its virtualization and imperative scrolling are key to its effectiveness.

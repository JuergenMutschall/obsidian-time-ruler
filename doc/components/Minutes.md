# Minutes and Time Components (`src/components/Minutes.tsx`)

This file contains two related components: `Minutes`, which generates a sequence of time slots, and `Time`, which renders each individual time slot with interactive capabilities.

## `Minutes` Component

### Purpose

The `Minutes` component is responsible for generating and rendering a sequence of discrete time slots (e.g., every 15 minutes or every hour) between a given `startISO` and `endISO`. It dynamically adjusts the intervals based on the current view mode (minutes for day view, hours for week view) and handles edge cases like chopping the start/end of the sequence.

### Props

*   **`startISO`** (`string`): The ISO string representation of the start time for the entire span.
*   **`endISO`** (`string`): The ISO string representation of the end time for the entire span.
*   **`chopEnd`** (optional, `boolean`): If true, the last time slot in the sequence might be omitted or adjusted to not exceed `endISO` strictly.
*   **`chopStart`** (optional, `boolean`): If true, the first time slot in the sequence might be omitted or adjusted, especially if it's not the current time ("now").
*   **`dragContainer`** (`string`): An identifier for the drag context, passed down to child `Time` components.

### State (managed via `useAppStore` and derived locally)

*   **`dayEnd`**: Global state from `useAppStore(state => state.settings.dayStartEnd[1])`. The configured end hour of the day.
*   **`type`**: Global state from `useAppStore(state => state.settings.viewMode === 'week' ? 'hours' : 'minutes')`. Determines the interval type: `'minutes'` (typically 15-min intervals) or `'hours'` (1-hour intervals).
*   **`times`**: Local array (`DateTime[]`). Calculated sequence of Luxon `DateTime` objects representing each time slot to be rendered.
*   **`startISOs`**: Local array (`string[]`). ISO string versions of the `times` array, used for keys.

### Functionality

1.  **Time Slot Calculation**:
    *   Converts `startISO` and `endISO` props to Luxon `DateTime` objects.
    *   Rounds the initial `start` and `end` times using `roundMinutes`.
    *   Adjusts `end` to not exceed the `dayEndTime` (calculated based on `dayEnd` setting and `start` time).
    *   Defines `modifier` based on `type`: `{ minutes: 15 }` or `{ hours: 1 }`.
    *   If `chopStart` is true and the range doesn't include "now", the `start` time is advanced by one interval.
    *   If `chopEnd` is true, the `end` time is reduced by one interval.
    *   A `while` loop iteratively adds `DateTime` objects to the `times` array, incrementing by the `modifier` until `start` exceeds `end`.
2.  **Rendering**:
    *   Maps over the calculated `times` array.
    *   For each `time` object (and its corresponding `startISOs[i]` for a key), it renders a `Time` component, passing `type`, `time`, and `dragContainer`.

## `Time` Component

### Purpose

The `Time` component represents a single, discrete time slot on the visual timeline (e.g., a 15-minute mark or an hour mark). It provides several key functionalities:
*   Visual representation of the time slot (tick mark and optional time label).
*   A droppable area to schedule tasks to this specific time.
*   A draggable handle to allow users to select a time range (presumably for defining task start/end times or creating new blocks).
*   Visual feedback when a time range is being selected over it or when it's a valid drop target.

### Props

*   **`time`** (`DateTime`): A Luxon `DateTime` object representing the specific time of this slot.
*   **`type`** (`TimeSpanTypes` i.e., `'minutes'` or `'hours'`): Indicates the type of interval this slot represents, affecting visual tick mark length.
*   **`dragContainer`** (`string`): Identifier for the drag context.

### State (managed via `useAppStore` and derived locally)

*   **`isOver`** (from `useDroppable`): True if a draggable item is currently hovering over this `Time` component's droppable area.
*   **`isDraggingTime`**: Global state from `useAppStore(state => isLengthType(state.dragData?.dragType))`. True if the current drag operation is for defining a time length/range.
*   **`selectedClassName`**: Global state derived from `useAppStore`. Applies a specific class (`border-l-accent`) if this `Time` slot falls within the currently selected drag range (`state.dragData.start` to `state.dragData.end`).
*   **`hourDisplay`**: Local string from `useHourDisplay(hours)`. Formatted hour string (e.g., "1PM", "13").

### Functionality

1.  **Droppable Area**:
    *   Uses `useDroppable` to make the component a drop target.
    *   The `id` for the droppable is constructed from `dragContainer`, `iso` (ISO string of `time`), and `'::scheduled'`.
    *   The `data` associated with the drop is `{ scheduled: iso }`, allowing dropped tasks to be scheduled to this time.
2.  **Draggable Handle (for Time Range Selection)**:
    *   Uses `useDraggable` to make the component draggable.
    *   The `id` for dragging is `${time}::time::${dragContainer}`.
    *   `dragData` is `{ dragType: 'time', start: iso }`. When dragging starts from this `Time` slot, it signifies the beginning of a time range selection.
3.  **Drag-Over Interaction (for Time Range Selection)**:
    *   An `useEffect` hook monitors `isOver` (from `useDroppable`) and `isDraggingTime`.
    *   If a time range selection is active (`isDraggingTime`) and a draggable item is over *this* `Time` slot (`isOver`), it updates the global `dragData`'s `end` property to this slot's `iso` time via `setters.set`. This allows dynamic updating of the selected time range as the user drags.
4.  **Visual Rendering**:
    *   A container `div` with `flex h-[16px] items-center justify-end relative`.
    *   **Hover Time Display**: An absolutely positioned `div` (class `!z-50`) shows the exact time (`HH:MM`) when `isOver` is true (i.e., when dragging over it to drop).
    *   **Main Slot Body**:
        *   This `div` has the `selectedClassName` applied if it's part of an active time range selection.
        *   It combines `setNodeRef` (for droppable) and `setDragNodeRef` (for draggable) on its `ref`.
        *   It includes `attributes` and `listeners` from `useDraggable`.
        *   **Tick Mark**: An `hr` element whose width varies based on `type` (minutes/hours) and whether it's a major interval (e.g., on the hour, every 3 hours, or every 6 hours for hour view; on the hour, half-hour for minute view).
        *   **Time Label**: A `div` displays the `hourDisplay` if it's a significant interval (on the hour for minute view, every 3 hours for hour view).

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`getters`, `setters`, `useAppStore`)**:
    *   `Minutes` reads `settings.dayStartEnd` and `settings.viewMode`.
    *   `Time` reads `dragData` to determine `isDraggingTime` and `selectedClassName`.
    *   `Time` uses `setters.set` to update `dragData.end` during time range dragging.
    *   `Time` uses `getters.get('dragData')` to access current drag data.
*   **`@dnd-kit/core` (`useDroppable`, `useDraggable`)**:
    *   `Time` uses both hooks for its interactive drag-and-drop behaviors.
*   **`src/services/util.ts`**:
    *   `Minutes` uses `roundMinutes`, `toISO`.
    *   `Time` uses `isLengthType`, `toISO`, `useHourDisplay`.
*   **Parent Components**:
    *   `Minutes` is typically used by `Hours.tsx` or `Block.tsx` to render the vertical time rulers alongside scheduled items.
*   **Child Components**:
    *   `Minutes` renders multiple `Time` components.

Together, `Minutes` and `Time` create the interactive vertical timelines that allow users to both see time intervals and interact with them for scheduling and defining task durations.

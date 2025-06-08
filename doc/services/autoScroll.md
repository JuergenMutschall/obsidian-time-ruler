# AutoScroll Service (`src/services/autoScroll.ts`)

## Purpose

The `autoScroll.ts` service provides a React hook, `useAutoScroll`, designed to automatically scroll designated scrollable areas within the Time Ruler plugin when a user drags an item near their edges. This is a common UX enhancement for drag-and-drop interfaces, allowing users to drag items into parts of a scrollable container that are not currently visible.

## Public API

The service exports a single React hook:

*   **`useAutoScroll()`**:
    *   This hook should be called within a React component that is part of the Time Ruler's UI (likely a high-level component like `[App.tsx](../../components/App.md)` where drag operations are managed).
    *   It doesn't take any arguments.
    *   It doesn't return any direct values but sets up event listeners to manage the auto-scrolling behavior.

## Functionality

1.  **State and Refs**:
    *   `dragging`: Subscribes to `state.dragData` (from [`DragData`](../../types.md#dragdata)) from [`useAppStore`](../../store.md). The auto-scroll behavior is only active when `dragging` is true (i.e., a dnd-kit drag operation is in progress).
    *   `scrolling`: A `useRef<boolean>(false)` to track if an auto-scroll animation is currently active. This prevents multiple scroll commands from firing simultaneously.
    *   `timeout`: A `useRef<number | null>(null)` to store the ID of a `setTimeout` call. This is used to delay the initiation of scrolling until the cursor has hovered near an edge for a specified duration (`WAIT_TIME`).
    *   `WAIT_TIME`: A constant set to `500` (milliseconds). This is the delay before auto-scrolling starts when the cursor is near an edge.

2.  **Event Listener Setup (`useEffect` hook)**:
    *   The main logic is contained within a `useEffect` hook that runs when the `dragging` state changes.
    *   **Event Attachment**: If `dragging` becomes true, it attaches an event listener to the `window` for either `'touchmove'` (on mobile) or `'mousemove'` (on desktop). The handler for this event is the `autoScroll` function.
    *   **Event Detachment**: The `useEffect`'s cleanup function removes this event listener when `dragging` becomes false or when the component using the hook unmounts.

3.  **`autoScroll` Function (Event Handler)**:
    *   This function is called on every mouse/touch move when `dragging` is true.
    *   **Position Detection**: Extracts `clientX` and `clientY` from the mouse/touch event.
    *   **Target Element Iteration**:
        *   It first looks for elements with the attribute `data-auto-scroll="y"` within the main `#time-ruler` container.
        *   For each such element, it checks if the current cursor position (`pos.x`, `pos.y`) is within its bounds.
        *   **Vertical Scrolling**: If the cursor is within a `MARGIN` (10px) of the top or bottom edge of a `data-auto-scroll="y"` element:
            *   Sets `found = true`.
            *   If no `timeout.current` is set, it initiates a `setTimeout` to call `scrollBy(el, { top: -height / height })` after `WAIT_TIME`.
            *   Breaks the loop (assuming only one scrollable area should react at a time).
        *   If no vertical scroll target was found (`!found`), it then iterates through elements with `data-auto-scroll="x"`.
        *   **Horizontal Scrolling**: Similarly, if the cursor is within `MARGIN` of the left or right edge of a `data-auto-scroll="x"` element:
            *   Sets `found = true`.
            *   Initiates a `setTimeout` to call `scrollBy(el, { left: -width / width })` after `WAIT_TIME`.
            *   Breaks the loop.
    *   **Timeout Clearing**: If `!found` (cursor is not near any edge of a scrollable area) and a `timeout.current` exists, it clears the timeout to prevent accidental scrolling.

4.  **`scrollBy` Function**:
    *   Sets `scrolling.current = true`.
    *   Clears `timeout.current`.
    *   Performs the actual scroll using `el.scrollBy({ ...object, behavior: 'smooth' })`. The `object` is like `{ top: -height }` or `{ left: width }`.
    *   Sets a `setTimeout` to reset `scrolling.current = false` after `750ms` (allowing the smooth scroll animation to roughly complete).

## Data Types and Interfaces

The service does not explicitly define or export new data types or interfaces. It uses standard DOM event types (`MouseEvent`, `TouchEvent`) and interacts with HTML element properties and methods. The `data-auto-scroll` attribute is a custom convention used by this service.

## Usage

The `useAutoScroll` hook should be invoked in a component that is active during drag-and-drop operations, typically the main application component where `@dnd-kit`'s `DndContext` is set up.

```tsx
// Example in [App.tsx](../../components/App.md) or a similar top-level component
import { useAutoScroll } from 'src/services/autoScroll';

export default function App({ apis }) {
  // ... other setup ...

  useAutoScroll(); // Initialize the auto-scroll behavior

  return (
    <DndContext /* ... */ >
      {/* ... rest of the app ... */}
      {/* Elements that need auto-scrolling should have data-auto-scroll="x" or data-auto-scroll="y" */}
      <div id="time-ruler-times" data-auto-scroll="x">
        {/* ... scrollable content ... */}
      </div>
    </DndContext>
  );
}
```
Elements intended to be auto-scrolled must have the `data-auto-scroll="y"` or `data-auto-scroll="x"` attribute. The scrolling amount is the full height or width of the element.

This service enhances the usability of drag-and-drop in long scrollable lists or timelines by automatically bringing off-screen areas into view.

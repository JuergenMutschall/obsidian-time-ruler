# Droppable Component (`src/components/Droppable.tsx`)

## Purpose

The `Droppable` component is a utility wrapper that makes its child element a valid drop target within the drag-and-drop system provided by `@dnd-kit/core`. It enhances the child component with styles to indicate when a draggable item is hovering over it.

## Props

*   **`children`** (`JSX.Element`): A single JSX element that will become the droppable area. The `Droppable` component clones this element to add new props (like `ref` and `className`).
*   **`id`** (`string`): A unique identifier for this droppable area. This ID is used by `@dnd-kit/core` to distinguish between different drop targets.
*   **`data`** (`DropData`): An object containing data associated with this droppable area. This data is passed to drag-and-drop event handlers and can be used to determine how a dropped item should be handled (e.g., what date/time a task should be scheduled to). The specific shape of `DropData` would be defined elsewhere in the application's types (likely related to scheduling information like `scheduled: string`).
*   **`ref`** (optional, `(element: HTMLElement | null) => void`): An optional ref callback. If provided, this ref will be called with the underlying DOM element of the child, in addition to the `setNodeRef` from `useDroppable`.

## Functionality

*   **Drag-and-Drop Integration**:
    *   It uses the `useDroppable` hook from `@dnd-kit/core`.
    *   `useDroppable` is initialized with the provided `id` and `data` props.
    *   The `setNodeRef` function returned by `useDroppable` is attached to the child element, registering it as a drop target with the DndContext.
*   **Visual Feedback**:
    *   It monitors the `isOver` state returned by `useDroppable`.
    *   If `isOver` is true (meaning a draggable item is currently hovering over this droppable area), it appends the class `!bg-selection` to the child element's existing `className`. This class is likely styled to provide a visual highlight (e.g., changing the background color).
    *   It also ensures the child always has the `rounded-icon` class.
*   **Child Enhancement**:
    *   It uses `cloneElement` to render its `children`. This allows it to inject new props into the child:
        *   `ref`: Combines the incoming `ref` (if any) with `setNodeRef` from `useDroppable`.
        *   `className`: Appends its own classes (`rounded-icon`, and `!bg-selection` when `isOver`) to the child's existing classes.

## State

*   **`isOver`**: This is internal state managed by the `useDroppable` hook. It reflects whether a draggable item is currently hovering over the droppable area. The `Droppable` component uses this state to conditionally apply styling.

## Interactions with Other Components and Services

*   **`@dnd-kit/core` (`useDroppable`)**: This is the core dependency for its drag-and-drop functionality. The `Droppable` component is essentially a styled wrapper around the `useDroppable` hook.
*   **Child Component**: It directly wraps and modifies a single child component passed to it. The child component receives an updated `ref` and `className`.
*   **DndContext**: It operates within a `DndContext` (provided higher up in the component tree, typically in `App.tsx` or a similar root component) which manages the overall drag-and-drop state.

## Usage Example

```tsx
import Droppable from './Droppable';
import Task from './Task'; // Assuming Task is a draggable component

// ...

<Droppable id="today-tasks" data={{ scheduled: '2023-10-27' }}>
  <div className="task-list-container p-4 border">
    {/* Tasks can be dropped here */}
    <p>Drop tasks for today</p>
  </div>
</Droppable>
```

In this example, the `div` with the class `task-list-container` becomes a droppable area. When a draggable item (like a `Task`) is dragged over it, its background will change due to the `!bg-selection` class, and if dropped, the `data` prop (`{ scheduled: '2023-10-27' }`) would be available to the `onDragEnd` handler.

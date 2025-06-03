# Unscheduled Component (`src/components/Unscheduled.tsx`)

## Purpose

The `Unscheduled` component is responsible for displaying tasks that are not scheduled and do not have a due date. It acts as a dedicated section in the Time Ruler UI for such tasks. The component is memoized using `React.memo` for performance optimization, meaning it will only re-render if its props change (though it takes no direct props, it relies on `useAppStore`, so changes in relevant store slices will trigger re-renders).

A constant `COLLAPSE_UNSCHEDULED` is exported, which is used as a DOM ID for a child `div`. This ID is likely used by the `Block` component (when `type='unscheduled'`) to portal a global collapse/expand button for all unscheduled task groups.

## Props

The `_Unscheduled` inner component (and therefore `Unscheduled`) does not accept any direct props. Its behavior and data are derived from the global state via `useAppStore`.

## State (managed via `useAppStore`)

*   **`showCompleted`**: Global state from `useAppStore(state => state.settings.showCompleted)`.
*   **`showingPastDates`**: Global state from `useAppStore(state => state.showingPastDates)`.
*   **`tasks`**: Derived global state. This is a filtered list of tasks from `state.tasks`. The filter includes tasks that:
    *   Meet completion criteria: either `showCompleted` is true, OR task completion status matches `showingPastDates` (i.e., show completed if showing past, show uncompleted if showing future/present).
    *   Are not subtasks (`!task.parent`).
    *   Are not part of a query (`!task.queryParent`).
    *   Have no scheduled date (`!parseTaskDate(task, state.tasks)`).
    *   Have no due date (`!task.due`).
*   **`childWidth`**: Global state from `useAppStore`. It's adjusted based on `settings.viewMode`: if view mode is 'week' or 'hour' and `state.childWidth > 1`, then `state.childWidth` is used; otherwise, it defaults to `1`. This impacts the styling for how many columns might be implicitly created within the unscheduled tasks' `Block`.

## Functionality

1.  **Task Filtering**:
    *   The primary logic involves filtering the global list of tasks to find only those that are truly "unscheduled" according to the defined criteria (no schedule, no due date, not a subtask/query item, and matching completion visibility).

2.  **Rendering Header**:
    *   A header section is rendered with:
        *   An empty `div` with the ID `COLLAPSE_UNSCHEDULED` (`tr-collapse-unscheduled`). This `div` serves as a target for `React.createPortal` used by the `Block` component (when its `type` is `'unscheduled'`) to render a global collapse/expand button for all groups within the unscheduled tasks block.
        *   A `Droppable` area with the ID `unscheduled-timespan` and `data: { scheduled: '' }`. This makes the "Unscheduled" title a drop target, presumably to unschedule tasks by dropping them here.
        *   The text "Unscheduled".

3.  **Rendering Tasks Block**:
    *   It renders a single `Block` component to display the filtered `tasks`.
    *   Props passed to this `Block`:
        *   `startISO={undefined}`: As these tasks are unscheduled.
        *   `blocks={[]}` and `events={[]}`: No nested blocks or direct events for this specific view.
        *   `type='unscheduled'`: Specifies the block type for appropriate styling and behavior (like the portal for the collapse button).
        *   `dragContainer='unscheduled'`: Defines the drag context.
        *   `tasks={tasks}`: The filtered list of unscheduled tasks.
    *   The container `div` for this `Block` has dynamic classes based on `childWidth` (e.g., `child:child:child:child:w-1/2` if `childWidth` is 2), which seems to imply a columnar layout for the groups rendered inside the `Block` if the view mode and child width settings necessitate it.
    *   `data-auto-scroll={'x'}` suggests horizontal scrolling if content overflows.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`useAppStore`)**:
    *   Reads `settings.showCompleted`, `showingPastDates`, `tasks`, `settings.viewMode`, and `childWidth` from the global store.
*   **`src/services/util.ts` (`parseTaskDate`)**:
    *   Used in the task filtering logic to determine if a task has a scheduled date.
*   **Child Components**:
    *   `Block`: The primary component used to render the list of unscheduled tasks and their groups.
    *   `Droppable`: Makes the "Unscheduled" title a drop target.
*   **`Block.tsx` (Portal Interaction)**:
    *   The `Block` component, when `type='unscheduled'`, is expected to use `React.createPortal` to render a collapse/expand button into the `div` with ID `COLLAPSE_UNSCHEDULED` provided by this `Unscheduled` component. This creates a shared control for all groups within the unscheduled block.

## Memoization

*   The component `Unscheduled` is wrapped in `React.memo(_Unscheduled, () => true)`.
*   The custom comparison function `() => true` effectively makes this component render only once, as it always indicates that the props have not changed (even though it takes no props). This is an aggressive memoization strategy. It implies that any changes to the unscheduled tasks list are expected to be handled by re-renders triggered from within its children (like the `Block` component reacting to store changes) or that the component itself is re-mounted if its context changes significantly. Given that `useAppStore` is used directly within `_Unscheduled`, changes to the relevant slices of the store *will* cause `_Unscheduled` to re-render, so the `() => true` might be misleading or intended to prevent re-renders from parent components if `Unscheduled` were to accept props in the future.

The `Unscheduled` component provides a dedicated space for tasks that don't fit into the timed schedule, using the versatile `Block` component to organize and display them.

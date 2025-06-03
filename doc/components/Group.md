# Group Component (`src/components/Group.tsx`)

## Purpose

The `Group` component is used within the Time Ruler UI to visually group tasks under a common heading. This heading can be derived from various task properties like file paths, priority levels, or custom tags, depending on the active `groupBy` setting. It supports collapsing/expanding groups and allows the entire group of tasks to be dragged (unless it's a priority-based group). It can also render nested subgroups.

## Props

*   **`headingPath`** (`string`): A string representing the path or identifier for this group's heading. This is used for display, collapsing state, and drag-and-drop identification. It can be a file path, a priority string, or a special `UNGROUPED` constant.
*   **`tasks`** (`TaskProps[]`): An array of task objects that belong to this group.
*   **`type`** (`BlockType` from `./Block.tsx`): The type of the parent `Block` component (e.g., 'all-day', 'unscheduled'). This influences how tasks might be sorted or subgrouped.
*   **`hidePaths`** (`string[]`): An array of parent heading paths that should be hidden or excluded when determining subheadings.
*   **`dragContainer`** (`string`): An identifier for the drag context, passed down from parent components like `Block` or `Day`.
*   **`startISO`** (optional, `string`): The start ISO date/time string, which is passed down to individual `Task` components rendered within this group.

## State (managed via `useAppStore` and derived locally)

*   **`collapsed`**: Global state from `useAppStore(state => state.collapsed[headingPath])`. Determines if the current group is collapsed (hiding its tasks). Defaults to `false`.
*   **`dragging`**: Global state from `useAppStore`. True if another `Group` (not a priority group and from a different file) is currently being dragged. This is used to conditionally render a `Droppable` area for reordering groups.
*   **`groupBySetting`**: Global state from `useAppStore(state => state.settings.groupBy)`. Used to determine how tasks within this group should be further subgrouped.
*   **`groupedTasks`**: Local state, derived by grouping the input `tasks` using `getSubHeading` based on the `groupBySetting`. For 'upcoming' type, tasks are not subgrouped further (remain `UNGROUPED`).
*   **`sortedTasks`**: Local state, an array of `[heading, TaskProps[]]` tuples. `groupedTasks` are sorted:
    *   Numerically/alphabetically by subheading.
    *   Tasks within each subgroup are then sorted:
        *   For 'upcoming' type: by `due` date, then `priority`.
        *   For other types: by `path`, then `position.start.line`.
*   **`isPriority`**: Local boolean, true if the current `headingPath` (specifically the `heading` part) corresponds to a recognized priority level (e.g., "High", "Medium").

## Functionality

### Heading Display and Formatting:

*   Extracts `myContainer` (e.g., file path) and `heading` (e.g., task content or specific group name) from `headingPath` using `splitHeading`.
*   Formats `myContainer` for display: truncates long names and removes ".md" extension.
*   The full `headingPath` is displayed unless it's the special `UNGROUPED` constant or is included in `hidePaths`.

### Drag and Drop:

*   **Draggable Group**:
    *   Uses the `useDraggable` hook from `@dnd-kit/core` to make the group draggable, *unless* it's a priority-based group (`isPriority` is true).
    *   `dragData` includes `tasks`, `type`, `headingPath`, `hidePaths`, and `dragContainer`.
    *   The drag handle (`setActivatorNodeRef`) is attached to the heading display area.
*   **Droppable Area for Reordering (Conditional)**:
    *   If another group (`dragging` is true) is being dragged, it renders a `Droppable` component above the current group's header. This allows other groups to be dropped here to reorder them (presumably by changing file structure or task metadata, though the exact mechanism isn't in this component).
    *   The `data` for this droppable includes `{ type: 'heading', heading: headingPath }`.

### Collapse/Expand:

*   Renders a `Button` with a chevron icon (right for collapsed, down for expanded) to toggle the `collapsed` state of the group.
*   Clicking this button updates the global `collapsed` state for this `headingPath` via `setters.patchCollapsed`.

### Task and Subgroup Rendering:

*   If `collapsed` is true, tasks and subgroups are not rendered.
*   **Ungrouped Tasks**: First, it renders any tasks that fall directly under this group without further subheadings (i.e., `heading === UNGROUPED` in `sortedTasks`). Each is rendered as a `Task` component.
*   **Subgroups**: Then, it iterates through `sortedTasks` where the `heading` is not `UNGROUPED`. For each of these, it recursively renders another `Group` component, passing down the relevant props:
    *   `headingPath`: The subheading becomes the new `headingPath`.
    *   `hidePaths`: The current `headingPath` is added to `hidePaths` for the subgroup to prevent redundant display.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`useAppStore`, `setters`)**:
    *   Reads `collapsed` state, `dragData`, and `settings.groupBy`.
    *   Updates `collapsed` state using `setters.patchCollapsed`.
*   **`@dnd-kit/core` (`useDraggable`)**: For making the group (except priority groups) draggable.
*   **`src/services/util.ts`**:
    *   `getHeading`, `getSubHeading`: To determine group headings and subheadings based on task properties and settings.
    *   `getParents`: (Potentially used by `getHeading` or `getSubHeading`, not directly in `Group.tsx`).
    *   `parseFileFromPath`: Used to compare file paths during drag operations.
    *   `splitHeading`: To parse `headingPath` into container and heading parts for display.
*   **Child Components**:
    *   `Task`: Renders individual tasks within the group.
    *   `Button`: Used for the collapse/expand button.
    *   `Droppable`: Conditionally rendered to allow other groups to be dropped onto this one for reordering.
    *   `Group` (Recursive): Renders subgroups.
*   **Parent Components**:
    *   Typically rendered by `Block.tsx` or recursively by another `Group.tsx`.

The `Group` component is key to organizing tasks hierarchically based on different criteria, providing both a clear visual structure and interactive features like dragging and collapsing.

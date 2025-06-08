# Dragging Service (`src/services/dragging.ts`)

## Purpose

The `dragging.ts` service centralizes the logic for handling drag-and-drop operations within the Time Ruler plugin. It provides event handler functions (`onDragStart` and `onDragEnd`) that are compatible with the `@dnd-kit/core` library. These handlers determine the consequences of dropping various draggable items onto different types of drop targets, often resulting in updates to task properties or other application states.

## Public API

The service exports two primary functions:

*   **`onDragStart(ev: DragStartEvent)`**:
    *   This function should be registered as the `onDragStart` handler with the `@dnd-kit/core` `DndContext`.
    *   It takes a `DragStartEvent` from `@dnd-kit/core` as an argument.
    *   Its main action is to update the global application state with the data of the currently active draggable item: `setters.set({ dragData: ev.active.data.current as DragData })`.

*   **`async onDragEnd(ev: DragEndEvent, activeDragRef: React.RefObject<DragData | null>)`**:
    *   This function should be registered as the `onDragEnd` handler with the `@dnd-kit/core` `DndContext`.
    *   It takes a `DragEndEvent` from `@dnd-kit/core` and a React `RefObject` (`activeDragRef`) which should hold the `[DragData](../../types.md#dragdata)` of the item that was being dragged (this ref is likely updated by `onDragStart` or directly from the component managing the draggable item).
    *   This function contains the core logic for what happens when a drag operation concludes.

## Functionality of `onDragEnd`

The `onDragEnd` function is the most complex part of this service. It determines actions based on the `dragData` (what was dragged) and `dropData` (what it was dropped onto).

1.  **Initial Checks**:
    *   Retrieves `dropData` from `ev.over?.data.current`.
    *   Retrieves `dragData` from `activeDragRef.current`.
    *   If the item is dropped onto itself (`ev.active.id === ev.over?.id`), it simply clears `dragData` and returns.

2.  **Specific Drag/Drop Combinations**:

    *   **Moving a Task to "Move" Zone**:
        *   If `dragData.dragType === 'task'` and `dropData.type === 'move'`:
            *   Opens the "move task" modal by setting global state: [`setters.set({ newTask: { task: dragData, type: 'move' } })`](../../store.md#setters-actions).

    *   **Non-TaskProp Drop Data (Special Drop Zones)**:
        *   If `dropData` is not a `[TaskProps](../../types.md#taskprops)` object (i.e., it's a special zone like 'heading' or 'delete'):
            *   **`dropData.type === 'heading'`**:
                *   If `dragData.dragType === 'group'`: Updates the file order by calling [`setters.updateFileOrder()`](../../store.md#setters-actions) with the parsed file paths from the dragged group and the target heading.
            *   **`dropData.type === 'delete'`**:
                *   Identifies all tasks to be deleted:
                    *   If `dragData` is a 'block' or 'group', it includes all tasks within that block/group.
                    *   If `dragData` is a 'task', it includes that single task.
                *   Includes all children of these tasks using `getChildren()`.
                *   If multiple tasks (including children) are to be deleted, it shows a confirmation dialog (`confirm()`).
                *   If confirmed, calls [`getters.getObsidianAPI().deleteTasks()`](../../store.md#getters) with the sorted list of task IDs (reversed to delete children first).

    *   **TaskProp Drop Data (Scheduling/Modifying Tasks)**:
        *   If `dropData` *is* `[TaskProps](../../types.md#taskprops)`-like (i.e., has scheduling information):
            *   **`dragData.dragType === 'new_button'`**: (Dragging the "+" button to schedule a new task)
                *   Opens the "new task" modal, pre-filling the scheduled time: [`setters.set({ newTask: { task: { scheduled: dropData.scheduled }, type: 'new' } })`](../../store.md#setters-actions).
            *   **`dragData.dragType === 'time'` or `'task-length'`**: (Dragging from a time slot or resizing a task)
                *   If `dropData.scheduled` is missing, returns.
                *   Calculates the `duration` (hours, minutes) between `dropData.scheduled` (drop time) and `dragData.start` (drag start time).
                *   If `'task-length'`, updates the dragged task's duration: [`setters.patchTasks([dragData.id], { duration: { hour: hours, minute: minutes } })`](../../store.md#setters-actions).
                *   If `'time'`, opens the "new task" modal with pre-filled scheduled time and duration: [`setters.set({ newTask: { task: { scheduled: dragData.start, duration: { hour: hours, minute: minutes } }, type: 'new' } })`](../../store.md#setters-actions).
            *   **`dragData.dragType === 'block'` or `'group'`**: (Dragging a block or group of tasks)
                *   Updates all tasks in `dragData.tasks` with the `dropData` (e.g., new scheduled date): [`setters.patchTasks(dragData.tasks.map(x => x.id), dropData)`](../../store.md#setters-actions).
            *   **`dragData.dragType === 'task'`**: (Dragging a single task)
                *   Updates the dragged task with `dropData`: [`setters.patchTasks([dragData.id], dropData)`](../../store.md#setters-actions).
            *   **`dragData.dragType === 'due'`**: (Dragging a task's due date handle)
                *   Updates the task's due date: [`setters.patchTasks([dragData.task.id], { due: dropData.scheduled })`](../../store.md#setters-actions).

3.  **Cleanup**:
    *   Finally, regardless of the outcome, it clears the global `dragData`: [`setters.set({ dragData: null })`](../../store.md#setters-actions).

## Data Types and Interfaces

While not explicitly defined in this file, the service relies heavily on `[DragData](../../types.md#dragdata)` and `[DropData](../../types.md#dropdata)` types/interfaces, which are likely defined elsewhere (e.g., in `src/app/store.ts` or a dedicated types file).

*   **`[DragData](../../types.md#dragdata)`**: Represents the data associated with the item being dragged. It seems to have a `dragType` property (e.g., 'task', 'group', 'block', 'new_button', 'time', 'task-length', 'due') and other properties depending on the type (e.g., `tasks` array for groups/blocks, `id` for tasks, `start` for time drags, `task` object for due drags, `headingPath` for groups).

*   **`[DropData](../../types.md#dropdata)`**: Represents the data associated with the droppable area. It can be:
    *   An object with scheduling information (e.g., `{ scheduled: string }`). This is often what `[TaskProps](../../types.md#taskprops)` might look like when used as drop data.
    *   A special object like `{ type: 'heading', heading: string }` or `{ type: 'delete' }` or `{ type: 'move' }`.

The service also uses `[isTaskProps](../../types.md#istaskpropsdata-dropdata-data-is-partialtaskprops)` (from `src/types/enums`) to differentiate between `[DropData](../../types.md#dropdata)` that represents task scheduling information and special drop zones.

## Interactions with Other Components and Services

*   **`@dnd-kit/core`**: This service is designed to be used directly with event types (`DragStartEvent`, `DragEndEvent`) from this library.
*   **[`src/app/store.ts`](../../store.md) ([`getters`](../../store.md#getters), [`setters`](../../store.md#setters-actions))**:
    *   Extensively used to get current application state (e.g., `tasks`, `dragMode`, `obsidianAPI`).
    *   Crucially used to set `dragData` on drag start, clear it on drag end, and dispatch various actions like `patchTasks`, `updateFileOrder`, and setting `newTask` data to open modals.
*   **`src/services/util.ts`**:
    *   Uses `getChildren`, `parseFileFromPath`.
*   **Obsidian API (via [`getters.getObsidianAPI()`](../../store.md#getters))**:
    *   `deleteTasks()`: Called when tasks are dropped on a delete zone. The `getObsidianAPI()` getter returns an instance of the `[ObsidianAPI](../../services/obsidianApi.md)` service.
*   **React**:
    *   `activeDragRef: React.RefObject<[DragData](../../types.md#dragdata) | null>`: The `onDragEnd` function expects a React ref to access the drag data. This implies that the state or context providing `[DragData](../../types.md#dragdata)` should also expose it via a ref for this handler. (Alternatively, `ev.active.data.current` could be used consistently if `activeDragRef` proves problematic, but the current implementation uses the ref).

This service acts as the brain for most drag-and-drop interactions, translating user gestures into concrete actions and state changes within the Time Ruler application.

# NewTask and NewTaskHeading Components (`src/components/NewTask.tsx`)

This file contains components related to the creation and relocation of tasks. The primary component is `NewTask`, which handles the UI for initiating new tasks and the modal for inputting task details. `NewTaskHeading` is a helper component used within this modal.

## `NewTask` Component

### Purpose

The `NewTask` component serves a dual role:
1.  **Draggable "New Task" Button**: When no task is being dragged, it presents a draggable "plus" button. This button can be dragged onto a timeline (e.g., a specific time slot in `Minutes.tsx` or a `Day.tsx` header) to initiate the creation of a new task, pre-filling its scheduled time. It can also be clicked to open the new task modal directly.
2.  **Drop Zones for Existing Tasks**: When a task or group is being dragged (`draggingTask` is true), this component instead displays drop zones for deleting the task (an "x" button) or moving it (a "move-right" button, if it's a single task).

When activated for creating or moving a task, it displays a modal dialog allowing the user to:
*   Enter/edit the task title.
*   View/confirm the scheduled date (if any).
*   Search for and select a target file and optionally a heading within that file to place the task.

### Props

*   **`dragContainer`** (`string`): An identifier for the drag context, used to create a unique ID for the draggable "new task" button.

### State (managed via `useAppStore` and local `useState`)

*   **`newTaskData`**: Global state from `useAppStore(state => state.newTask)`. An object `{ task: Partial<TaskProps>, type: 'new' | 'move' }` or `null`. Controls the visibility and content of the new/move task modal.
    *   `task`: Holds the properties of the task being created or moved.
    *   `type`: Indicates if the operation is 'new' or 'move'.
*   **`newTask`**: Local boolean derived from `newTaskData`, true if `newTaskData.task` exists.
*   **`newTaskMode`**: Local, either `'new'` or `'move'`, derived from `newTaskData.type`.
*   **`search`**: Local string state for the file/heading search input within the modal.
*   **`dailyNoteInfo`**: Global state from `useAppStore(state => state.dailyNoteInfo)`. Used when creating tasks in the daily note.
*   **`allHeadings`**: Global state from `useAppStore`. A unique, sorted list of all task paths (files) and "Daily" (for daily notes), used for the file selection dropdown. Filtered by `search` to `filteredHeadings`.
*   **`draggingTask`**: Global state from `useAppStore`. Holds data of the currently dragged task/group/block if any. Determines if the component shows the "plus" button or the delete/move drop zones.
*   **`calendarMode`**: Global state from `useAppStore(state => state.settings.viewMode === 'week')`. Affects styling (button size).
*   **`focus`**: Local boolean state, true if the task title input in the modal has focus. Used to manage Tab key behavior.
*   **Refs**: `frame` (for the modal), `inputFrame` (for task title input), `inputRef` (for file search input).

### Functionality

1.  **Draggable "New Task" Button**:
    *   Uses `useDraggable` from `@dnd-kit/core`. The `id` is `new_task_button::${dragContainer}`.
    *   `dragData` is `{ dragType: 'new_button' }`.
    *   On `onMouseDown` (if no task is currently being dragged), it sets up a `checkForClick` listener on `mouseup`. If it was a click (not a drag), it opens the new task modal (`setters.set({ newTask: ... })`).
2.  **Delete/Move Drop Zones**:
    *   If `draggingTask` is true:
        *   Renders a `Droppable` "x" button with `id: 'delete-task'` and `data: { type: 'delete' }`.
        *   If `draggingTask.dragType === 'task'`, renders a `Droppable` "move-right" button with `id: 'move-task'` and `data: { type: 'move' }`.
3.  **New/Move Task Modal**:
    *   Displayed if `newTaskData` and `newTask` are true.
    *   Is a fixed overlay covering the screen.
    *   **Click-Away Listener**: An `useEffect` hook adds a `mousedown` listener to the window when the modal is open. If a click occurs outside the modal's `frame`, it closes the modal (`setters.set({ newTask: null })`).
    *   **Header**: Displays "New Task" or "Move Task", the scheduled date (if any), and a "check" button to confirm task creation/moving.
    *   **Title Input**: An `input` for the task's `originalTitle`.
        *   `onChange` updates `newTaskData.task.originalTitle`.
        *   `onKeyDown` for 'Enter' confirms the task.
        *   `onFocus`/`onBlur` manage the `focus` state.
        *   An `useEffect` hook manages Tab key behavior when `focus` is true to trap Tab within the modal (specifically to move focus to `inputRef`).
    *   **File Search Input**: An `input` for searching `allHeadings`.
        *   `onChange` updates the `search` state.
        *   `onKeyDown` for 'Enter' confirms task creation/moving with the first `filteredHeadings` result.
    *   **Headings List**: Displays `filteredHeadings` using `NewTaskHeading` components.
    *   `useEffect` hook to clear `search` when `newTask` state changes (modal opens/closes).
    *   `useEffect` hook to auto-focus the title input (`inputFrame`) when the modal opens.

## `NewTaskHeading` Component

### Purpose

`NewTaskHeading` is a simple presentational component rendered within the `NewTask` modal. It displays a single selectable file path and heading, allowing the user to choose where to place the new or moved task.

### Props

*   **`headingPath`** (`string`): The full path to the file and optionally a heading within it (e.g., "path/to/file.md#Heading").
*   **`newTaskData`** (`NonNullable<AppState['newTask']>`): The current new/move task data from the store.

### State (managed via `useAppStore`)

*   **`dailyNoteInfo`**: Global state, used by the click handler when creating a task.

### Functionality

1.  **Display**:
    *   Uses `splitHeading` to separate `headingPath` into `myContainer` (file path) and `title` (heading, or file name if no heading).
    *   Truncates long titles and container paths for display.
    *   Styles the text differently if `headingPath` includes a `#` (indicating a heading within a file).
2.  **Interaction**:
    *   On `onMouseDown`:
        *   Calls the appropriate Obsidian API function via `getters.getObsidianAPI()`:
            *   If `newTaskData.type === 'move'`, calls `api.moveTask(newTaskData.task, headingPath)`.
            *   Else (for 'new'), calls `api.createNewTask(newTaskData.task, headingPath, dailyNoteInfo)`.
        *   Uses `setTimeout` to close the `NewTask` modal (`setters.set({ newTask: null })`) after the action.
    *   The element is styled as `selectable cursor-pointer` with a hover underline.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`getters`, `setters`, `useAppStore`)**:
    *   `NewTask` heavily relies on the store for `newTask` data, `dailyNoteInfo`, `allHeadings` (derived from `state.tasks`), `dragData`, and `settings.viewMode`.
    *   Uses `setters.set` to manage `newTask` data (opening/closing modal, updating task properties).
    *   `NewTaskHeading` uses `getters.getObsidianAPI()` and `setters.set({ newTask: null })`.
*   **`@dnd-kit/core` (`useDraggable`)**:
    *   `NewTask` uses this for its draggable "plus" button.
*   **`src/services/util.ts`**:
    *   `NewTask` uses `convertSearchToRegExp`, `getHeading`, `parseFileFromPath`, `parseFolderFromPath`, `splitHeading`.
    *   `NewTaskHeading` uses `splitHeading`.
*   **`src/services/obsidianApi.ts` (via `getters.getObsidianAPI()`)**:
    *   `NewTask` (via modal's confirm button) and `NewTaskHeading` use `createNewTask` and `moveTask`.
*   **Child Components**:
    *   `NewTask` renders `Button` and `Droppable` (for delete/move zones), and `NewTaskHeading`.
*   **Parent Components**:
    *   `NewTask` is likely placed in a persistent part of the UI where task creation can be initiated, such as alongside the main timeline view in `App.tsx` or in the `Buttons` section.

These components provide a comprehensive interface for adding new tasks to the system, either by dragging a "new task" stub or by direct interaction with a modal, including sophisticated file and heading selection.

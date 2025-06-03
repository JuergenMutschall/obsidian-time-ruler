# Task Component (`src/components/Task.tsx`)

## Purpose

The `Task` component is responsible for rendering a single task item within the Time Ruler UI. It displays various properties of a task, such as its title (with support for `[[wikilink]]` rendering), completion status, priority, reminder, due date, duration, tags, and notes. It also handles the rendering of subtasks, which can be collapsed or expanded. The component is highly interactive, supporting drag-and-drop for the task itself, its duration, and its due date.

## Props

*   **`dragContainer`** (`string`): An identifier for the drag context, passed down from parent components. Used to create unique IDs for draggable elements.
*   **`startISO`** (optional, `string`): The ISO string for the scheduled start time of the block this task is in. Defaults to `task.scheduled` if not provided.
*   **`subtasks`** (optional, `TaskProps[]`): An array of subtask objects. If not provided, it's derived from `task.children` and `task.queryChildren` from the global store.
*   **`renderType`** (optional, `'deadline'`): A special rendering mode. If `'deadline'`, it might imply a more compact or specific style.
*   **`dragging`** (optional, `true`): A flag indicating if this task instance is part of a drag overlay, which might trigger different styling or behavior (though not explicitly detailed in the provided code for styling).
*   **`...task`** (`TaskProps`): The rest of the props are the properties of the task itself (e.g., `id`, `title`, `completed`, `priority`, `due`, `duration`, `tags`, `notes`, `children`, `queryChildren`, `scheduled`, `reminder`, `status`, `path`, `page`).

## State (managed via `useAppStore` and local state/refs)

*   **Processed `subtasks`**: Derived from `useAppStore`. Filters and processes the initial `subtasks` prop or `task.children`/`task.queryChildren` based on settings (`settings.scheduledSubtasks`) and whether the subtask's schedule/due date aligns with the parent task's date and visibility settings (`showingPastDates`).
*   **`isDragging`** (from `useDraggable`): Boolean indicating if the main task item is currently being dragged.
*   **`dragOffsetRef`**: `useRef<number>` to store and manage the calculated offset from the right edge of the task element to the cursor/touch point during drag initiation. This is then set in the global store (`setters.set({ dragOffset })`).
*   **`isLink`**: Local boolean, true if `renderType` is `'parent'` or `'deadline'`.
*   **`isCalendar`**: Global state from `useAppStore(state => state.settings.viewMode === 'week')`.
*   **`smallText`**: Local boolean, true if `isLink` or `isCalendar`, leading to smaller text rendering.
*   **`collapsed`**: Global state from `useAppStore(state => state.collapsed[task.id])`. True if the subtask section for this task is collapsed. Defaults to `false`.
*   **`dailyNoteInfo`**: Global state from `useAppStore(state => state.dailyNoteInfo)`.
*   **`groupBy`**: Global state from `useAppStore(state => state.settings.groupBy)`.
*   **`childWidth`**: Global state from `useAppStore(state => state.childWidth)`.
*   **`isWide`**: Local boolean state, determined by comparing the calculated column width with a threshold (400px).
*   **`showingPastDates`**: Global state from `useAppStore(state => state.showingPastDates)`.
*   **`hasLengthDrag`**: Local boolean, true if the task is scheduled with a specific time and is not in the past (or future if `showingPastDates`). This enables the draggable handle for task duration.

## Functionality

### Task Completion:

*   `completeTask()`: Sets `task.completion` to the current time and `task.completed` to `true` in the global store via `setters.patchTasks`.

### Subtask Processing:

*   Filters and prepares `subtasks` based on global settings (`settings.scheduledSubtasks`) and visibility rules (completed status vs. `showingPastDates`, and whether subtask schedule/due aligns with parent).

### Drag and Drop:

1.  **Main Task Dragging**:
    *   Uses `useDraggable` for the main task item. ID: `` `${task.id}::${renderType}::${dragContainer}` ``.
    *   `dragData` includes `dragType: 'task'`, `renderType`, `dragContainer`, and all task properties.
    *   An `useEffect` hook calculates `dragOffset` when dragging starts, based on the pointer/touch position relative to the task element's right edge, and stores it in the global state. This helps in positioning the drag overlay correctly.
2.  **Task Length Dragging**:
    *   If `hasLengthDrag` is true, a draggable handle for task duration is rendered.
    *   Uses `useDraggable`. ID: `` `${task.id}::${renderType}::length::${dragContainer}` ``.
    *   `dragData` is `{ dragType: 'task-length', id: task.id, start: task.scheduled, end: task.scheduled }`.
3.  **Deadline Dragging**:
    *   If the task is not completed, a draggable handle for the due date is rendered.
    *   Uses `useDraggable`. ID: `` `${task.id}::${renderType}::deadline::${dragContainer}` ``.
    *   `dragData` is `{ dragType: 'due', task }`.

### Rendering:

*   **Main Task Area**:
    *   A `div` with `data-task` attribute (status).
    *   **Checkbox**: A `Button` styled as a checkbox. Clicking it calls `completeTask()`. Displays task status if not 'x'.
    *   **Title Area**:
        *   The main draggable area for the task.
        *   `taskTitle()` function renders the title, parsing and converting `[[wikilinks]]` into clickable `<span>` elements that open the link in Obsidian.
        *   Text styling changes based on priority, `renderType`, link status, or completion.
        *   Clicking the title area (on `mousedown`) opens the task using `openTask(task)`.
    *   **Priority & Reminder**: Displays priority (e.g., "H!", "M!") and reminder (with icon) if present.
*   **Task Length & Due Date (if not dragging)**:
    *   Conditionally renders draggable handles for `duration` ("length" or actual duration) and `due` date (relative days, e.g., "3d"). These are only visible on hover (`group-hover:block`) if not already set.
*   **Tags**: If `task.tags` exist and `groupBy` is not 'tags', displays them.
*   **Notes**: If `task.notes` exist and not `isLink`, displays them.
*   **Subtasks Section**:
    *   If `subtasks` exist and are not empty:
        *   Renders a collapse/expand control (a line that rotates). Clicking it toggles `state.collapsed[task.id]`.
        *   If not `collapsed`, renders a `Block` component with `type='child'`, passing the processed `subtasks`. `hidePaths` is configured to ensure correct heading display within the child block.

### Styling and Layout:

*   Uses Tailwind CSS extensively.
*   `smallText` prop affects font size.
*   Title text wrapping (`break-all` vs. `break-words`) depends on word length.
*   Dynamically determines `isWide` based on column width to potentially adjust layout (though `isWide` is not directly used for layout changes in the snippet).

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`getters`, `setters`, `useAppStore`)**:
    *   Reads numerous global states: `tasks` (for subtask resolution), `settings.scheduledSubtasks`, `showingPastDates`, `collapsed`, `dailyNoteInfo`, `settings.groupBy`, `settings.viewMode`, `childWidth`, `dragOffset`.
    *   Uses `setters.patchTasks` to update task completion.
    *   Uses `setters.patchCollapsed` to toggle subtask visibility.
    *   Uses `setters.set({ dragOffset })` to update the global drag offset.
    *   Uses `getters.get('apis').obsidian.app.workspace.openLinkText` for wikilinks.
*   **`@dnd-kit/core` (`useDraggable`)**: Used for all three draggable aspects (task, length, due date).
*   **`src/services/obsidianApi.ts` (`openTask`)**: Called when the task title is clicked.
*   **`src/services/util.ts`**:
    *   `getHeading`, `isDateISO`, `nestedScheduled`, `parseTaskDate`, `roundMinutes`, `toISO`, `getToday`.
*   **`src/types/enums.ts` (`TaskPriorities`, `priorityNumberToSimplePriority`)**: For displaying priority.
*   **Child Components**:
    *   `Block`: Renders subtasks.
    *   `Button`: Used for the checkbox.
    *   `Logo`: Used for the reminder icon.
*   **Parent Components**:
    *   Typically rendered by `Group.tsx` or `Block.tsx` as part of a list of tasks.

The `Task` component is a cornerstone of the UI, providing a rich, interactive representation of individual to-do items and their nested structures.

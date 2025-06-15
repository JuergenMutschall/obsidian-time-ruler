# Task Component (`src/components/Task.tsx`)

## Purpose
The `Task` component is responsible for rendering a single task item. It acts as an orchestrator, combining several specialized child components to display various aspects of a task and manage its interactions, including drag-and-drop for the task itself, its duration, and its due date.

## Props
- **`dragContainer: string`**: Identifier for the drag context.
- **`startISO?: string`**: Scheduled start time of the block this task is in.
- **`subtasks?: TaskProps[]`**: Optional array of subtask objects; otherwise derived from `task.children` and `task.queryChildren`.
- **`renderType?: 'deadline'`**: Special rendering mode, may affect child component behavior.
- **`dragging?: true`**: Flag if this instance is part of a drag overlay.
- **`...task: TaskProps`**: Core properties of the task itself.

## Core Functionalities

### 1. Task Completion Logic
- Defines `completeTask()` to update task's completion status in the global store. This is passed to `TaskCheckbox`.

### 2. Subtask Processing
- Filters and processes `subtasks` (from props or derived from global state) based on settings (`settings.scheduledSubtasks`) and visibility rules.
- Passes the processed subtasks to the `TaskSubtaskList` component.

### 3. Drag and Drop
- **Main Task Dragging**:
    - Uses `useDraggable` for the main task item.
    - Calculates `dragOffset` during drag initiation and updates global state.
- **Task Length Dragging**:
    - Conditionally provides a draggable handle for task duration if `hasLengthDrag` is true.
    - This is managed via `TaskContent` and `TaskDetails`.
- **Deadline Dragging**:
    - Conditionally provides a draggable handle for the due date if the task is not completed.
    - This is managed via `TaskContent` and `TaskDetails`.

### 4. Rendering and Delegation to Child Components
The `Task` component structures the task item and delegates specific rendering tasks to child components:
- **`TaskCheckbox`**: Renders the interactive checkbox for task completion. Receives `completed`, `status`, and the `onComplete` callback. (See `[./TaskCheckbox.md](./TaskCheckbox.md)`)
- **`TaskContent`**: Renders the main content area of the task, including the title and other details. It is the primary draggable region for the task. `TaskContent` itself uses `TaskTitle` and `TaskDetails`. (See `[./TaskContent.md](./TaskContent.md)`)
- **`TaskTags`**: Displays the list of tags associated with the task, if applicable based on current grouping settings. (See `[./TaskTags.md](./TaskTags.md)`)
- **`TaskNotes`**: Displays the notes or description for the task, if present and not in a link context. (See `[./TaskNotes.md](./TaskNotes.md)`)
- **`TaskSubtaskList`**: Manages the display (collapse/expand) and rendering of processed subtasks. (See `[./TaskSubtaskList.md](./TaskSubtaskList.md)`)

### 5. State Management
- Interacts with global state for:
    - `collapsed[task.id]`: To control subtask visibility via `TaskSubtaskList`.
    - `dragOffset`: To store the calculated drag offset.
    - Task data for subtask resolution and processing.
    - Various settings like `scheduledSubtasks`, `showingPastDates`, `viewMode`, `childWidth`.

## Interactions
- Primarily interacts with its child components by passing props and callbacks.
- Relies heavily on the global Zustand store (`useAppStore`, `setters`, `getters`) for state and actions.
- Uses `@dnd-kit/core` for drag-and-drop functionality.
- Utilizes services like `obsidianApi.ts` (indirectly via callbacks or store actions) and `util.ts`.

This component forms the core representation of a task in the UI, bringing together various pieces of functionality and information in a structured way.

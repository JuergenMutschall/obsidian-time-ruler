# React Component Descriptions

This document provides an overview of the React components used in the Time Ruler plugin, located in the `src/components/` directory.

## App.tsx

*   **Purpose**: The main root component for the Time Ruler plugin's UI. It sets up the overall layout, including the drag-and-drop context (`DndContext`), handles global state initialization and effects (like loading data, setting up timers for "now" updates and timer events), and renders the main view sections like buttons, the timeline (`Day` components or `Unscheduled` tasks area), and the search modal.
*   **Key Aspects**:
    *   Manages `useEffect` hooks for initial data loading (`reload` function), current time updates, and timer completion checks.
    *   Calculates the date ranges to display (`times` array) based on `weeksShownState`, `showingPastDates`, and `viewMode`.
    *   Handles drag overlay (`DragOverlay`) to show a custom element while dragging.
    *   Integrates `useAutoScroll` for automatic scrolling during drag operations.
    *   Renders `Buttons` component for top-level controls and the main scrollable area for days/unscheduled tasks.
    *   Manages dynamic rendering of days based on scroll position (`scrollViews` state) for performance.

## Block.tsx

*   **Purpose**: Represents a visual block of tasks or events within a specific time slot or group (like "all-day" or "unscheduled"). It groups tasks by headings (if applicable) and renders them. It can also display calendar events.
*   **Props**:
    *   `tasks: TaskProps[]`: Array of tasks to display within this block.
    *   `events: EventProps[]`: Array of calendar events to display.
    *   `blocks: BlockProps[]`: Nested blocks (used for `Hours` component to structure further).
    *   `type: BlockType ('event' | 'unscheduled' | 'child' | 'all-day' | 'upcoming')`: Determines the styling and behavior of the block.
    *   `startISO?: string`, `endISO?: string`: Time boundaries for this block.
    *   `title?: string`: Optional title for the block (e.g., "past", "today").
    *   `dragContainer: string`: ID for dnd-kit droppable context.
*   **Key Aspects**:
    *   Filters and sorts tasks, grouping them by heading path based on settings (`state.settings.groupBy`).
    *   Uses `useDraggable` to make the block itself draggable if it contains tasks.
    *   Renders a header for the block (if not 'child' or 'unscheduled') which can show a title, event summaries, and a collapse button.
    *   Maps over `sortedGroups` to render `Group` components for each heading/path.
    *   Can render `Minutes` (time scale) if not hidden by settings and the block has a defined time range.
    *   Can render nested `Hours` if `blocks` prop is provided.
    *   For 'unscheduled' type, it can portal a collapse button to the main `Unscheduled` component's header.

## Button.tsx

*   **Purpose**: A simple, reusable button component. It can display an icon (via `Logo` component) or text children.
*   **Props**:
    *   `className?: string`: Custom CSS classes.
    *   `src?: string`: Source/name of the icon to display.
    *   `children?`: React children (e.g., text for the button).
    *   Accepts standard HTML button attributes (`onClick`, `title`, etc.).
*   **Key Aspects**:
    *   Forward refs to the underlying `div` element.
    *   Applies common styling for clickable icons/buttons.

## Day.tsx

*   **Purpose**: Renders a single day in the Time Ruler view. It displays tasks and events scheduled for that day, including all-day events, timed tasks, and a "Now" indicator if applicable.
*   **Props**:
    *   `startISO: string`, `endISO: string`: The start and end ISO datetime strings for this day's display range.
    *   `type: TimeSpanTypes` (likely 'minutes'): Indicates the type of time span it represents.
    *   `dragContainer: string`: ID for dnd-kit context.
    *   `isNow?: boolean`: True if this day component represents the current time segment.
*   **Key Aspects**:
    *   Calculates and filters tasks and events from the global store that fall within its `startISO` and `endISO`.
    *   Separates tasks into `allDay`, `pastTasks` (if `isNow` and `showingPastDates`), and `upcoming` (due tasks).
    *   Groups timed tasks by their specific start time into `blocksByTime`.
    *   Renders a header with the day's title (e.g., "Mon, Jan 1") and a collapse button.
    *   The header is clickable to open the corresponding daily note.
    *   If `isNow`, it renders the `Timer` component.
    *   Renders `Block` components for all-day events/tasks and upcoming/past tasks.
    *   Renders an `Hours` component to display the timed blocks for the day.
    *   Manages a "focus on now" state (`TR::NOW` collapsed state) which can alter its display to only show current/past items within the "now" block.

## Droppable.tsx

*   **Purpose**: A generic wrapper component that uses `useDroppable` from `@dnd-kit/core` to make its children a valid drop target in the drag-and-drop system.
*   **Props**:
    *   `children: JSX.Element`: The child element that will become droppable.
    *   `id: string`: Unique ID for the droppable area.
    *   `data: DropData`: Data associated with this drop target, used in `onDragEnd` to determine what was dropped onto.
    *   `ref?`: Optional ref forwarding.
*   **Key Aspects**:
    *   Clones its child element and injects `ref` and dynamic class names (e.g., `!bg-selection` when `isOver` is true).

## Group.tsx

*   **Purpose**: Renders a group of tasks under a specific heading (e.g., a file path, a custom heading from a task's path, or a priority level). It handles the display of the group title and the list of tasks within it. Groups can be collapsible and draggable.
*   **Props**:
    *   `headingPath: string`: The path or name of the heading for this group (e.g., "path/to/file" or "path/to/file#My Heading" or `UNGROUPED`).
    *   `tasks: TaskProps[]`: Array of tasks belonging to this group.
    *   `type: BlockType`: The type of block this group belongs to (e.g., 'all-day', 'unscheduled'), influencing some internal logic.
    *   `hidePaths: string[]`: Paths to hide (e.g., if this group is nested, parent paths might be hidden in the display).
    *   `dragContainer: string`: ID for dnd-kit context.
    *   `startISO?: string`: Start time of the parent block, sometimes relevant for context.
*   **Key Aspects**:
    *   Uses `useDraggable` to make the group header draggable (unless it's a priority-based pseudo-heading).
    *   Displays the heading title and its container (e.g., file name).
    *   Provides a collapse/expand button for the group.
    *   If `groupBySetting` is active, it can further group tasks by sub-headings recursively by rendering `Group` components again.
    *   Renders individual `Task` components for each task in the group (or subgroup).
    *   The `UNGROUPED` constant is used for tasks that don't fall under a specific sub-heading within the current grouping.

## Hours.tsx

*   **Purpose**: Renders a vertical sequence of time blocks (usually `Block` components representing events or groups of tasks) and the `Minutes` (time scale) components that fill the gaps between these blocks. It's responsible for laying out events and tasks that occur at specific times throughout a day.
*   **Props**:
    *   `startISO: string`, `endISO: string`: The overall start and end time for the range this `Hours` component covers.
    *   `blocks: BlockProps[]`: An array of `BlockProps` objects, each representing a scheduled event or a collection of tasks at a specific time. These blocks are assumed to be sorted by their start time.
    *   `chopStart?: boolean`, `chopEnd?: boolean`: Flags to adjust the rendering of the first and last `Minutes` scale (e.g., not to draw ticks before the first block or after the last).
    *   `dragContainer?: string`: ID for dnd-kit context.
*   **Key Aspects**:
    *   Processes the input `blocks` to handle overlapping or nested blocks. It creates `formattedBlocks` where each block's `endISO` can be extended if `extendBlocks` setting is true and there's empty space before the next block. It also collects nested blocks.
    *   Renders a `Minutes` component for the time range *before* the first block (if `startISO` is earlier).
    *   Iterates through `formattedBlocks`:
        *   Renders a `Block` component for each event/task group.
        *   Renders a `Minutes` component for the time range *between* the current block and the next, or from the last block to `endISO`.
    *   Conditionally hides the `Minutes` scale if `settings.hideTimes` is true or if in 'week' view mode.

## Logo.tsx

*   **Purpose**: A simple component that renders an Obsidian icon using `setIcon` from the Obsidian API.
*   **Props**:
    *   `src: string`: The name/ID of the Obsidian icon to display (e.g., "plus", "chevron-right").
    *   `className?: string`: Custom CSS classes for styling the icon container.
    *   `title?: string`: HTML title attribute for the icon.
*   **Key Aspects**:
    *   Uses `useLayoutEffect` to call `setIcon` after the component's `div` element is rendered.
    *   The `div` acts as a container for the SVG icon that Obsidian's `setIcon` creates.

## Minutes.tsx

*   **Purpose**: Renders the vertical time scale (the "ruler" part of Time Ruler) with tick marks at 15-minute or hourly intervals, depending on the view mode. Each tick mark is also a draggable point to create new timed blocks and a droppable area to schedule items.
*   **Props**:
    *   `startISO: string`, `endISO: string`: The time range this scale should cover.
    *   `chopStart?: boolean`, `chopEnd?: boolean`: Flags to omit the first/last tick if it aligns perfectly with a block boundary and shouldn't be interactive as a gap.
    *   `dragContainer: string`: ID for dnd-kit context.
*   **Key Components**:
    *   **`Time` (internal sub-component)**: Represents a single tick mark on the scale.
        *   Uses `useDroppable` to make the tick a drop target (data includes its `scheduled` ISO time).
        *   Uses `useDraggable` to allow dragging from a tick to define a new timed block (drag data includes `dragType: 'time'` and `start` ISO).
        *   Displays the hour label (e.g., "3 PM") at appropriate intervals (e.g., every 3 hours or on the hour for minute view).
        *   Dynamically styles itself if it's part of a currently dragged/selected time range.
*   **Key Aspects**:
    *   Calculates an array of `DateTime` objects (`times`) representing each tick mark based on `startISO`, `endISO`, and `type` ('minutes' or 'hours').
    *   Adjusts the actual start and end of the scale based on `chopStart`, `chopEnd`, and the current time ("now") to avoid rendering unnecessary ticks.
    *   Renders a list of `Time` sub-components.

## NewTask.tsx

*   **Purpose**: Renders the "add new task" button (+) and the modal dialog for creating a new task or moving an existing task.
*   **Props**:
    *   `dragContainer: string`: ID for dnd-kit context.
*   **Key Aspects**:
    *   **Button (+)**:
        *   Uses `useDraggable` to make the "+" button draggable. Dragging it onto a time slot initiates new task creation.
        *   Also acts as a regular button: clicking it (if not dragged) opens the new task modal.
    *   **Modal Dialog** (appears when `state.newTask` is populated):
        *   Displays "New Task" or "Move Task" based on `newTaskData.type`.
        *   Shows the `scheduled` time if the task creation was initiated by dragging to a time slot.
        *   Provides an input field for the task title (`newTask.originalTitle`).
        *   Provides an input field to search for files/headings to create/move the task into.
        *   Lists filtered files/headings (`filteredHeadings`) based on the search.
        *   Clicking a heading in the list finalizes task creation/move via `obsidianApi.createNewTask()` or `obsidianApi.moveTask()`.
        *   Handles "Enter" key press in input fields to confirm.
    *   **Delete/Move Drop Targets**: When a task is being dragged (`draggingTask` is active), this component also renders "delete" (X) and "move" (->) buttons which are `Droppable` targets.

## Search.tsx

*   **Purpose**: Renders a search modal that allows users to find tasks across their vault. It displays a list of tasks matching the search query and allows opening a selected task in the Time Ruler view.
*   **Key Aspects**:
    *   Uses `createPortal` to render the modal at the top level of the application.
    *   Filters tasks from the global store (`state.tasks`) based on the input search query (`search` state). The search logic (`convertSearchToRegExp`) appears to match against task title, path, tags, notes, priority, and status.
    *   Sorts found tasks, likely by relevance or a calculated score based on where the search term appears.
    *   Handles keyboard navigation (Enter to open task, Escape to close).
    *   Clicking a task in the results calls `openTaskInRuler()` and closes the modal.

## Task.tsx

*   **Purpose**: Renders an individual task item. It displays the task's title, checkbox, priority, due date, reminder, duration, tags, and notes. It also handles rendering of subtasks.
*   **Props**:
    *   Inherits all properties from `TaskProps`.
    *   `subtasks?: TaskProps[]`: Optional array of pre-filtered subtasks to render.
    *   `dragContainer: string`: ID for dnd-kit context.
    *   `startISO?: string`: Contextual start time, possibly from the parent block.
    *   `renderType?: 'deadline' | 'parent'`: Special rendering mode (e.g., if this task is being shown as a deadline indicator).
    *   `dragging?: true`: True if this task instance is being rendered as a drag overlay.
*   **Key Aspects**:
    *   Uses `useDraggable` to make the task draggable. Drag data includes all task properties.
    *   Provides a checkbox to complete/uncomplete the task (`completeTask` function).
    *   Displays task title, parsing and highlighting `[[wikilinks]]` within it.
    *   Shows priority indicator (e.g., "!!!").
    *   Shows due date (`X_d` for X days away) and reminder icons and text.
    *   If the task has a scheduled time and duration, it displays the duration (e.g., "1h30m") and makes this part draggable (`useDraggable` for `task-length`) to change the duration.
    *   The due date is also draggable (`useDraggable` for `due`) to change the due date.
    *   Displays tags and notes if present.
    *   Handles rendering of `subtasks`:
        *   Filters subtasks based on settings (`scheduledSubtasks`) and whether they fit the parent's context.
        *   If subtasks exist, shows a collapse/expand control.
        *   If expanded, recursively renders a `Block` component of `type='child'` to display the subtasks.
    *   Calculates drag offset during drag start to correctly position the drag overlay.

## Timer.tsx

*   **Purpose**: Implements the timer and stopwatch functionality. It displays the current time (either counting up for stopwatch or down for timer), provides controls to start, pause, resume, and reset, and allows adding/subtracting time.
*   **Key Aspects**:
    *   Uses `react-timer-hook`'s `useTimer` (for countdown) and `useStopwatch` (for count-up).
    *   Manages state for inputting timer duration (`input` state).
    *   `start()`: Initializes timer or stopwatch based on input.
    *   `reset()`: Clears timer/stopwatch.
    *   `addTime(minutes: number)`: Adds or subtracts time from the running timer/stopwatch.
    *   `togglePlaying()`: Starts, pauses, or resumes the timer/stopwatch.
    *   Displays time in `HH:MM:SS` or `MM:SS` format.
    *   Shows a visual progress bar representing the elapsed/remaining time.
    *   Handles timer completion events (sound/notification) based on plugin settings.

## Toggle.tsx

*   **Purpose**: A wrapper component that uses Obsidian's `Setting` and `ToggleComponent` to render a standard Obsidian-style toggle switch. This is likely used in settings or other UI areas where Obsidian's native controls are preferred.
*   **Props**:
    *   `callback: (state: boolean) => void`: Function called when the toggle state changes.
    *   `title: string`: Name/label for the setting, passed to `setName()`. (Note: The implementation seems to use a static name; this might be a simplification).
    *   `value: boolean`: The current value of the toggle.
*   **Key Aspects**:
    *   Creates an Obsidian `Setting` and adds a `ToggleComponent` to it programmatically.
    *   Updates the toggle's displayed value when the `value` prop changes.

## Unscheduled.tsx

*   **Purpose**: Renders the dedicated area for tasks that are not scheduled for any specific date or time. It groups these tasks and displays them.
*   **Key Aspects**:
    *   Filters tasks from the global store to find those that are unscheduled (no `scheduled` date and no `due` date, unless `showCompleted` alters this).
    *   It's wrapped in `memo` for performance optimization.
    *   Renders a header "Unscheduled" which is a `Droppable` target (to unschedule tasks by dragging them here).
    *   Contains a `div` with ID `COLLAPSE_UNSCHEDULED` which is likely a portal target for a collapse button managed by the `Block` component when `type='unscheduled'`.
    *   Renders a single `Block` component of `type='unscheduled'` to display all the filtered unscheduled tasks.
    *   The `childWidth` prop influences the layout of tasks within this block.

## AppInitializer.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskCheckbox.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskContent.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskDetails.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskNotes.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskSubtaskList.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskTags.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TaskTitle.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TimeRulerHeader.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TimelineView.tsx

*   **Purpose**: [Placeholder - To be updated with component details]

## TimelineViewHandle.ts

*   **Purpose**: [Placeholder - To be updated with component details]
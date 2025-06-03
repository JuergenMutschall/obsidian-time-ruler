# Block Component (`src/components/Block.tsx`)

## Purpose

The `Block` component is responsible for rendering a distinct section within the Time Ruler UI. These blocks can represent various things:
*   A collection of tasks scheduled for a specific time period.
*   A group of unscheduled tasks.
*   Calendar events.
*   A container for sub-tasks (child blocks).
*   All-day tasks.
*   Upcoming tasks.

It handles the visual grouping of tasks, displaying time information, and enabling drag-and-drop for the entire block of tasks.

## Props

*   **`hidePaths`** (optional, `string[]`): An array of paths to hide when determining task groupings. Defaults to `[]`.
*   **`tasks`** (`TaskProps[]`): An array of task objects to be displayed within this block.
*   **`type`** (`BlockType`): Defines the type of the block. `BlockType` can be:
    *   `'event'`: For calendar events.
    *   `'unscheduled'`: For unscheduled tasks.
    *   `'child'`: For blocks representing sub-tasks.
    *   `'all-day'`: For tasks scheduled for the whole day.
    *   `'upcoming'`: For tasks that are upcoming.
*   **`id`** (optional, `string`): A unique identifier for the block.
*   **`dragContainer`** (`string`): An identifier for the drag context, used to scope drag-and-drop operations.
*   **`startISO`** (optional, `string`): The ISO string representation of the start time for this block.
*   **`endISO`** (optional, `string`): The ISO string representation of the end time for this block.
*   **`parentId`** (optional, `string`): The ID of the parent block if this is a child block.
*   **`events`** (`EventProps[]`): An array of calendar event objects associated with this block.
*   **`blocks`** (`BlockProps[]`): An array of nested block properties, used for rendering hour markers or further subdivisions.
*   **`title`** (optional, `string`): A custom title for the block, can override the default time display.
*   **`dragging`** (optional, `true`): A flag indicating if the block is currently being dragged (used for styling the drag overlay).

## State (managed via `useAppStore` and local `useState`)

*   **`showingTasks`**: Derived state from `useAppStore`. Filters the input `tasks` to exclude tasks that are children of other tasks within this block.
*   **`groupedTasks`**: Derived state from `useAppStore`. Groups `showingTasks` based on headings (e.g., file paths, priorities) determined by `getHeading` utility and global settings (`settings.groupBy`).
*   **`sortedGroups`**: Derived state from `useAppStore`. Sorts `groupedTasks` based on global settings (`settings.groupBy`, `fileOrder`).
*   **`twentyFourHourFormat`**: From `useAppStore(state => state.settings.twentyFourHourFormat)`.
*   **`hideTimes`**: From `useAppStore(state => state.settings.hideTimes || state.settings.viewMode === 'week')`.
*   **`showingPastDates`**: From `useAppStore(state => state.showingPastDates)`.
*   **`unscheduledPortal`** (local state, `HTMLDivElement | null`): Stores a reference to the DOM element where the collapse button for the "unscheduled" block type should be portaled.
*   **`collapsed`**: From `useAppStore(state => state.collapsed[heading])`. Determines if a group within the block is collapsed. The component also checks if *all* its groups are collapsed to display a master collapse/expand button.

## Functionality

### Task Filtering and Grouping:

*   Filters out child tasks from the main `tasks` prop to only display top-level tasks for this block.
*   Groups the displayed tasks based on criteria defined by `settings.groupBy` (e.g., by path, priority, hybrid, tags, or no grouping). The `getHeading` utility function is used for this.
*   Sorts these groups based on `settings.groupBy` and `fileOrder` from the global store.

### Drag and Drop:

*   Uses the `useDraggable` hook from `@dnd-kit/core` to make the entire block draggable if it contains tasks.
*   The `dragData` object includes essential information about the block and its tasks for drag handling.
*   The drag handle is typically the header area of the block.

### Rendering:

*   **Header**:
    *   For most block types (not 'child' or 'unscheduled'), it renders a header section.
    *   This header is a `Droppable` target, allowing tasks to be dropped onto it to be scheduled within this block's time range.
    *   Displays a collapse/expand button for the groups within the block.
    *   Shows event titles if any.
    *   Displays the block's `title` or formatted `startISO` and `endISO` times (respecting `twentyFourHourFormat` and `hideTimes` settings). A horizontal rule visually separates this from task content.
*   **Task Groups**:
    *   Iterates over `sortedGroups` and renders a `Group` component for each group of tasks.
*   **Time Ruler (`Minutes` component)**:
    *   If `hideTimes` is false and valid `startISO` and `endISO` are provided, it renders a vertical `Minutes` component on the right side, visually representing the time span of the block.
    *   Adjusts `firstStartISO` to be no earlier than the current time if not showing past dates.
*   **Event Details**:
    *   If there are events, it can display event location and notes.
*   **Nested Blocks/Hours (`Hours` component)**:
    *   If `blocks` prop has data (typically for hour-based views), it renders an `Hours` component to show hour markers within this block.
*   **Unscheduled Block Specifics**:
    *   If `type === 'unscheduled'`, it uses `createPortal` to render a collapse/expand button into a specific DOM element (`COLLAPSE_UNSCHEDULED`) likely located in the `Unscheduled` component's header. This allows global collapse/expand of all unscheduled task groups.

### Styling:

*   Applies different background colors and padding based on `type` (e.g., `'child'` blocks have less visual distinction).
*   `dragging` prop can alter appearance when the block is part of a drag overlay.

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`useAppStore`, `setters`)**:
    *   Reads various global settings (`settings.groupBy`, `settings.twentyFourHourFormat`, `settings.hideTimes`, `settings.viewMode`, `fileOrder`, `collapsed`).
    *   Reads task data (`state.tasks`) to resolve child tasks.
    *   Reads `dailyNoteInfo`.
    *   Uses `setters.patchCollapsed` to update the collapsed state of task groups.
*   **`@dnd-kit/core` (`useDraggable`)**: For making the block draggable.
*   **`src/services/util.ts`**:
    *   `getChildren`: To identify and filter out child tasks.
    *   `getHeading`: To determine the grouping key for tasks.
    *   `isDateISO`: To check if a string is an ISO date (for all-day events).
    *   `parseFileFromPath`: Used in sorting groups by file order.
    *   `roundMinutes`: For adjusting `firstStartISO` to the current time.
    *   `toISO`: For converting DateTime objects to ISO strings.
*   **Child Components**:
    *   `Group`: Renders each group of tasks within the block.
    *   `Minutes`: Renders the vertical time scale.
    *   `Hours`: Renders hour subdivisions if `blocks` prop is provided.
    *   `Button`: Used for collapse/expand buttons.
    *   `Droppable`: Makes the header a drop zone.
*   **`src/components/Unscheduled.tsx` (`COLLAPSE_UNSCHEDULED`)**: The "unscheduled" block type portals its collapse button to an element defined in this component.

This component is a fundamental building block for the timeline view, organizing and presenting tasks and events in a structured and interactive way.

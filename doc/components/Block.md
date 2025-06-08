# Block Component (`src/components/Block.tsx`)

## Purpose

The `Block` component is a fundamental UI element in Time Ruler, responsible for rendering distinct sections or "blocks" of time within the timeline view. These blocks serve to visually organize and display tasks and calendar events. Depending on its `type` and props, a block can represent:

*   A collection of tasks scheduled for a specific time period.
*   A group of unscheduled tasks.
*   Calendar events.
*   A container for sub-tasks (rendered as child `Group` components, not nested `Block` components directly).
*   All-day tasks/events.
*   Upcoming tasks/events.

It handles the visual grouping of tasks, displaying time information, event details, and enables drag-and-drop functionality for the entire block of tasks.

## Props (`BlockComponentProps`)

The component receives props defined by `BlockComponentProps`, which extends `BlockProps`:

```typescript
// Defined within Block.tsx
export type BlockProps = {
  startISO?: string;
  endISO?: string;
  tasks: TaskProps[];
  events: EventProps[];
  blocks: BlockProps[]; // Typically for nested hour markers, not for task grouping
  title?: string;
};

export type BlockComponentProps = BlockProps & {
  hidePaths?: string[];
  type: BlockType;
  id?: string; // A base ID for the block, often related to its content or type
  dragContainer: string; // Identifier for the drag context/scope
  parentId?: string;
  dragging?: true; // True if the block is being rendered as a drag overlay
};

export type BlockType =
  | 'event'
  | 'unscheduled'
  | 'child' // Represents a group of tasks under a parent, styled differently
  | 'all-day'
  | 'upcoming';
```

*   **`tasks: TaskProps[]`**: An array of task objects to be potentially displayed within this block.
*   **`events: EventProps[]`**: An array of calendar event objects associated with this block.
*   **`blocks: BlockProps[]`**: An array of nested block properties, primarily used for rendering hour markers or further time subdivisions via the `Hours` component, not for grouping tasks.
*   **`startISO?: string`**: The ISO string for the start time of this block.
*   **`endISO?: string`**: The ISO string for the end time of this block.
*   **`title?: string`**: An optional custom title for the block. If provided, it can override the default time display in the header.
*   **`hidePaths?: string[]`**: (Default: `[]`) An array of paths to exclude when determining task groupings by path.
*   **`type: BlockType`**: Defines the type of the block, influencing its styling and behavior (see `BlockType` definition above).
*   **`id?: string`**: A base identifier for the block. The actual draggable ID is a composite string.
*   **`dragContainer: string`**: Scopes the drag-and-drop operations.
*   **`parentId?: string`**: The ID of a parent element, if applicable.
*   **`dragging?: true`**: A flag indicating if the block is currently being rendered as part of a drag overlay, which can alter its appearance.

## Constants
*   **`UNGROUPED = '__ungrouped'`**: A constant string used as a key for tasks that do not fall into any specific group based on the current grouping criteria.

## State Management

The `Block` component utilizes both local state and data derived from the global Zustand store (`useAppStore`):

### Local State:
*   **`unscheduledPortal: HTMLDivElement | null`**:
    *   Manages a DOM element reference for portaling the collapse button specifically for `type: 'unscheduled'` blocks. Set via `useEffect` to `document.getElementById(COLLAPSE_UNSCHEDULED)`.

### Zustand Store (`useAppStore`):
*   **`showingTasks: TaskProps[]`**:
    *   Derived by filtering the input `tasks` prop. It excludes tasks that are children of other tasks *also present within the same input `tasks` array for this block*. This ensures only top-level tasks for the current block context are processed for display.
*   **`groupedTasks: Record<string, TaskProps[]>`**:
    *   Derived by grouping `showingTasks` using `_.groupBy`. The grouping key is determined by `getHeading(task, dailyNoteInfo, settings.groupBy, hidePaths)`. Tasks that don't fit a specific group heading (based on settings) are grouped under the `UNGROUPED` key.
*   **`sortedGroups: [string, TaskProps[]][]`**:
    *   Derived by sorting the entries of `groupedTasks`. The sorting logic depends on `settings.groupBy`:
        *   If `settings.groupBy` is `false`, no specific sorting is applied beyond `_.groupBy`'s behavior.
        *   Otherwise, it performs a multi-level sort:
            1.  Puts the `UNGROUPED` group first if it exists.
            2.  Sorts by task priority (using `task.priority`).
            3.  Sorts by the file order defined in `state.fileOrder` (using `parseFileFromPath(groupHeading)`).
            4.  Sorts by the task's starting line number (`task.position.start.line`).
*   **`settings.twentyFourHourFormat: boolean`**: Used for formatting times in the header.
*   **`settings.hideTimes: boolean`**: Used to determine if times should be hidden in the header and if the `Minutes` component (vertical time ruler) should be rendered. Also influenced by `settings.viewMode === 'week'`.
*   **`settings.groupBy: string | false`**: Determines the criteria for grouping tasks.
*   **`fileOrder: string[]`**: Used in sorting groups when grouping by path.
*   **`dailyNoteInfo`**: Used by `getHeading` for grouping logic.
*   **`showingPastDates: boolean`**: Affects the calculation of `firstStartISO` for the `Minutes` component.
*   **`collapsed: Record<string, boolean>`**: The global collapsed state for groups. `state.collapsed[groupHeading]` determines if a specific group within the block is collapsed. The component also computes a local `collapsed` boolean representing if *all* its own groups are collapsed, used for the master collapse/expand button in the block header.

## Functionality

### Task Filtering and Grouping:
*   As described in the State section, tasks are first filtered to exclude children of other tasks within the block's immediate `tasks` list.
*   These filtered tasks are then grouped based on `settings.groupBy` and sorted.

### Drag and Drop:
*   The component uses the `useDraggable` hook from `@dnd-kit/core` if `tasks.length > 0`.
*   The draggable `id` is a composite: `` `${id}::${startISO}::${type}::${dragContainer}` ``.
*   The `dragData` payload includes `BlockComponentProps` along with `dragType: 'block'`.
*   The drag handle (`setActivatorNodeRef`) is specifically assigned to the header's right section containing the horizontal rule and time display, making that area the primary grab target.

### Rendering Logic and Visual Representation:

*   **Main Container**:
    *   A `div` with `data-role='block'`.
    *   Styled conditionally: `bg-code pb-2` for types other than `'child'`, and `mt-1` for `'event'` type.
    *   The `ref` from `useDraggable` (`setNodeRef`) is applied here if the block is draggable.
*   **Header (`type !== 'child' && type !== 'unscheduled'`)**:
    *   Wrapped in a `Droppable` component, allowing tasks to be dropped onto the header. The `Droppable` `id` is `` `${dragContainer}::${type}::${startISO}::${tasks[0]?.id ?? events?.[0]?.id}` ``.
    *   Contains a master collapse/expand `Button` for all groups within this block. This button's icon (`chevron-down` or `chevron-right`) reflects the combined `collapsed` state of its groups. Clicking it calls `setters.patchCollapsed` for all group headings in `sortedGroups`.
    *   Displays titles of events (`events.map(...)`), truncated if too long.
    *   The draggable area (with `attributes` and `listeners` from `useDraggable`) includes a horizontal rule and the block's time display.
        *   Time display: Uses the `title` prop if provided; otherwise, formats `startISO` (and `endISO` if `hideTimes` is true and it's not an all-day event) using `formatStart`. Respects `twentyFourHourFormat`.
*   **Task Groups Area (`div.time-ruler-groups`)**:
    *   Iterates over `sortedGroups` and renders a `Group` component for each `[path, tasks]` entry, passing relevant props.
    *   For `type: 'unscheduled'`, this container has special styling for horizontal scrolling with snap behavior (`flex overflow-y-hidden overflow-x-auto flex-col flex-wrap !w-full !h-full snap-x snap-mandatory`).
*   **Vertical Time Ruler (`Minutes` component)**:
    *   Rendered if `hideTimes` is false, `firstStartISO` and `firstEndISO` are valid, and `firstStartISO < firstEndISO`.
    *   `firstStartISO` is adjusted: if not `showingPastDates`, it won't be earlier than the current rounded minute.
    *   `firstEndISO` is taken from `blocks[0]?.startISO` (start of the first nested hour block) or the block's own `endISO`.
*   **Event Details Display**:
    *   If `events[0]` exists and has a `location` or `notes`, these are displayed below the task groups.
*   **Nested Hour Blocks (`Hours` component)**:
    *   If `blocks` prop (representing hour subdivisions) has data and `endISO` is valid, an `Hours` component is rendered to display these hour markers.
*   **Unscheduled Block Collapse Button Portal**:
    *   If `type === 'unscheduled'`, a special collapse/expand `Button` is rendered using `createPortal`. This button is portaled to the DOM element identified by `COLLAPSE_UNSCHEDULED` (likely in the `Unscheduled` component's header area). This allows a global-like collapse/expand for all unscheduled task groups from a central button.
    *   The `useEffect` hook `useEffect(() => { if (type === 'unscheduled') setUnscheduledPortal(...); }, [])` sets up the portal target.

## Interactions

*   **Zustand Store (`src/app/store.ts`)**:
    *   Reads various settings and state slices as detailed above.
    *   Dispatches actions via `setters.patchCollapsed` to toggle the collapsed state of task groups.
*   **`@dnd-kit/core`**:
    *   Uses `useDraggable` for making the block draggable.
*   **Services (`src/services/util.ts`)**:
    *   Uses `getChildren`, `getHeading`, `isDateISO`, `parseFileFromPath`, `roundMinutes`, `toISO`, `splitHeading`.
*   **Child Components**:
    *   `Group`: Renders individual groups of tasks.
    *   `Minutes`: Renders the vertical time scale for the block.
    *   `Hours`: Renders hour subdivisions.
    *   `Button`: Used for collapse/expand controls.
    *   `Droppable`: Makes the header a drop target.
*   **Parent/Sibling Components**:
    *   `Unscheduled` (`COLLAPSE_UNSCHEDULED`): The target for the portalized collapse button of unscheduled blocks.
    *   Typically rendered by `Day` or `TimelineView` components.

The `Block` component is a versatile and crucial part of the timeline, adapting its rendering and behavior based on the type of content it represents and the current application settings.

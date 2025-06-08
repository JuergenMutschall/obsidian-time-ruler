# React Component Descriptions

This document provides an overview of the React components used in the Time Ruler plugin, located in the `src/components/` directory.

## [App](./App.md)
- **Purpose**: The main root component for the Time Ruler plugin's UI. It sets up the overall layout, including the drag-and-drop context (`DndContext`), handles global state initialization and effects (like loading data, setting up timers for "now" updates and timer events), and renders the main view sections like buttons, the timeline (`Day` components or `Unscheduled` tasks area), and the search modal.

## [AppInitializer](./AppInitializer.md)
- **Purpose**: A headless React component crucial for plugin startup and ongoing operation. It handles initial data loading, manages global timers and notifications, orchestrates initial UI behaviors like scrolling, and synchronizes/reloads tasks based on state changes.

## [Block](./Block.md)
- **Purpose**: Represents a visual block of tasks or events within a specific time slot or group (like "all-day" or "unscheduled"). It groups tasks by headings (if applicable) and renders them. It can also display calendar events.

## [Button](./Button.md)
- **Purpose**: A simple, reusable button component. It can display an icon (via `Logo` component) or text children.

## [Day](./Day.md)
- **Purpose**: Renders a single day in the Time Ruler view. It displays tasks and events scheduled for that day, including all-day events, timed tasks, and a "Now" indicator if applicable.

## [Droppable](./Droppable.md)
- **Purpose**: A generic wrapper component that uses `useDroppable` from `@dnd-kit/core` to make its children a valid drop target in the drag-and-drop system.

## [Group](./Group.md)
- **Purpose**: Renders a group of tasks under a specific heading (e.g., a file path, a custom heading from a task's path, or a priority level). It handles the display of the group title and the list of tasks within it. Groups can be collapsible and draggable.

## [Hours](./Hours.md)
- **Purpose**: Renders a vertical sequence of time blocks (usually `Block` components representing events or groups of tasks) and the `Minutes` (time scale) components that fill the gaps between these blocks. It's responsible for laying out events and tasks that occur at specific times throughout a day.

## [Logo](./Logo.md)
- **Purpose**: A simple component that renders an Obsidian icon using `setIcon` from the Obsidian API.

## [Minutes](./Minutes.md)
- **Purpose**: Renders the vertical time scale (the "ruler" part of Time Ruler) with tick marks at 15-minute or hourly intervals, depending on the view mode. Each tick mark is also a draggable point to create new timed blocks and a droppable area to schedule items.

## [NewTask](./NewTask.md)
- **Purpose**: Renders the "add new task" button (+) and the modal dialog for creating a new task or moving an existing task.

## [Search](./Search.md)
- **Purpose**: Renders a search modal that allows users to find tasks across their vault. It displays a list of tasks matching the search query and allows opening a selected task in the Time Ruler view.

## [Task](./Task.md)
- **Purpose**: Renders an individual task item. It displays the task's title, checkbox, priority, due date, reminder, duration, tags, and notes. It also handles rendering of subtasks.

## [TaskCheckbox](./TaskCheckbox.md)
- **Purpose**: A specialized UI element representing a task's status (e.g., completed, pending) as an interactive checkbox. It uses the `Button` component and allows users to change task completion state via a callback.

## [TaskContent](./TaskContent.md)
- **Purpose**: A draggable container for a task's main content, structuring the visual presentation of its title (via `TaskTitle`) and detailed information (via `TaskDetails`). It integrates with `@dnd-kit/core` for DND functionality.

## [TaskDetails](./TaskDetails.md)
- **Purpose**: Displays secondary task details like priority and reminders. It also provides draggable handles for adjusting task duration and due date, and is designed to be hidden when its parent task is dragged.

## [TaskNotes](./TaskNotes.md)
- **Purpose**: Displays the notes or description for a task. It conditionally renders, hiding notes if the task is in a compact "link" format or if no notes content exists.

## [TaskSubtaskList](./TaskSubtaskList.md)
- **Purpose**: Renders a list of subtasks for a parent task, providing a visual control to collapse/expand this list. It uses the `Block` component to display subtasks when expanded.

## [TaskTags](./TaskTags.md)
- **Purpose**: Displays the list of tags for a task. It conditionally renders, hiding tags if the task has none or if the application view is already grouping by tags.

## [TaskTitle](./TaskTitle.md)
- **Purpose**: Renders a task's title, parsing and making `[[wikilinks]]` clickable for navigation within Obsidian. It applies conditional styling based on task properties and limits display to approximately two lines.

## [TimeRulerHeader](./TimeRulerHeader.md)
- **Purpose**: The primary interactive control panel for Time Ruler. It handles timeline navigation, view/appearance settings, search initiation, and new task creation via various buttons and a settings dropdown.

## [TimelineView](./TimelineView.md)
- **Purpose**: The core scrollable area displaying tasks and events by time periods (using `Day` components) or as unscheduled (using `Unscheduled` component). It features virtualization for performance and an imperative handle for programmatic scrolling.

## [TimelineViewHandle](./TimelineViewHandle.md)
- **Purpose**: An interface defining the programmatic API (e.g., `scrollTo` method) for imperatively interacting with the `TimelineView` component from a parent. This allows controlled scrolling and decouples parent components from `TimelineView`'s internal DOM.

## [Timer](./Timer.md)
- **Purpose**: Implements the timer and stopwatch functionality. It displays the current time (either counting up for stopwatch or down for timer), provides controls to start, pause, resume, and reset, and allows adding/subtracting time.

## [Toggle](./Toggle.md)
- **Purpose**: A wrapper component that uses Obsidian's `Setting` and `ToggleComponent` to render a standard Obsidian-style toggle switch. This is likely used in settings or other UI areas where Obsidian's native controls are preferred.

## [Unscheduled](./Unscheduled.md)
- **Purpose**: Renders the dedicated area for tasks that are not scheduled for any specific date or time. It groups these tasks and displays them.
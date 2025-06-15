# System Overview

## Plugin: Time Ruler

**ID:** `time-ruler`
**Author:** Joshua Tazman Reinier
**Description:** Time Ruler is an Obsidian plugin that provides a drag-and-drop time blocking interface, combining features of a task list and a calendar view. It aims to help users visually schedule and manage their tasks within Obsidian.

## Core Features

*   **Task Parsing:** Reads tasks from Markdown files in various formats, including:
    *   Dataview inline fields (e.g., `[scheduled:: YYYY-MM-DDTHH:mm]`, `[due:: YYYY-MM-DD]`)
    *   Obsidian Tasks plugin emoji syntax (e.g., ⏳, 📅, 🔺)
    *   Full Calendar plugin syntax (e.g., `[date:: YYYY-MM-DD]`, `[startTime:: HH:mm]`)
    *   Day Planner format (e.g., `YYYY-MM-DD HH:mm - HH:mm Task description`)
    *   Kanban style dates (`@{YYYY-MM-DD}`, `@@{HH:mm}`)
*   **Time Blocking View:** Displays tasks and events on a visual timeline, allowing users to see their schedule at a glance. Supports day, week, and hour views.
*   **Drag and Drop:**
    *   Reschedule tasks by dragging them to different time slots or days.
    *   Change task duration by dragging resize handles.
    *   Create new tasks by dragging a "new task" button to a desired time.
    *   Move tasks between files/headings.
*   **Task Management:**
    *   Create, edit, and delete tasks.
    *   Mark tasks as complete.
    *   Support for nested tasks (subtasks).
    *   Filter tasks by search terms, paths, and custom criteria.
    *   Query tasks: Dynamically include tasks from Dataview queries as children of a parent task.
*   **Online Calendar Integration:**
    *   Imports events from iCalendar (`.ics`) links for read-only display alongside Obsidian tasks.
    *   Supports multiple calendars.
*   **Integrated Timer:** A Pomodoro/stopwatch timer to help with time tracking and focus.
*   **Customization:**
    *   Extensive settings to control appearance, behavior, task parsing, and filtering.
    *   Users can define preferred date/time formats, custom task statuses, and more.
*   **Inter-Plugin Compatibility:** Designed to work well with:
    *   **Dataview:** Essential for reading task metadata from notes.
    *   **Tasks:** Supports its task format.
    *   **Full Calendar:** Supports its event/task format.
    *   **Reminder:** Can parse Reminder plugin's syntax.

## Workflow

1.  **Task Input:** Users create tasks in their Obsidian notes using one of the supported formats.
2.  **Parsing & Indexing:** The Time Ruler plugin, with the help of Dataview, parses these tasks from the vault.
3.  **Display:** Tasks are rendered in the Time Ruler view (a custom Obsidian view pane). External calendar events are also fetched and displayed.
4.  **Interaction:** Users can drag and drop tasks to reschedule, change duration, mark complete, etc. These changes are written back to the Markdown files.
5.  **New Task Creation:** Users can create new tasks directly from the Time Ruler interface, which are then added to the specified note or daily note.

## Key Dependencies

*   **Obsidian API:** For all core interactions with the Obsidian application (views, commands, settings, file system access).
*   **Dataview Plugin API:** Crucial for querying and accessing metadata from Markdown files. The plugin will not function without Dataview.
*   **React & ReactDOM:** Used for rendering the plugin's user interface (settings tab and the main Time Ruler view).
*   **Luxon:** For date and time manipulations.
*   **ical / ical2json:** For parsing iCalendar data.
*   **@dnd-kit/core:** For drag and drop functionality.

## Detailed Documentation
For a detailed breakdown of UI components, see the [Component Overview](./components/_OVERVIEW.md).
For a detailed breakdown of internal services, see the [Service Overview](./services/_OVERVIEW.md).

## Network Usage

The plugin makes GET requests to user-configured iCalendar URLs to fetch event data. This typically happens on startup/refresh. No other data is sent externally.
# Documentation Overview

Welcome to the Time Ruler plugin documentation! This document serves as a starting point and guide to help you understand the plugin's internal structure, control flows, and core components.

## Main Documentation Files

The primary documentation is organized into several key Markdown files within this `doc/` directory:

*   **[`architecture.md`](./architecture.md)**:
    *   Provides a high-level overview of the plugin's architecture. It describes the main components (like the plugin entry point, React UI, and services), their responsibilities, and how they interact. Includes Mermaid diagrams for visualization.

*   **[`control_flow.md`](./control_flow.md)**:
    *   Details the sequence of events for common user interactions, such as creating or editing tasks, changing settings, etc. It traces these flows through different components and services, using Mermaid diagrams to illustrate the interactions.

*   **[`plugin.md`](./plugin.md)**:
    *   Focuses on the core plugin class (`TimeRulerPlugin` in `src/main.ts`). It explains the plugin lifecycle (`onload`, `onunload`), how views, settings tabs, commands, and event listeners are registered, and its direct interactions with the Obsidian API.

*   **[`store.md`](./store.md)**:
    *   Describes the Zustand state management store (`src/app/store.ts`). It covers the structure of the `AppState`, the purpose of different state slices, and how getters and setters (actions) are used to access and modify the state.

*   **[`types.md`](./types.md)**:
    *   Documents important TypeScript types and interfaces used throughout the plugin, primarily from `src/types/index.d.ts` and other relevant files (like `TimeRulerSettings` from `src/main.ts`). This includes key data structures like `TaskProps`, `EventProps`, etc.

## Subdirectory Documentation

### [`doc/components/`](./components/)

This directory contains detailed documentation for individual React components found in `src/components/`.
*   Each `.md` file typically corresponds to a `.tsx` component (e.g., `App.md`, `Task.md`, `TimelineView.md`).
*   These documents should explain the component's purpose, its props, internal state (if significant), and how it interacts with the Zustand store or parent/child components.
*   An [`_overview.md`](./components/_overview.md) within this subdirectory may provide a general introduction to the component architecture or common patterns used.

### [`doc/services/`](./services/)

This directory contains documentation for the various services found in `src/services/`.
*   Each `.md` file corresponds to a service module (e.g., `obsidianApi.md`, `parser.md`, `calendarApi.md`).
*   These documents should detail the public API of each service, its responsibilities, any important algorithms or logic, and how it interacts with the Obsidian API, external APIs, or the Zustand store.
*   An `_overview.md` within this subdirectory may provide a general introduction if available.

## How to Navigate This Documentation

1.  **Start with [`_overview.md`](./_overview.md) (this file):** Get a lay of the land.
2.  **High-Level Understanding ([`architecture.md`](./architecture.md)):** If you want to understand the overall structure and how major parts fit together.
3.  **Plugin Entry & Obsidian Integration ([`plugin.md`](./plugin.md)):** To see how the plugin boots up and registers its core features with Obsidian.
4.  **State Management ([`store.md`](./store.md)):** To understand what data is stored globally and how it's managed.
5.  **Data Structures ([`types.md`](./types.md)):** Refer to this for definitions of common data objects passed around the application.
6.  **User Interaction Flows ([`control_flow.md`](./control_flow.md)):** To trace specific user actions through the system.
7.  **Deep Dives ([`doc/components/`](./components/) and [`doc/services/`](./services/)):** When you need to understand a specific React component or a service module in detail. Start with the [`_overview.md`](./components/_overview.md) in those directories if available, then navigate to the specific file.

This structured approach should help developers find the information they need efficiently.

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

## Network Usage

The plugin makes GET requests to user-configured iCalendar URLs to fetch event data. This typically happens on startup/refresh. No other data is sent externally.

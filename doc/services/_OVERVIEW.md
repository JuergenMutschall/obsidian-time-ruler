# Service Descriptions

This document provides an overview of the services used in the Time Ruler plugin, located in the `src/services/` directory. These services encapsulate specific functionalities like interacting with the Obsidian API, parsing task data, managing drag-and-drop operations, and handling external calendar data.

## [autoScroll.ts](./autoScroll.md)
- **Purpose**: Provides a React hook `useAutoScroll` to automatically scroll designated scrollable areas when a user drags an item near their edges. This enhances the drag-and-drop experience in long lists or timelines.

## [calendarApi.ts](./calendarApi.md)
- **Purpose**: Manages fetching and parsing calendar data from iCalendar (`.ics`) URLs. It processes single and recurring events, including exceptions, and updates the global application state with these events.

## [dragging.ts](./dragging.md)
- **Purpose**: Centralizes the logic for handling drag-and-drop operations using `@dnd-kit/core`. It provides `onDragStart` and `onDragEnd` handlers that determine the consequences of dropping various draggable items onto different drop targets.

## [obsidianApi.ts](./obsidianApi.md)
- **Purpose**: Provides the `ObsidianAPI` class and utility functions to interact with the Obsidian application, its vault, metadata, and the Dataview plugin. It handles task CRUD operations, file operations, settings access, and UI interactions.

## [parser.ts](./parser.md)
- **Purpose**: Responsible for translating tasks and their metadata between different representations. It parses tasks from Markdown/Dataview into `TaskProps`, formats `TaskProps` back to Markdown text or page frontmatter, and detects metadata formats (e.g., Tasks plugin, Dataview inline fields).

## [util.ts](./util.md)
- **Purpose**: A collection of miscellaneous helper functions for date/time manipulation (using Luxon), string parsing (paths, headings), task data processing, DOM interactions, and application-specific logic for task hierarchies and queries.

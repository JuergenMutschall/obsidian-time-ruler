# Architecture Overview

This document provides a high-level overview of the Obsidian Time Ruler plugin's architecture.

## Main Components

The plugin is structured into several key components:

*   **`main.ts`**: This is the entry point of the plugin. It defines the `TimeRulerPlugin` class, which extends Obsidian's `Plugin` class. It handles the plugin's lifecycle, settings management, command registration, event handling, and view activation. It also integrates with the Dataview plugin.

*   **`src/app/`**: This directory likely contains the core application logic.
    *   `store.ts`: Suggests the use of a state management solution (like Zustand or Redux) to manage the plugin's data and state.

*   **`src/components/`**: This directory houses the UI components of the plugin, built using React (as indicated by `.tsx` files). Key components include:
    *   `App.tsx`: The main application component that likely orchestrates the overall UI.
    *   `Day.tsx`, `Block.tsx`, `Task.tsx`: Components responsible for rendering different parts of the time ruler interface.
    *   `Timer.tsx`: A component for the timer functionality.
    *   `NewTask.tsx`, `Search.tsx`: Components for user interactions like adding tasks and searching.

*   **`src/plugin/`**: This directory contains code specific to the Obsidian plugin environment.
    *   `SettingsTab.tsx`: A React component that renders the plugin's settings interface within Obsidian.

*   **`src/services/`**: This directory provides various services used throughout the plugin:
    *   `obsidianApi.ts`: Interacts with the Obsidian API to perform actions like opening files, displaying notices, etc.
    *   `parser.ts`: Handles parsing of task strings and converting them to and from task objects.
    *   `calendarApi.ts`: Likely interacts with calendar data, possibly for integrating external calendars or parsing calendar-related information.
    *   `dragging.ts`: Manages drag-and-drop functionality within the time ruler.
    *   `util.ts`: Contains utility functions used across the plugin.

*   **`src/types/`**: This directory contains TypeScript type definitions, ensuring type safety and improving code maintainability.

*   **`src/assets/`**: Stores static assets like sound files used for notifications.

## Interactions

1.  **Plugin Initialization**: Obsidian loads the plugin, and `main.ts` initializes the `TimeRulerPlugin`. Settings are loaded, and the Time Ruler view is registered.
2.  **View Activation**: When a user activates the Time Ruler (e.g., via a command or ribbon icon), `main.ts` creates and displays the `TimeRulerView`, which is likely built using the React components from `src/components/`.
3.  **Data Management**: The `src/app/store.ts` manages the state of the application, including tasks, settings, and UI state. Components read data from the store and dispatch actions to update it.
4.  **Task Parsing and Manipulation**: Tasks are parsed from Markdown files using services in `src/services/parser.ts`. Users can interact with tasks in the UI, and these interactions are handled by components, which then update the store and potentially modify the underlying Markdown files via `src/services/obsidianApi.ts`.
5.  **Settings**: Users can configure the plugin via the `SettingsTab` component, and these settings are saved by `TimeRulerPlugin`.
6.  **Obsidian Integration**: The plugin interacts with Obsidian through the API provided in `obsidian.d.ts` and wrapper functions in `src/services/obsidianApi.ts`. This includes creating views, adding commands, handling editor events, etc.
7.  **Dataview Integration**: The plugin relies on the Dataview plugin for querying task data from Markdown files.

This is a high-level overview, and further details can be found by examining the code within each component and service.

# Documentation Overview

Welcome to the Time Ruler plugin documentation! This document serves as a starting point and guide to help you understand the plugin's internal structure, control flows, and core components.

## Main Documentation Files

The primary documentation is organized into several key Markdown files within this `doc/` directory:

*   **`ARCHITECTURE.MD`**:
    *   Provides a high-level overview of the plugin's architecture. It describes the main components (like the plugin entry point, React UI, and services), their responsibilities, and how they interact. Includes Mermaid diagrams for visualization.

*   **`CONTROL_FLOW.MD`**:
    *   Details the sequence of events for common user interactions, such as creating or editing tasks, changing settings, etc. It traces these flows through different components and services, using Mermaid diagrams to illustrate the interactions.

*   **`PLUGIN.MD`**:
    *   Focuses on the core plugin class (`TimeRulerPlugin` in `src/main.ts`). It explains the plugin lifecycle (`onload`, `onunload`), how views, settings tabs, commands, and event listeners are registered, and its direct interactions with the Obsidian API.

*   **`STORE.MD`**:
    *   Describes the Zustand state management store (`src/app/store.ts`). It covers the structure of the `AppState`, the purpose of different state slices, and how getters and setters (actions) are used to access and modify the state.

*   **`TYPES.MD`**:
    *   Documents important TypeScript types and interfaces used throughout the plugin, primarily from `src/types/index.d.ts` and other relevant files (like `TimeRulerSettings` from `src/main.ts`). This includes key data structures like `TaskProps`, `EventProps`, etc.

*   **`README.MD`**:
    *   (If present and distinct from the main project README) This file might contain specific developer notes or a summary relevant to the codebase within the `doc/` folder itself. *(The main project README.md at the repository root typically covers user-facing information and installation.)*

## Subdirectory Documentation

### `doc/components/`

This directory contains detailed documentation for individual React components found in `src/components/`.
*   Each `.md` file typically corresponds to a `.tsx` component (e.g., `App.md`, `Task.md`, `TimelineView.md`).
*   These documents should explain the component's purpose, its props, internal state (if significant), and how it interacts with the Zustand store or parent/child components.
*   An `_OVERVIEW.md` within this subdirectory may provide a general introduction to the component architecture or common patterns used.

### `doc/services/`

This directory contains documentation for the various services found in `src/services/`.
*   Each `.md` file corresponds to a service module (e.g., `obsidianApi.md`, `parser.md`, `calendarApi.md`).
*   These documents should detail the public API of each service, its responsibilities, any important algorithms or logic, and how it interacts with the Obsidian API, external APIs, or the Zustand store.

## How to Navigate This Documentation

1.  **Start with `_OVERVIEW.MD` (this file):** Get a lay of the land.
2.  **High-Level Understanding (`ARCHITECTURE.MD`):** If you want to understand the overall structure and how major parts fit together.
3.  **Plugin Entry & Obsidian Integration (`PLUGIN.MD`):** To see how the plugin boots up and registers its core features with Obsidian.
4.  **State Management (`STORE.MD`):** To understand what data is stored globally and how it's managed.
5.  **Data Structures (`TYPES.MD`):** Refer to this for definitions of common data objects passed around the application.
6.  **User Interaction Flows (`CONTROL_FLOW.MD`):** To trace specific user actions through the system.
7.  **Deep Dives (`doc/components/` and `doc/services/`):** When you need to understand a specific React component or a service module in detail. Start with the `_OVERVIEW.md` in those directories if available, then navigate to the specific file.

This structured approach should help developers find the information they need efficiently.

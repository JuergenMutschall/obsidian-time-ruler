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

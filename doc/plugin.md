# Time Ruler Plugin Core (`src/main.ts`)

This document details the core functionality of the Time Ruler plugin, primarily managed through the `TimeRulerPlugin` class in `src/main.ts`. It covers the plugin's lifecycle, registration of views, settings, commands, and its interaction with the Obsidian API.

## Plugin Class: `TimeRulerPlugin`

The main class `TimeRulerPlugin` extends `Plugin` from the `obsidian` API. It serves as the entry point and central coordinator for the plugin's features.

```typescript
export default class TimeRulerPlugin extends Plugin {
  settings: [TimeRulerSettings](../types.md#timerulersettings);

  constructor(app: App, manifest: any) {
    super(app, manifest);
    this.saveSettings = this.saveSettings.bind(this); // Binding saveSettings to ensure correct 'this' context
  }

  // ... lifecycle methods and other functionalities
}
```

Key responsibilities:
- Managing plugin settings ([`TimeRulerSettings`](../types.md#timerulersettings)).
- Setting up UI elements like views and settings tabs.
- Registering commands for user interaction.
- Handling plugin lifecycle events (`onload`, `onunload`).

## Plugin Settings

-   **[`TimeRulerSettings`](../types.md#timerulersettings) (Type):** Defines the structure for all settings used by the plugin. This includes calendar configurations, display preferences (like 24-hour format), task filtering options, etc.
-   **`DEFAULT_SETTINGS` (Constant):** Provides the default values for all settings when the plugin is first loaded or when settings are reset.
-   **`loadSettings()`:** An `async` method called during `onload`. It loads settings from Obsidian's storage using `this.loadData()` and merges them with `DEFAULT_SETTINGS`.
    ```typescript
    async loadSettings() {
      this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
    }
    ```
-   **`saveSettings()`:** A method responsible for persisting the current state of `this.settings` to Obsidian's storage using `this.saveData()`. This method is also bound in the constructor and passed to child components like `SettingsTab` and `[ObsidianAPI](../services/obsidianApi.md)` to allow them to trigger settings persistence.
    ```typescript
    saveSettings() {
      this.saveData(this.settings);
    }
    ```

## Plugin Lifecycle

### `onload()`

This `async` method is the primary initialization point when Obsidian loads the plugin. It performs the following setup actions:

1.  **Load Settings:** Calls `await this.loadSettings()` to retrieve previously saved settings or apply defaults.
2.  **Add Settings Tab:** Registers the plugin's settings tab for user configuration.
    ```typescript
    this.addSettingTab(new SettingsTab(this, this.app));
    ```
    This creates an instance of `SettingsTab` (from `src/plugin/SettingsTab.tsx`), passing the plugin instance (`this`) and the Obsidian `App` object.
3.  **Register View:** Registers the main Time Ruler view.
    ```typescript
    this.registerView(TIME_RULER_VIEW, (leaf) => new TimeRulerView(leaf, this));
    ```
    -   `TIME_RULER_VIEW` (constant, likely `'time-ruler-view'`): The unique identifier for this view type.
    -   The factory function `(leaf) => new TimeRulerView(leaf, this)` is called by Obsidian when it needs to create an instance of the view, providing the `WorkspaceLeaf` and the plugin instance. `TimeRulerView` is imported from `src/index.tsx`.
4.  **Add Commands:** Registers various commands that users can execute via the command palette or hotkeys.
    *   **`activate-view`**: Opens Time Ruler (respecting the `openInMain` setting).
    *   **`activate-view-main`**: Forces Time Ruler to open in a main tab.
    *   **`activate-view-sidebar`**: Forces Time Ruler to open in the sidebar.
    *   **`find-task`**: "Reveal in Time Ruler" - an editor command to locate the currently selected task in the Time Ruler view.
    ```typescript
    this.addCommand({
      icon: 'ruler',
      callback: () => this.activateView(this.settings.openInMain),
      id: 'activate-view',
      name: 'Open Time Ruler',
    });
    // ... other commands
    ```
5.  **Add Ribbon Icon:** Adds an icon to the Obsidian ribbon (sidebar) for quick access to open the Time Ruler.
    ```typescript
    this.addRibbonIcon('ruler', 'Open Time Ruler', () => {
      this.activateView(this.settings.openInMain);
    });
    ```
6.  **Register Event Listeners:**
    *   Sets up an event listener for the editor context menu to add custom items.
    ```typescript
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, _, context) =>
        this.openMenu(menu, context)
      )
    );
    ```
    The `openMenu` method dynamically adds items like "Reveal in Time Ruler" or "Do Today/Tomorrow..." to the menu when a task is right-clicked.

### `onunload()`

While `src/main.ts` does not explicitly define an `onunload()` method, Obsidian automatically handles unregistering views, commands, event listeners, etc., that were registered using the plugin's lifecycle methods (`registerView`, `addCommand`, `registerEvent`). If any custom cleanup were needed (e.g., stopping timers, releasing external resources not managed by Obsidian's APIs), an `onunload()` method would be implemented.

## Key Methods and Functionalities

### `activateView(main?: boolean)`

This `async` method handles the logic for opening or focusing the Time Ruler view.
1.  **Dataview Check:** It first checks if the Dataview plugin is installed and initialized using `getAPI(this.app)`. If Dataview is not available (a critical dependency), it shows a `Notice` to the user and aborts.
2.  **Detach Existing Leaves:** It detaches any existing leaves of type `TIME_RULER_VIEW` using `this.app.workspace.detachLeavesOfType(TIME_RULER_VIEW)`. This ensures a clean state and avoids multiple instances.
3.  **Get Leaf:** It determines where to open the view (main workspace or right sidebar) based on the `main` parameter (or plugin settings).
    ```typescript
    const leaf = main
      ? this.app.workspace.getLeaf(true) // New tab in main area
      : this.app.workspace.getRightLeaf(false); // Sidebar, or new tab if sidebar hidden
    ```
4.  **Set View State:** It sets the state of the chosen leaf to display the Time Ruler view.
    ```typescript
    await leaf.setViewState({
      type: TIME_RULER_VIEW,
      active: true,
    });
    ```
5.  **Reveal Leaf:** Finally, it ensures the leaf is revealed (brought to the front): `this.app.workspace.revealLeaf(leaf)`.

### `openMenu(menu: Menu, context: MarkdownView | MarkdownFileInfo)`

This method is called when the editor context menu is opened.
- It checks if the cursor is on a line that represents a task.
- If so, it adds:
    - "Reveal in Time Ruler" item, which calls `this.jumpToTask(context)`.
    - A "Do" submenu with options like "Today", "Tomorrow", "Now", "Next week", and "Unschedule", which call `this.editTask(context, cursor.line, modificationType)`.

### `jumpToTask(context: MarkdownView | MarkdownFileInfo)`

This `async` method facilitates finding a task from the editor within the Time Ruler view.
- It extracts the file path and line number from the editor `context`.
- Validates that the current line is a task.
- Ensures the Time Ruler view is open and active using `activateView()` if necessary.
- Calls `openTaskInRuler(path + '::' + cursor.line)`. `openTaskInRuler` (from `src/services/obsidianApi.ts`) is a function that then signals the React UI to find and scroll to the specified task.

### `editTask(...)`

This `async` method modifies a task's scheduled date directly from the editor context menu.
- It constructs the task ID.
- Determines the new `scheduled` ISO string based on the `modification` type (e.g., 'today', 'now').
- Calls [`setters.patchTasks([id], { scheduled })`](../store.md#setters-actions) to update the task in the store and persist it via `[ObsidianAPI](../services/obsidianApi.md)`.

## Interaction with Obsidian API

The `TimeRulerPlugin` class and its methods extensively use the Obsidian API (`this.app` and imported functions/classes):

-   **Plugin Lifecycle:** `Plugin` base class, `onload`, `loadData`, `saveData`.
-   **Workspace:**
    -   `this.app.workspace.on('editor-menu', ...)`: Registering editor menu event listeners.
    -   `this.app.workspace.getLeavesOfType(...)`: Finding existing view instances.
    -   `this.app.workspace.detachLeavesOfType(...)`: Closing view instances.
    *   `this.app.workspace.getLeaf(true)` / `this.app.workspace.getRightLeaf(false)`: Creating new panes/leaves for the view.
    *   `this.app.workspace.revealLeaf(...)`: Focusing a view.
    *   `leaf.setViewState(...)`: Assigning a view type to a leaf.
    *   `this.app.workspace.getActiveFile()`: Used in `checkCallback` for commands.
-   **Views:** `this.registerView(...)`.
-   **Settings:** `this.addSettingTab(...)`.
-   **Commands:** `this.addCommand(...)`.
-   **UI Notifications:** `new Notice(...)`.
-   **Icons:** `this.addRibbonIcon(...)`, `setIcon(...)` used in `openMenu`.
-   **Menu:** `Menu` class for context menus.
-   **Editor Context:** `MarkdownView`, `MarkdownFileInfo`, `editor.getCursor()`, `editor.getLine()`.
-   **Dataview Integration:** `getAPI(this.app)` from `'obsidian-dataview'` is used to interact with the Dataview plugin, primarily for task querying (though the direct query logic is in `[ObsidianAPI](../services/obsidianApi.md)`).

The plugin encapsulates most direct Obsidian API interactions related to its core setup and features within `src/main.ts`. Other services, like `[ObsidianAPI](../services/obsidianApi.md)` in `src/services/obsidianApi.ts`, handle more specific interactions like file system operations and detailed Dataview queries.

# TimeRulerPlugin Class (`src/main.ts`)

## Purpose

`TimeRulerPlugin` is the main class for the Obsidian Time Ruler plugin. It extends Obsidian's `Plugin` class and serves as the entry point and central coordinator for all plugin functionalities. It handles:
*   Plugin lifecycle (loading and unloading).
*   Loading and saving plugin settings.
*   Registering the custom Time Ruler view.
*   Adding ribbon icons and commands to trigger plugin actions.
*   Setting up event listeners for interactions within Obsidian (e.g., editor menu).

## Plugin Settings (`TimeRulerSettings`)

The plugin defines a `TimeRulerSettings` interface, with `DEFAULT_SETTINGS` providing the initial values. Key settings include:

*   **`calendars: string[]`**: Array of iCalendar URLs.
*   **`fieldFormat: FieldFormat['main']`**: Default format for parsing task metadata (e.g., 'dataview', 'tasks').
*   **`muted: boolean`**: Whether to mute sounds.
*   **`timerEvent: 'notification' | 'sound'`**: How timer completion is signaled.
*   **`inbox: string | null`**: Path to a default inbox note (usage not fully clear from `main.ts` alone).
*   **`search: string`**: Default Dataview query for searching pages.
*   **`taskSearch: string`**: Additional filter for task text.
*   **`fileOrder: string[]`**: Custom order for files/groups in views.
*   **`customStatus: { include: boolean; statuses: string }`**: Configuration for custom task statuses.
*   **`showCompleted: boolean`**: Whether to show completed tasks by default.
*   **`dayStartEnd: [number, number]`**: Start and end hours for the day view.
*   **`groupBy: false | 'priority' | 'path' | 'hybrid' | 'tags'`**: Default grouping for tasks.
*   **`twentyFourHourFormat: boolean`**: Whether to use 24-hour time format.
*   **`filterFunction: string`**: Custom JavaScript function string for filtering Dataview results.
*   **`addTaskToEnd: boolean`**: Whether to add new tasks to the end of a file/section.
*   **`extendBlocks: boolean`**: Whether time blocks should extend to the next event.
*   **`hideTimes: boolean`**: Whether to hide the minute/hour markers on the timeline.
*   **`borders: boolean`**: Whether to show borders around UI elements.
*   **`viewMode: 'hour' | 'day' | 'week'`**: Default view mode for the timeline.
*   **`scheduledSubtasks: boolean`**: Whether subtasks need to be explicitly scheduled.
*   **`openInMain: boolean`**: Whether to open the Time Ruler view in a main tab by default or a sidebar.

## Lifecycle Methods

### `constructor(app: App, manifest: any)`

*   Calls the parent `Plugin` constructor.
*   Binds `this.saveSettings` to the class instance.

### `async onload()`

This is the primary method called when the plugin is loaded.
1.  **Load Settings**: Calls `await this.loadSettings()` to load plugin data.
2.  **Add Settings Tab**: Registers a new `SettingsTab` instance (`new SettingsTab(this, this.app)`).
3.  **Register View**:
    *   Registers the `TIME_RULER_VIEW` (custom view type, likely "time-ruler") with a factory function that creates a new `TimeRulerView` instance. `TimeRulerView` is the main React component host for the plugin's UI, likely defined in `src/index.tsx` or `src/components/App.tsx`.
4.  **Add Commands**:
    *   **`Open Time Ruler` (`activate-view`)**: Activates the Time Ruler view, respecting `this.settings.openInMain`.
    *   **`Open Time Ruler in Main Tab` (`activate-view-main`)**: Activates the view specifically in a main tab.
    *   **`Open Time Ruler in Sidebar` (`activate-view-sidebar`)**: Activates the view specifically in the sidebar.
    *   **`Reveal in Time Ruler` (`find-task`)**: An editor callback command. When invoked from an editor with the cursor on a task line, it attempts to find and reveal that task within the Time Ruler view.
        *   It first ensures the Time Ruler view is open (`this.activateView()`).
        *   Then calls `openTaskInRuler(path + '::' + cursor.line)` (a function from `obsidianApi.ts`) to highlight the task.
5.  **Add Ribbon Icon**:
    *   Adds a ribbon icon ("ruler") that, when clicked, opens the Time Ruler view (respecting `this.settings.openInMain`).
6.  **Register Editor Menu Event**:
    *   Listens to `this.app.workspace.on('editor-menu', ...)` to add custom items to the context menu that appears when right-clicking in the editor.
    *   Calls `this.openMenu(menu, context)` to populate the menu.

### `onunload()`

*   (Not explicitly defined in the provided `main.ts` snippet, but a standard `Plugin` method). If defined, it would handle cleanup tasks like unregistering views, commands, and event listeners when the plugin is disabled.

## Key Methods

### `async activateView(main?: boolean)`

*   **Dataview Check**: Ensures the Dataview plugin is enabled and its API is available. If not, it shows a notice and returns. It includes a short timeout and retry mechanism for Dataview API initialization.
*   **Detach Existing Leaves**: Detaches any existing leaves of type `TIME_RULER_VIEW` to prevent duplicates.
*   **Get Leaf**: Gets a new leaf (workspace pane). If `main` is true, it gets a main editing leaf; otherwise, it gets a right sidebar leaf (`this.app.workspace.getRightLeaf(false)`).
*   **Set View State**: Sets the state of the new leaf to display the `TIME_RULER_VIEW`.
*   **Reveal Leaf**: Makes sure the leaf containing the Time Ruler view is visible.

### `jumpToTask(context: MarkdownView | MarkdownFileInfo)`

*   Called by the "Reveal in Time Ruler" command.
*   Extracts the file path and cursor line from the editor context.
*   Validates that the cursor is on a task line (`/ *- \[ \] /`).
*   Ensures the Time Ruler view is active (calls `this.activateView()` if needed).
*   Calls `openTaskInRuler()` (from `obsidianApi.ts`) with the task's unique ID (filePath + "::" + lineNumber) to highlight it in the view.

### `openMenu(menu: Menu, context: MarkdownView | MarkdownFileInfo)`

*   Called when the editor context menu is opened.
*   Checks if the cursor is on a valid task line.
*   **"Reveal in Time Ruler" Item**: Adds a menu item to call `this.jumpToTask(context)`.
*   **"Do" Submenu**: Adds a submenu with actions to quickly reschedule the selected task:
    *   "Today", "Tomorrow", "Now", "Next week": Calls `this.editTask()` with the respective modification.
    *   "Unschedule": (If the task line contains an ISO date) Calls `this.editTask()` to remove scheduling.

### `async editTask(context: MarkdownView, line: number, modification: 'now' | 'today' | 'tomorrow' | 'next-week' | 'unschedule')`

*   Calculates the new `scheduled` date/time string based on the `modification` type.
    *   'now': Current time, rounded.
    *   'today': Current date (time part removed).
    *   'tomorrow': Tomorrow's date.
    *   'next-week': Date one week from now.
    *   'unschedule': Empty string.
*   Uses `setters.patchTasks()` (from the Zustand store) to update the task's `scheduled` property. This will trigger persistence via `ObsidianAPI.saveTask()`.

### Settings Management

*   **`async loadSettings()`**: Merges `DEFAULT_SETTINGS` with any settings saved in `this.loadData()`. The result is stored in `this.settings`.
*   **`saveSettings()`**: Saves the current `this.settings` object using `this.saveData()`. This method is typically passed to the `SettingsTab` and other services (like `ObsidianAPI`) that need to modify settings.

## Interactions

*   **Obsidian `Plugin` API**: Extends `Plugin`, uses `this.app`, `this.manifest`, `this.registerView`, `this.addCommand`, `this.addRibbonIcon`, `this.addSettingTab`, `this.loadData`, `this.saveData`.
*   **`SettingsTab.tsx`**: Instantiates and registers the settings tab UI.
*   **`TimeRulerView` (likely `src/index.tsx` or `src/components/App.tsx`)**: The main UI component registered as the custom view. The plugin passes itself (`this`) to the view, allowing the view to access plugin settings and methods.
*   **`obsidian-dataview`**: Explicitly checks for and uses the Dataview API (`getAPI()`).
*   **`src/app/store.ts` (`setters`, `getters`)**:
    *   `editTask` uses `setters.patchTasks` to update task data.
*   **`src/services/obsidianApi.ts`**:
    *   `jumpToTask` uses `openTaskInRuler()`.
    *   The `ObsidianAPI` class instance is created and managed (likely initialized and stored in the Zustand store, then accessed via `getters` when needed by the plugin methods, or plugin methods pass necessary parts of `this.settings` or `this.app` to it).
*   **`src/services/util.ts`**: Uses `roundMinutes`, `toISO`.

The `TimeRulerPlugin` class is the central hub that wires together all parts of the plugin, from UI registration and command handling to settings persistence and core feature invocation.

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

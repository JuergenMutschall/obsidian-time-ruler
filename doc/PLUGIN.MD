# Time Ruler Plugin Core (`src/main.ts`)

This document details the core functionality of the Time Ruler plugin, primarily managed through the `TimeRulerPlugin` class in `src/main.ts`. It covers the plugin's lifecycle, registration of views, settings, commands, and its interaction with the Obsidian API.

## Plugin Class: `TimeRulerPlugin`

The main class `TimeRulerPlugin` extends `Plugin` from the `obsidian` API. It serves as the entry point and central coordinator for the plugin's features.

```typescript
export default class TimeRulerPlugin extends Plugin {
  settings: TimeRulerSettings;

  constructor(app: App, manifest: any) {
    super(app, manifest);
    this.saveSettings = this.saveSettings.bind(this); // Binding saveSettings to ensure correct 'this' context
  }

  // ... lifecycle methods and other functionalities
}
```

Key responsibilities:
- Managing plugin settings (`TimeRulerSettings`).
- Setting up UI elements like views and settings tabs.
- Registering commands for user interaction.
- Handling plugin lifecycle events (`onload`, `onunload`).

## Plugin Settings

-   **`TimeRulerSettings` (Type):** Defines the structure for all settings used by the plugin. This includes calendar configurations, display preferences (like 24-hour format), task filtering options, etc.
-   **`DEFAULT_SETTINGS` (Constant):** Provides the default values for all settings when the plugin is first loaded or when settings are reset.
-   **`loadSettings()`:** An `async` method called during `onload`. It loads settings from Obsidian's storage using `this.loadData()` and merges them with `DEFAULT_SETTINGS`.
    ```typescript
    async loadSettings() {
      this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
    }
    ```
-   **`saveSettings()`:** A method responsible for persisting the current state of `this.settings` to Obsidian's storage using `this.saveData()`. This method is also bound in the constructor and passed to child components like `SettingsTab` and `ObsidianAPI` to allow them to trigger settings persistence.
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
- Calls `setters.patchTasks([id], { scheduled })` to update the task in the store and persist it via `ObsidianAPI`.

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
-   **Dataview Integration:** `getAPI(this.app)` from `'obsidian-dataview'` is used to interact with the Dataview plugin, primarily for task querying (though the direct query logic is in `ObsidianAPI`).

The plugin encapsulates most direct Obsidian API interactions related to its core setup and features within `src/main.ts`. Other services, like `ObsidianAPI` in `src/services/obsidianApi.ts`, handle more specific interactions like file system operations and detailed Dataview queries.

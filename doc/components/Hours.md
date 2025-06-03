# Hours Component (`src/components/Hours.tsx`)

## Purpose

The `Hours` component is responsible for rendering the main time-gridded section of a day in the Time Ruler UI. It takes a series of `BlockProps` (representing scheduled tasks or events) and arranges them chronologically. Between these blocks, it can render `Minutes` components to represent the empty time slots, if times are not hidden by settings. It also handles the logic for extending block durations to fill empty space and processing nested blocks.

## Props

*   **`startISO`** (`string`): The ISO string representation of the start time for the entire span this `Hours` component covers.
*   **`endISO`** (`string`): The ISO string representation of the end time for the entire span.
*   **`blocks`** (`BlockProps[]`): An array of `BlockProps` objects. Each `BlockProps` typically contains tasks and/or events scheduled at a specific time (`block.startISO`). These are expected to be roughly sorted by `startISO`.
*   **`chopStart`** (optional, `boolean`): A flag passed down to the first `Minutes` component. If true, the visual representation of the first time slot might be "chopped" or shortened. Defaults to `false`.
*   **`dragContainer`** (optional, `string`): An identifier for the drag context, passed down from parent components (e.g., `Day.tsx`) and further extended for child `Block` and `Minutes` components. Defaults to `''`.
*   **`noExtension`** (optional, `boolean`): Although present in the props definition, this prop is not actually used in the component's logic as shown in the provided code snippet. It might be a remnant or intended for future use.

## State (managed via `useAppStore` and derived locally)

*   **`extendBlocks`**: Global state from `useAppStore(state => state.settings.extendBlocks)`. If true, blocks that have the same start and end time (i.e., no explicit duration) will have their `endISO` extended to the `startISO` of the next block or the overall `endISO` of the `Hours` component.
*   **`hideTimes`**: Global state from `useAppStore(state => state.settings.hideTimes || state.settings.viewMode === 'week')`. If true, the `Minutes` components (visual time rulers) between blocks are not rendered.
*   **`formattedBlocks`**: Local variable (`BlockProps[]`). This is a processed version of the input `blocks` prop. The processing involves:
    *   **Nesting**: It iterates through the input `blocks`. If subsequent blocks have a `startISO` that falls *before* the `endISO` of the current block (calculated by `getEndISO`), they are considered nested and moved into the `blocks` array of the current `formattedBlock`.
    *   **Extension**: If `extendBlocks` is true and a block's original `endISO` (from `getEndISO`) is the same as its `startISO`, its `endISO` is updated to be the `startISO` of the *next* processed block in the `formattedBlocks` array, or the overall `endISO` of the `Hours` component if it's the last block.

## Functionality

### Block Processing (`formattedBlocks`):

1.  **Initialization**: An empty `formattedBlocks` array is created.
2.  **Iteration and Nesting**: The component iterates through the input `blocks` array.
    *   For each `thisBlock`, it calculates its effective `thisEndISO` using `getEndISO(thisBlock)`.
    *   It then checks subsequent blocks (`blocks[i + 1]`). If a subsequent block's `startISO` is earlier than `thisEndISO`, it's considered a nested block. These nested blocks are collected into a `nestedBlocks` array and the main loop index `i` is advanced past them.
3.  **End Time Extension**:
    *   When adding `thisBlock` to `formattedBlocks`, its `endISO` is determined. If `extendBlocks` is true and the block's original duration is zero (i.e., `thisEndISO === thisBlock.startISO`), its `endISO` is set to the `startISO` of the *next* block in the input `blocks` array (i.e., `blocks[i + 1]?.startISO`) or, if it's effectively the last block, to the overall `endISO` of the `Hours` component. Otherwise, the calculated `thisEndISO` is used.
    *   The collected `nestedBlocks` are assigned to the `blocks` property of the current `formattedBlock`.

### Rendering:

1.  **Outer Container**: A `div` with class `pb-1 relative`. If `hideTimes` is true, `space-y-1` is added for spacing between blocks.
2.  **Initial `Minutes` Component**:
    *   If `hideTimes` is false, a `Minutes` component is rendered *before* the first block.
    *   Its `startISO` is the overall `startISO` of the `Hours` component.
    *   Its `endISO` is the `startISO` of the first `formattedBlock` (or the overall `endISO` if there are no blocks).
    *   `chopStart` is passed through, or set to true if the `Hours` `startISO` is the same as the first block's `startISO`.
3.  **Iterating through `formattedBlocks`**:
    *   For each processed `block` in `formattedBlocks`:
        *   A `Block` component is rendered with the `blockStartISO`, `blockEndISO`, `tasks`, `events`, and nested `blocks` from the current `formattedBlock`. Its `type` is hardcoded to `'event'` (this might be a simplification or an indication that `Hours` primarily deals with event-like blocks at its top level of rendering, with further type distinctions handled within the `Block` itself).
        *   If `hideTimes` is false, a `Minutes` component is rendered *after* this `Block`.
            *   Its `startISO` is the `blockEndISO` of the current block.
            *   Its `endISO` is the `startISO` of the *next* `formattedBlock` (or the overall `endISO` if it's the last block).
            *   `chopStart` is true if the current block's `startISO` and `blockEndISO` are the same (i.e., it's an instantaneous event before potential extension).

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`useAppStore`)**:
    *   Reads `settings.extendBlocks` and `settings.hideTimes`, `settings.viewMode`.
*   **`src/services/util.ts` (`getEndISO`)**:
    *   Uses `getEndISO` to determine the effective end time of a block, considering its tasks and events, which is crucial for the nesting and extension logic.
*   **Child Components**:
    *   `Block`: Renders each processed (potentially nested and extended) block of tasks/events.
    *   `Minutes`: Renders the visual time ruler segments between blocks if times are not hidden.
*   **Parent Components**:
    *   Typically rendered by `Day.tsx` to display the main scheduled items for a day.

The `Hours` component plays a crucial role in laying out the timed sections of the day, handling complex scenarios like overlapping or instantaneous events, and ensuring that the visual representation of time is consistent with user settings.

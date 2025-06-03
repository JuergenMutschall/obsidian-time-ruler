# Logo Component (`src/components/Logo.tsx`)

## Purpose

The `Logo` component is a simple React component designed to render icons using Obsidian's built-in `setIcon` utility. It provides a wrapper `div` that is then populated with an SVG icon by Obsidian's API. This ensures consistency with Obsidian's native icon styling and allows usage of any icon available in Obsidian's icon set.

## Props

*   **`src`** (`string`): This is the primary prop, representing the name/identifier of the icon to be displayed (e.g., "plus", "trash", "chevron-right"). This identifier is passed directly to Obsidian's `setIcon` function.
*   **`className`** (optional, `string`): Additional CSS classes to be applied to the wrapper `div`. Defaults to `''`.
    *   The component automatically adds `flex select-none flex-col items-center justify-center`.
    *   It also conditionally adds `h-full` if `className` does not include a height utility (e.g., `h-6`) and `w-full` if `className` does not include a width utility (e.g., `w-6`), effectively making the icon try to fill its container by default if specific dimensions aren't provided.
*   **`title`** (optional, `string`): Although this prop is defined, it is not directly used by the `Logo` component itself in the provided code (e.g., not set as an HTML attribute on the div). It might be intended for parent components to use or for future accessibility enhancements. Defaults to `''`.

## Functionality

*   **Icon Rendering**:
    *   It uses a `div` element as a container for the icon.
    *   A `useRef` (`frame`) is attached to this `div`.
    *   The `useLayoutEffect` hook is used to call Obsidian's `setIcon(frame.current, src)` function whenever the `src` prop changes (or on initial render).
        *   `invariant(frame.current)` ensures that the ref is attached before `setIcon` is called.
        *   `setIcon` dynamically adds the SVG icon content inside the referenced `div`.
*   **Styling**:
    *   The wrapper `div` has base classes: `flex select-none flex-col items-center justify-center` to center the icon.
    *   It intelligently adds `h-full` and `w-full` if the provided `className` doesn't already specify height or width, allowing the icon to adapt to its container size or have explicit dimensions.

## State

The `Logo` component is stateless itself. Its visual output is determined by its props (primarily `src` and `className`) and the behavior of Obsidian's `setIcon` function.

## Interactions with Other Components and Services

*   **Obsidian API (`setIcon`)**: This is the core interaction. The component relies entirely on `obsidian.setIcon` to render the actual icon graphic.
*   **Parent Components**: It's used by other components (like `Button.tsx`) that need to display icons. The parent component provides the `src` (icon name) and any necessary `className` for styling and sizing.

## Usage Example

```tsx
// To render a "plus" icon that fills its container
<Logo src="plus" />

// To render a "trash" icon with a specific size and custom class
<Logo src="trash" className="h-5 w-5 text-red-500" />
```

This component acts as a bridge between React-based components and Obsidian's imperative `setIcon` API, making it easy to use Obsidian's native icons within the plugin's UI.

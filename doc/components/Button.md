# Button Component (`src/components/Button.tsx`)

## Purpose

The `Button` component is a general-purpose, reusable UI component that provides a consistent look and feel for clickable elements throughout the Time Ruler plugin. It can display either an icon (via the `Logo` component) or textual content.

## Props

The component accepts standard HTML button attributes (forwarded via `...rest`) along with its own specific props:

*   **`className`** (optional, `string`): Allows for additional CSS classes to be applied to the root `div` element for custom styling.
*   **`src`** (optional, `string`): If provided, this string is passed to the `Logo` component to render an icon within the button. The `Logo` component likely maps this string to a specific SVG icon.
*   **`children`** (optional, `React.ReactNode`): If `src` is not provided, the `children` prop will be rendered inside the button. This allows for text content or other React elements to be used as the button's content.
*   **`ref`**: The component uses `forwardRef` to forward a ref to the underlying `div` element. This allows parent components to get a direct reference to the DOM element if needed.
*   All other standard HTML attributes applicable to a `div` element (like `onClick`, `onPointerDown`, `title`, `style`, etc.) can be passed and will be applied to the root `div`.

## Functionality

*   **Rendering**:
    *   Renders a `div` element with base styling: `transition-colors duration-300 clickable-icon whitespace-nowrap font-menu text-sm`.
        *   `clickable-icon`: This class likely provides styles to make the div behave like a button (e.g., cursor, hover effects).
        *   `whitespace-nowrap`: Prevents text content from wrapping.
        *   `font-menu text-sm`: Applies specific font styling.
        *   `transition-colors duration-300`: Adds a smooth transition effect for color changes (e.g., on hover).
    *   If the `src` prop is provided, it renders the `Logo` component, passing the `src` value to it. This is used for icon-based buttons.
    *   If `src` is not provided, it renders the `children` prop. If neither `src` nor `children` are provided, it renders `null`.
*   **Event Handling**: Standard HTML event handlers (e.g., `onClick`) can be passed as props and will be attached to the root `div` element.

## State

The `Button` component is stateless itself. Its behavior and appearance are controlled entirely by its props.

## Interactions with Other Components and Services

*   **`Logo` Component (`./Logo.tsx`)**: If the `src` prop is used, the `Button` component instantiates and renders the `Logo` component to display an icon.
*   It does not directly interact with other services or global state stores. It's a presentational component.

## Usage Example

```tsx
// Icon button
<Button src="plus" onClick={() => console.log('Add clicked')} title="Add" />

// Text button
<Button onClick={() => console.log('Submit clicked')} className="custom-class">
  Submit
</Button>
```

This component serves as a fundamental UI primitive within the plugin, ensuring consistency for interactive elements.

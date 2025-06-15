import { forwardRef } from 'react'
import Logo from './Logo'

const Button = forwardRef<
  HTMLDivElement,
  {
    className?: string
    src?: string
  } & React.ButtonHTMLAttributes<HTMLElement>
>(({ className, src, children, ...rest }, ref) => {
  const plugin = app.plugins.plugins['time-ruler'];
  const buttonColors = plugin?.settings?.buttonColors;
  const dynamicStyles: React.CSSProperties = {};

  if (buttonColors?.backgroundColor) {
    dynamicStyles.backgroundColor = buttonColors.backgroundColor;
  }
  if (buttonColors?.textColor) {
    dynamicStyles.color = buttonColors.textColor;
  }
  if (buttonColors?.borderColor) {
    dynamicStyles.borderColor = buttonColors.borderColor;
    dynamicStyles.borderWidth = '1px';
    dynamicStyles.borderStyle = 'solid';
  }
  // Note: If you want to explicitly remove border if no color is set,
  // you might add an else condition here to set borderStyle to 'none'.
  // For now, we'll let the theme's default border apply if not specified.

  // Override CSS variables for hover and active states
  if (buttonColors?.hoverBackgroundColor) {
    dynamicStyles['--interactive-hover'] = buttonColors.hoverBackgroundColor;
  }
  if (buttonColors?.activeBackgroundColor) {
    dynamicStyles['--interactive-active'] = buttonColors.activeBackgroundColor;
  }

  return (
    <div
      className={`transition-colors duration-300 clickable-icon theme-interactive-normal hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] whitespace-nowrap font-menu text-sm ${className}`}
      style={dynamicStyles} // Apply the dynamic styles here
      {...rest}
      ref={ref}
    >
      {src ? <Logo src={src} /> : children ?? null}
    </div>
  )
})

export default Button

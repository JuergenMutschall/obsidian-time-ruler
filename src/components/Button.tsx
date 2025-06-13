import { forwardRef } from 'react'
import Logo from './Logo'

const Button = forwardRef<
  HTMLDivElement,
  {
    className?: string
    src?: string
  } & React.ButtonHTMLAttributes<HTMLElement>
>(({ className, src, children, ...rest }, ref) => {
  return (
    <div
      className={`transition-colors duration-300 clickable-icon theme-interactive-normal hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] whitespace-nowrap font-menu text-sm ${className}`}
      {...rest}
      ref={ref}
    >
      {src ? <Logo src={src} /> : children ?? null}
    </div>
  )
})

export default Button

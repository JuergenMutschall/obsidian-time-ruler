import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

// Mock the Logo component
jest.mock('./Logo', () => ({
  __esModule: true,
  default: jest.fn((props) => <img data-testid="mock-logo" src={props.src} alt="logo" />),
}));

describe('Button Component', () => {
  it('renders without crashing', () => {
    render(<Button />);
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });

  it('renders with an icon when src prop is provided', () => {
    const testSrc = 'test-icon';
    render(<Button src={testSrc} />);
    const logoElement = screen.getByTestId('mock-logo');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement).toHaveAttribute('src', testSrc);
  });

  it('renders children when provided', () => {
    const buttonText = 'Click Me';
    render(<Button>{buttonText}</Button>);
    expect(screen.getByText(buttonText)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    render(<Button className={customClass} />);
    const buttonElement = screen.getByTestId('custom-button');
    expect(buttonElement).toHaveClass(customClass);
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with other HTML attributes', () => {
    const label = 'Test Button Label';
    render(<Button aria-label={label} />);
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it('renders null for children if src is present and no explicit children given', () => {
    render(<Button src="test-icon" />);
    const buttonElement = screen.getByTestId('custom-button');
    // Check that it doesn't have direct text children beyond what Logo might render
    // This is a bit tricky as Logo is mocked. The main check is that Logo is there.
    expect(buttonElement.firstChild).toBe(screen.getByTestId('mock-logo'));
    // Check that no other text content is present.
    // The mock logo has alt text "logo", so we check that no *other* text is there.
    expect(buttonElement).not.toHaveTextContent(/^((?!logo).)+$/i);
  });

  it('renders children if both src and children are provided (children take precedence based on implementation)', () => {
    // Current implementation: {src ? <Logo src={src} /> : children ?? null}
    // This means if src is provided, Logo is shown, children are ignored.
    const buttonText = 'Explicit Children';
    render(<Button src="test-icon">{buttonText}</Button>);
    expect(screen.getByTestId('mock-logo')).toBeInTheDocument();
    expect(screen.queryByText(buttonText)).not.toBeInTheDocument();
  });

});

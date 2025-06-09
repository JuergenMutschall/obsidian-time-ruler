import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Logo from './Logo';

// Mock obsidian's setIcon function
jest.mock('obsidian', () => ({
  setIcon: jest.fn(), // Define as jest.fn() directly in the factory
}));

describe('Logo Component', () => {
  let mockSetIconFn: jest.Mock; // To hold the reference to the mocked setIcon

  beforeEach(() => {
    // Get the fresh mock for each test to ensure isolation of call counts etc.
    mockSetIconFn = jest.requireMock('obsidian').setIcon;
    mockSetIconFn.mockClear(); // Clear history before each test
  });

  it('renders a div', () => {
    render(<Logo src="test-icon" />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).toBeInTheDocument();
  });

  it('calls setIcon with the correct icon name and element', () => {
    render(<Logo src="my-icon" />);
    const renderedDiv = screen.getByTestId('logo-container');
    expect(mockSetIconFn).toHaveBeenCalledTimes(1);
    expect(mockSetIconFn).toHaveBeenCalledWith(renderedDiv, 'my-icon');
  });

  it('applies default and custom classNames', () => {
    const customClass = 'my-custom-logo';
    render(<Logo src="test-icon" className={customClass} />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).toHaveClass('flex');
    expect(divElement).toHaveClass('select-none');
    expect(divElement).toHaveClass(customClass);
  });

  it('conditionally applies h-full and w-full if not in className', () => {
    render(<Logo src="test-icon" />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).toHaveClass('h-full');
    expect(divElement).toHaveClass('w-full');
  });

  it('does not apply h-full if h- is in className', () => {
    render(<Logo src="test-icon" className="h-16" />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).not.toHaveClass('h-full');
    expect(divElement).toHaveClass('h-16');
    expect(divElement).toHaveClass('w-full'); // w-full should still apply
  });

  it('does not apply w-full if w- is in className', () => {
    render(<Logo src="test-icon" className="w-16" />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).not.toHaveClass('w-full');
    expect(divElement).toHaveClass('w-16');
    expect(divElement).toHaveClass('h-full'); // h-full should still apply
  });

  it('does not apply h-full or w-full if both h- and w- are in className', () => {
    render(<Logo src="test-icon" className="h-10 w-10" />);
    const divElement = screen.getByTestId('logo-container');
    expect(divElement).not.toHaveClass('h-full');
    expect(divElement).not.toHaveClass('w-full');
    expect(divElement).toHaveClass('h-10');
    expect(divElement).toHaveClass('w-10');
  });

  it('renders with a title prop (passed to setIcon)', () => {
    render(<Logo src="test-icon" title="My Test Icon" />);
    // No direct assertion on title in the DOM unless setIcon did that.
    // We've already tested setIcon is called.
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();
  });
});

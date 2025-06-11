import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCheckbox from '../../components/TaskCheckbox'; // Adjust path

// Since Button is a simple div wrapper, direct import is fine.
// If Button had complex logic/side effects, mocking would be more relevant.
// import Button from './Button';

describe('TaskCheckbox Component', () => {
  const mockOnComplete = jest.fn();
  const defaultProps = {
    completed: false,
    status: ' ',
    isLink: false,
    isMobile: false,
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  test('renders correctly with default props', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-transparent'); // Not completed
    // For an empty status ' ', the button has no text content.
    // If it rendered &nbsp; or similar, this would need adjustment.
    // The component renders props.status, which is ' ' here.
    // getByText(' ') might be too broad. Let's check its direct child.
    expect(buttonElement?.textContent).toBe(' ');
  });

  test('displays status character correctly', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} status="-" />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement?.textContent).toBe('-');
    expect(screen.getByText('-')).toBeInTheDocument(); // More direct
  });

  test('does not display status character for "x" (completed look)', () => {
    // The component renders <></> if status is 'x'
    const { container } = render(<TaskCheckbox {...defaultProps} status="x" />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement?.textContent).toBe('');
    expect(screen.queryByText('x')).not.toBeInTheDocument();
  });

  test('applies correct classes when completed', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} completed={true} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).toHaveClass('bg-faint');
  });

  test('calls onComplete when clicked', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).not.toBeNull();
    if (buttonElement) {
        fireEvent.click(buttonElement);
    }
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  test('applies correct size class for isLink', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} isLink={true} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).toHaveClass('h-2', 'w-2');
  });

  test('applies correct size class for isMobile and not isLink', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} isMobile={true} isLink={false} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).toHaveClass('h-5', 'w-5');
  });

  test('applies default size class when not isLink and not isMobile', () => {
    const { container } = render(<TaskCheckbox {...defaultProps} isLink={false} isMobile={false} />);
    const buttonElement = container.querySelector('.task-list-item-checkbox');
    expect(buttonElement).toHaveClass('h-4', 'w-4');
  });
});

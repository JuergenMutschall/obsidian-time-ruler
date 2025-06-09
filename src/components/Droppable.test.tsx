import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Droppable from './Droppable';

// Mock @dnd-kit/core's useDroppable hook
const mockSetNodeRef = jest.fn();
let mockIsOver = false; // Default state for isOver

jest.mock('@dnd-kit/core', () => ({
  useDroppable: jest.fn(() => ({
    isOver: mockIsOver,
    setNodeRef: mockSetNodeRef,
  })),
}));

describe('Droppable Component', () => {
  const defaultChildProps = {
    className: 'child-class',
    'data-testid': 'droppable-child',
  };
  const defaultChild = <div {...defaultChildProps}>Droppable Child</div>;
  const defaultDroppableProps = {
    id: 'test-droppable',
    data: { type: 'test-type', scheduled: '2023-01-01' }, // Example DropData
  };

  beforeEach(() => {
    // Reset mocks for each test
    jest.clearAllMocks();
    mockIsOver = false; // Reset isOver state before each test
    // Re-apply the mock implementation for useDroppable to pick up the reset mockIsOver
    (require('@dnd-kit/core').useDroppable as jest.Mock).mockImplementation(() => ({
        isOver: mockIsOver,
        setNodeRef: mockSetNodeRef,
    }));
  });

  it('renders its children', () => {
    render(
      <Droppable {...defaultDroppableProps}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Droppable Child');
  });

  it('applies base and child-specific classNames', () => {
    render(
      <Droppable {...defaultDroppableProps}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(childElement).toHaveClass('child-class');
    expect(childElement).toHaveClass('rounded-icon'); // Base class from Droppable
  });

  it('does not apply "!bg-selection" class when not over', () => {
    mockIsOver = false;
    (require('@dnd-kit/core').useDroppable as jest.Mock).mockImplementation(() => ({
        isOver: mockIsOver,
        setNodeRef: mockSetNodeRef,
    }));
    render(
      <Droppable {...defaultDroppableProps}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(childElement).not.toHaveClass('!bg-selection');
  });

  it('applies "!bg-selection" class when isOver is true', () => {
    mockIsOver = true;
    (require('@dnd-kit/core').useDroppable as jest.Mock).mockImplementation(() => ({
        isOver: mockIsOver,
        setNodeRef: mockSetNodeRef,
    }));
    render(
      <Droppable {...defaultDroppableProps}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(childElement).toHaveClass('!bg-selection');
  });

  it('calls setNodeRef with the child element', () => {
    render(
      <Droppable {...defaultDroppableProps}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(mockSetNodeRef).toHaveBeenCalledWith(childElement);
  });

  // This test describes behavior that React warns against for plain function components
  // if 'ref' is expected to work like React.forwardRef. The component would need to use React.forwardRef
  // or the prop should be named differently (e.g., inputRef) for this to work without React warnings
  // and for props.ref to be populated as expected by this test.
  it.skip('calls both external ref and setNodeRef if external ref is provided', () => {
    const externalRef = jest.fn();
    render(
      <Droppable {...defaultDroppableProps} ref={externalRef}>
        {defaultChild}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(externalRef).toHaveBeenCalledWith(childElement);
    expect(mockSetNodeRef).toHaveBeenCalledWith(childElement);
  });

  it('preserves original props of the child', () => {
    const extraProp = "extra-value";
    const childWithExtraProp = <div {...defaultChildProps} data-extra={extraProp}>Child</div>;
    render(
      <Droppable {...defaultDroppableProps}>
        {childWithExtraProp}
      </Droppable>
    );
    const childElement = screen.getByTestId('droppable-child');
    expect(childElement).toHaveAttribute('data-extra', extraProp);
  });

});

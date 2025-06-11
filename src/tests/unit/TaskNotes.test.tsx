import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskNotes from '../../components/TaskNotes'; // Adjust path if necessary

describe('TaskNotes Component', () => {
  const defaultProps = {
    notes: 'This is a test note.',
    isLink: false,
  };

  test('renders notes when provided and not a link', () => {
    render(<TaskNotes {...defaultProps} />);
    expect(screen.getByText('This is a test note.')).toBeInTheDocument();
    // Check for the specific class
    expect(screen.getByText('This is a test note.')).toHaveClass('task-description');
  });

  test('renders nothing if notes is null', () => {
    const { container } = render(<TaskNotes {...defaultProps} notes={null} />);
    // When component returns null, container.firstChild should be null
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('This is a test note.')).not.toBeInTheDocument();
  });

  test('renders nothing if notes is undefined', () => {
    const { container } = render(<TaskNotes {...defaultProps} notes={undefined} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('This is a test note.')).not.toBeInTheDocument();
  });

  test('renders nothing if isLink is true', () => {
    const { container } = render(<TaskNotes {...defaultProps} isLink={true} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('This is a test note.')).not.toBeInTheDocument();
  });
});

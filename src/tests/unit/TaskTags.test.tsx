import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskTags from '../../components/TaskTags'; // Adjust path if necessary, assuming it's in the same folder for now or ./TaskTags if tests are in components folder

describe('TaskTags Component', () => {
  const defaultProps = {
    tags: [],
    groupBy: false as const, // Type assertion for default
  };

  test('renders nothing if tags array is empty', () => {
    const { container } = render(<TaskTags {...defaultProps} tags={[]} />);
    // Check if the main div container for tags is absent or empty
    // The component returns null, so the container itself (if queried specifically) might exist but be empty.
    // A more direct check is if any tag-specific elements are present.
    expect(container.querySelector('.cm-hashtag')).toBeNull();
  });

  test('renders nothing if groupBy is "tags"', () => {
    const { container } = render(<TaskTags {...defaultProps} tags={['#tag1']} groupBy="tags" />);
    expect(container.querySelector('.cm-hashtag')).toBeNull();
  });

  test('renders tags correctly', () => {
    const tags = ['#tag1', '#tag2', '#another-tag'];
    render(<TaskTags {...defaultProps} tags={tags} groupBy={false} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('another-tag')).toBeInTheDocument();
  });

  test('does not render a specific tag if it is not provided', () => {
    const tags = ['#tag1'];
    render(<TaskTags {...defaultProps} tags={tags} groupBy={false} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.queryByText('tag2')).not.toBeInTheDocument();
  });

  test('renders correct number of tags', () => {
    const tags = ['#tag1', '#tag2', '#tag3'];
    const { container } = render(<TaskTags {...defaultProps} tags={tags} groupBy={false} />);
    const tagElements = container.querySelectorAll('.cm-hashtag');
    expect(tagElements.length).toBe(3);
  });
});

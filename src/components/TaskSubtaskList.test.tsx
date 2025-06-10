import React from 'react';
import { render } from '@testing-library/react';
import TaskSubtaskList from './TaskSubtaskList';

describe('TaskSubtaskList', () => {
  it('renders without crashing', () => {
    render(<TaskSubtaskList subtasks={[]} />);
  });
});

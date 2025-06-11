import React from 'react';
import { render } from '@testing-library/react';
import TaskSubtaskList from '../../components/TaskSubtaskList';

describe('TaskSubtaskList', () => {
  it('renders without crashing', () => {
    render(<TaskSubtaskList subtasks={[]} />);
  });
});

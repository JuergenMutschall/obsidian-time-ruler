import React from 'react';
import { render } from '@testing-library/react';
import TaskTitle from './TaskTitle';

describe('TaskTitle', () => {
  it('renders without crashing', () => {
    render(<TaskTitle title="Test Title" />);
  });
});

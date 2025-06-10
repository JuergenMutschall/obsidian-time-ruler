import React from 'react';
import { render } from '@testing-library/react';
import TimelineView from './TimelineView';

describe('TimelineView', () => {
  it('renders without crashing', () => {
    render(<TimelineView tasks={[]} />);
  });
});

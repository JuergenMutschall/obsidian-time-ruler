import React from 'react';
import { render } from '@testing-library/react';
import TimeRulerHeader from './TimeRulerHeader';

describe('TimeRulerHeader', () => {
  it('renders without crashing', () => {
    render(<TimeRulerHeader />);
  });
});

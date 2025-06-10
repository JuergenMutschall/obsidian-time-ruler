import React from 'react';
import { render } from '@testing-library/react';
import Unscheduled from './Unscheduled';

describe('Unscheduled', () => {
  it('renders without crashing', () => {
    render(<Unscheduled />);
  });
});

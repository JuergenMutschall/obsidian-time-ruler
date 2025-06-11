import React from 'react';
import { render } from '@testing-library/react';
import Unscheduled from '../../components/Unscheduled';

describe('Unscheduled', () => {
  it('renders without crashing', () => {
    render(<Unscheduled />);
  });
});

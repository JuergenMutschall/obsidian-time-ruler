import React from 'react';
import { render } from '@testing-library/react';
import { Timer } from './Timer';

describe('Timer', () => {
  it('renders without crashing', () => {
    render(<Timer />);
  });
});

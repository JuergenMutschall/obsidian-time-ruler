import React from 'react';
import { render } from '@testing-library/react';
import Toggle from '../../components/Toggle';

describe('Toggle', () => {
  it('renders without crashing', () => {
    render(<Toggle />);
  });
});

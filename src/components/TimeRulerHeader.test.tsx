import React from 'react';
import { render } from '@testing-library/react';
import TimeRulerHeader from './TimeRulerHeader';

// Mock the store
jest.mock('../app/store', () => ({
  useAppStore: jest.fn((selector) => selector({
    settings: {
      viewMode: 'day', // Default view mode
      hideTimes: false, // Default hideTimes
    },
    // Add other state properties if needed by the component
  })),
  getters: {
    getObsidianAPI: jest.fn(() => ({
      setSetting: jest.fn(),
    })),
    getApp: jest.fn(() => ({
      isMobile: false,
    })),
    // Mock the 'get' function used by util.ts -> getStartDate -> getToday
    get: jest.fn((key) => {
      if (key === 'settings') {
        return { dayStartEnd: [0, 24] }; // Provide default dayStartEnd
      }
      return undefined;
    }),
  },
  setters: {
    set: jest.fn(),
    // Add other setters if needed
  },
}));

describe('TimeRulerHeader', () => {
  const defaultProps = {
    times: [],
    weeksShownState: 0,
    setWeeksShown: jest.fn(),
    setupStore: jest.fn(),
    showingPastDates: false,
    datesShown: 7,
    timelineViewRef: React.createRef(), // Pass a ref
  };

  it('renders without crashing', () => {
    render(<TimeRulerHeader {...defaultProps} />);
  });
});

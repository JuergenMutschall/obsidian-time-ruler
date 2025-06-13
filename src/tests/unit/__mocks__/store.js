// src/tests/unit/__mocks__/store.js

const mockGettersValues = {
  searchWithinWeeks: 0, // Default mock value
  showingPastDates: 'all', // Default mock value
  // Add other keys as needed by tests
};

const getters = {
  get: jest.fn((key) => {
    if (key in mockGettersValues) {
      return mockGettersValues[key];
    }
    // Return undefined or a default mock for keys not explicitly set
    console.warn(`[store.js mock] getters.get called with unmocked key: ${key}`);
    return undefined;
  }),
  // Mock other potential functions in 'getters' if any
};

const setters = {
  set: jest.fn((key, value) => {
    // Optional: could also update mockGettersValues if that behavior is desired
    // console.log(`[store.js mock] setters.set called with key: ${key}, value: ${value}`);
  }),
  // Mock other potential functions in 'setters' if any
};

// Helper function for tests to set values for getters.get
const setMockGetter = (key, value) => {
  mockGettersValues[key] = value;
};

// Helper function to reset all mock getter values to defaults or clear them
const resetMockGetters = () => {
  // Example: Reset to initial default values
  mockGettersValues.searchWithinWeeks = 0;
  mockGettersValues.showingPastDates = 'all';
  // Or clear all keys:
  // Object.keys(mockGettersValues).forEach(key => delete mockGettersValues[key]);
};

module.exports = {
  getters,
  setters,
  setMockGetter,
  resetMockGetters,
  // Mock other potential top-level exports from 'src/app/store'
  // e.g., someAction: jest.fn(),
};

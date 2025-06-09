module.exports = {
  getAPI: jest.fn(() => ({
    index: {
      initialized: true, // Changed to true
      // Potentially add other mock methods/properties if needed later
      // For example, if App.tsx's reload tried to access dv.index.pages
      // pages: jest.fn(() => [])
    },
    // Add other Dataview API mocks if necessary
  })),
};

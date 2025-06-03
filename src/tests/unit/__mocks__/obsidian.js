// src/tests/unit/__mocks__/obsidian.js
module.exports = {
  setIcon: jest.fn(),
  Platform: {
    isMobile: false, // Default mock value
  },
  // Add other exports as needed by your components, e.g.:
  // Notice: jest.fn(),
  // MarkdownView: jest.fn(),
  // Plugin: class Plugin {},
  // App: jest.fn(() => ({
  //   workspace: {
  //     getActiveViewOfType: jest.fn()
  //   }
  // }))
};

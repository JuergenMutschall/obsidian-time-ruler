// src/tests/unit/__mocks__/obsidian.js
module.exports = {
  setIcon: jest.fn(),
  Platform: {
    isMobile: false, // Default mock value
  },
  request: jest.fn(),
  Component: class { constructor() { this.load = jest.fn(); this.unload = jest.fn(); } },
  Notice: jest.fn(),
  TFile: class {},
  MarkdownView: class {},
  App: jest.fn(() => ({
    workspace: {
      getActiveViewOfType: jest.fn(),
      on: jest.fn(), // For layout-change, resize events
      openLinkText: jest.fn(),
    },
    metadataCache: {
      on: jest.fn(), // For dataview:metadata-change
      getCache: jest.fn(),
    },
    vault: {
      read: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getConfig: jest.fn().mockReturnValue({}), // Default to empty config
      readConfigJson: jest.fn().mockResolvedValue({}), // For daily-notes
      process: jest.fn(), // For createNewTask -> findPosition -> app.vault.process
    },
    fileManager: {
      processFrontMatter: jest.fn(),
    },
    // Add any other app properties/methods as needed
  })),
  // Add other exports as needed by your components
};

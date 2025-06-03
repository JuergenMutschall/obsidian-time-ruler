// src/tests/unit/__mocks__/store.js
export const getters = {
  get: jest.fn(),
  getObsidianAPI: jest.fn(() => ({
    deleteTasks: jest.fn().mockResolvedValue(undefined),
    saveTask: jest.fn().mockResolvedValue(undefined),
    createTaskInPath: jest.fn().mockResolvedValue(undefined),
    // Add other ObsidianAPI methods if they get called directly via getters.getObsidianAPI()
  })),
  getTask: jest.fn(), // Specifically for openTaskInRuler
};

export const setters = {
  set: jest.fn(),
  patchTasks: jest.fn().mockResolvedValue(undefined),
  updateFileOrder: jest.fn(),
  // Add other setters if needed
};

export const useAppStore = jest.fn();
export const useAppStoreRef = jest.fn();

// You might need to mock the actual store structure if it's accessed directly,
// but for now, focusing on getters and setters.
export default {
  getters,
  setters,
  useAppStore,
  useAppStoreRef
};

// src/tests/unit/__mocks__/obsidian-dataview.js
export const getAPI = jest.fn(() => ({
  pages: jest.fn().mockReturnThis(), // chainable
  where: jest.fn().mockReturnThis(), // chainable
  file: {
    tasks: {
      where: jest.fn().mockReturnThis(), // chainable
      map: jest.fn().mockReturnValue([]), // ends chain
    }
  },
  map: jest.fn().mockReturnValue([]), // ends chain
  array: jest.fn().mockReturnValue([]), // ends chain
  index: {
    initialized: true, // or false, depending on test case
  }
  // Add other Dataview API methods/properties as needed
}));

export default {
  getAPI,
  // Add other exports like STask if needed
};

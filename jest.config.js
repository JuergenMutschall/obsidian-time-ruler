module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Using jsdom as some utils might interact with DOM elements or expect a window object
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json' // Explicitly point to the tsconfig
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Add a basic moduleNameMapper for potential absolute imports from 'src' if needed,
  // and to mock CSS/asset files that Jest can't handle.
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    'obsidian': '<rootDir>/src/tests/unit/__mocks__/obsidian.js', // Mock for Obsidian module
    'obsidian-dataview': '<rootDir>/src/tests/unit/__mocks__/obsidian-dataview.js',
    '^src/app/store$': '<rootDir>/src/tests/unit/__mocks__/store.js',
    '\.css$': 'identity-obj-proxy', // Mocks CSS imports
    '\.(mp3|wav)$': '<rootDir>/src/tests/unit/__mocks__/fileMock.js' // Mocks sound file imports
  },
  // Specify roots for Jest to look for tests
  roots: [
    "<rootDir>/src"
  ],
  // Test pattern to look for files ending with .test.ts or .spec.ts
  testRegex: "(/__tests__/.*|(\.|/)(test|spec))\.tsx?$"
};

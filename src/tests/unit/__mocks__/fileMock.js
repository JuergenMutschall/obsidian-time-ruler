// Mock for file assets like .mp3, .wav, etc.
//
// In Jest tests, when a component or module imports a file (e.g., an image or audio file),
// Jest needs to know how to handle this import. Since these files are not JavaScript,
// they can't be directly processed by Jest's JavaScript execution environment.
//
// This mock replaces the actual file import with a simple string or object.
// This allows tests to run without errors related to unhandled file types.
// The specific value returned (e.g., 'test-file-stub') can be used in snapshot testing
// or to verify that a component is receiving some value for the file prop.

module.exports = 'test-file-stub';

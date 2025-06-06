import '@testing-library/jest-dom';

// JSDOM doesn't implement HTMLMediaElement APIs, so we mock them
if (typeof window !== 'undefined' && typeof window.HTMLMediaElement !== 'undefined') {
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve()); // play() returns a Promise
  window.HTMLMediaElement.prototype.pause = jest.fn();
  // Add other media methods if needed, e.g., canPlayType, addTextTrack
}

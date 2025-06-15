import { render, screen } from '@testing-library/react';
import React from 'react';
import Button from '../../components/Button';
import { ButtonColorSettings } from '../../types';

// Mock the global 'app' object and plugin settings
// @ts-ignore
global.app = {
  plugins: {
    plugins: {
      'time-ruler': {
        settings: {
          buttonColors: {},
        },
      },
    },
  },
};

const mockPluginSettings = (settings: ButtonColorSettings) => {
  // @ts-ignore
  global.app.plugins.plugins['time-ruler'].settings.buttonColors = settings;
};

describe('Button Component', () => {
  beforeEach(() => {
    // Reset to default (no custom colors) before each test
    mockPluginSettings({});
  });

  test('renders with default theme styles when no custom colors are set', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toBeInTheDocument();
    // Check that specific custom styles are not applied
    expect(buttonElement.style.backgroundColor).toBe('');
    expect(buttonElement.style.color).toBe('');
    expect(buttonElement.style.borderColor).toBe('');
    // For CSS variables, check they are not set on the element's style attribute.
    expect(buttonElement.style.getPropertyValue('--interactive-hover')).toBe('');
    expect(buttonElement.style.getPropertyValue('--interactive-active')).toBe('');
  });

  test('applies custom background color', () => {
    mockPluginSettings({ backgroundColor: 'rgb(255, 0, 0)' }); // Red
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  test('applies custom text color', () => {
    mockPluginSettings({ textColor: 'rgb(0, 255, 0)' }); // Green
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('color: rgb(0, 255, 0)');
  });

  test('applies custom border color', () => {
    mockPluginSettings({ borderColor: 'rgb(0, 0, 255)' }); // Blue
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('border-color: rgb(0, 0, 255)');
    expect(buttonElement).toHaveStyle('border-width: 1px');
    expect(buttonElement).toHaveStyle('border-style: solid');
  });

  test('applies custom hover background color via CSS variable', () => {
    mockPluginSettings({ hoverBackgroundColor: 'rgb(255, 255, 0)' }); // Yellow
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('--interactive-hover: rgb(255, 255, 0)');
  });

  test('applies custom active background color via CSS variable', () => {
    mockPluginSettings({ activeBackgroundColor: 'rgb(255, 0, 255)' }); // Magenta
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('--interactive-active: rgb(255, 0, 255)');
  });

  test('applies multiple custom colors correctly', () => {
    mockPluginSettings({
      backgroundColor: 'rgb(10, 20, 30)',
      textColor: 'rgb(40, 50, 60)',
      borderColor: 'rgb(70, 80, 90)',
      hoverBackgroundColor: 'rgb(100, 110, 120)',
      activeBackgroundColor: 'rgb(130, 140, 150)',
    });
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me').parentElement;

    expect(buttonElement).toHaveStyle('background-color: rgb(10, 20, 30)');
    expect(buttonElement).toHaveStyle('color: rgb(40, 50, 60)');
    expect(buttonElement).toHaveStyle('border-color: rgb(70, 80, 90)');
    expect(buttonElement).toHaveStyle('--interactive-hover: rgb(100, 110, 120)');
    expect(buttonElement).toHaveStyle('--interactive-active: rgb(130, 140, 150)');
  });
});

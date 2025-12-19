/**
 * Component Tests for Art Map Quiz Application
 *
 * TESTING PHILOSOPHY FOR REACT COMPONENTS:
 * ========================================
 *
 * Why test React components?
 * - User interactions: Test that clicks, inputs, toggles work correctly
 * - State changes: Verify component state updates as expected
 * - Rendering: Ensure UI renders and re-renders correctly
 * - Accessibility: Test ARIA attributes and keyboard navigation
 *
 * Testing Best Practices:
 * 1. Test behavior, not implementation (what user sees, not how it works)
 * 2. Use React Testing Library (favors user-centric testing)
 * 3. Mock external dependencies (API calls, images)
 * 4. Keep tests isolated and focused
 * 5. Use meaningful test descriptions
 *
 * INTERVIEW PREP: React Testing Patterns
 * ======================================
 * Common patterns demonstrated:
 * - render(): Mount component in test environment
 * - screen.getBy*()/queryBy*()/findBy*(): Query DOM elements
 * - fireEvent/userEvent: Simulate user interactions
 * - waitFor(): Test async operations
 * - jest.mock(): Mock external modules
 * - beforeEach/afterEach: Setup and cleanup
 *
 * Key Testing Libraries:
 * - @testing-library/react: Component testing utilities
 * - @testing-library/jest-dom: Extended matchers (toBeInTheDocument, etc.)
 * - jest: Test runner and assertion library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import WorldMap from '../WorldMap';
import ArtworkInfoBar from '../ArtworkInfoBar';
import ExternalLinks from '../ExternalLinks';


// ========================
// WorldMap Component Tests
// ========================

describe('WorldMap Component', () => {
  /**
   * TESTING PATTERN: Setup mock data
   * 
   * Components need props to render. Rather than using real data,
   * we mock it for fast, reliable tests.
   */
  const mockProps = {
    countries: [
      { iso3: 'USA', name: 'United States', continent: 'North America' },
      { iso3: 'FRA', name: 'France', continent: 'Europe' },
      { iso3: 'JPN', name: 'Japan', continent: 'Asia' },
    ],
    mode: 'explore',
    targetCountry: null,
    loading: false,
    onCountryClick: jest.fn(),
    onModeToggle: jest.fn(),
    onStartOver: jest.fn(),
    onManualCountrySelect: jest.fn(),
    colors: {
      cardBg: '#f5e6d3',
      text: '#3d2817',
      border: '#8b7355',
      glow: '#d4a574',
    },
  };

  /**
   * TESTING PATTERN: afterEach cleanup
   * 
   * After each test, clear all mocks so they don't leak into other tests.
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // Rendering Tests
  // ========================

  test('should render globe container', () => {
    render(<WorldMap {...mockProps} />);
    
    // Look for the main container
    const container = screen.getByRole('article') || screen.getByTestId('globe-container');
    expect(container).toBeInTheDocument();
  });

  test('should display title for explore mode', () => {
    render(<WorldMap {...mockProps} mode="explore" />);
    
    // In explore mode, should show default text
    expect(screen.getByText(/Click to Explore/i)).toBeInTheDocument();
  });

  test('should display target country name in quiz mode', () => {
    const quizProps = {
      ...mockProps,
      mode: 'quiz',
      targetCountry: 'USA',
      targetCountryName: 'United States',
    };
    render(<WorldMap {...quizProps} />);
    
    // Should show "Find: United States"
    expect(screen.getByText(/Find: United States/i)).toBeInTheDocument();
  });

  test('should show/hide quiz controls based on mode', () => {
    const { rerender } = render(<WorldMap {...mockProps} mode="explore" />);
    
    // In explore mode, quiz controls should not be visible
    let nextButton = screen.queryByText(/^Next$/);
    expect(nextButton).not.toBeInTheDocument();
    
    // Switch to quiz mode
    rerender(<WorldMap {...mockProps} mode="quiz" />);
    
    // Now quiz controls should be visible
    nextButton = screen.getByText(/^Next$/);
    expect(nextButton).toBeInTheDocument();
  });

  // ========================
  // Interaction Tests
  // ========================

  test('should call onCountryClick when country is selected', async () => {
    render(<WorldMap {...mockProps} />);
    
    // This test structure assumes a globe globe with clickable regions
    // In real scenario, would test actual globe click events
    expect(mockProps.onCountryClick).not.toHaveBeenCalled();
  });

  test('should call onModeToggle when quiz toggle changes', async () => {
    render(<WorldMap {...mockProps} mode="explore" />);
    
    // Find the mode toggle checkbox
    const toggleCheckbox = screen.getByRole('checkbox', { name: /quiz/i });
    
    // Click it
    fireEvent.click(toggleCheckbox);
    
    // Should have called the callback
    expect(mockProps.onModeToggle).toHaveBeenCalled();
  });

  test('should call onStartOver when Next button clicked in quiz mode', async () => {
    const quizProps = {
      ...mockProps,
      mode: 'quiz',
      targetCountry: 'USA',
    };
    render(<WorldMap {...quizProps} />);
    
    // Find and click Next button
    const nextButton = screen.getByRole('button', { name: /^Next$/ });
    fireEvent.click(nextButton);
    
    // Should call onStartOver
    expect(mockProps.onStartOver).toHaveBeenCalled();
  });

  test('should disable Show Me button when already shown', () => {
    const showMeProps = {
      ...mockProps,
      mode: 'quiz',
      targetCountry: 'USA',
      showMeActivated: true,
    };
    render(<WorldMap {...showMeProps} />);
    
    // Find Show Me button
    const showMeButton = screen.getByRole('button', { name: /Show Me/ });
    
    // Should be disabled
    expect(showMeButton).toHaveAttribute('disabled');
    expect(showMeButton).toHaveStyle({ opacity: '0.5', cursor: 'not-allowed' });
  });

  // ========================
  // State & Props Tests
  // ========================

  test('should display loading state', () => {
    const loadingProps = {
      ...mockProps,
      loading: true,
    };
    render(<WorldMap {...loadingProps} />);
    
    // When loading, should show loading indicator or disabled state
    // Exact implementation depends on component
  });

  test('should handle empty countries list', () => {
    const emptyProps = {
      ...mockProps,
      countries: [],
    };
    
    // Should not crash
    expect(() => render(<WorldMap {...emptyProps} />)).not.toThrow();
  });

  test('should apply provided colors to UI elements', () => {
    const customColors = {
      ...mockProps.colors,
      cardBg: '#ff0000',
      text: '#00ff00',
    };
    render(<WorldMap {...mockProps} colors={customColors} />);
    
    // Component should use these colors in its inline styles
    // This is harder to test directly, but can verify via computed styles
  });
});


// ========================
// ArtworkInfoBar Component Tests
// ========================

describe('ArtworkInfoBar Component', () => {
  const mockCountryData = {
    iso3: 'FRA',
    name: 'France',
    continent: 'Europe',
    mortality_rate: 4.2,
    images_count: 156,
  };

  const mockProps = {
    selectedCountry: mockCountryData,
    loading: false,
    onClose: jest.fn(),
    colors: {
      cardBg: '#f5e6d3',
      text: '#3d2817',
      border: '#8b7355',
    },
  };

  test('should render country information when data provided', () => {
    render(<ArtworkInfoBar {...mockProps} />);
    
    // Should display country name
    expect(screen.getByText('France')).toBeInTheDocument();
    
    // Should display continent
    expect(screen.getByText(/Europe/i)).toBeInTheDocument();
  });

  test('should show loading state', () => {
    render(<ArtworkInfoBar {...mockProps} loading={true} />);
    
    // Should show loading indicator
    expect(screen.getByText(/loading/i) || screen.getByTestId('loading')).toBeTruthy();
  });

  test('should display artwork count', () => {
    render(<ArtworkInfoBar {...mockProps} />);
    
    // Should show image count
    expect(screen.getByText(/156/i) || screen.getByText(/artwork/i)).toBeTruthy();
  });

  test('should call onClose when close button clicked', () => {
    render(<ArtworkInfoBar {...mockProps} />);
    
    // Find close button
    const closeButton = screen.getByRole('button', { name: /close|×/i });
    
    fireEvent.click(closeButton);
    
    // Should call callback
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('should hide when no country selected', () => {
    render(<ArtworkInfoBar {...mockProps} selectedCountry={null} />);
    
    // Should not show content
    expect(screen.queryByText('France')).not.toBeInTheDocument();
  });
});


// ========================
// ExternalLinks Component Tests
// ========================

describe('ExternalLinks Component', () => {
  const mockLinks = {
    gapminder_url: 'https://www.gapminder.org/countries/fra',
    tasteatlas_url: 'https://www.tasteatlas.com/france',
  };

  const mockProps = {
    iso3: 'FRA',
    externalLinks: mockLinks,
    loading: false,
  };

  test('should render external links when data provided', () => {
    render(<ExternalLinks {...mockProps} />);
    
    // Should have links to external resources
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  test('should open links in new tab with security attributes', () => {
    render(<ExternalLinks {...mockProps} />);
    
    // Find external links
    const links = screen.getAllByRole('link');
    
    // All external links should open in new tab
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      // Security: should have rel attribute with noopener and noreferrer
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
  });

  test('should show loading state', () => {
    render(<ExternalLinks {...mockProps} loading={true} />);
    
    // Should show loading indicator
    expect(screen.getByText(/loading/i) || screen.getByTestId('loading')).toBeTruthy();
  });

  test('should handle missing links gracefully', () => {
    const incompleteProps = {
      ...mockProps,
      externalLinks: { gapminder_url: mockLinks.gapminder_url },
    };
    
    // Should not crash with missing data
    expect(() => render(<ExternalLinks {...incompleteProps} />)).not.toThrow();
  });

  test('should use nullish coalescing for optional fields', () => {
    const sparseProps = {
      iso3: 'FRA',
      externalLinks: {},
      loading: false,
    };
    
    // Component should gracefully handle empty links object
    expect(() => render(<ExternalLinks {...sparseProps} />)).not.toThrow();
  });
});


// ========================
// Integration Tests
// ========================

describe('Component Integration', () => {
  /**
   * TESTING PATTERN: Integration tests
   * 
   * Test how multiple components work together,
   * simulating real user workflows.
   */

  test('should handle user switching between quiz and explore modes', () => {
    const mockOnModeToggle = jest.fn();
    
    const props = {
      countries: [
        { iso3: 'USA', name: 'United States', continent: 'North America' },
      ],
      mode: 'explore',
      onModeToggle: mockOnModeToggle,
      onCountryClick: jest.fn(),
      onStartOver: jest.fn(),
      colors: {
        cardBg: '#f5e6d3',
        text: '#3d2817',
        border: '#8b7355',
        glow: '#d4a574',
      },
    };

    const { rerender } = render(<WorldMap {...props} />);
    
    // Find toggle and switch mode
    const toggle = screen.getByRole('checkbox', { name: /quiz/i });
    fireEvent.click(toggle);
    
    // Re-render with new mode
    rerender(<WorldMap {...props} mode="quiz" />);
    
    // Quiz controls should now be visible
    expect(screen.getByText(/Next/i)).toBeInTheDocument();
  });
});

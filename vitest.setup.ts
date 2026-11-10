import '@testing-library/jest-dom'

// Mock ResizeObserver for jsdom environment
if (typeof window !== 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver || ResizeObserver
  global.ResizeObserver = global.ResizeObserver || ResizeObserver
}

if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

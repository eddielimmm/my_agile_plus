/**
 * Safe browser utilities that work with SSR
 */

// Safe way to check if code is running in a browser
export const isBrowser = typeof window !== 'undefined';

// Safe way to get window.location
export const getLocation = () => {
  return isBrowser ? window.location : null;
};

// Safe way to get current pathname
export const getPathname = () => {
  return isBrowser ? window.location.pathname : '';
};

// Safe way to get current URL
export const getCurrentUrl = () => {
  return isBrowser ? window.location.href : '';
};

// Safe way to navigate
export const navigateTo = (url: string) => {
  if (isBrowser) {
    window.location.href = url;
  }
}; 
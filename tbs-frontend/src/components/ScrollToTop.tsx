import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls the window to the top
 * whenever the route changes. This ensures that when navigating
 * between pages, the scroll position resets to the top.
 * 
 * Also resets scroll position for any scrollable containers
 * (like SidebarInset content areas).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll
    });

    // Also reset scroll for document element (for better browser compatibility)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset scroll for any scrollable main containers (like SidebarInset)
    const mainContainers = document.querySelectorAll('main[class*="SidebarInset"], main[class*="flex-1"]');
    mainContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;


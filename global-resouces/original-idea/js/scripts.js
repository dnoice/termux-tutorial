// === js/scripts.js ===
// Version: 1.0
// Last Reviewed: 2025-04-27
// Author: Dennis 'dendogg' Smaltz (for Danny Barcello)
// Description: This script enhances the Termux Guide with features like theme toggling, copy buttons for code blocks, smooth scrolling for TOC links, section animations, and a parallax effect for the header graphic. It is designed to be modular, efficient, and compatible with modern browsers while gracefully degrading in unsupported environments.

(function() {
    'use strict'; // Enforce strict parsing and error handling

    // --- Configuration Constants ---
    // These constants (constants means they are not meant to be changed during runtime but can be adjusted for different use cases, if you change one of these values it won't affect the script's functionality though it may affect how it looks and behaves. Make sure to test out any and all changes immediately) define key values for theme management, copy button behavior, TOC highlighting, section animations, and parallax effects.
    const CONFIG = {
        THEME_STORAGE_KEY: 'theme',         // localStorage key for theme preference
        DARK_THEME_NAME: 'dark',            // Value for dark theme
        LIGHT_THEME_NAME: 'light',          // Value for light theme
        COPY_BUTTON_TEXT: 'Copy',           // Default text for copy buttons
        COPIED_BUTTON_TEXT: 'Copied!',      // Text after successful copy
        ERROR_BUTTON_TEXT: 'Error',         // Text on copy error
        COPIED_TIMEOUT_MS: 2000,            // Duration (ms) for "Copied!" message
        ERROR_TIMEOUT_MS: 3000,             // Duration (ms) for "Error" message
        TOC_ACTIVE_CLASS: 'active',         // CSS class for the active TOC link
        // Selector targets sections AND figures for entrance animation
        SECTION_ANIMATE_SELECTOR: 'main > section, figure.tutorial-image-figure',
        SECTION_VISIBLE_CLASS: 'is-visible',// CSS class for elements that have entered the viewport
        SECTION_BASE_ANIMATE_CLASS: 'section-animate', // Base class for animation setup
        PARALLAX_ELEMENT_SELECTOR: '.header-graphic', // Element for parallax effect
        PARALLAX_FACTOR: 0.3,               // Parallax speed factor (Desktop: moves at 30% of scroll)
        PARALLAX_FACTOR_MOBILE: 0.1,        // Reduced factor (Mobile: moves at 10% of scroll)
        MOBILE_BREAKPOINT: 768,             // Width (px) below which mobile settings apply
        THROTTLE_DELAY_MS: 10,              // Delay (ms) for throttling frequent events (scroll/resize)
        // IntersectionObserver margin to determine when TOC link becomes active (top 40% of viewport)
        TOC_OBSERVER_MARGIN: '0px 0px -60% 0px',
        // IntersectionObserver margin for triggering section/figure animations (bottom 15% enters viewport)
        SECTION_OBSERVER_MARGIN: '0px 0px -15% 0px'
    };

    // --- Global State Variables ---
    let latestScrollY = 0;        // Stores the last known scroll position for performance
    let ticking = false;          // Flag for requestAnimationFrame throttling
    let currentParallaxFactor = CONFIG.PARALLAX_FACTOR; // Holds the active parallax factor

    // --- Helper Functions ---

    /**
     * Safely interacts with localStorage, handling potential errors (e.g., disabled).
     * @param {'get'|'set'} action - The operation to perform ('get' or 'set').
     * @param {string} key - The localStorage key.
     * @param {string} [value] - The value to set (only required for 'set' action).
     * @returns {string|null} Retrieved value for 'get', null otherwise or on error.
     */
    function safeLocalStorage(action, key, value = null) {
        try {
            if (action === 'set') {
                localStorage.setItem(key, value);
                return null; // Explicitly return null on set
            } else if (action === 'get') {
                return localStorage.getItem(key);
            }
        } catch (e) {
            // Warn if localStorage is unavailable, but don't break the script.
            console.warn(`LocalStorage ${action} failed for key "${key}". Storage might be disabled.`, e);
        }
        return null; // Return null on error or invalid action
    }

    /**
     * Throttles a function call to limit its execution rate on frequent events.
     * Ensures the function isn't called more often than the specified limit.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The minimum time interval (ms) between calls.
     * @returns {Function} A throttled version of the input function.
     */
    function throttle(func, limit) {
        let inThrottle; // Flag to track whether the function is currently throttled
        return function(...args) {
            const context = this; // Preserve context (`this`)
            if (!inThrottle) {
                func.apply(context, args); // Execute the function
                inThrottle = true; // Set throttle flag
                // Release the throttle after the specified limit
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // --- Core Feature Setup Functions ---

    /**
     * Sets up the light/dark theme toggle functionality.
     * Reads saved preference or OS preference, applies theme, handles button clicks,
     * and listens for OS theme changes.
     */
    function setupTheme() {
        const themeToggleButton = document.getElementById('darkModeToggle');
        const htmlElement = document.documentElement; // Target the <html> element

        // Validate critical elements
        if (!htmlElement) {
             console.error("Critical Error: Cannot find <html> element. Theme setup aborted.");
             return;
        }
        if (!themeToggleButton) {
            // Warn if button is missing, but proceed with setting initial theme
            console.warn("Theme toggle button '#darkModeToggle' not found. Initial theme will be set, but toggling via button is disabled.");
        }

        // Function to apply a theme (light or dark)
        const applyTheme = (theme) => {
            // Validate theme value, default to light if invalid
            const validTheme = (theme === CONFIG.DARK_THEME_NAME || theme === CONFIG.LIGHT_THEME_NAME)
                             ? theme : CONFIG.LIGHT_THEME_NAME;
            htmlElement.setAttribute('data-theme', validTheme); // Set attribute on <html>
            safeLocalStorage('set', CONFIG.THEME_STORAGE_KEY, validTheme); // Save preference
            // Update button's aria-pressed state for accessibility
            if (themeToggleButton) {
                themeToggleButton.setAttribute('aria-pressed', validTheme === CONFIG.DARK_THEME_NAME);
            }
        };

        // Determine the initial theme: saved preference > OS preference > default (light)
        const savedTheme = safeLocalStorage('get', CONFIG.THEME_STORAGE_KEY);
        let initialTheme = CONFIG.LIGHT_THEME_NAME; // Default theme
        let osPrefersDark = false;
        try {
             // Check OS preference using media query
             osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch(e) {
             console.warn("Could not check OS color scheme preference. Falling back.", e);
        }

        if (savedTheme) {
            initialTheme = savedTheme; // Use saved theme if available
        } else if (osPrefersDark) {
            initialTheme = CONFIG.DARK_THEME_NAME; // Use OS preference if no saved theme
        }
        applyTheme(initialTheme); // Apply the determined theme on page load

        // Add click listener to the toggle button (if it exists)
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                const currentTheme = htmlElement.getAttribute('data-theme');
                const newTheme = currentTheme === CONFIG.LIGHT_THEME_NAME ? CONFIG.DARK_THEME_NAME : CONFIG.LIGHT_THEME_NAME;
                applyTheme(newTheme); // Toggle and apply the new theme
            });
        }

        // Listen for changes in OS theme preference (if supported)
        try {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleOsThemeChange = (event) => {
                 // Only change theme if the user hasn't manually set one (respect user choice)
                 if (safeLocalStorage('get', CONFIG.THEME_STORAGE_KEY) === null) {
                     const newOsTheme = event.matches ? CONFIG.DARK_THEME_NAME : CONFIG.LIGHT_THEME_NAME;
                     applyTheme(newOsTheme);
                 }
             };
            // Use modern event listener API where available, fallback for older browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleOsThemeChange);
            } else if (mediaQuery.addListener) { // Deprecated fallback
                mediaQuery.addListener(handleOsThemeChange);
            }
        } catch (e) {
            console.warn("Could not add OS theme change listener.", e);
        }
    }

    /**
     * Sets up smooth scrolling for internal anchor links (e.g., Table of Contents).
     * Uses the native `scrollIntoView` with 'smooth' behavior.
     */
    function setupSmoothScrolling() {
        // Select only TOC links that point to an ID on the same page
        const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
        if (!tocLinks.length) return; // Exit if no such links are found

        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                // Basic validation: Ensure href is not just "#"
                if (!targetId || targetId.length <= 1) return;

                let targetElement;
                try {
                    // Use CSS.escape for potentially complex IDs, though unlikely needed here
                    // targetElement = document.querySelector(CSS.escape(targetId));
                    targetElement = document.querySelector(targetId);
                } catch (error) {
                    console.error(`Error finding element for smooth scroll selector "${targetId}":`, error);
                    return; // Stop if query fails
                }

                if (targetElement) {
                    e.preventDefault(); // Prevent the default anchor jump
                    targetElement.scrollIntoView({
                        behavior: 'smooth', // Enable smooth scrolling
                        block: 'start'     // Align the top of the target element with the top of the viewport
                    });
                    // Optionally, update focus to the target section for accessibility
                    // targetElement.focus({ preventScroll: true }); // Check browser support if using
                } else {
                    // Warn if the linked element doesn't exist on the page
                    console.warn(`Smooth scroll target element not found for ID: ${targetId}`);
                }
            });
        });
    }

    /**
     * Adds 'Copy' buttons to all <pre> code blocks that contain <code>.
     * Uses the modern asynchronous Clipboard API (navigator.clipboard.writeText).
     * Provides visual feedback (text change, class change) on success/error.
     */
    function setupCopyButtons() {
        // Feature detection: Check for Clipboard API support (requires HTTPS or localhost)
        if (!navigator.clipboard?.writeText) {
             console.warn("Clipboard API (writeText) not supported or unavailable in this context (requires HTTPS/localhost). Copy buttons disabled.");
             return; // Abort if API is not available
         }

        const codeBlocks = document.querySelectorAll('pre');
        if (!codeBlocks.length) return; // Exit if no <pre> elements

        codeBlocks.forEach((block) => {
            const codeElement = block.querySelector('code');
            // Ensure block contains <code>, doesn't already have a button, and has text content
            if (!codeElement || block.querySelector('.copy-button') || !codeElement.textContent?.trim()) {
                return; // Skip this block if conditions aren't met
            }

            // Create the button container and the button element
            const header = document.createElement('div');
            header.className = 'code-block-header'; // For styling
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.textContent = CONFIG.COPY_BUTTON_TEXT;
            button.setAttribute('aria-label', 'Copy code to clipboard');
            button.title = 'Copy code to clipboard'; // Tooltip for mouse users

            header.appendChild(button);
            // Insert the button container *inside* the <pre>, before the <code>
            block.insertBefore(header, block.firstChild);

            let timeoutId = null; // Stores timer ID for resetting button state

            // Add click event listener to the button
            button.addEventListener('click', async () => {
                if (timeoutId) clearTimeout(timeoutId); // Clear any existing reset timer

                // Reset button state visually before attempting copy
                button.classList.remove('copied', 'error');
                button.textContent = CONFIG.COPY_BUTTON_TEXT;

                const codeToCopy = codeElement.textContent; // Get current code content
                if (!codeToCopy) {
                     console.error("Copy button clicked, but associated <code> content is empty.");
                     button.textContent = CONFIG.ERROR_BUTTON_TEXT;
                     button.classList.add('error');
                     // Set timer to reset error state
                     timeoutId = setTimeout(() => {
                          button.textContent = CONFIG.COPY_BUTTON_TEXT;
                          button.classList.remove('error');
                      }, CONFIG.ERROR_TIMEOUT_MS);
                     return; // Stop if there's nothing to copy
                }

                // Attempt to copy using the Clipboard API
                try {
                    await navigator.clipboard.writeText(codeToCopy);
                    // Success: Update button text and add 'copied' class
                    button.textContent = CONFIG.COPIED_BUTTON_TEXT;
                    button.classList.add('copied');
                    // Set timer to reset button state after a short delay
                    timeoutId = setTimeout(() => {
                        button.textContent = CONFIG.COPY_BUTTON_TEXT;
                        button.classList.remove('copied');
                    }, CONFIG.COPIED_TIMEOUT_MS);
                } catch (err) {
                    // Error: Log error, update button text, add 'error' class
                    console.error('Failed to copy code to clipboard:', err);
                    button.textContent = CONFIG.ERROR_BUTTON_TEXT;
                    button.classList.add('error');
                    // Set timer to reset button state after a short delay
                    timeoutId = setTimeout(() => {
                         button.textContent = CONFIG.COPY_BUTTON_TEXT;
                         button.classList.remove('error');
                    }, CONFIG.ERROR_TIMEOUT_MS);
                }
            });
        });
    }

    /**
     * Uses Intersection Observer API to highlight the active Table of Contents link
     * corresponding to the section currently most visible in the viewport's upper area.
     */
    function setupTocActiveState() {
        const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
        // Map section IDs to their corresponding TOC link elements for quick lookup
        const sectionLinkMap = new Map();
        const sectionsToObserve = [];

        // Build the map and list of sections to observe
        tocLinks.forEach(link => {
             const targetId = link.getAttribute('href');
             // Validate href is a valid ID selector
             if (!targetId || targetId.length <= 1 || !targetId.startsWith('#')) return;
             try {
                 const section = document.querySelector(targetId);
                 if (section) {
                     sectionLinkMap.set(section, link); // Map the DOM element to its link
                     sectionsToObserve.push(section);   // Add section to the list for observation
                 } else {
                     console.warn(`TOC Active State: Section element not found for link href: ${targetId}`);
                 }
             } catch(e) {
                 console.error(`TOC Active State: Error finding section for ${targetId}:`, e);
             }
        });

        if (!sectionsToObserve.length) return; // Exit if no valid linked sections found

        // Observer options: Define the "active zone" near the top of the viewport
        const observerOptions = {
            root: null, // Observe relative to the viewport
            rootMargin: CONFIG.TOC_OBSERVER_MARGIN, // e.g., '0px 0px -60% 0px' -> top 40% is active zone
            threshold: 0 // Trigger as soon as the boundary is crossed
        };

        let currentlyActiveLink = null; // Track the currently highlighted link

        // Callback function for the Intersection Observer
        const observerCallback = (entries) => {
            let latestIntersectingSection = null;
            // Find the topmost section currently intersecting the active zone
            entries.forEach(entry => {
                 if (entry.isIntersecting) {
                    // Keep track of the section closest to the top of the viewport
                    if (!latestIntersectingSection || entry.boundingClientRect.top < latestIntersectingSection.boundingClientRect.top) {
                        latestIntersectingSection = entry;
                    }
                 }
             });

            // Get the link corresponding to the topmost intersecting section
            const activeLink = latestIntersectingSection ? sectionLinkMap.get(latestIntersectingSection.target) : null;

            // Update classes only if the active link has changed
            if (activeLink !== currentlyActiveLink) {
                // Remove active class from the previously active link (if any)
                if (currentlyActiveLink) {
                    currentlyActiveLink.classList.remove(CONFIG.TOC_ACTIVE_CLASS);
                }
                // Add active class to the new active link (if any)
                if (activeLink) {
                    activeLink.classList.add(CONFIG.TOC_ACTIVE_CLASS);
                }
                // Update the tracked active link
                currentlyActiveLink = activeLink;
            }
        };

        // Create and start the observer
        try {
            const observer = new IntersectionObserver(observerCallback, observerOptions);
            sectionsToObserve.forEach(section => observer.observe(section)); // Observe each section
        } catch (e) {
            console.error("Failed to create IntersectionObserver for TOC active state:", e);
        }
    }

   /**
    * Uses Intersection Observer to add a 'visible' class to sections and figures
    * when they scroll into view, triggering CSS animations. Runs only once per element.
    */
   function setupSectionAnimations() {
       const elementsToAnimate = document.querySelectorAll(CONFIG.SECTION_ANIMATE_SELECTOR);
       if (!elementsToAnimate.length) return; // Exit if no elements match the selector

       // Ensure all target elements have the base animation class
       elementsToAnimate.forEach(el => {
           // Add the base class only if it's not already present
           if (!el.classList.contains(CONFIG.SECTION_BASE_ANIMATE_CLASS)) {
               el.classList.add(CONFIG.SECTION_BASE_ANIMATE_CLASS);
           }
       });

       // Observer options: Trigger when the element enters the bottom 15% of the viewport
       const observerOptions = {
           root: null, // Relative to viewport
           rootMargin: CONFIG.SECTION_OBSERVER_MARGIN, // e.g., '0px 0px -15% 0px'
           threshold: 0 // Trigger as soon as intersection starts
       };

       // Callback function for the observer
       const observerCallback = (entries, observerInstance) => {
           entries.forEach(entry => {
               if (entry.isIntersecting) {
                   // Element is now visible, add the class to trigger the animation
                   entry.target.classList.add(CONFIG.SECTION_VISIBLE_CLASS);
                   // Stop observing this element once it has become visible (performance)
                   observerInstance.unobserve(entry.target);
               }
           });
       };

       // Create and start the observer
       try {
           const observer = new IntersectionObserver(observerCallback, observerOptions);
           elementsToAnimate.forEach(el => observer.observe(el)); // Observe each target element
       } catch (e) {
           console.error("Failed to create IntersectionObserver for section/figure animations:", e);
       }
   }


    /**
     * Sets up the parallax scroll effect for the specified header graphic.
     * Uses requestAnimationFrame for smooth animation updates.
     * Adjusts parallax effect intensity based on screen width (mobile vs. desktop).
     * Uses throttling for scroll and resize event listeners for performance.
     */
    function setupHeaderParallax() {
        const parallaxElement = document.querySelector(CONFIG.PARALLAX_ELEMENT_SELECTOR);
        if (!parallaxElement) return; // Exit if the parallax element is not found

        parallaxElement.classList.add('parallax-effect'); // Add class for potential CSS hooks
        let parallaxEnabled = true; // Control flag to potentially disable on mobile

        // Function to update the element's transform based on scroll position
        const updateParallax = () => {
            // Calculate vertical translation based on scroll position and factor
            const translateY = latestScrollY * currentParallaxFactor;
            // Apply using CSS variable for easier CSS management and potential combination with other transforms
            parallaxElement.style.setProperty('--parallax-offset', `${translateY}px`);
            // Explicitly set transform here as well, using the CSS variable
            parallaxElement.style.transform = `translateY(var(--parallax-offset))`;
            ticking = false; // Reset ticking flag, allowing next rAF request
        };

        // Scroll event handler: Records scroll position and requests animation frame
        const onScroll = () => {
            latestScrollY = window.scrollY; // Update latest scroll position
            // Request animation frame only if parallax is enabled and not already ticking
            if (!ticking && parallaxEnabled) {
                window.requestAnimationFrame(updateParallax);
                ticking = true; // Set ticking flag
            }
        };

        // Resize event handler: Adjusts parallax factor based on window width
        const handleResize = () => {
            const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
            // Set the appropriate parallax factor
            currentParallaxFactor = isMobile ? CONFIG.PARALLAX_FACTOR_MOBILE : CONFIG.PARALLAX_FACTOR;

            // --- Optional: Fully disable parallax on mobile if desired ---
            // parallaxEnabled = !isMobile;
            // if (!parallaxEnabled) {
            //     // Reset position immediately if disabled
            //     parallaxElement.style.transform = 'translateY(0px)';
            //     parallaxElement.style.removeProperty('--parallax-offset');
            // }
            // --- End Optional Disable ---

            // Trigger an immediate parallax update after resize check if enabled
            if (parallaxEnabled && !ticking) {
                onScroll(); // Use onScroll to request rAF correctly
            } else if (!parallaxEnabled && !ticking) {
                 // If disabled and not already updating, ensure transform is reset via rAF
                 latestScrollY = 0; // Reset scroll influence
                 window.requestAnimationFrame(updateParallax); // Apply the reset
                 ticking = true;
            }
        };

        // Use throttled listeners for scroll and resize events for performance
        const throttledScrollHandler = throttle(onScroll, CONFIG.THROTTLE_DELAY_MS);
        const throttledResizeHandler = throttle(handleResize, 150); // Check resize less frequently than scroll

        // Attach event listeners
        window.addEventListener('scroll', throttledScrollHandler, { passive: true }); // Use passive listener for scroll
        window.addEventListener('resize', throttledResizeHandler);

        // Initial setup on page load
        handleResize(); // Set initial factor/state based on current width
        latestScrollY = window.scrollY; // Get initial scroll position
        if (parallaxEnabled) updateParallax(); // Apply initial parallax position immediately if enabled
    }

    // --- Global Initialization ---
    /**
     * Initializes all features when the DOM is ready.
     */
    function initialize() {
        console.log("Initializing Termux Guide Enhancements - v1.0"); // Log initialization start
        setupTheme();
        setupSmoothScrolling();
        setupCopyButtons();
        setupTocActiveState();
        setupSectionAnimations();
        setupHeaderParallax();
        console.log("Termux Guide Enhancements Initialized."); // Log completion
    }

    // --- DOM Ready Execution ---
    // Ensures the script runs only after the HTML document structure is fully loaded.
    if (document.readyState === 'loading') {
        // Still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOMContentLoaded has already fired, initialize immediately
        initialize();
    }

})(); // End IIFE (Immediately Invoked Function Expression)

// === END js/scripts.js ===
/**
 * PDF // BRUTAL_BOX - Progressive Web App (PWA) Manager
 * Registers the Service Worker and manages offline status.
 * All PWA installation is handled natively by Chrome/browser.
 */

(function () {
    'use strict';

    // 1. SERVICE WORKER REGISTRATION
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then((registration) => {
                    console.log('[PWA] Service Worker registered. Scope:', registration.scope);

                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('[PWA] New version ready.');
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.warn('[PWA] Service Worker registration failed:', error);
                });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerServiceWorker();
    } else {
        window.addEventListener('load', registerServiceWorker);
    }

    // 2. OFFLINE / ONLINE CONNECTIVITY NOTIFICATION
    const offlineIndicator = document.getElementById('offline-indicator');

    function handleConnectionChange() {
        if (!offlineIndicator) return;
        if (!navigator.onLine) {
            offlineIndicator.style.display = 'inline-flex';
        } else {
            offlineIndicator.style.display = 'none';
        }
    }

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    handleConnectionChange();
})();

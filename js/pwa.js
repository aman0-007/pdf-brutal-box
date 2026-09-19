/**
 * PDF // BRUTAL_BOX - Service Worker Registration
 * Registers the PWA service worker so the app works seamlessly offline.
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('[PWA] Service Worker registered with scope:', reg.scope);
            })
            .catch((err) => {
                console.warn('[PWA] Service Worker registration failed:', err);
            });
    });
}

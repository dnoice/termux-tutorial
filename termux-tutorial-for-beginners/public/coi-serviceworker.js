/*!
 * coi-serviceworker v0.1.7 — Guido Zuidhof et al., MIT License.
 * https://github.com/gzuidhof/coi-serviceworker
 *
 * Injects Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy response
 * headers so that SharedArrayBuffer (required by CheerpX / WebVM) works on
 * static hosts like GitHub Pages, which cannot set headers themselves.
 *
 * LOCAL MODIFICATIONS (two, both about blast radius — see astro.config.mjs):
 *
 * 1. `window.coi.scope` — upstream registers with the script's own directory as
 *    the scope, which here is the site root: the worker would then control all
 *    every page on the site and serve all of them with COEP `require-corp`, for a
 *    feature that exists on ONE page. Any future cross-origin subresource (an
 *    embedded video, a GitHub CDN screenshot, a badge) would be blocked
 *    site-wide. A narrower scope is legal — a worker may claim any path at or
 *    below its own — so we register with the sandbox lesson's directory and the
 *    other pages are never controlled and never reload.
 *
 * 2. `window.coi.swUrl` — upstream reads `document.currentScript.src`, which is
 *    null when the tag is injected dynamically. The config only injects this
 *    script on the page that needs it, so the URL is passed in explicitly and
 *    currentScript is kept only as the fallback for a plain <script src> use.
 */
/* eslint-disable */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener('message', (ev) => {
        if (!ev.data) return;
        if (ev.data.type === 'deregister') {
            self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
                clients.forEach((client) => client.navigate(client.url));
            });
        } else if (ev.data.type === 'coepCredentialless') {
            coepCredentialless = ev.data.value;
        }
    });

    self.addEventListener('fetch', function (event) {
        const r = event.request;
        if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;

        const request = (coepCredentialless && r.mode === 'no-cors')
            ? new Request(r, { credentials: 'omit' })
            : r;
        event.respondWith(
            fetch(request).then((response) => {
                if (response.status === 0) return response;
                const newHeaders = new Headers(response.headers);
                newHeaders.set('Cross-Origin-Embedder-Policy',
                    coepCredentialless ? 'credentialless' : 'require-corp');
                if (!coepCredentialless) newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
                newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }).catch((e) => console.error(e)),
        );
    });
} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem('coiReloadedBySelf');
        window.sessionStorage.removeItem('coiReloadedBySelf');
        const coepDegrading = (reloadedBySelf === 'coepdegrade');

        const n = navigator;
        const controlling = n.serviceWorker && n.serviceWorker.controller;
        if (controlling && !window.crossOriginIsolated) {
            window.sessionStorage.setItem('coiReloadedBySelf', 'coepdegrade');
        }

        const coi = {
            shouldRegister: () => !reloadedBySelf,
            shouldDeregister: () => false,
            coepCredentialless: () => !(navigator.userAgentData &&
                navigator.userAgentData.brands &&
                navigator.userAgentData.brands.some((b) => b.brand === 'Chromium' && Number(b.version) >= 96)),
            coepDegrade: () => true,
            doReload: () => window.location.reload(),
            quiet: false,
            // Local additions; null means "behave like upstream".
            swUrl: null,
            scope: null,
            ...window.coi,
        };

        if (!window.isSecureContext) {
            !coi.quiet && console.log('COOP/COEP Service Worker not registered, a secure context is required.');
            return;
        }

        if (controlling) {
            n.serviceWorker.controller.postMessage({ type: 'coepCredentialless', value: coi.coepCredentialless() });
            if (coi.shouldDeregister()) n.serviceWorker.controller.postMessage({ type: 'deregister' });
        }

        if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;

        if (!window.SharedArrayBuffer) {
            !coi.quiet && console.log('COOP/COEP Service Worker not registered, SharedArrayBuffer is not available.');
            return;
        }

        const currentScript = window.document.currentScript;
        const swUrl = coi.swUrl || (currentScript && currentScript.src);
        if (!swUrl) {
            !coi.quiet && console.log('COOP/COEP Service Worker not registered, no script URL.');
            return;
        }
        // Scope is optional: without it the worker claims its own directory,
        // which is the whole site. See LOCAL MODIFICATIONS at the top.
        const options = coi.scope ? { scope: coi.scope } : undefined;

        n.serviceWorker && n.serviceWorker.register(swUrl, options).then(
            (registration) => {
                !coi.quiet && console.log('COOP/COEP Service Worker registered', registration.scope);
                registration.addEventListener('updatefound', () => {
                    !coi.quiet && console.log('Reloading page to make use of updated COOP/COEP Service Worker.');
                    if (coi.shouldRegister()) coi.doReload();
                });
                if (registration.active && !n.serviceWorker.controller) {
                    !coi.quiet && console.log('Reloading page to make use of COOP/COEP Service Worker.');
                    if (coi.shouldRegister()) coi.doReload();
                }
            },
            (err) => !coi.quiet && console.error('COOP/COEP Service Worker failed to register:', err),
        );
    })();
}

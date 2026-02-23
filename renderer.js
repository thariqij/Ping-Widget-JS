const { ipcRenderer } = require('electron');

/**
 * Close window
 * Sends IPC message to main process
 */
function closeWindow() {
    ipcRenderer.send('close-window');
}

/**
 * Header hover control via IPC
 * Main process polls cursor position at OS level and sends mouse-entered/mouse-left.
 */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const circle = document.getElementById('circle');
    const svgContainer = document.querySelector('.svg-container');
    const pingTooltip = document.getElementById('ping-tooltip');
    let hideTimeout = null;
    let isDragging = false;

    if (!header) {
        console.error('Header element not found!');
        return;
    }

    // ========================================================================
    // HEADER & TOOLTIP SHOW/HIDE
    // ========================================================================

    function showHeader() {
        header.style.opacity = '1';
        pingTooltip.style.opacity = '1';
    }

    function hideHeader() {
        header.style.opacity = '0';
        pingTooltip.style.opacity = '0';
    }

    function cancelHide() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    }

    function scheduleHide() {
        cancelHide();
        hideTimeout = setTimeout(() => {
            hideHeader();
            hideTimeout = null;
        }, 500);
    }

    ipcRenderer.on('mouse-entered', () => {
        cancelHide();
        showHeader();
    });

    ipcRenderer.on('mouse-left', () => {
        scheduleHide();
    });

    // ========================================================================
    // WINDOW DRAGGING - manual drag via SVG container
    // ========================================================================
    if (svgContainer) {
        console.log('SVG container found, setting up drag handlers');

        // Start dragging when mouse down on SVG
        svgContainer.addEventListener('mousedown', (e) => {
            console.log('Drag started at', e.clientX, e.clientY);
            isDragging = true;
            ipcRenderer.send('window-drag-start', { clientX: e.clientX, clientY: e.clientY });
        });
    } else {
        console.warn('SVG container NOT found!');
    }

    // These listeners should be on document, always active
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            ipcRenderer.send('window-drag', { clientX: e.clientX, clientY: e.clientY });
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            console.log('Drag stopped');
            isDragging = false;
            ipcRenderer.send('window-drag-end', {});
        }
    });

    document.addEventListener('mouseleave', () => {
        if (isDragging) {
            console.log('Mouse left window, stopping drag');
            isDragging = false;
            ipcRenderer.send('window-drag-end', {});
        }
    });

    // ========================================================================
    // PING RESULT → CIRCLE COLOR
    // ========================================================================

    /**
     * Map latency (ms) to a color.
     *   0-50ms   → green  (great)
     *   50-150ms → yellow (okay)
     *   150ms+   → red    (poor)
     *   timeout  → dark red
     *   error    → gray
     *
     * Uses OKLCH for smooth perceptual transitions.
     */
    function latencyToColor(latency) {
        if (latency === null) return null;

        // Clamp to 0-300 range for mapping
        const clamped = Math.max(0, Math.min(latency, 300));

        if (clamped <= 50) {
            // Green to yellow: hue 145 → 95
            return `oklch(0.75 0.2 149)`;
        } else if (clamped <= 150) {
            // Yellow to red: hue 95 → 30
            const t = (clamped - 50) / 100;
            const hue = 95 - (t * 65);
            return `oklch(0.65 0.25 ${hue})`;
        } else {
            // Red deepens: hue 30 → 15, lightness drops
            const t = (clamped - 150) / 150;
            const hue = 30 - (t * 15);
            const lightness = 0.65 - (t * 0.15);
            return `oklch(${lightness} 0.25 ${hue})`;
        }
    }

    ipcRenderer.on('ping-result', (_event, result) => {
        // Log in CMD ping style
        if (result.error) {
            console.log(`Ping error: ${result.error}`);
            if (pingTooltip) pingTooltip.textContent = 'Error';
        } else if (result.timeout) {
            console.log(`Request timed out.`);
            if (pingTooltip) pingTooltip.textContent = 'Timeout';
        } else {
            console.log(`Reply from www.google.com.br: bytes=32 seq=${result.seq} time=${result.latency}ms`);
            if (pingTooltip) pingTooltip.textContent = `${result.latency}ms`;
        }

        if (!circle) return;

        if (result.error) {
            // Error → gray
            circle.setAttribute('fill', 'oklch(0.55 0.02 260)');
        } else if (result.timeout) {
            // Timeout → dark red
            circle.setAttribute('fill', 'oklch(0.45 0.25 25)');
        } else {
            const color = latencyToColor(result.latency);
            if (color) {
                circle.setAttribute('fill', color);
            }
        }
    });
});
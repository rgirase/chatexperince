/**
 * logger.js
 * Intercepts console methods to store logs in memory for in-app viewing on mobile.
 */

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 500;
        this.isInitialized = false;
        this.originalConsole = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
            debug: console.debug.bind(console)
        };
    }

    init() {
        if (this.isInitialized) return;

        const self = this;

        const patch = (type) => {
            const original = self.originalConsole[type];
            console[type] = function (...args) {
                // Call original console first
                original.apply(console, args);

                // Format and store log
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');

                self.logs.push({
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toLocaleTimeString(),
                    type,
                    message
                });

                // Keep log size manageable
                if (self.logs.length > self.maxLogs) {
                    self.logs.shift();
                }

                // Dispatch event for UI to update if needed
                window.dispatchEvent(new CustomEvent('app_log_added', { detail: self.logs }));
            };
        };

        patch('log');
        patch('warn');
        patch('error');
        patch('info');
        patch('debug');

        this.isInitialized = true;
        console.log("[Logger] In-app log interception active.");
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
        window.dispatchEvent(new CustomEvent('app_log_added', { detail: this.logs }));
    }
}

const logger = new Logger();
export default logger;

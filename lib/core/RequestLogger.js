'use strict';

/**
 * Create a new RequestLogger
 * @param {Object} options Configuration options
 * @param {Number} [options.maxLogs=200] Maximum number of logs to store
 */
class RequestLogger {

  constructor(options = {}) {
    this.logs = [];
    this.enabled = false;
    // Ensure maxLogs is a positive number or default to 200
    this.maxLogs = (options.maxLogs !== undefined) ? options.maxLogs : 200;
  }

  /**
   * Enable request logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable request logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Check if request logging is enabled
   * @returns {boolean} True if logging is enabled, false otherwise
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Add a request/response pair to the log
   * @param {Object} config Request configuration object
   * @param {Object|null} response Response object or null for failed/cancelled requests
   */
  addLog(config, response) {
    if (!this.enabled || this.maxLogs <= 0) {
      return;
    }
    
    // Create log entry with relevant information
    const logEntry = {
      method: config.method ? config.method.toUpperCase() : 'GET',
      url: config.url,
      // For cancelled requests or network errors, response will be null or undefined
      status: response ? response.status : 0
    };

    // Oldest logs first order - Stacked newest on top
    this.logs.push(logEntry);

    // For memory efficiency, trim logs if we exceed the maximum
    while (this.logs.length > this.maxLogs) {
      // Remove oldest logs
      this.logs.shift();
    }
  }

  /**
   * Get all logged requests
   * @returns {Array} Copy of the current logs array to prevent external mutation
   */
  getLogs() {
    // Return a copy of the logs array to prevent external mutation
    return [...this.logs];
  }

  /**
   * Clear all request logs
   */
  clearLogs() {
    this.logs = [];
  }
}

export default RequestLogger; 
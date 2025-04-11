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
    //MaxLogs is a positive number for memory efficiency
    this.maxLogs = (options.maxLogs !== undefined && options.maxLogs >= 0) ? options.maxLogs : 200;
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
      id: config.logId, 
      method: config.method ? config.method.toUpperCase() : 'GET',
      url: config.url,
      // For cancelled requests or network errors, response will be null
      status: response ? response.status : 0
    };

    // Oldest logs first order - Stacked newest on top
    this.logs.push(logEntry);

    // For memory efficiency, remove oldest logs at max capacity
    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Update an existing log entry with response data
   * @param {string|number} logId ID of the log entry to update
   * @param {Object|null} response Response object or null for failed requests
   */
  updateLog(logId, response) {
    // Important design consideration: We update logs even if logging is currently disabled
    // This ensures requests that started when logging was enabled get proper status codes
    if (!logId) {
      return;
    }
    
    // Find the log entry by ID and update status
    const logIndex = this.logs.findIndex(log => log.id === logId);
    if (logIndex >= 0) {
      if (response) {
        this.logs[logIndex].status = response.status;
      }
    }
  }

  /**
   * Get all logged requests
   * @returns {Array} Copy of the current logs array to prevent external mutation
   */
  getLogs() {
    // Return the copy of array to avoid external mutation
    return this.logs.map(log => ({
      method: log.method,
      url: log.url,
      status: log.status
    }));
  }

  /**
   * Clear all request logs
   */
  clearLogs() {
    this.logs = [];
  }
}

export default RequestLogger; 
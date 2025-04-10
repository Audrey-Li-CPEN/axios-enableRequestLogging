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
    this.maxLogs = options.maxLogs || 200;
  }

  enable() {
    this.enabled = true;
  }

 
  disable() {
    this.enabled = false;
  }


  isEnabled() {
    return this.enabled;
  }


  addLog(config, response) {
    if (!this.enabled) {
      return;
    }

    // Record log entry with required fields
    const logEntry = {
      method: config.method ? config.method.toUpperCase() : 'GET',
      url: config.url,
      // For cancelled requests or network errors, response will be null or undefined
      status: response ? response.status : 0
    };

    // Oldest logs first order - Stacked newest on top
    this.logs.push(logEntry);

    // for memory efficiency, trim logs if we exceed the maximum
    while (this.logs.length > this.maxLogs) {
      // Remove oldest logs
      this.logs.shift();
    }
  }

  getLogs() {
    // Return a copy of the logs array to prevent external mutation
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export default RequestLogger; 
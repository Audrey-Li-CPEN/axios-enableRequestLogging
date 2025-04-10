'use strict';

  /**
   * Create a new RequestLogger
   * @param {Object} options Configuration options
   * @param {Number} [options.maxLogs=100] Maximum number of logs to store
   */
class RequestLogger {

  constructor(options = {}) {
    this.logs = [];
    this.enabled = false;
    this.maxLogs = options.maxLogs || 100;
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
    if (!this.enabled) return;

    // Record log entry with required fields
    const logEntry = {
      method: (config.method).toUpperCase() || 'GET',
      url: config.url,
      status: response ? response.status : 0
    };

    // Oldest logs first order - Stacked
    this.logs.push(logEntry);

    // for memory efficiency, trim logs if we exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(1, this.maxLogs);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export default RequestLogger; 
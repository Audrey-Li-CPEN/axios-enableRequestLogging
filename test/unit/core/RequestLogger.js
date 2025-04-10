import RequestLogger from '../../../lib/core/RequestLogger.js';
import assert from 'assert';

describe('RequestLogger', function() {
  describe('constructor', function() {
    it('should create a new RequestLogger with default options', function() {
      const logger = new RequestLogger();
      assert.strictEqual(logger.enabled, false);
      assert.strictEqual(logger.maxLogs, 200);
      assert.deepStrictEqual(logger.logs, []);
    });

    it('should accept custom maxLogs option', function() {
      const logger = new RequestLogger({ maxLogs: 50 });
      assert.strictEqual(logger.maxLogs, 50);
    });
  });

  describe('enable/disable', function() {
    it('should enable logging', function() {
      const logger = new RequestLogger();
      assert.strictEqual(logger.enabled, false);
      
      logger.enable();
      assert.strictEqual(logger.enabled, true);
    });

    it('should disable logging', function() {
      const logger = new RequestLogger();
      logger.enable();
      assert.strictEqual(logger.enabled, true);
      
      logger.disable();
      assert.strictEqual(logger.enabled, false);
    });

    it('should check if logging is enabled', function() {
      const logger = new RequestLogger();
      assert.strictEqual(logger.isEnabled(), false);
      
      logger.enable();
      assert.strictEqual(logger.isEnabled(), true);
    });
  });

  describe('addLog', function() {
    it('should not add logs when disabled', function() {
      const logger = new RequestLogger();
      logger.disable();
      
      logger.addLog({ method: 'get', url: '/test' }, { status: 200 });
      assert.strictEqual(logger.logs.length, 0);
    });

    it('should add logs when enabled', function() {
      const logger = new RequestLogger();
      logger.enable();
      
      logger.addLog({ method: 'get', url: '/test' }, { status: 200 });
      assert.strictEqual(logger.logs.length, 1);
      
      const logEntry = logger.logs[0];
      assert.strictEqual(logEntry.method, 'GET');
      assert.strictEqual(logEntry.url, '/test');
      assert.strictEqual(logEntry.status, 200);
    });

    it('should format method as uppercase', function() {
      const logger = new RequestLogger();
      logger.enable();
      
      logger.addLog({ method: 'post', url: '/test' }, { status: 201 });
      assert.strictEqual(logger.logs[0].method, 'POST');
    });

    it('should handle missing response', function() {
      const logger = new RequestLogger();
      logger.enable();
      
      logger.addLog({ method: 'get', url: '/test' }, null);
      assert.strictEqual(logger.logs[0].status, 0);
    });

    it('should limit logs to maxLogs', function() {
      const logger = new RequestLogger({ maxLogs: 2 });
      logger.enable();
      
      logger.addLog({ method: 'get', url: '/test1' }, { status: 200 });
      logger.addLog({ method: 'get', url: '/test2' }, { status: 200 });
      logger.addLog({ method: 'get', url: '/test3' }, { status: 200 });
      
      assert.strictEqual(logger.logs.length, 2);
      assert.strictEqual(logger.logs[0].url, '/test2');
      assert.strictEqual(logger.logs[1].url, '/test3');
    });
  });

  describe('getLogs', function() {
    it('should return all logs', function() {
      const logger = new RequestLogger();
      logger.enable();
      
      logger.addLog({ method: 'get', url: '/test1' }, { status: 200 });
      logger.addLog({ method: 'post', url: '/test2' }, { status: 201 });
      
      const logs = logger.getLogs();
      assert.strictEqual(logs.length, 2);
      
      // Check first log entry
      assert.strictEqual(logs[0].method, 'GET');
      assert.strictEqual(logs[0].url, '/test1');
      assert.strictEqual(logs[0].status, 200);
      
      // Check second log entry
      assert.strictEqual(logs[1].method, 'POST');
      assert.strictEqual(logs[1].url, '/test2');
      assert.strictEqual(logs[1].status, 201);
    });
  });

  describe('clearLogs', function() {
    it('should clear all logs', function() {
      const logger = new RequestLogger();
      logger.enable();
      
      logger.addLog({ method: 'get', url: '/test' }, { status: 200 });
      assert.strictEqual(logger.logs.length, 1);
      
      logger.clearLogs();
      assert.strictEqual(logger.logs.length, 0);
    });
  });
});
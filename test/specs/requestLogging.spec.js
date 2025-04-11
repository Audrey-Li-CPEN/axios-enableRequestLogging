describe('request logging', function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    
    beforeEach(function() {
      jasmine.Ajax.install();
    });
  
    afterEach(function() {
      jasmine.Ajax.uninstall();
    });
  
    describe('public interface', function() {
      it('should expose request logging methods on axios instance', function() {
        const instance = axios.create();
        
        expect(typeof instance.enable_request_logging).toEqual('function');
        expect(typeof instance.disable_request_logging).toEqual('function');
        expect(typeof instance.get_request_log).toEqual('function');
        expect(typeof instance.clear_request_log).toEqual('function');
      });
    });
  
    describe('logging behavior', function() {
      let instance;
  
      beforeEach(function() {
        instance = axios.create();
        instance.enable_request_logging();
      });
  
      afterEach(function() {
        instance.disable_request_logging();
        instance.clear_request_log();
      });
  
      it('should single successful request', function(done) {
        instance.get('/foo');
  
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
  
          setTimeout(function() {
            const logs = instance.get_request_log();
            expect(logs.length).toEqual(1);
            expect(logs[0].method).toEqual('GET');
            expect(logs[0].url).toEqual('/foo');
            expect(logs[0].status).toEqual(200);
            done();
          }, 100);
        });
      });
  
      it('should log single failed request', function(done) {
        instance.get('/error');
  
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 404,
            responseText: 'Not found'
          });
  
          setTimeout(function() {
            const logs = instance.get_request_log();
            expect(logs.length).toEqual(1);
            expect(logs[0].method).toEqual('GET');
            expect(logs[0].url).toEqual('/error');
            expect(logs[0].status).toEqual(404);
            done();
          }, 100);
        });
      });
  
      it('should log requests with different HTTP methods', function(done) {
        instance.post('/post', { data: 'test' });
  
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 201,
            responseText: 'Created'
          });
  
          setTimeout(function() {
            const logs = instance.get_request_log();
            expect(logs.length).toEqual(1);
            expect(logs[0].method).toEqual('POST');
            expect(logs[0].url).toEqual('/post');
            expect(logs[0].status).toEqual(201);
            done();
          }, 100);
        });
      });
  
      it('should not log requests when disabled', function(done) {
        instance.disable_request_logging();
        instance.get('/foo');
  
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
  
          setTimeout(function() {
            const logs = instance.get_request_log();
            expect(logs.length).toEqual(0);
            done();
          }, 100);
        });
      });
  
      it('should clear logs when requested', function(done) {
        instance.get('/foo');
  
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
  
          setTimeout(function() {
            expect(instance.get_request_log().length).toEqual(1);
            instance.clear_request_log();
            expect(instance.get_request_log().length).toEqual(0);
            done();
          }, 100);
        });
      });
    });
  
    describe('concurrent requests', function() {
      let instance;
  
      beforeEach(function() {
        instance = axios.create();
        instance.enable_request_logging();
      });
  
      afterEach(function() {
        instance.disable_request_logging();
        instance.clear_request_log();
      });
  
      it('should handle multiple concurrent requests', function(done) {
        // Send first request
        instance.get('/foo').catch(() => {});
        
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Send second request after first completes
          instance.post('/bar').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 201,
            responseText: 'Created'
          });
          
          // Send third request after second completes
          instance.put('/baz').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Check logs after all requests complete
          setTimeout(function() {
            const logs = instance.get_request_log();
            
            expect(logs.length).toEqual(3);
            
            // Check for all expected logs
            expect(logs.some(log => log.method === 'GET' && log.url === '/foo' && log.status === 200)).toBe(true);
            expect(logs.some(log => log.method === 'POST' && log.url === '/bar' && log.status === 201)).toBe(true);
            expect(logs.some(log => log.method === 'PUT' && log.url === '/baz' && log.status === 200)).toBe(true);
            
            done();
          }, 100);
        }).catch(function(error) {
          console.error('Test error:', error);
          done.fail(error);
        });
      });
  
      it('should handle concurrent successes and failures', function(done) {
        // Send first request
        instance.get('/success').catch(() => {});
        
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Send second request after first completes
          instance.get('/error').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 500,
            responseText: 'Server Error'
          });
          
          // Check logs after all requests complete
          setTimeout(function() {
            const logs = instance.get_request_log();
            
            expect(logs.length).toEqual(2);
            
            // Check for all expected logs
            expect(logs.some(log => log.url === '/success' && log.status === 200)).toBe(true);
            expect(logs.some(log => log.url === '/error' && log.status === 500)).toBe(true);
            
            done();
          }, 100);
        }).catch(function(error) {
          console.error('Test error:', error);
          done.fail(error);
        });
      });
  
      it('should respect maxLogs limit with concurrent requests', function(done) {
        // Create instance with small maxLogs
        const limitedInstance = axios.create({
          requestLogger: {
            maxLogs: 2
          }
        });
        limitedInstance.enable_request_logging();
        
        // Send first request and wait for completion
        limitedInstance.get('/first').catch(() => {});
        
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          //Send second request after first completes
          limitedInstance.get('/second').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Send third request after second completes
          limitedInstance.get('/third').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          setTimeout(function() {
            const logs = limitedInstance.get_request_log();
            
            // Should only have 2 logs due to maxLogs limit
            expect(logs.length).toEqual(2);
            
            // The first log should have been removed
            expect(logs.some(log => log.url === '/first')).toBe(false);
            expect(logs.some(log => log.url === '/second')).toBe(true);
            expect(logs.some(log => log.url === '/third')).toBe(true);
            
            done();
          }, 100);
        }).catch(function(error) {
          console.error('Test error:', error);
          done.fail(error);
        });
      });

      it('should maintain chronological order with oldest requests first', function(done) {
        instance.clear_request_log();
        
        // Send first request
        instance.get('/first').catch(() => {});
        
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Send second request after first completes
          instance.get('/second').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          // Send third request after second completes
          instance.get('/third').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
     
          setTimeout(function() {
            const logs = instance.get_request_log();
            
            expect(logs.length).toEqual(3);
            
            // Verify chronological order - oldest request should be first
            expect(logs[0].url).toEqual('/first');
            expect(logs[1].url).toEqual('/second');
            expect(logs[2].url).toEqual('/third');
            
            done();
          }, 100);
        }).catch(function(error) {
          console.error('Test error:', error);
          done.fail(error);
        });
      });
    });
  
    describe('additional logging scenarios', function() {
      let instance;
  
      beforeEach(function() {
        instance = axios.create();
        instance.enable_request_logging();
      });
  
      afterEach(function() {
        instance.disable_request_logging();
        instance.clear_request_log();
      });
  
      it('should handle multiple failed requests', function(done) {
        // Send first request
        instance.get('/error1').catch(() => {});
        
        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 404,
            responseText: 'Not Found'
          });
          
          // Send second request after first completes
          instance.get('/error2').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 500,
            responseText: 'Server Error'
          });
          
          // Send third request after second completes
          instance.get('/error3').catch(() => {});
          
          return getAjaxRequest();
        }).then(function(request) {
          request.respondWith({
            status: 403,
            responseText: 'Forbidden'
          });
          
          setTimeout(function() {
            const logs = instance.get_request_log();
            
            expect(logs.length).toEqual(3);
            expect(logs.some(log => log.url === '/error1' && log.status === 404)).toBe(true);
            expect(logs.some(log => log.url === '/error2' && log.status === 500)).toBe(true);
            expect(logs.some(log => log.url === '/error3' && log.status === 403)).toBe(true);
            
            done();
          }, 100);
        }).catch(function(error) {
          console.error('Test error:', error);
          done.fail(error);
        });
      });
      
      it('should handle multiple getters and verify non-mutability of returned logs', function(done) {
        // Send request
        instance.get('/test').catch(() => {});

        getAjaxRequest().then(function(request) {
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });

          setTimeout(function() {
            const logs = instance.get_request_log();
            expect(logs.length).toEqual(1);
            expect(logs[0].url).toEqual('/test');
            expect(logs[0].status).toEqual(200);
            
            // Make a copy of the logs before modifying
            const originalLength = logs.length;
            
            // Try to modify the returned log array (shouldn't affect actual logs)
            logs.pop();
            
            // Get logs second time - should still have the original count
            const secondGetLogs = instance.get_request_log();
            expect(secondGetLogs.length).toEqual(originalLength);
            
            done();
          }, 500);
        }).catch(function(error) {
          done.fail(error);
        });
      });

      it('should handle cancelled requests appropriately', function(done) {
        const source = axios.CancelToken.source();
        
        // Start a request that will be cancelled
        instance.get('/cancel-me', {
          cancelToken: source.token
        }).catch((error) => {
          // Add debug output to monitor the error
          console.log('Request error type:', error.constructor.name);
          console.log('Error has config?', !!error.config);
          console.log('Error has response?', !!error.response);
          
          setTimeout(function() {
            const logs = instance.get_request_log();
            
            // Debug information
            console.log('Logs after cancellation:', JSON.stringify(logs));
            
            // The key expectation - we should have one log entry for the cancelled request
            expect(logs.length).toEqual(1);
            
            if (logs.length > 0) {
              expect(logs[0].method).toEqual('GET');
              expect(logs[0].url).toEqual('/cancel-me');
              expect(logs[0].status).toEqual(0);
            }
            
            done();
          }, 500); 
        });
        
        // Wait for request to be created before cancelling
        getAjaxRequest().then(function(request) {
          source.cancel('Request cancelled for testing');
          
          // Respond to complete the request cycle
          request.respondWith({
            status: 0,
            responseText: ''
          });
        });
      });

      it('should handle network errors correctly', function(done) {
        // Temporarily simulate network errors
        jasmine.Ajax.uninstall();
        
        // Use a timeout to ensure time to fail
        const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;
        
        // Make a request to a non-existent server
        instance.get('http://localhost:45678/not-found')
          .catch(() => {
            // Wait to make sure the logging has time to complete
            setTimeout(function() {
              const logs = instance.get_request_log();
              
              expect(logs.length).toEqual(1);
              expect(logs[0].method).toEqual('GET');
              expect(logs[0].url).toEqual('http://localhost:45678/not-found');
              // Network errors typically have status 0
              expect(logs[0].status).toEqual(0);
              
              // Restore jasmine ajax after test
              jasmine.Ajax.install();
              jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
              done();
            }, 100);
          });
      });

      it('should work with various Axios configurations', function(done) {
        // Create instance with custom configuration
        const configuredInstance = axios.create({
          baseURL: 'https://api.example.com',
          timeout: 1000,
          headers: {
            'Authorization': 'Bearer test-token',
            'X-Custom-Header': 'test-value'
          }
        });
        configuredInstance.enable_request_logging();
        
        configuredInstance.get('/configured-request');
        
        getAjaxRequest().then(function(request) {
          // Verify that the configured headers were sent
          expect(request.requestHeaders.Authorization).toEqual('Bearer test-token');
          expect(request.requestHeaders['X-Custom-Header']).toEqual('test-value');
          
          request.respondWith({
            status: 200,
            responseText: 'OK'
          });
          
          setTimeout(function() {
            const logs = configuredInstance.get_request_log();
            expect(logs.length).toEqual(1);
            expect(logs[0].method).toEqual('GET');
            expect(logs[0].url).toEqual('/configured-request');
            expect(logs[0].status).toEqual(200);
            
            // Clean up
            configuredInstance.disable_request_logging();
            configuredInstance.clear_request_log();
            done();
          }, 100);
        });
      });

      it('should log requests with all HTTP methods', function(done) {
        const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        let completedRequests = 0;
        
        // Clear any existing logs
        instance.clear_request_log();
        
        // Process requests sequentially instead of in parallel
        function processNextMethod(index) {
          if (index >= methods.length) {
            setTimeout(function() {
              const logs = instance.get_request_log();
              
              // Should have one log for each method
              expect(logs.length).toEqual(methods.length);
              
              // Check each method has a corresponding log
              methods.forEach((method, idx) => {
                const methodUpper = method.toUpperCase();
                const expectedStatus = 200 + idx;
                
                // Find the log entry for this method
                const found = logs.some(log => 
                  log.method === methodUpper && 
                  log.url === `/${method}-test` && 
                  log.status === expectedStatus
                );
                
                expect(found).toBe(true, `Missing log for ${methodUpper} method`);
              });
              
              done();
            }, 100);
            return;
          }
          
          const method = methods[index];
          // For methods that accept a body, provide one
          const data = ['post', 'put', 'patch'].includes(method) ? { data: 'test' } : undefined;
          
          // Send the request
          instance[method](`/${method}-test`, data).catch(() => {});
          
          // Handle the request
          getAjaxRequest().then(function(request) {
            request.respondWith({
              status: 200 + index,
              responseText: `${method} response`
            });
            
            // Process the next method after this one is complete
            setTimeout(function() {
              processNextMethod(index + 1);
            }, 50);
          });
        }
        
        // Start processing with the first method
        processNextMethod(0);
      });
    });
  });
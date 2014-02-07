describe('Errwischt.js', function() {
  var server;

  function TestError(message) {
    this.name = "TestError";
    this.message = (message || "");
    Error.apply(this);
    this.stack = (new Error()).stack;
  }
  TestError.prototype = new Error();
  TestError.prototype.constructor = TestError;

  function popLastSendData() {
    expect(server.requests.length).to.not.equal(0);
    var req = server.requests.pop();
    return JSON.parse(req.requestBody).data;
  }

  beforeEach(function enableCORS() {
    sinon.FakeXMLHttpRequest.prototype.withCredentials = sinon.FakeXMLHttpRequest.prototype.withCredentials || true;
  })

  beforeEach(function() {
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  describe('when not initialized', function() {
    it('.start does nothing', function() {
      Errwischt.start();
      expect(Errwischt.isCapturing).to.equal(false);
    });
  });

  describe('when initialized', function() {
    beforeEach(function() {
      Errwischt.setup('thisismyapikey');
    });

    it('has an api key', function() {
      expect(Errwischt._apiKey).to.equal('thisismyapikey');
    });

    it('.setup will flag it as capturing', function() {
      Errwischt.setup('thisismyapikey');
      expect(Errwischt.isCapturing).to.equal(true);
    });

    it('.start will flag it as capturing', function() {
      Errwischt.start();
      expect(Errwischt.isCapturing).to.equal(true);
    });

    describe('when not started', function() {
      beforeEach(function() {
        Errwischt.stop();
      });

      it('.onerror will not send a request', function() {
        window.onerror('My damn error', 'intheface.js', 3);
        expect(server.requests.length).to.equal(0);
      });

      it('.save will not send a request', function() {
        Errwischt.send(new TestError('My damn error'));
        // This two calls are from tracekit to determine stacktrace
        expect(server.requests.length).to.equal(2);
      });
    });

    describe('when started', function() {
      beforeEach(function() {
        Errwischt.start();
      });

      it('.stop/.start will flag it as non/do capturing', function() {
        Errwischt.stop();
        expect(Errwischt.isCapturing).to.equal(false);
        Errwischt.start();
        expect(Errwischt.isCapturing).to.equal(true);
      });

      it('.send will send the request using the apiKey used in setup', function() {
        server.respondWith('POST', 'http://api.errwischt.com/add', [200, {}, "Oh hi"]);
        Errwischt.send('my test error');
        expect(server.requests.length).to.equal(1);
        expect(server.requests[0].url).to.equal('http://api.errwischt.com/add');
        var body = JSON.parse(server.requests[0].requestBody);
        expect(body.token).to.equal('thisismyapikey');
      });

      it('.send will send the request to errwischt.local when on ENV=development', function() {
        Errwischt.ENV = 'development';
        server.respondWith('POST', 'http://errwischt.local:8181/add', [200, {}, "Oh hi"]);
        Errwischt.send('my test error');
        expect(server.requests.length).to.equal(1);
        expect(server.requests[0].url).to.equal('http://errwischt.local:8181/add');
        var body = JSON.parse(server.requests[0].requestBody);
        expect(body.token).to.equal('thisismyapikey');
        delete Errwischt.ENV;
      });

      it('.send with only message specified', function() {
        Errwischt.send('my test error');
        var data = popLastSendData();
        expect(data.error.message).to.equal('my test error');
        expect(data.error.type).to.equal('SimpleError');
      });

      it('.send with message string and error name specified', function() {
        Errwischt.send('An Error', 'my test error');
        var data = popLastSendData();
        expect(data.error.message).to.equal('my test error');
        expect(data.error.type).to.equal('An Error');
      });

      it('.send with a proper error', function() {
        Errwischt.send(new TestError('my test error'));
        var data = popLastSendData();
        expect(data.error.message).to.equal('my test error');
        expect(data.error.type).to.equal('TestError');
      });

      it('.onerror will send the error as UncaughtError', function() {
        window.onerror('My damn error', 'intheface.js', 3);
        var data = popLastSendData();
        expect(data.error.message).to.equal('My damn error');
        expect(data.error.type).to.equal('UncaughtError');
      });
    });

    describe('a simple send error should have', function() {
      var errorData;
      beforeEach(function() {
        Errwischt.start();
        Errwischt.send(new TestError('my own error'));
        errorData = popLastSendData();
      });

      it('sends info about itself with error', function() {
        expect(errorData.client.name).to.equal('errwischt.js');
        expect(errorData.client.version).to.not.equal(null);
      });

      it('sends a time', function() {
        expect(errorData.time).to.not.equal(null);
      });

      it('a message', function() {
        expect(errorData.error.message).to.equal('my own error');
      });

      it('a class name of error', function() {
        expect(errorData.error.type).to.equal('TestError');
      });

      it('a stack trace', function() {
        expect(errorData.stackTrace.length).to.equal(6);
        var stackItem = errorData.stackTrace[0];
        expect(stackItem.column).to.equal(24);
        expect(stackItem.lineNumber).to.equal(139);
        expect(stackItem.methodName).to.equal('Context.<anonymous>');
        expect(stackItem.file).to.contain('errwischt_test.js');
      });

      it('the environment set', function() {
        var env = errorData.environment;
        expect(env.browser).to.equal(navigator.appCodeName);
        expect(env.browserName).to.equal(navigator.appName);
        expect(env.browserVersion).to.equal(navigator.appVersion);
        expect(env.platform).to.equal(navigator.platform);
        expect(env.userAgent).to.equal(navigator.userAgent);
        expect(env.cookieEnabled).to.equal(navigator.cookieEnabled);
        expect(env.browserWidth).to.not.equal(null);
        expect(env.browserHeigth).to.not.equal(null);
        expect(env.screenWidth).to.not.equal(null);
        expect(env.screenHeigth).to.not.equal(null);
      });

      it('the request data', function() {
        if (document.location.href.indexOf('?') === -1) {
          document.location.href += '?test';
        }
        expect(errorData.request.url).to.equal(document.location.href.split('?')[0]);
        expect(errorData.request.queryString).to.equal(document.location.search);
      });
    });

    describe('calling send with message and custom object', function() {
      var errorData;
      beforeEach(function() {
        Errwischt.start();
        Errwischt.send(new TestError('my own error'), { custom: 'data', foo: 42 });
        errorData = popLastSendData();
      });

      it('a complete error definition', function() {
        expect(errorData.error.message).to.equal('my own error');
        expect(errorData.error.type).to.equal('TestError');
      });

      it('a stack trace', function() {
        expect(errorData.stackTrace).to.not.be.empty();
      });

      it('sends the custom data along', function() {
        expect(errorData.data.custom).to.equal('data');
        expect(errorData.data.foo).to.equal(42);
      });

    });

    describe('setting global custom data', function() {
      var errorData;
      beforeEach(function() {
        Errwischt.start();
        Errwischt.customData({ custom: 'yes', bar: 1 });
      });

      it('sends the custom data along with only a message', function() {
        Errwischt.send('baam', { custom: 'data', foo: 42 });
        errorData = popLastSendData();
        expect(errorData.error.message).to.equal('baam');
        expect(errorData.data.custom).to.equal('data');
        expect(errorData.data.foo).to.equal(42);
        expect(errorData.data.bar).to.equal(1);
      });

      it('is also used by onerror errors', function() {
        window.onerror('baam', 'intheface.js', 3);
        errorData = popLastSendData();
        expect(errorData.error.message).to.equal('baam');
        expect(errorData.data.custom).to.equal('yes');
        expect(errorData.data.bar).to.equal(1);
      });

      describe('calling send with message and own custom object', function() {
        beforeEach(function() {
          Errwischt.send(new Error('my own error'), { custom: 'data', foo: 42 });
          errorData = popLastSendData();
        });

        it('it will merge both custom data objects to one', function() {
          expect(errorData.data.custom).to.equal('data');
          expect(errorData.data.foo).to.equal(42);
          expect(errorData.data.bar).to.equal(1);
        });
      });
    });
  });
});

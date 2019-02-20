;(function (global) {
  function selectorModule() {
    var defName = 'YYEINVOICE';
    var supportPostMessage = 'postMessage' in window;
    var allowOrigin = ['https://meet.yonyoucloud.com', 'https://me.yonyoucloud.com',
      'https://yesfp.yonyoucloud.com', 'http://fapiao.yonyoucloud.com', 'http://127.0.0.1:5500'
    ];
    var listenCallback;

    // Message类
    function Selector(messageName) {
      this.listenFnArr = [];
      this.name = messageName || defName;
      this.initListen();
    }

    // 初始化消息监听
    Selector.prototype.initListen = function () {
      var self = this;
      listenCallback = function (event) {
        var allowAccess = false;
        if (typeof event == 'object' && event.origin) {
          for (var k = 0; k < allowOrigin.length; k++) {
            var item = allowOrigin[k];
            if (event.origin === item) {
              allowAccess = true;
              break;
            }
          }
        }
        if (!allowAccess) {
          return;
        }
        var msg = event.data || '';
        var msgPairs = msg.split('__YY__');
        var name = msgPairs[0];
        var msg = msgPairs[1] || {};
        for (var i = 0; i < self.listenFnArr.length; i++) {
          if (self.name === name) {
            self.listenFnArr[i](JSON.parse(msg));
          }
        }
      };
      if (supportPostMessage) {
        // 兼容IE监听
        if ('addEventListener' in document) {
          window.addEventListener('message', listenCallback, false);
        } else if ('attachEvent' in document) {
          window.attachEvent('onmessage', listenCallback);
        }
      } else {
        throw new Error("浏览器不支持PostMessage，请升级浏览器");
      }
    };

    // 监听消息
    Selector.prototype.onSelected = function (callback) {
      if (callback && typeof callback == 'function') {
        var len = this.listenFnArr.length;
        var cbIsExist = false;
        for (var i = 0; i < len; i++) {
          if (this.listenFnArr[i] == callback) {
            cbIsExist = true;
            break;
          }
        }
        if (!cbIsExist) {
          this.listenFnArr.push(callback);
        }
      } else {
        throw new Error('onSelected事件参数不能为空并且类型必须为function');
      }
      
    };
    // 注销监听
    Selector.prototype.removeEvent = function () {
      // 兼容IE  移除监听
      if ('removeEventListener' in document) {
        window.removeEventListener('message', listenCallback, false);
      } else if ('detachEvent' in document) {
        window.detachEvent('onmessage', listenCallback);
      }
      this.listenFnArr = [];
    };
    return Selector;
  }

  var moduleName = selectorModule();
  if (typeof module !== 'undefined' && typeof exports === 'object') {
    module.exports = moduleName;
  } else if (typeof define === 'function' && (define.amd || define.cmd)) {
    define(function () {
      return moduleName;
    });
  } else {
    global.Selector = moduleName;
  }
})(this || (typeof window !== 'undefined' ? window : global));

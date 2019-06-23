"use strict";
let Center = {channel_url: "ws://imsg.airi.net.cn/", socket_time_out: 9, valid: true};
// let Center = {channel_url: "ws://127.0.0.1:8008/", socket_time_out: 9, valid: true, retry: 3};
(function (window) {
    let socket, session = {}, ID_SEQ = 1, config = {listener: null, log: console}, listener = {
        onOpened: function (event) {
            if (config.listener != null) {
                config.listener.onOpened(event);
            }
            handshake();
        },
        onClosed: function (event) {
            if (config.listener != null) {
                config.listener.onClosed(event);
            }
            session = {};
            ID_SEQ = 1;
            socket = null;
        },
        onHandshake: function () {
            session.handshakeOk = true;
            if (config.listener != null) {
                config.listener.onHandshake();
            }
            //暂不直接连接
            // if (config.userId) {
            //     bindUser(config.userId, config.tags);
            // }
        },
        onBindUser: function (success) {
            if (config.listener != null) {
                config.listener.onBindUser(success);
            }
        },
        onReceivePush: function (message, messageId) {
            if (config.listener != null) {
                config.listener.onReceivePush(message, messageId);
            }
        },
        onKickUser: function (userId, deviceId) {
            if (config.listener != null) {
                config.listener.onKickUser(userId, deviceId);
            }
            doClose(-1, "kick user");
        }
    };
    const Command = {
        HANDSHAKE: 2,
        BIND: 5,
        UNBIND: 6,
        ERROR: 10,
        OK: 11,
        KICK: 13,
        PUSH: 15,
        ACK: 23,
        UNKNOWN: -1
    };

    function Packet(cmd, body, sessionId) {
        return {
            cmd: cmd,
            flags: 16,
            sessionId: sessionId || ID_SEQ++,
            body: body
        }
    }

    function handshake() {
        config.log.info("<<< send handshake message, deviceId=" + config.deviceId);
        send(Packet(Command.HANDSHAKE, {
                deviceId: config.deviceId,
                osName: config.osName,
                osVersion: config.osVersion,
                clientVersion: config.clientVersion
            })
        );
    }

    function bindUser(userId, tags) {
        if (userId && userId != session.userId) {
            config.log.info("<<< send bindUser message, userId=" + userId);
            session.userId = userId;
            session.tags = tags;
            send(Packet(Command.BIND, {userId: userId, data: userId, tags: tags}));
        } else {
            config.log.error("user " + userId + " already bind");
        }
    }

    function keepAlive() {
        config.log.info("<<< send heartbeat for keep alive with ng" + userInfo.userId);
        var packet = Packet(Command.PUSH, {});
        send(packet);
    }

    function ack(sessionId) {
        config.log.debug("<<< send ack message, sessionId=" + sessionId);
        send(Packet(Command.ACK, null, sessionId));
    }

    function send(packet) {
        if (!socket) {
            return;
        }
        let message = JSON.stringify(packet);
        if (socket.readyState == WebSocket.OPEN) {
            socket.send(message);
            config.log.debug("<<< send message to server, message=" + message);
        } else {
            config.log.error("The socket is not open. message=" + message);
            Center.valid = false;
        }
    }

    function dispatch(packet) {
        switch (packet.cmd) {
            case Command.HANDSHAKE: {
                config.log.info(">>> handshake ok.");
                listener.onHandshake();
                break;
            }
            case Command.OK: {
                if (packet.body.cmd == Command.BIND) {
                    config.log.info(">>> bind user ok.");
                    listener.onBindUser(true);
                } else if (packet.body.cmd == Command.PUSH) {
                    config.log.info("receive push message from server:" + packet.body.data);
                    process(packet.body.data);
                }
                break;
            }
            case Command.ERROR: {
                if (packet.body.cmd == Command.BIND) {
                    config.log.warn(">>> bind user failure.");
                    listener.onBindUser(false);
                    Center.valid = false;
                    window.clearInterval(timer);
                }
                break;
            }

            case Command.KICK: {
                if (session.userId == packet.body.userId && config.deviceId
                    == packet.body.deviceId) {
                    config.log.warn(">>> receive kick user.");
                    listener.onKickUser(packet.body.userId, packet.body.deviceId);
                }
                break;
            }

            case Command.PUSH: {
                config.log.info(">>> receive push, content=" + packet.body.content);
                let sessionId;
                if ((packet.flags & 8) != 0) {
                    ack(packet.sessionId);
                } else {
                    sessionId = packet.sessionId
                }
                listener.onReceivePush(packet.body.content, sessionId);
                break;
            }
        }
    }

    function onReceive(event) {
        config.log.debug(">>> receive packet=" + event.data);
        dispatch(JSON.parse(event.data))
    }

    function onOpen(event) {
        config.log.info("Web Socket opened!");
        listener.onOpened(event);
    }

    function onClose(event) {
        config.log.info("Web Socket closed!");
        listener.onClosed(event);
        // 断线重连
        if (Center.valid && Center.retry-- > 0) {
            login();
        }
    }

    function onError(event) {
        config.log.info("Web Socket receive, error");
        doClose();
    }

    function doClose(code, reason) {
        if (socket) {
            socket.close();
        }
        config.log.info("try close web socket client, reason=" + reason);
    }

    function doConnect(cfg) {
        config = copy(cfg);
        socket = new WebSocket(config.url);
        socket.onmessage = onReceive;
        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onerror = onError;
        config.log.debug("try connect server, url=" + config.url);
    }

    function copy(cfg) {
        for (let p in cfg) {
            if (cfg.hasOwnProperty(p)) {
                config[p] = cfg[p];
            }
        }
        return config;
    }

    /**
     * 封装ajax函数
     *
     * @param {string}opt.type http连接的方式，包括POST和GET两种方式
     * @param {string}opt.url 发送请求的url
     * @param {boolean}opt.async 是否为异步请求，true为异步的，false为同步的
     * @param {object}opt.data 发送的参数，格式为对象类型
     * @param {function}opt.success ajax发送并接收成功调用的回调函数
     */
    function ajax(opt) {
        opt = opt || {};
        opt.method = opt.method.toUpperCase() || 'POST';
        opt.contentType = opt.contentType
            || 'application/x-www-form-urlencoded;charset=utf-8';
        opt.url = opt.url || '';
        opt.async = opt.async || true;
        opt.data = opt.data || null;
        opt.success = opt.success || function () {
        };
        var xmlHttp = null;
        if (XMLHttpRequest) {
            xmlHttp = new XMLHttpRequest();
        } else {
            xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        var postData = opt.data;
        //需要考虑application/json格式
        if (opt.method == 'GET' || opt.contentType == ''
            || !opt.contentType.startsWith(
                "application/json")) {
            var params = [];
            for (var key in opt.data) {
                params.push(key + '=' + opt.data[key]);
            }
            postData = params.join('&');
        }
        if (opt.method.toUpperCase() === 'POST') {
            xmlHttp.open(opt.method, opt.url, opt.async);
            xmlHttp.setRequestHeader('Content-Type', opt.contentType);
            xmlHttp.send(postData);
        } else if (opt.method.toUpperCase() === 'GET') {
            xmlHttp.open(opt.method, opt.url + '?' + postData, opt.async);
            xmlHttp.send(null);
        }
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                opt.success(xmlHttp.responseText);
            }
        };
    }

    window.mpush = {
        connect: doConnect,
        close: doClose,
        bindUser: bindUser,
        push: keepAlive
    }
    window.Get = function (opt) {
        opt = opt || {}
        opt.method = 'Get';
        ajax(opt);
    }
    window.Post = function (opt) {
        opt = opt || {}
        opt.method = 'Post';
        opt.contentType = opt.contentType
            || 'application/x-www-form-urlencoded;charset=utf-8';
        ajax(opt);
    }
    const timer = window.setInterval(keepAlive, Center.socket_time_out * 60 * 1000);

})(window);

var userInfo = {
    uid: "",
    userId: "",
    status: -1//-1表示未连接服务器, 0表示未绑定，1表示已绑定
}

function $(id) {
    return document.getElementById(id);
}

let log = {
    log: function () {
        // $("responseText").value += (new Date().toLocaleString() + " " + (Array.prototype.join.call(
        //     arguments, "") + "\r\n"));
        var msg = (new Date().toLocaleString() + " " + (Array.prototype.join.call(
            arguments, "") + "\r\n"));
        console.log(msg);

    }
};
log.debug = log.info = log.warn = log.error = log.log;

function guid1() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function connect() {
    mpush.connect({
        url: Center.channel_url,
        deviceId: guid1(),
        osName: "web",
        osVersion: navigator.userAgent,
        clientVersion: "1.0",
        log: log,
        listener: {
            onOpened: function (event) {
            },
            onClosed: function (event) {
            },
            onHandshake: function () {
                userInfo.status = 0;
            },
            onReceivePush: function (message, messageId) {
                process(JSON.parse(message).content);
            },
            onBindUser: function (success) {
                userInfo.status = 1;
            },
            onKickUser: function (userId, deviceId) {
                userInfo.status = -1;
            }
        }
    });
}

function bind() {
    //首先查询绑定信息
    mpush.bindUser(ticket);
}

function login() {
    connect();
    setTimeout(bind, 1000);
}

window.onload = function () {
    login();
};
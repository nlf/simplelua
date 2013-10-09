var net = require('net');
var util = require('util');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var redis = require('redis');

function SimpleRedis(client, options) {
    var self = this;

    options = options || {};
    var scriptPath = options.scriptPath || './lua';
    delete options.scriptPath;

    redis.RedisClient.call(this, client, options);

    var files = fs.readdirSync(scriptPath);
    var name;
    for (var i = 0, l = files.length; i < l; i++) {
        if (path.extname(files[i]).toLowerCase() === '.lua') {
            name = path.basename(files[i], '.lua');
            SimpleRedis.prototype[name] = (function (name, script) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    args = [script, 0].concat(args);
                    var callback;

                    if (typeof args[args.length - 1] === 'function') callback = args.pop();
                    return self.eval(args, callback);
                };
            })(name, fs.readFileSync(path.join(scriptPath, files[i]), 'utf8'));
        }
    }
}

util.inherits(SimpleRedis, redis.RedisClient);

exports.createClient = function (port, host, options) {
    port = port || 6379;
    host = host || '127.0.0.1';

    var client = net.createConnection(port, host);
    var r = new SimpleRedis(client, options);
    r.port = port;
    r.host = host;

    return r;
};

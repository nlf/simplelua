var net = require('net');
var util = require('util');
var fs = require('fs');
var path = require('path');
var redis = require('redis');
var walkdir = require('walkdir');

// Given an object: { foo: { a: 1, b: 2 } }
// and key: foo
// and function: newFoo
//
// this function sets object.foo = newFoo, but copies the existing
// properties onto the function so that
// object.foo() works, but so does object.foo.a -> 1
var replaceObjectWithFunction = function (object, key, fn) {
    if (object[key]) {
        Object.keys(object[key]).forEach(function (k) {
            fn[k] = object[key][k];
        });
    }
    object[key] = fn;
};

// Follows an object hierarchy down the leaves listed 
// in the array
var navigateObjectByArray = function (object, leaves) {
    return leaves.reduce(function (leaf, nextLeafName) {
        return leaf && leaf[nextLeafName];
    }, object);
};


function SimpleRedis(client, options) {
    var self = this;

    options = options || {};
    var scriptPath = options.scriptPath || './lua';
    delete options.scriptPath;

    redis.RedisClient.call(this, client, options);

    walkdir.sync(scriptPath, function (filename, stat) {
        var relativePathParts = path.relative(scriptPath, filename).split(path.sep);
        var name, prototype, luaFn;

        relativePathParts.pop(); //Skip the last node
        prototype = navigateObjectByArray(SimpleRedis.prototype, relativePathParts);

        if (!prototype) return;

        if (stat.isDirectory()) {
            //Create empty object for directories
            name = path.basename(filename);
            if (!prototype[name]) prototype[name] = {};

        } else if (stat.isFile() && path.extname(filename).toLowerCase() === '.lua') {
            name = path.basename(filename, '.lua');

            luaFn = (function (script) {
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    args = [script, 0].concat(args);
                    var callback;

                    if (typeof args[args.length - 1] === 'function') callback = args.pop();
                    return self.eval(args, callback);
                };
            })(fs.readFileSync(filename, 'utf8'));

            replaceObjectWithFunction(prototype, name, luaFn);
        }
    });
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

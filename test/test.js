var simplelua = require('../index.js');
var client = simplelua.createClient(6379, '127.0.0.1', { scriptPath: __dirname + '/lua' });

var assert = require('assert');

assert(typeof client.basic === 'function', "Adds functions to the prototype");
assert(typeof client.user === 'object', "Creates objects for sub-directories");
assert(typeof client.user.create === 'function', "Adds functions in sub-directories to nested objects");

assert(typeof client.user.nested.mofn === 'function', "Adds functions in sub-sub-directories to nested objects");

assert(typeof client.company === 'function', "Works with directory named the same as a function");
assert(typeof client.company.create === 'function', "Adds functions in sub-directories to nested functions");

console.log('All tests passed');
client.end();

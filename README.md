SimpleLua
=========

This module was written to provide a very simple wrapper for the redis library to add lua scripts as members of the prototype.

Usage
-----

    ./lua/print.lua

```lua
-- all arguments passed to the function will be in the ARGV table, in order
return ARGV[1]
```

    client.js

```js
// the scriptPath option is optional and defaults to './lua'
// it specifies what directory contains your lua scripts
// all other parameters are identical to the node_redis module

var client = require('simplelua').createClient(6379, '127.0.0.1', { scriptPath: './lua' });

// since we loaded the file print.lua, we now have client.print available
client.print('testing', function (err, reply) {
  console.log(reply); // "testing"
});
```

Security Considerations
-----------------------

This module *will* allow you to overwrite native redis commands and potentially completely break the module or destroy your data. Consider yourself warned.

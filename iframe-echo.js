var context = require.context('./src/iframe', true, /.js$/);
context.keys().forEach(context);
module.exports = context;

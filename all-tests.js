var context = require.context('./src/tests', true, /.js$/);
context.keys().forEach(context);
module.exports = context;

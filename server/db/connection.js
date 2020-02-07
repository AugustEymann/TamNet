const monk = require('monk');
const connectionString = 'mongodb://admin:admin1234@ds227808.mlab.com:27808/tamtest';
const db = monk(connectionString);

module.exports = db;
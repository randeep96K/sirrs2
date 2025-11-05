const User = require('./User');
const Incident = require('./Incident');

// Define associations
User.hasMany(Incident, {
  foreignKey: 'reporterId',
  as: 'incidents'
});

Incident.belongsTo(User, {
  foreignKey: 'reporterId',
  as: 'reporter'
});

module.exports = {
  User,
  Incident
};
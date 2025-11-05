const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: {
        args: [1, 200],
        msg: 'Title must be between 1 and 200 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Description is required' },
      len: {
        args: [1, 2000],
        msg: 'Description must be between 1 and 2000 characters'
      }
    }
  },
  category: {
    type: DataTypes.ENUM('road', 'water', 'electricity', 'waste', 'safety', 'other'),
    defaultValue: 'other'
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Location stored as separate fields (MySQL doesn't have native geospatial for Point)
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'acknowledged', 'in-progress', 'resolved', 'rejected'),
    defaultValue: 'pending'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  timeline: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  resolutionPhotos: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'incidents',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Incident;

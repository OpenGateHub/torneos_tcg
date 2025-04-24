const Sequelize = require('sequelize');
const db = require('../config/db');
const Usuarios = require('./Usuarios');
const Torneo = require('./Torneo');

const Inscripciones = db.define('Inscripciones', {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  torneoId: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'inscripciones'
});

Inscripciones.belongsTo(Usuarios, { foreignKey: 'usuarioId', as:'usuario' });
Inscripciones.belongsTo(Torneo, { foreignKey: 'torneoId' });

module.exports = Inscripciones;

// models/Enfrentamientos.js
const Sequelize = require('sequelize');
const db = require('../config/db');

const Enfrentamientos = db.define('Enfrentamientos', {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  torneoId: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  jugador1Id: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  jugador2Id: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  ronda: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  ganadorId: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true // se completa cuando termina el enfrentamiento o queda vacio en caso de empate
  },
  empate: {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  finalizado: {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'enfrentamientos',
  timestamps: true
});


Enfrentamientos.associate = (models) => {
  Enfrentamientos.belongsTo(models.Usuarios, { as: 'jugador1', foreignKey: 'jugador1Id' });
  Enfrentamientos.belongsTo(models.Usuarios, { as: 'jugador2', foreignKey: 'jugador2Id' });
  Enfrentamientos.belongsTo(models.Usuarios, { as: 'ganador', foreignKey: 'ganadorId' });
  Enfrentamientos.belongsTo(models.Torneo, { foreignKey: 'torneoId' });
};
module.exports = Enfrentamientos;

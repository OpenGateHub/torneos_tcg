const Sequelize = require("sequelize");
const db = require("../config/db");
const Company = require('./Company');
const Usuarios = require('./Usuarios');

const UserCompany = db.define(
    "UserCompany",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false
        },
        company: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        timestamps: true,
        tableName: "users_companies",
    }
);

// Definir las asociaciones
UserCompany.belongsTo(Company, { foreignKey: 'company' });
UserCompany.belongsTo(Usuarios, { foreignKey: 'user' });

module.exports = UserCompany;

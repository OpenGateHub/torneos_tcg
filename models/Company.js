const Sequelize = require("sequelize");
const db = require("../config/db");

const Company = db.define(
    "Company",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name:{
            type: Sequelize.DataTypes.CHAR(100),
        },
        address: {
            type: Sequelize.DataTypes.CHAR(250),
        },
        phone: {
            type: Sequelize.DataTypes.CHAR(20),
        },
        email: {
            type: Sequelize.DataTypes.CHAR(250),
        },
        coin_name: {
            type: Sequelize.DataTypes.CHAR(100),
        },
        owner : {
            type: Sequelize.DataTypes.CHAR(100),
        }
    },
    {
        timestamps: true,
        tableName: "companies",
    }
);

Company.associate = (models) => {
    Company.hasMany(models.Torneo, {
        foreignKey: "companyId",
        as: "torneos",
    });

    Company.belongsToMany(models.Usuarios, {
        through: models.UserCompany,
        foreignKey: 'company',
        otherKey: 'user',
        as: 'usuarios',
      });
};

module.exports = Company;

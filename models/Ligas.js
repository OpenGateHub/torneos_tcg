const Sequelize = require("sequelize");
const db = require("../config/db");

const League = db.define(
    "League",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: Sequelize.DataTypes.CHAR(100),
            allowNull: false
        },
        description: {
            type: Sequelize.DataTypes.CHAR(250),
            allowNull: true
        },
        startDate: {
            type: Sequelize.DataTypes.DATE,
            allowNull: true
        },
        endDate: {
            type: Sequelize.DataTypes.DATE,
            allowNull: true
        },
        is_active: {
            type: Sequelize.DataTypes.DATE,
            allowNull: true
        },
        firstPlacePrize:{
            type: Sequelize.DataTypes.CHAR(100),
            allowNull: true
        },
        secondPlacePrize:{
            type: Sequelize.DataTypes.CHAR(100),
            allowNull: true
        },
        thirdPlacePrize:{
            type: Sequelize.DataTypes.CHAR(100),
            allowNull: true
        },
        companyId: {
            type: Sequelize.DataTypes.INTEGER,
            references: {
                model: "companies",
                key: "id",
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        }
    },
    {
        timestamps: true,
        tableName: "leagues",
    }
);

League.associate = (models) => {
    League.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
    });
    League.hasMany(models.Torneo, {
        foreignKey: 'leagueId',
        as: 'tournaments'
    });
}

module.exports = League
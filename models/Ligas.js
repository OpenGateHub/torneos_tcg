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
            allowNull: false
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
    })
}

module.exports = League
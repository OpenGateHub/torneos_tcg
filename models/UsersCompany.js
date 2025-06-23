const Sequelize = require("sequelize");
const db = require("../config/db");

const UserCompany = db.define(
    "UserCompany",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user :{
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false
        },
        company :{
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        timestamps: true,
        tableName: "users_companies",
    }
);

module.exports = UserCompany;

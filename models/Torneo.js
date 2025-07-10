const Sequelize = require("sequelize");
const db = require("../config/db");

const Torneo = db.define(
    "Torneo",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [3, 100],
                    msg: "El nombre del torneo debe tener entre 3 y 100 caracteres",
                },
            },
        },
        fecha_inicio: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: "Debe ingresar una fecha de inicio válida",
                },
            },
        },
        fecha_fin: {
            type: Sequelize.DataTypes.DATE,
            allowNull: true,
            validate: {
                isDate: {
                    msg: "Debe ingresar una fecha de finalización válida",
                },
            },
        },
        tipo: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            defaultValue: "casual",
            validate: {
                isIn: {
                    args: [["casual", "suizo", "otro"]],
                    msg: 'El tipo debe ser "casual", "suizo" o "otro"',
                },
            },
        },
        estado: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            defaultValue: "activo",
            validate: {
                isIn: {
                    args: [["activo", "en progreso", "cerrado"]],
                    msg: 'El estado debe ser "activo", "en progreso" o "cerrado"',
                },
            },
        },
        descripcion: {
            type: Sequelize.DataTypes.TEXT,
            allowNull: true,
        },
        participantes: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        maxParticipantes: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            default: 0
        },
        playoff: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        inscripcionesCerradas: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        companyId: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "companies",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        leagueId: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "leagues",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },
    },
    {
        timestamps: true,
        tableName: "torneos",
    }
);

Torneo.associate = (models) => {
    Torneo.belongsToMany(models.Usuarios, {
        through: "Inscripciones",
        foreignKey: "torneoId",
        otherKey: "usuarioId",
        as: "Usuarios",
    });
    Torneo.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
    });
    Torneo.belongsTo(models.League, {
        foreignKey: "leagueId",
        as: "league",
    });
    Torneo.hasMany(models.Enfrentamientos, {
        foreignKey: "torneoId",
        as: "enfrentamientos",
    });
};

module.exports = Torneo;

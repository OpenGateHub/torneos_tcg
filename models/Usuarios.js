const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const Usuarios = db.define('Usuarios', {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'El correo debe ser válido'
      },
    }
  },
  nombre: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    validate: {
      len:{
        args: [3,50],
        msg: 'El nombre debe tener entre 3 y 50 caracteres'
      }
    }
  },
  last_name: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [3,50],
        msg: 'El apellido debe tener entre 3 y 50 caracteres'
      }
    }
  },
  birthdate: {
    type: Sequelize.DataTypes.DATE,
    allowNull:true
  },
  provincia : {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  dni: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8],
        msg: 'La contraseña debe tener al menos 8 caracteres'
      }
    }
  },
  rol: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    defaultValue: 'jugador', // o 'usuario'
    validate: {
      isIn: {
        args: [['admin', 'jugador']],
        msg: 'El rol debe ser admin o jugador'
      }
    }
  },
  token: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true // solo se completa cuando se genera
  },
  expiraToken: {
    type: Sequelize.DataTypes.DATE,
    allowNull: true
  },
  activo:{
    type: Sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verified: {
    type: Sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  bio: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },

    // passwordFuerte: {
    //     type: Sequelize.DataTypes.STRING,
    //     allowNull: false,
    //     validate: {
    //       is: {
    //         args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    //         msg: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número'
    //       }
    //     }
    //   },
},{
  hooks: {
    beforeCreate: async (usuario) => {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(usuario.password, salt);
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    }
  },
  timestamps: true,
  tableName: 'usuarios'
});

//Método para comparar los password
// Método para comparar password
Usuarios.prototype.validarPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};
// Integracion con la tabla de inscripciones
Usuarios.associate = models => {
  Usuarios.belongsToMany(models.Torneo, {
    through: 'Inscripciones',
    foreignKey: 'usuarioId',
    otherKey: 'torneoId',
    as: 'Torneos'
  });

  Usuarios.belongsToMany(models.Company, {
    through: models.UserCompany,
    foreignKey: 'user',
    otherKey: 'company',
    as: 'companies',
  });
};



module.exports = Usuarios;
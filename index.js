const express = require('express');
const router = require('./routes');
require('dotenv').config({path:'variables.env'});
const cors = require('cors');
require('colors')


//Conexion a la DB y carga de modelos
const db = require('./config/db.js');
const Usuarios = require('./models/Usuarios.js');
const UserCompany = require('./models/UsersCompany.js')
const Company = require('./models/Company.js')
const Inscripciones = require('./models/Inscripciones.js');
const Torneo = require('./models/Torneo.js');
const Enfrentamientos = require('./models/Enfrentamientos.js');
const Ligas = require('./models/Ligas.js')

// Llamar a las asociaciones después de cargar los modelos
Usuarios.associate(db.models);
Company.associate?.(db.models);
Torneo.associate(db.models);
// Inscripciones.associate(db.models)
Enfrentamientos.associate(db.models)
Ligas.associate(db.models)

// Inscripciones.associate(db.models);
// force true only development, i need implement de migration system
db.sync({
  alter: true
}).then(()=> console.log("DB conectada".green)).catch((error)=> console.log(error))

//Creacion de la App
const app = express();

// Configurar CORS
const whitelist = [
  process.env.URL_FRONTEND,
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing
app.use('/', router())

// Puerto del servidor
app.listen(process.env.PORT, ()=>{
  console.log(`Server running on http://localhost:${process.env.PORT}`.blue);
})
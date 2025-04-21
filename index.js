const express = require('express');
const router = require('./routes');
require('dotenv').config({path:'variables.env'});

//Conexion a la DB
const db = require('./config/db.js');
require('./models/Usuarios.js');
db.sync().then(()=> console.log("DB conectada")).catch((error)=> console.log(error))


//Creacion de la App
const app = express();

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing
app.use('/', router())

// Puerto del servidor
app.listen(process.env.PORT, ()=>{
  console.log("Servidor funcionando");
})
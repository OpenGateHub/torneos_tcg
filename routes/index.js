const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Controllers
const usuariosController = require('../controllers/usuariosController');

module.exports = function(){
  //Index
  router.get('/', (req,res)=>{
    res.send("Servidor funcionando, torneito de cartulis")
  })
  
  /** USUARIOS */
  //Crear Usuario
  router.post('/crear-cuenta',[
    body('email').isEmail().withMessage('El correo no es válido'),
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
  ], usuariosController.crearCuenta);

  //Confirmar cuenta
  router.get('/confirmar-cuenta/:token', usuariosController.confirmarCuenta)

  return router;
}
const { body, param, query } = require('express-validator');
const { validateResult } = require('../helpers/validateHelper');

const validateCreate = [
    body('email')
        .exists().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido'),
    body('nombre')
        .exists().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
    body('last_name')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('El apellido debe tener entre 3 y 50 caracteres'),
    body('password')
        .exists().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula'),
    body('birthdate')
        .optional()
        .isISO8601().withMessage('La fecha debe estar en formato ISO8601'),
    body('provincia')
        .optional()
        .isString().withMessage('La provincia debe ser un texto'),
    body('city')
        .optional()
        .isString().withMessage('La ciudad debe ser un texto'),
    body('bio')
        .optional()
        .isString().withMessage('La biografía debe ser un texto'),
    (req, res, next) => validateResult(req, res, next)
];

const validateUpdate = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('nombre')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
    body('last_name')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('El apellido debe tener entre 3 y 50 caracteres'),
    body('birthdate')
        .optional()
        .isISO8601().withMessage('La fecha debe estar en formato ISO8601'),
    body('provincia')
        .optional()
        .isString().withMessage('La provincia debe ser un texto'),
    body('city')
        .optional()
        .isString().withMessage('La ciudad debe ser un texto'),
    body('bio')
        .optional()
        .isString().withMessage('La biografía debe ser un texto'),
    (req, res, next) => validateResult(req, res, next)
];

module.exports = { validateCreate, validateUpdate };
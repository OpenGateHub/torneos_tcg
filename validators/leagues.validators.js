const { body } = require('express-validator');

const createLeagueValidator = [
    body('name')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres')
        .trim(),
    
    body('description')
        .optional()
        .notEmpty().withMessage('La descripción es obligatoria')
        .isLength({ max: 250 }).withMessage('La descripción no puede exceder los 250 caracteres')
        .trim(),
    
    body('companyId')
        .notEmpty().withMessage('El ID de la compañía es obligatorio')
        .isInt().withMessage('El ID de la compañía debe ser un número entero')
];

const updateLeagueValidator = [
    body('name')
        .optional()
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres')
        .trim(),
    
    body('description')
        .optional()
        .isLength({ max: 250 }).withMessage('La descripción no puede exceder los 250 caracteres')
        .trim(),
    
    body('companyId')
        .optional()
        .isInt().withMessage('El ID de la compañía debe ser un número entero')
];

module.exports = {
    createLeagueValidator,
    updateLeagueValidator
};
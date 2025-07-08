const BaseController = require("./base.controller");
const Company = require('../models/Company');
const UserCompany = require('../models/UsersCompany')
const User = require('../models/Usuarios')

// TODO edit action, only edit your own resorces


class CompaniesController extends BaseController {
    constructor() {
        super({
            model: Company
        });
    }

    async create(req, res) {
        const { userId, ...rest } = req.body
        // TODO validate that user dont have Company
        
        try {
            const company = await this.model.create({
                ...rest,
                owner: userId
            });
            const userCompany = await UserCompany.create({
                user: userId,
                company: company.id
            })
            const user = await User.findByPk(userId)
            user.show_is_company_modal = false
            await user.save()
            return res.status(201).json(company, userCompany);
        } catch (error) {
            return res.status(500).json({
                message: 'Error al crear el registro',
                error: error.message
            });
        }
    }



}

module.exports = new CompaniesController()
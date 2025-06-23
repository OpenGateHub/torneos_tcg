const BaseController = require("./base.controller");
const Company = require('../models/Company');


class CompaniesController extends BaseController {
    constructor(){
        super({
            model: Company
        });
    }
}

module.exports = new CompaniesController()
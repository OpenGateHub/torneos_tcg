const BaseController = require("./base.controller");
const Torneo = require('../models/Torneo')

class TournamentsController extends BaseController {
    constructor() {
        super({
            model: Torneo
        })
    }
}

module.exports = new TournamentsController()

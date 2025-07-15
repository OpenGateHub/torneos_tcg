const {ApplicationService} = require('../services/application.service')


class ApplicationController {
    constructor(){
        this.applicationService = new ApplicationService()
    }

    async getGeneralTable(req, res){
        const generalTable = await this.applicationService.generalTablePosition()
        res.json({
            results: generalTable
        })
    }
}

module.exports = new ApplicationController()
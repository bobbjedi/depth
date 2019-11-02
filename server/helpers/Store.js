const {usersDb, storeDb} = require('../modules/DB');
const config = require('../helpers/configReader');
const $u = require('./utils');
const _ = require('underscore');

module.exports = {
    games: [],
    async init(){
        let system = await storeDb.findOne({});
        if (!system){
            system = new storeDb({});
        }
        system.save();
        this.system = system;
    }
};

module.exports.init();

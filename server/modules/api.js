const log = require('../helpers/log');
const sha256 = require('sha256');
const {usersDb} = require('./DB');
const $u = require('../helpers/utils');
const publicApi = require('./publicApi');
const ed = require('../../common/code_sever');
const depth = require('./depth');
const allData = require('./allData');

module.exports = (app) => {
    app.get('/api', async (req, res) => {
        let checkUser;
        try {
            const action = req.query.action;
            const GET = JSON.parse(await ed.d(req.query.data));
            const User = await $u.getUserFromQ({token: GET.token});
            // роуты
            switch (action) {
            case ('getUser'):
                if (User) {
                    //TODO: приделать время жизни токена
                    User.isLogged = true;
                    delete User.password;
                    delete User._id;
                    success(User, res);
                } else {
                    error(null, res);
                }
                break;

            case ('login'):
                checkUser = await usersDb.findOne({$and: [{login: GET.login}, {password: sha256(GET.password.toString())}]});
                if (!checkUser){
                    error('This login and password not found', res);
                    return;
                }
                success(await assignUser(checkUser), res);
                break;

            case ('registration'):
                const {login, password, address} = GET;
                if (!login.length || !password.length || !address.length) {
                    error('No full data', res);
                    return;
                }
                checkUser = await usersDb.findOne({
                    $or: [{ address }, { login }]
                });
                if (checkUser){
                    error('Login or address already exists!', res);
                    return;
                }
                const newUser = await $u.createUser({address, login, password});

                success(await assignUser(newUser), res);
                break;

                // ++++++++++++++TESTTTT
            case ('all'):
                success(await allData(), res);
                break;

            case ('reset'):
                (await usersDb.find({})).forEach(u=>{
                    // u.deposits.BTC.pending = 0;
                    // u.deposits.BIP.pending = 0;
                    u.deposits.BTC.balance = 1000;
                    u.deposits.BIP.balance = 1000;
                    u.save();
                });
                require('./DB').BTC_BIP_Depth.db.remove({}, {multi: true});
                require('./DB').BTC_BIP_CloseOrders.db.remove({}, {multi: true});
                setTimeout(()=>{
                    success({}, res);
                }, 200);
                break;

                // ------------ TESTT
            case ('setOrder'):
                const resSetOrder = await depth[GET.pairName].setOrder({type: GET.type, amount: GET.value, price: GET.price, user: await $u.getUserFromQ({login: GET.login})});
                success({resSetOrder}, res);
                break;

            case ('removeOrder'):
                const resRemoveOrder = await depth[GET.pairName].removeOrder({orderId: GET.orderId, user: await $u.getUserFromQ({login: GET.login})});
                success({resRemoveOrder}, res);
                break;
            default:
                error('error endpoint', res);
                break;
            }

        } catch (e) {
            console.log(e);
            error('Error api code 1', res);
        }
    });
    app.get('/public', async (req, res) => {
        publicApi(req, res);
    });
};

function error(msg, res) {
    try {
        log.error(msg);
        res.json({success: false,
            msg,
        });
    } catch (e) {
        console.log(e);
    }
}
async function success(data, res) {
    try {
        res.json({
            success: true,
            result: await ed.e(JSON.stringify(data))
        });
    } catch (e) {
        console.log(e);
    }
}

async function assignUser (user){
    try {
        const token = sha256(new Date().toString());
        user.token = token;
        await user.save();
        delete user._id;
        delete user.password;
        return user;
    } catch (e){
        console.log('assignUser: ' + e);
    }
}



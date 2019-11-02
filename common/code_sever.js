var ne = require('node-encrypt');
const key = 'c7ff80d080cc85af3cceaa3524401f94';

exports.e = text =>{
    return new Promise(r=> ne.encrypt({text, key}, (err, c) => r(c)));
};

exports.d = cipher =>{
    return new Promise(r=> ne.decrypt({cipher: cipher.replace(/ /g, '+'), key}, (err, c) => r(c)));
};

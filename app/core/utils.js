import Store from '../Store';
export default {
    round(n) {
        return Number(n.toFixed(0));
    },
    unix(){
        return new Date().getTime();
    },
    clone(o){
        return JSON.parse(JSON.stringify(o));
    },
    sound(name, v = 0.2) {
        if (!Store.isSoundOn) {
            return;
        }
        const s = new Audio('assets/sounds/' + name + '.mp3');
        s.play();
        s.volume = v;
    },
    thousandSeparator (num){
        let fixed = 8;
        if (num > 0.8){
            fixed = 2;
        }
        if (+num === 0){
            return '0.00';
        }
        var parts = num.toFixed(fixed).split('.'),
            main = parts[0],
            len = main.length,
            output = '',
            i = len - 1;
        while (i >= 0) {
            output = main.charAt(i) + output;
            if ((len - i) % 3 === 0 && i > 0) {
                output = ',' + output;
            }
            --i;
        }
        if (parts.length > 1) {
            output = `${output}.${parts[1]}`;
        }
        return output;
    }
};

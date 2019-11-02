import axios from 'axios';
import Store from '../Store';
import config from '../../config';
import ed from '../../common/code_sever';

export default async (obj, cb = () => {}, silent, type = 'api') => {
    obj.data = obj.data || {};
    obj.data.token = type === 'api' && (obj.token || Store.user.token);
    // console.log('Req: ', obj.action, obj.data);
    axios.get(config.domain || '' + '/' + type + '?action=' + obj.action + '&data=' + (await ed.e(JSON.stringify(obj.data))))
        .then(async res => {
            const data = res.data;
            if (data.success) {
                let dc = JSON.parse(await ed.d(data.result));
                console.log('Resp:', obj.action + ' -> ', dc);
                cb(dc);
                return;
            }
            console.warn(obj.action + ' error: ', data);
            if (!silent) {
                Store.$notify({
                    type: 'error',
                    group: 'foo',
                    title: 'Error ' + obj.action,
                    text: data.msg
                });
            }
        })
        .catch(function (err) {
            console.warn(obj.data.action, err);
        });
};


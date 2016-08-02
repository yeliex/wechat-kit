/**
 * Creator: yeliex
 * Project: wechatKit
 * Description:
 */
const wx = require('../lib/wechat');

(() => {
  const defaultJSApiList = [
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'onMenuShareQQ',
    'onMenuShareWeibo',
    'onMenuShareQZone',
    'startRecord',
    'stopRecord',
    'onVoiceRecordEnd',
    'playVoice',
    'pauseVoice',
    'stopVoice',
    'onVoicePlayEnd',
    'uploadVoice',
    'downloadVoice',
    'chooseImage',
    'previewImage',
    'uploadImage',
    'downloadImage',
    'translateVoice',
    'getNetworkType',
    'openLocation',
    'getLocation',
    'hideOptionMenu',
    'showOptionMenu',
    'hideMenuItems',
    'showMenuItems',
    'hideAllNonBaseMenuItem',
    'showAllNonBaseMenuItem',
    'closeWindow',
    'scanQRCode',
    'chooseWXPay',
    'openProductSpecificView',
    'addCard',
    'chooseCard',
    'openCard'
  ];

  const $ = {
    ajax: require('node.ajax')
  };

  const that = {
    configured: false
  };

  let openid = null;
  let openidProcess = false;
  const openidCallback = [];

  const initial = function (callback) {
    if (!that.configured) {
      wx.config(that.config);
    }
    if (typeof callback === 'function') {
      wx.ready(callback);
      wx.error(callback);
    }
  };

  const closeWindow = function () {
    initial(()=> {
      wx.closeWindow();
    });
  };

  const initShare = function ({ title, desc, link, imgUrl, target = ['Timeline', 'AppMessage', 'QQ', 'Weibo', 'QZone'], success, cancel }) {
    initial(()=> {
      const menuList = [];

      // hide menu items
      wx.hideMenuItems({
        menuList: ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq', 'menuItem:share:weiboApp', 'menuItem:share:QZone', 'menuItem:share:facrbook']
      });

      target.forEach((i) => {
        wx[`onMenuShare${i}`]({
          title,
          desc,
          link,
          imgUrl,
          success: typeof success === 'function' ? success : '',
          cancel: typeof cancel === 'function' ? cancel : ''
        });

        switch (i.toLowerCase()) {
          case 'appmessage': {
            i = 'appMessage';
            break;
          }
          case 'timeline': {
            i = 'timeline';
            break;
          }
          case 'qq': {
            i = 'qq';
            break;
          }
          case 'weibo': {
            i = 'weiboApp';
            break;
          }
          case 'qzone': {
            i = 'QZone';
            break;
          }
        }
        menuList.push(`menuItem:share:${i}`);
      });

      // show share menu item
      wx.showMenuItems({ menuList });
    });
  };

  const getOpenid = function ({ callback, required, secret = that.config.secret, request }) {
    if (openidProcess) {
      typeof callback === "function" ? openidCallback.push(callback) : '';
      return;
    }

    const doCallback = (id) => {
      openidCallback.forEach((func)=> {
        func(id);
      });
    };

    const finish = (id) => {
      openid = id;
      doCallback(id);
    };

    if (openid) {
      return openid;
    } else {
      openidProcess = true;

      // 先从url参数中获取openid
      let id = () => {
        const param = location.href.match(/openid=(.*)&?/g);

        if (param) {
          return param[1];
        }
      };

      if (id) {
        finish(id);
        return id;
      }
      // 参数中不存在openid
      id = (()=> {
        const param = location.href.match(/code=(.*)&?/g);

        if (param) {
          const code = param[1];

          // 根据code从服务器获取openid
          if (secret) {
            // 从微信服务器直接获取
            const req = $.ajax(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${that.config.appId}&secret=${secret}&code=${code}&grant_type=authorization_code`);
            if (req.openid) {
              finish(req.openid);
              return req.openid;
            }
          } else if (typeof request === 'function') {
            // 从自定义url获取 (避免暴露secret)
            const id = request(code);
            finish(id);
            return id;
          } else {
            alert('获取openid失败');
            closeWindow();
            throw 'require secret or request should be function';
          }
        } else {
          if (required) {
            alert('获取openid失败');
            closeWindow();
            throw 'code cannot find';
          }
        }
      })();

      if (!id) {
        alert('获取openid失败');
        closeWindow();
        throw 'unknown error';
      }

      return id;
    }
  };

  /**
   * initial config file
   * @param params string/Object config or url
   * @param callback return config paraser
   * @param debug boolean
   */
  const init = function (params, callback, debug) {
    let config = {};

    if (typeof callback === "boolean") {
      debug = debug || callback || false;
    }

    if (typeof params === 'string') {
      const request = $.ajax(params);
      if (typeof callback === 'function') {
        params = callback(request);
      } else {
        if (request.status) {
          params = request.data;
        } else {
          throw `can not get params from ${params},may be return 'error'`;
        }
      }
    } else if (params !== 'object') {
      throw 'wechat js sdk config must be object or url';
    }

    const { appId, timestamp, nonceStr, signature, jsApiList } = params;

    if (!appId || !timestamp || !nonceStr || !signature) {
      throw 'params error';
    }

    config = {
      debug: debug || params.debug || false,
      appId: appId,
      timestamp: timestamp,
      nonceStr: nonceStr,
      signature: signature,
      jsApiList: jsApiList || defaultJSApiList
    };

    that.config = config;

    return Object.assign({}, wx, {
      config, closeWindow, initShare,
      init: initial,
      getOpenid
    })
  };

  if (typeof module === 'object') {
    module.exports = init;
  }
  if (typeof window === 'object') {
    window.Wechat = init;
  }
})();

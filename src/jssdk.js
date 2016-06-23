/**
 * Creator: yeliex
 * Project: wechatKit
 * Description:
 */
(function () {
  import Wx from '../lib/wechat';
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

  const config = function (callback) {
    if (!that.configured) {
      Wx.config(that.config);
    }
    if (typeof callback === 'function') {
      wx.ready(callback);
      wx.error(callback);
    }
  };

  const closeWindow = function () {
    config(()=> {
      Wx.closeWindow();
    });
  };

  const initShare = function ({ title, desc, link, imgUrl, target = ['Timeline', 'AppMessage', 'QQ', 'Weibo', 'QZone'], success, cancel }) {
    const menuList = [];

    // hide menu items
    Wx.hideMenuItems({
      menuList: ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:qq', 'menuItem:share:weiboApp', 'menuItem:share:QZone']
    });

    target.forEach((i) => {
      Wx[`onMenuShare${i}`]({
        title,
        desc,
        link,
        imgUrl,
        success: typeof success === 'function' ? success : '',
        cancel: typeof cancel === 'function' ? cancel : ''
      });

      switch (i.toLowerCase()) {
        case 'appmessage':
        {
          i = 'appMessage';
          break;
        }
        case 'timeline':
        {
          i = 'timeline';
          break;
        }
        case 'qq':
        {
          i = 'qq';
          break;
        }
        case 'weibo':
        {
          i = 'weiboApp';
          break;
        }
        case 'qzone':
        {
          i = 'QZone';
          break;
        }
      }
      menuList.push(`menuItem:share:facebook${i}`);
    });

    // show share menu item
    Wx.showMenuItems({ menuList });
  };

  /**
   * initial config file
   * @param params string/Object config or url
   * @param debug boolean
   */
  const init = function (params, debug) {
    let config = {};

    if (typeof params === 'string') {
      const request = $.ajax(params);
      if (request.status) {
        params = request.data;
      } else {
        throw `can not get params from ${params}`;
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

    return Object.assign({}, Wx, {
      config, closeWindow, initShare
    })
  };
  module.export = init;
}());



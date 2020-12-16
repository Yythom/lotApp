Page({
  data: {
    background: [],
    shop_id: '',
    indicatorDots: true,
    autoplay: true,
    vertical: false,
    interval: 20000,
    circular: false,
    duration: 1500,
    token: '',
    btn_list: [
      {
        name: '支付能力', btnList: [
          { label: '启动收银台', func: 'callStartApp', icon: 'active.png', desc: '调用收银台' },
        ]
      },
      {
        name: '会员能力', btnList: [
          { label: '刷脸核身', func: 'callFaceVerify', icon: 'face.png', desc: '用于刷脸核身' },
        ]
      },
      {
        name: '连接收银机能力', btnList: [
          { label: '发送付款码', func: 'callWriteHID', icon: 'send_code.png', desc: '向收银机发送付款码' },
          { label: '小指令', func: 'callTinyCommand', icon: 'tiny_command.png', desc: '发送接收小指令' },
        ]
      },
      {
        name: '基础能力', btnList: [
          { label: '容器版本查询', func: 'callGetVersion', icon: 'version.png', desc: '查询小程序容器版本' },
          { label: '获取设备序列号', func: 'callGetSysProp', icon: 'get_sys.png', desc: '查询设备序列号', key: 'ro.serialno' },
          { label: '获取设备型号', func: 'callGetSysProp', icon: 'get_sys.png', desc: '查询设备型号', key: 'ro.product.model' },
          { label: '获取设备 ID', func: 'callGetSysProp', icon: 'get_sys.png', desc: '查询设备 ID', key: 'unisdk.deviceId' },
          { label: '打开系统设置', func: 'callSySSetting', icon: 'setting.png', desc: '打开系统设置页面' },
          { label: '扫描二维码', func: 'callScanQr', icon: 'scan_code.png', desc: '单次扫描二维码' },
          { label: '连续扫描二维码', func: 'callContinuousScanQr', icon: 'scan_code.png', desc: '连续扫描二维码' },
          { label: '生成二维码', func: 'callGenerateQr', icon: 'qr.png', desc: '用于生成二维码' },
          { label: '跳转海报页面', func: 'callPoster', icon: 'poster.png', desc: '用于展示电子海报' }
        ]
      },
      {
        name: '语音能力', btnList: [
          { label: '语音播报1.0', func: 'callVoice1', icon: 'audio1.png', desc: '支持数值播报类型和自定义语音' },
          { label: '语音播报2.0', func: 'callVoice2', icon: 'audio2.png', desc: '支持在线合成语音' },
        ]
      },
      {
        name: '外设接入能力', btnList: [
          { label: '连接打印机', func: 'callPrinter', icon: 'print.png', desc: '用于打印小票' },
          { label: '身份证读卡器', func: 'callIdCardReader', icon: 'card.png', desc: '需连接读卡器' },
        ]
      }
    ],
    shownCode: '',
    floatShown: false,
    image: '',
    init: true,
    modalOpened: false,
    buttons: [
      { text: '确认' }, { text: '关闭' }
    ],
  },
  upOrder(order_id) {
    let that = this;
    let count = 1;
    function aFn() {
      my.showLoading()
      setTimeout(() => {
        my.request({
          url: 'https://api.fishcashier.com/merchant/v1/pay/search',
          headers: {
            'content-type': 'application/json',
          },
          method: 'POST',
          timeout: 10000,
          dataType: 'json',
          data: {
            shop_id: that.data.shop_id,
            order_id: order_id,
          },
          success: (res) => {
            my.hideLoading();
            if (res.data.code == '0') {
              console.log('up order', res.data.result);
              if (res.data.result.status == 4 || res.data.result.status == 1 || res.data.result.status == 4) {
                setTimeout(() => {
                  my.showToast({ content: res.data.result.status_message });
                }, 200);
              } else {
                count++;
                if (count < 30) {
                  aFn(count);
                } else {
                  my.showToast({ content: '收款失败 ' + res.data.msg });
                }
              }
            } else {
              count++;
              if (count < 30) {
                aFn(count);
              } else {
                my.showToast({ content: '收款失败 ' + res.data.msg });
              }
            }
          },
        });
        console.log(count+'s');
      }, 1000);
    }
    aFn(count)
  },
  outLogin() {
    my.clearStorageSync();
    my.redirectTo({
      url: '/login/login'
    })
  },
  footBotton(e) {
    let that = this;
    let text = e.currentTarget.dataset.item.text;
    if (text === '确认') {
      console.log('out');
      that.outLogin();
      setTimeout(() => {
        that.onMaskClick();
      }, 200);
    } else {
      console.log(' no-out');
      that.onMaskClick();
    }
  },
  getAccount() {
    let that = this
    // 页面加载完成
    my.request({
      url: 'https://api.fishcashier.com/merchant/v1/shop/account/detail',
      headers: {
        'content-type': 'application/json',
        'token': `${that.data.token}`
      },
      method: 'POST',
      timeout: 10000,
      dataType: 'json',
      success: (res) => {
        const result = res.data;
        if (result.code == '0') {
          if (that.data.init) {
            my.setStorageSync({
              key: 'account',
              data: {
                account: result.result
              }
            });
            this.setData({
              account: result.result
            })
          }
        } else {
          if (result.msg !== '请重新登录') {
            my.showToast({ content: '失败!' + res.data.msg });
          } else {
            that.refreshToken();
          }
        }
      },
      fail: (err) => {
        that.refreshToken();
        console.log('bg_err', err);
      },
    });
  },
  onMaskClick() {
    this.setData({
      modalOpened: !this.data.modalOpened,
    })
  },
  order_router() {
    my.navigateTo({
      url: '/orderlist/orderlist'
    });
  },
  setLocal(key) { // 获取本地存储
    let that = this;
    let obj = { ...that.data }
    const storage = my.getStorageSync({ key });
    if (storage.success) {
      obj[key] = storage.data[key];
      that.setData({
        ...obj
      })
    } else {
      my.showToast({ content: storage.message });
    }
  },
  // upOrder(order_id) {
  //   let that = this;

  //   my.request({
  //     url: 'https://api.fishcashier.com/merchant/v1/pay/search',
  //     headers: {
  //       'content-type': 'application/json',
  //     },
  //     method: 'POST',
  //     timeout: 10000,
  //     dataType: 'json',
  //     data: {
  //       shop_id: that.data.shop_id,
  //       order_id
  //     },
  //     success: (res) => {
  //       my.hideLoading();
  //       if (res.data.code == '0') {
  //         console.log('up order', res.data.result);
  //         setTimeout(() => {
  //           my.showToast({ content: res.data.result.status_message });
  //         }, 200);
  //       } else {
  //         my.showToast({ content: '收款失败 ' + res.data.msg });
  //       }
  //     },
  //   });

  // },
  getBanner() {
    let that = this;
    my.request({
      url: 'https://api.fishcashier.com/merchant/v1/shop/banner',
      headers: {
        'content-type': 'application/json',
        'token': `${that.data.token}`
      },
      method: 'POST',
      timeout: 10000,
      dataType: 'json',
      success: (res) => {
        const result = res.data;
        if (result.code == '0') {
          if (that.data.init) {
            my.setStorageSync({
              key: 'shop_id',
              data: {
                shop_id: result.result.shop_id
              }
            });
            this.setData({
              background: result.result.list,
              shop_id: result.result.shop_id
            })
          }
        } else {
          if (result.msg !== '请重新登录') {
            my.showToast({ content: '失败!' + res.data.msg });
          } else {
            that.refreshToken();
          }
        }
      },
      fail: (err) => {
        that.refreshToken();
        console.log('bg_err', err);
      },
    });
  },
  refreshToken() {
    let refreshToken = '';
    let that = this;
    const storage = my.getStorageSync({ key: 'refreshToken' });
    if (storage.success) {
      refreshToken = storage.data.refreshToken
    } else {
      my.redirectTo({
        url: '/login/login'
      });
    }
    my.request({
      url: 'https://api.fishcashier.com/merchant/v1/login/refreshToken',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      timeout: 10000,
      dataType: 'json',
      data: {
        token: refreshToken
      },
      success: (res) => {
        console.log(res, 'refreshToken');
        if (res.data.code == 0) {
          let result = res.data;
          my.setStorage({
            key: 'token',
            data: {
              token: result.result.token,
            }
          });
          my.setStorage({
            key: 'refreshToken',
            data: {
              refreshToken: result.result.refreshToken
            }
          });
          if (that.data.token) {
            that.setData({
              token: result.result.token
            })
          }
          this.getBanner();
          my.showToast({ content: '刷新token成功' });
        } else {
          my.redirectTo({
            url: '/login/login'
          });
        }
      },
      fail: (err) => {
        my.redirectTo({
          url: '/login/login'
        });
      },
    });
  }
  ,
  onReady() {
    this.setLocal('token');
    this.getBanner();
    this.getAccount();
    this.setData({
      init: true
    });
  },
  onShow() {
    // 页面显示
    this.startListenKeyboardEvent();
    //开始监听小指令
    my.ix.startMonitorTinyCommand();
    /**
     * 监听小指令
     */
    my.ix.onMonitorTinyCommand((data) => {
      my.showToast({ content: data });
    });
    /**
     * 添加打印机状态监听
     */
    my.ix.startMonitorPrinter({
      success: (r) => {
        console.log("success");
      },
      fail: (r) => {
        console.log("fail, errorCode:" + r.error);
      }
    });
    //打印机状态监听
    my.ix.onMonitorPrinter((r) => {
      console.log("received data:" + r);
    });

    if (this.data.token) {
      console.log('返回刷新');
      this.getBanner();
    }
  },
  onHide() {
    // 页面隐藏
    //关闭收银台事件监听
    my.ix.offCashierEventReceive();
    //关闭键盘事件监听
    my.ix.offKeyEventChange();
    //移除监听小指令
    my.ix.offMonitorTinyCommand();
    //移除打印机监听
    my.ix.offMonitorPrinter({
      success: (r) => {
        console.log("success");
      },
      fail: (r) => {
        console.log("fail, errorCode:" + r.error);
      }
    });
  },
  onUnload() {

    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: 'My App',
      desc: 'My App description',
      path: 'pages/index/index',
    };
  },

  startListenCashierEvent() {
    my.ix.onCashierEventReceive((r) => {
      if (r.bizType === 'RESULT_CLOSED') {
        my.ix.offCashierEventReceive();
        my.showToast({ content: '收银台关闭' });
      } else if (r.bizType === 'RESULT_BTN_FUNCTION')
        my.showToast({ content: '收银台自定义按钮按下' });
      else {
      }
      // my.showToast({ content: 'RESULT: ' + r.bizType });
    });
  },

  startListenKeyboardEvent() {
    let that = this;
    my.ix.onKeyEventChange((r) => {
      if (r.keyCode === 131) {
        that.getBanner();
        let id = '';
        const storageId = my.getStorageSync({ key: 'shop_id' });
        if (storageId.success) {
          id = storageId.data.shop_id
        } else {
          my.showToast({ content: '店铺id不存在' })
        }
        this.startApp((res) => {
          my.showLoading();
          console.log('res,', res);
          my.request({
            url: 'https://api.fishcashier.com/merchant/v1/pay/face',
            method: 'POST',
            data: {
              price: r.amount,
              method: 2,
              scan: 1,
              shop_id: id,
              code: res,
            },
            timeout: 10000,
            headers: {
              'content-type': 'application/json'  //默认值
            },
            dataType: 'json',
            success: function (res) {
              if (res.data.code == '0') {
                console.log('接口返回', res);
                my.hideLoading();
                if (res.data.result.status_message === '已支付' && res.data.result.status === 3) {
                  my.showToast({ content: '收款成功' });
                  my.ix.voicePlay({
                    eventId: 'ZFDZ',
                    number: r.amount,
                    success: (r) => {

                    }
                  });
                  // setTimeout(() => {
                  //   that.upOrder(res.data.result.pay_order_id);
                  // }, 1000);
                } else {
                  my.showLoading();
                  setTimeout(() => {
                    that.upOrder(res.data.result.pay_order_id);
                  }, 200);
                }
              } else {
                my.showLoading();
                my.showToast({ content: '收款失败 ' + res.data.msg });
              }
            },
            fail: function (res) {
              // my.alert({ content: 'fail' });
              my.showLoading();
              my.showToast({ content: '收款失败 ' + res.data });
            },
          });
        }, r.amount);
      } else {

      }
    });
  },

  callStartApp() {
    this.startApp();
  },

  callFaceVerify() {
    my.ix.faceVerify({
      option: 'life',
      success: (r) => {
        my.showToast({ content: 'uid : ' + r.buyerId })
      },
      fail: (r) => {
        my.showToast({ content: JSON.stringify(r) });
      }
    });
  },
  /**
   * 添加会员卡功能
   * 该功能需要提前配置好会员卡
   * 参考文档：https://opendocs.alipay.com/mini/introduce/card
   * 以下仅展示小程序内功能代码
   */
  callCardAuth() {
    my.addCardAuth({
      url: '从 openapi 接口获取到的 url',
      success: (res) => {
        my.alert({ content: '授权成功' });
      },
      fail: (res) => {
        my.alert({ content: '授权失败' });
      },
    });
  },

  callWriteHID() {
    this.startApp((code) => {
      my.ix.writeHID({
        protocol: 'barcode',
        value: code,
        success: (r) => {
          my.showToast({ content: 'success: ' + JSON.stringify(r) });
        },
        fail: (r) => {
          my.showToast({ content: 'fail: ' + JSON.stringify(r) });
        }
      })
    })
  },

  callTinyCommand() {
    my.showToast({ content: '测试本接口需要连接收银机并写入代码' })
    my.ix.tinyCommand({
      target: 'ix',
      content: { bizNo: '12345678', data: 'hello world' },
      success: (r) => {
        my.showToast({ content: '发送小指令成功' })
      },
      fail: (r) => {
        my.showToast({ content: "发送小指令失败 : " + r.error })
      }
    });
  },

  callGetVersion() {
    my.ix.getVersion({
      success: (r) => {
        my.showToast({
          content: JSON.stringify(r)//'服务版本号: ' + r.versionName + '-' + r.versionCode
        })
      }
    });
  },
  callGetSysProp(evt) {
    const { key } = evt.target.dataset;
    my.ix.getSysProp({
      key: key,
      success: (r) => {
        my.showToast({
          content: JSON.stringify(r)//'DeviceSn: ' + r.value
        })
      }
    });
  },

  callSySSetting() {
    my.ix.startApp({
      appName: 'settings',
    });
  },

  callScanQr() {
    my.showToast({ content: '开始扫码状态，请将二维码放在摄像头前' });
    this.showCodes('scan');
    my.ix.codeScan({
      success: (r) => {
        my.showToast({ content: r.code });
        this.hideFloat();
      },
      fail: (r) => {
        console.log('error: ' + r.errorMessage);
      }
    });
  },

  callContinuousScanQr() {
    let time = 0;
    this.showCodes('scan')
    my.showToast({ content: '开始扫码状态，请将二维码放在摄像头前' });
    my.ix.onCodeScan((res) => {
      if (res.success) {
        if (++time === 3) {
          my.ix.offCodeScan();
          this.hideFloat();
        }
        my.showToast({ content: res.code });
      }
    })
  },

  callGenerateQr() {
    my.ix.generateImageFromCode({
      code: 'https://opensupport.alipay.com/support/home.htm',
      format: 'QRCODE',
      width: 200,
      correctLevel: 'H',
      success: (r) => {
        // my.showToast({ content: JSON.stringify(r) })
        this.showImage(r.image);
      }
    });
  },

  callVoice1() {
    my.ix.voicePlay({
      eventId: 'ZFDZ',
      number: '100',
      success: (r) => {
        my.showToast({ content: '语音播放结束' })
      }
    });
  },

  callVoice2() {
    my.ix.speech({
      text: '欢迎光临',
      success: (r) => {
        my.showToast({ content: '语音播放结束' })
      }
    });
  },

  callPrinter() {
    my.ix.printerStatus({
      success: (r) => {
        my.showToast({ content: '打印机状态连接中' });
        //调用打印机API
        //Esc指令文档：https://opendocs.alipay.com/mini/multi-platform/dp4shc
        my.ix.printer({
          cmds: [{ 'cmd': 'addSelectJustification', 'args': ['CENTER'] },
          { 'cmd': 'addSelectPrintingPositionForHRICharacters', 'args': ['BELOW'] },
          { 'cmd': 'addSetBarcodeHeight', 'args': ['60'] },
          { 'cmd': 'addCODE128General', 'args': ['ALIPAY', '300', '100'] },
          { 'cmd': 'addPrintAndLineFeed', 'args': [] }],
          success: (r) => {
            my.showToast({ content: '打印成功' });
          },
          fail: (r) => {
            my.showToast({ content: '打印失败' });
          }
        });
      },
      fail: (r) => {
        my.showToast({ content: 'fail : ' + r.errorMessage })
      }
    });
  },

  callPoster() {
    my.navigateTo({
      url: '/pages/poster/poster'
    });
  },

  callIdCardReader() {
    my.showToast({ content: '测试本接口需要连接读卡器' })
    //调用读卡器读取身份证信息
    //文档地址：https://opendocs.alipay.com/mini/multi-platform/xiisgz
    my.ix.readCard({
      success: (r) => {
        my.showToast({ content: JSON.stringify(r) });
      },
      fail: (r) => {
        my.showToast({ content: "fail, errorCode:" + r.error });
      }
    });
  },

  startApp(callback, amount) {
    if (!amount) {
      my.showToast({ content: '请输入金额' });
      return false;
    }

    this.startListenCashierEvent();
    my.ix.startApp({
      appName: 'cashier',
      bizNo: Math.random().toString(16).slice(2),
      totalAmount: amount,
      orderDetail: [],
      posTimeout: '30',
      faceLoadingTimeout: '10',
      scanLoadingTimeout: '10',
      success: (r) => {
        // my.showToast({ content: r.barCode });
        if (callback && r.barCode) {
          callback(r.barCode);
        }
      },
      fail: (r) => {
        console.log('errrrrr', r);
        if (r.error === 1400 && r.errorMessage === 'amount error') {
          my.showToast({ content: '支付金额最小金额为0.01元' })
          return false;
        }
        // my.showToast({ content: 'errrrrrrrr:' + JSON.stringify(r) });
      }
    });
  },
  showCodes(code) {
    this.setData({
      floatShown: true,
      shownCode: code
    })
  },
  showImage(img) {
    this.setData({
      image: img,
      shownCode: '',
      floatShown: true,
    })
  },
  hideFloat() {
    this.setData({
      floatShown: false,
      shownCode: '',
      image: '',
    })
  }
});
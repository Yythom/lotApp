
Page({
  data: {
    order_id: '',
    token: '',
    account: {},
    timer: '',
    currentTime: 30,
    order: {},
    refund_order_id: '',
    refundStatus: false,
    modalOpened: false,
    isTuikuan: false,
    buttons: [
      { text: '确认' }, { text: '关闭' }
    ],
    moeny: '',
  },
  onPullDownRefresh() {
    if (this.data.token) {
      console.log('下拉刷新');
      this.getOrderDetail(this.data.order_id);
    }
  },
  setLocal(key) { // 获取本地存储 设置到当前页面state
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
  onLoad() {
    this.setLocal('order_id');
    this.setLocal('token');
    this.setLocal('account')
    this.getOrderDetail(this.data.order_id);
  },
  refundApi(price) { // 退款 Api
    let that = this;
    let { token } = this.data;
    console.log(price);

    my.request({
      url: 'https://api.integral.haimeiyx.com/merchant/v1/order/order/refund',
      headers: { 'content-type': 'application/json', 'token': `${token}` },
      method: 'POST',
      dataType: 'json',
      data: {
        order_id: that.data.order.order.order_id,
        price: price || that.data.order.price,
        reasons: '',
      },
      success: (res) => {
        const result = res.data;
        if (result.code == 0) {
          console.log(result);
          that.setData({
            refund_order_id: result.result.refund_order_id,
          })
          my.hideLoading();
        } else {
          my.hideLoading();
          if (result.msg !== '请重新登录') {
            my.showToast({ content: res.data.msg });
          } else {
            that.refreshToken();
          }
        }
      },
      fail: (err) => {
        my.hideLoading();
      },
    });
  },
  searchRefund() { // 退款状态查询
    let that = this;
    let { token } = this.data;
    that.setData({
      refundStatus: true,
    })
    console.log(that.data.refund_order_id);

    my.request({
      url: 'https://api.integral.haimeiyx.com/merchant/v1/order/order/searchRefund',
      headers: { 'content-type': 'application/json', 'token': `${token}` },
      method: 'POST',
      dataType: 'json',
      data: {
        order_id: that.data.refund_order_id,
      },
      success: (res) => {
        const result = res.data;
        if (result.code == 0) {
          if (result.result.status === 3) {
            clearInterval(that.data.timer);
            console.log(that.data.timer, 'timer', result.result.status, 'status');
            my.showToast({ content: '退款成功' });
            my.hideLoading();
            that.getOrderDetail(that.data.order_id);
          } else if (result.result.status === 1) {
            // 继续查询
          } else if (result.result.status === 2) {
            // 继续查询
          } else {
            clearInterval(that.data.timer);
            my.showToast({ content: '退款失败' });
            my.hideLoading();
          }
        } else {
          if (result.msg !== '请重新登录') {
            my.showToast({ content: res.data.msg });
            my.hideLoading();
            clearInterval(that.data.timer);
          } else {
            that.refreshToken();
          }
        }
      },
      fail: (err) => {
      },
    });
  },
  fullRefund() { // 全部退款
    let i = 0;
    let that = this;
    this.refundApi();
    let timer = setInterval(() => {
      my.showLoading();
      ++i;
      that.searchRefund();
      if (i === that.data.currentTime) {
        clearInterval(timer);
        my.showToast({ content: '退款失败' });
        my.hideLoading();
      }
    }, 1000)
    that.setData({
      timer,
    })
  },
  partRefund(price) { // 部分退款
    let that = this;
    if (this.data.moeny > this.data.order.price) {
      my.showToast({ content: '金额最大值为' + that.data.order.price });
      return;
    }

    let i = 0;
    that.refundApi(price)
    let timer = setInterval(() => {
      my.showLoading();
      ++i;
      that.searchRefund();
      if (i === that.data.currentTime) {
        clearInterval(timer);
        my.showToast({ content: '退款失败' });
        my.hideLoading();
      }
    }, 1000)
    that.setData({
      timer,
    })

  },
  getOrderDetail(order_id) { // 获取订单详情
    my.showLoading();
    const that = this;
    let { token } = this.data
    my.request({
      url: 'https://api.integral.haimeiyx.com/merchant/v1/shop/order/detail',
      headers: { 'content-type': 'application/json', 'token': `${token}` },
      method: 'POST',
      dataType: 'json',
      data: {
        order_id
      },
      success: (res) => {
        const result = res.data;
        if (result.code == 0) {
          console.log(result.result);
          that.setData({
            order: result.result
          });
          my.stopPullDownRefresh();
          my.hideLoading();
        } else {
          my.stopPullDownRefresh();
          my.hideLoading();
          if (result.msg !== '请重新登录') {
            my.showToast({ content: res.data.msg });
            my.showToast({ content: '失败!' + res.data.msg });
          } else {
            that.refreshToken();
          }
        }
      },
      fail: (err) => {
        my.showToast({ content: '服务器错误' });
        my.hideLoading();
      },
    });
  },
  refreshToken() {
    let that = this;
    let refreshToken = '';
    const storage = my.getStorageSync({ key: 'refreshToken' });
    if (storage.success) {
      refreshToken = storage.data.refreshToken
    } else {
      my.redirectTo({
        url: '/login/login'
      });
    }
    my.request({
      url: 'https://api.integral.haimeiyx.com/merchant/v1/login/refreshToken',
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
          that.getOrderDetail(that.data.order_id);
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
  },
  // modal 相关
  onMaskClick() {
    this.setData({
      modalOpened: !this.data.modalOpened,
      moeny: ''
    })
  },
  onMaskClickAll() {
    this.setData({
      isTuikuan: !this.data.isTuikuan,
      moeny: ''
    })
  },
  footBotton(e) { // 部分退款modal底部
    let that = this;
    let text = e.currentTarget.dataset.item.text;
    if (text === '确认') {
      if (!that.data.moeny) {
        my.showToast({ content: '退款金额不能为空' });
        return
      } else if (that.data.moeny < 0.01) {
        my.showToast({ content: '最小金额为0.01' });
        return
      }
      that.partRefund(that.data.moeny);
      setTimeout(() => {
        that.onMaskClick();
      }, 200);
    } else {
      that.onMaskClick();
    }
  },
  footBottonAll(e) { // 全部退款modal底部
    let that = this;
    let text = e.currentTarget.dataset.item.text;
    if (text === '确认') {
      that.fullRefund();
      setTimeout(() => {
        that.onMaskClickAll();
      }, 200);
    } else {
      that.onMaskClickAll();
    }
  },
  inputFn(e) { // 部分退款输入金额
    let value = e.detail.value;
    this.setData({
      moeny: value
    })
  },
  copy(e) { // 复制编号
    let orderId = e.currentTarget.dataset.key;
    my.setClipboard({
      text: orderId,
      success: (status) => {
        my.showToast({ content: '复制成功' })
      },
    });
  }
});

Page({
  data: {
    page: 1,
    pageSize: 5,
    total: 0,
    list: [],
    token: '',
    shop_id: '',
    value: '',
    startTime: '',
    endTime: '',
    date: '',
    headerData: {},
    flag: false,
  },
  scrollTo() {
    this.setData({
      flag: !this.data.flag
    })
    console.log(this.data.flag);
    if (!this.data.flag) {
      setTimeout(() => {
        my.pageScrollTo({
          scrollTop: 9999,
          duration: 400,
        });
      }, 300);
    } else {

      my.pageScrollTo({
        scrollTop: 10,
        duration: 400,
      });
    }
  },
  backIndex() {
    my.redirectTo({
      url: '/pages/index/index'
    })
  },
  onPullDownRefresh() {
    if (this.data.token) {
      console.log('下拉刷新');
      this.init();
    }
  },
  onShow() {
    if (this.data.token) {
      console.log('返回刷新');
      this.init();
    }
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
  getTotalData() {
    let that = this;
    let { token, page, pageSize, shop_id } = this.data
    my.request({
      url: 'http://47.108.151.32:9501/merchant/v1/shop/shop/together/code',
      headers: { 'content-type': 'application/json', 'token': `${token}` },
      method: 'POST',
      dataType: 'json',
      data: {
        page: page,
        pageSize,
        shop_id,
        type: 5,
      },
      success: (res) => {
        const result = res.data;
        if (result.code == 0) {
          that.setData({
            headerData: result.result,
          })
        }
      }
    });
  },
  getList(search, currentPage) { // 商品列表数据
    let date = '';
    let pay_order_id = '';
    if (search) {
      if (search.pay_order_id) {
        pay_order_id = search.pay_order_id;
      }
      if (search.date) {
        date = search.date;
      }
    }

    my.showLoading();
    if (currentPage) {
      let flag = false;
      if (this.data.total > this.data.pageSize && this.data.list.length !== this.data.total) {
        flag = true
      }
      if (!flag) {
        my.showToast({ content: '加载完了' });
        my.hideLoading();
        return;
      }
    }
    let that = this;
    let { token, page, pageSize, total, shop_id } = that.data
    my.request({
      url: 'http://47.108.151.32:9501/merchant/v1/shop/shop/together/list',
      headers: { 'content-type': 'application/json', 'token': `${token}` },
      method: 'POST',
      dataType: 'json',
      data: {
        page: currentPage || page,
        pageSize,
        shop_id,
        type: 5,
        pay_order_id: pay_order_id || '',
        date: date || that.data.date
      },
      success: (res) => {
        const result = res.data;
        if (result.code == 0) {
          if (currentPage) {
            that.setData({
              list: [...that.data.list, ...result.result.list],
              page: currentPage,
              total: result.result.total
            })
            my.hideLoading();
            my.stopPullDownRefresh();
          } else {
            that.setData({
              list: result.result.list,
              total: result.result.total
            })
            my.hideLoading();
            my.stopPullDownRefresh();
          }
        } else {
          if (result.msg !== '请重新登录') {
            my.showToast({ content: res.data.msg });
            my.showToast({ content: '失败!' + res.data.msg });
          } else {
            that.refreshToken();
          }
          my.hideLoading();
        }
      },
      fail: (err) => {
        my.showToast({ content: '服务器错误' });
        my.hideLoading();
      },
    });
  },
  getOrderDetail(order_id) {
    my.showLoading();
    my.setStorage({
      key: 'order_id',
      data: {
        order_id
      },
      success: () => {
        my.navigateTo({
          url: '/orderitem/orderitem'
        });
        my.hideLoading()
      },
    });
  },
  onReady() {
    this.setLocal('token');
    this.setLocal('shop_id');
    let that = this;
    that.getList();
    that.getTotalData();
  },
  lower() {
    this.getList('', this.data.page + 1)
  },
  goDetail(event) {
    let { order_id } = event.currentTarget.dataset;
    this.getOrderDetail(order_id);
  },
  handleInput(value) {
    if (!value.length) {
      if (this.data.token) {
        console.log('搜索刷新');
        this.init();
      }
    }
    this.setData({
      value,
    });
  },
  handleClear() {
    this.setData({
      value: '',
    });
  },
  handleSubmit() {
    const reg = /\s+/g;
    const numberReg = /^\d+$/;
    let value = this.data.value.replace(reg, '');
    if (!value) {
      this.init();
      return
    }
    if (!numberReg.test(value)) {
      my.showToast({ content: '请输入数字' })
      return
    }
    this.getList({ pay_order_id: value });
  },
  init() {
    this.setData({
      page: 1,
      total: 0,
      startTime: '',
      endTime: '',
      date: '',
      value: '',
    })
    this.getList();
    this.getTotalData();
  },
  datePicker1() {
    function formatDate() {
      var date = new Date();
      var YY = date.getFullYear() + '-';
      var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
      var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
      var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
      var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
      var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
      return YY + MM;
    }
    const that = this;
    console.log(formatDate());

    my.datePicker({
      currentDate: formatDate() + '1',
      startDate: '2000-1-1',
      endDate: '2030-1-1',
      success: (res) => {
        that.setData({
          startTime: res.date
        })
      },
    });
  },
  datePicker2() {
    const that = this;
    function formatDate() {
      var date = new Date();
      var YY = date.getFullYear() + '-';
      var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
      var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
      var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
      var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
      var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
      return YY + MM + DD;
    }

    my.datePicker({
      currentDate: formatDate(),
      startDate: '2000-1-1',
      endDate: formatDate(),
      success: (res) => {
        that.setData({
          endTime: res.date
        })
      },
    });
  },
  dateSearch() {
    if (!this.data.startTime) {
      my.showToast({ content: '开始时间不能为空' });
      return;
    } else if (!this.data.endTime) {
      my.showToast({ content: '结束时间不能为空' });
      return
    }
    this.setData({
      date: `${this.data.startTime}|${this.data.endTime}`
    })
    this.getList({ date: this.data.date });
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
      url: 'http://47.108.151.32:9501/merchant/v1/login/refreshToken',
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
            });
          }
          that.getList();
          that.getTotalData();
          my.showToast({ content: '刷新token成功' });
          my.stopPullDownRefresh();
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
  copy(e) {
    let orderId = e.currentTarget.dataset.key;
    my.setClipboard({
      text: orderId,
      success: (status) => {
        my.showToast({ content: '复制成功' })
      },
    });
  }
});

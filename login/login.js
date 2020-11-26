Page({
  data: {
    account: '',
    password: '',
    loginStatus: false,
  },
  onLoad() {

  },
  bindInput1(e) {
    this.setData({
      account: e.detail.value
    })
  },
  bindInput2(e) {
    this.setData({
      password: e.detail.value
    })
  },
  login() {
    this.setData({ loginStatus: true });
    let that = this;
    // console.log(this.data.account, this.data.password)
    if (!this.data.account || !this.data.password) {
      my.showToast({ content: '账号或密码必须填写' });
      this.setData({ loginStatus: false });
      return
    }
    my.request({
      url: 'http://47.108.151.32:9501/merchant/v1/login',
      method: 'POST',
      data: {
        account: this.data.account,
        password: this.data.password,
      },
      headers: {
        'content-type': 'application/json'  //默认值
      },
      dataType: 'json',
      timeout: 10000,
      success: function (res) {
        if (!res.data) {
          my.showToast({ content: '网络错误!' });
          that.setData({ loginStatus: false });
          return;
        }
        let result = res.data;
        if (result.code == 0) {
          that.setData({ loginStatus: false });
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

          // 13705952166 123456"
          my.redirectTo({
            url: '/pages/index/index'
          });
        } else {
          my.showToast({ content: '登入失败!' + res.data.msg });
          that.setData({ loginStatus: false });
        }
      },
      fail: function (res) {
        my.showToast({ content: '登入失败!' + res.data });
        that.setData({ loginStatus: false });
      },
    });
  }
});

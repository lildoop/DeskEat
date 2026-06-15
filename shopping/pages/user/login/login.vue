<template>
  <view class="login-page">
    <!-- 顶部品牌 -->
    <view class="brand-area">
      <text class="brand-name">拾味集</text>
      <text class="brand-slogan">微信快捷登录，即刻开启美食之旅</text>
    </view>

    <!-- 微信快捷登录按钮 -->
    <view class="login-area">
      <button class="wx-login-btn" :loading="isLogging" :disabled="!agreed" @tap="wechatLogin">
        <view class="wx-btn-inner" v-if="!isLogging">
          <text>微信快捷登录</text>
        </view>
      </button>

      <!-- 协议勾选 -->
      <view class="agree-row" @tap="agreed = !agreed">
        <view class="agree-circle" :class="{ 'agree-checked': agreed }">
          <uni-icons v-if="agreed" type="checkmarkempty" size="14" color="#fff"></uni-icons>
        </view>
        <text class="agree-text">我已阅读并同意《用户协议》和《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { putRequest, BASE_URL } from '@/utils/request.js'

const isLogging = ref(false)
const agreed = ref(false)

const wechatLogin = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
    return
  }

  const openid = uni.getStorageSync('openid')
  if (!openid) {
    uni.showToast({ title: '登录信息异常，请重新进入小程序', icon: 'none' })
    return
  }
  isLogging.value = true

  try {
    // 1. 获取微信头像昵称
    const profile = await new Promise((resolve, reject) => {
      uni.getUserProfile({ desc: '用于展示您的头像和昵称', success: resolve, fail: reject })
    })

    // 2. 下载头像到本地
    const dl = await new Promise((resolve, reject) => {
      uni.downloadFile({ url: profile.userInfo.avatarUrl, success: resolve, fail: reject })
    })

    // 3. 上传到自有服务器
    let avatarUrl = ''
    if (dl.statusCode === 200) {
      const up = await new Promise((resolve, reject) => {
        uni.uploadFile({
          url: `${BASE_URL}/common/upload`,
          filePath: dl.tempFilePath,
          name: 'file',
          success: resolve,
          fail: reject
        })
      })
      if (up.statusCode === 200) {
        const data = JSON.parse(up.data)
        if (data.code === 2000) avatarUrl = data.data.file_url
      }
    }

    // 4. 更新到后端
    await Promise.all([
      putRequest('/user/info/avatar/update', { avatar_url: avatarUrl, openid }),
      putRequest('/user/info/nickname/update', { nickname: profile.userInfo.nickName, openid })
    ])

    // 5. 存入本地，后续下单时校验是否已登录
    uni.setStorageSync('nickname', profile.userInfo.nickName)
    uni.setStorageSync('avatar', avatarUrl)

    uni.showToast({ title: '授权成功', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 800)
  } catch (err) {
    const msg = err?.errMsg?.includes('cancel') ? '已取消授权' : '授权失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    isLogging.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 60rpx;
  box-sizing: border-box;
}

// 品牌区
.brand-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 280rpx;
}

.brand-name {
  font-size: 52rpx;
  font-weight: bold;
  color: #333;
  letter-spacing: 8rpx;
}

.brand-slogan {
  font-size: 26rpx;
  color: #999;
  margin-top: 24rpx;
}

// 登录区
.login-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 160rpx;
}

// 登录按钮
.wx-login-btn {
  width: 100%;
  height: 96rpx;
  background: #07c160;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after { border: none; border-radius: 48rpx; }

  &[disabled] {
    background: #ccc;
  }
}

.wx-btn-inner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 34rpx;
  color: #fff;
  font-weight: 500;
}

.wx-icon-circle {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #fff;
  font-weight: bold;
}

// 协议勾选
.agree-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 48rpx;
}

.agree-circle {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agree-checked {
  background: #07c160;
  border-color: #07c160;
}

.agree-text {
  font-size: 24rpx;
  color: #999;
}
</style>

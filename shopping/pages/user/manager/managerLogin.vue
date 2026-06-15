<template>
  <view class="login-container">
    <!-- 标题 -->
    <view class="title">管理员登录</view>

    <!-- 手机号输入 -->
    <view class="input-item">
      <uni-icons type="phone" size="28" color="#666"></uni-icons>
      <input
        class="input"
        v-model="form.phone"
        type="number"
        placeholder="请输入管理员手机号"
        maxlength="11"
      />
    </view>

    <!-- 登录方式切换 -->
    <view class="tab-wrap">
      <text
        class="tab-item"
        :class="{ active: loginType === 'code' }"
        @tap="loginType = 'code'"
      >
        验证码登录
      </text>
      <text
        class="tab-item"
        :class="{ active: loginType === 'pwd' }"
        @tap="loginType = 'pwd'"
      >
        密码登录
      </text>
    </view>

    <!-- 验证码登录 -->
    <view class="input-item" v-if="loginType === 'code'">
      <uni-icons type="lock" size="28" color="#666"></uni-icons>
      <input
        class="input"
        v-model="form.code"
        type="number"
        placeholder="请输入验证码"
        maxlength="6"
      />
      <button
        class="code-btn"
        :disabled="countdown > 0"
        @tap="sendCode"
      >
        {{ countdown > 0 ? `${countdown}s` : "获取验证码" }}
      </button>
    </view>

    <!-- 密码登录 → 对接后端接口 -->
    <view class="input-item" v-else>
      <uni-icons type="locked" size="28" color="#666"></uni-icons>
      <input
        class="input"
        v-model="form.password"
        :password="!showPwd"
        placeholder="请输入登录密码"
        maxlength="18"
      />
      <!-- 眼睛图标 -->
      <uni-icons 
        :type="showPwd ? 'eye' : 'eye-slash'" 
        size="28" 
        color="#999"
        @tap="showPwd = !showPwd"
      ></uni-icons>
    </view>

    <!-- 登录按钮 -->
    <button class="submit-btn" @tap="login">登录</button>

    <!-- 跳转注册 -->
    <view class="link-wrap" @tap="goRegister">
      <text class="link">没有账号？立即注册</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
// 🔥 引入请求工具和Token存储方法
import { postRequest, setToken } from '@/utils/request.js'

// 登录类型：code验证码 / pwd密码
const loginType = ref('code')
// 密码可见性
const showPwd = ref(false)
// 表单数据
const form = reactive({
  phone: '',
  code: '',
  password: ''
})
// 验证码倒计时
const countdown = ref(0)
let timer = null

// 发送验证码（和之前保持一致）
const sendCode = async() => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  if(countdown.value > 0) return
  try {
    await postRequest(`/common/phone_captcha?phone=${form.phone}`, {}) 
    uni.showToast({ title: '验证码发送成功', icon: 'success' })
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (err) {
    uni.showToast({ title: '验证码发送失败', icon: 'none' })
    console.error(err)
  }
}

// 🔥 登录提交（对接后端 /admin/login 接口）
const login = async () => {
  // 基础校验：手机号必须填
  if (!form.phone) return uni.showToast({ title: '请输入手机号', icon: 'none' })

  // 1. 验证码登录（暂未对接接口，可后续扩展）
  if (loginType.value === 'code') {
    uni.showToast({ title: '验证码登录暂未开放', icon: 'none' })
    return
  }

  // 2. 密码登录：对接后端接口
  if (!form.password) return uni.showToast({ title: '请输入密码', icon: 'none' })

  try {
    // 调用管理员登录接口，参数完全匹配后端要求
    const res = await postRequest('/admin/login', {
      phone: form.phone,
      password: form.password
    })

    // 登录成功

    // 适配后端成功码 2000
    if (res.code === 2000) {
      // ✅ 登录成功：存储角色为管理员
      uni.setStorageSync('role', 'admin')
      setToken(res.data)
      // 从 token 中解码 user_id 并存下来（token 格式: base64(user_id).uuid）
      try {
        const b64 = res.data.split('.')[0]
        // eslint-disable-next-line
        const uid = atob(b64)
        uni.setStorageSync('admin_userid', uid)
      } catch (e) { /* 忽略 */ }
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        // 清空页面栈，跳转到管理员首页
        uni.reLaunch({ url: '/pages/admin/index/index' })
      }, 1000)
    } else {
      // 后端返回业务错误（如密码错误、账号不存在）
      uni.showToast({ title: res.message || '登录失败', icon: 'none' })
    }
  } catch (err) {
    // 网络错误/接口报错
    uni.showToast({ title: '登录请求失败，请重试', icon: 'none' })
    console.error('登录错误：', err)
  }
}

// 跳转到注册页
const goRegister = () => {
  uni.navigateTo({ url: '/pages/user/manager/managerRegister' })
}

// 销毁定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.login-container {
  padding: 60rpx 40rpx;
  min-height: 100vh;
  background-color: #fff;

  .title {
    font-size: 48rpx;
    font-weight: bold;
    text-align: center;
    margin-bottom: 80rpx;
    color: #333;
  }

  .input-item {
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid #eee;
    padding: 20rpx 0;
    margin-bottom: 40rpx;
    gap: 20rpx;

    .input {
      flex: 1;
      font-size: 30rpx;
      color: #333;
    }

    .code-btn {
      width: 180rpx;
      height: 60rpx;
      line-height: 60rpx;
      font-size: 26rpx;
      color: #07c160;
      background: transparent;
      border: 1rpx solid #07c160;
      border-radius: 30rpx;
      padding: 0;

      &:disabled {
        color: #999;
        border-color: #ccc;
      }

      &::after {
        border: none;
      }
    }
  }

  // 登录方式切换
  .tab-wrap {
    display: flex;
    margin-bottom: 40rpx;

    .tab-item {
      flex: 1;
      text-align: center;
      font-size: 30rpx;
      color: #666;
      padding: 20rpx 0;
      position: relative;

      &.active {
        color: #07c160;
        font-weight: bold;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60rpx;
          height: 4rpx;
          background-color: #07c160;
          border-radius: 2rpx;
        }
      }
    }
  }

  .submit-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background-color: #07c160;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    margin-top: 40rpx;

    &::after {
      border: none;
    }
  }

  .link-wrap {
    text-align: center;
    margin-top: 40rpx;

    .link {
      font-size: 28rpx;
      color: #07c160;
    }
  }
}
</style>
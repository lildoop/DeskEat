<template>
  <view class="register-container">
    <!-- 标题 -->
    <view class="title">管理员注册</view>

    <!-- 手机号 -->
    <view class="input-item">
      <uni-icons type="phone" size="28" color="#666"></uni-icons>
      <input
        class="input"
        v-model="form.phone"
        type="number"
        placeholder="请输入手机号"
        maxlength="11"
      />
    </view>

    <!-- 验证码 -->
    <view class="input-item">
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

    <!-- 密码 → 新增眼睛图标切换明文/密文 -->
    <view class="input-item">
      <uni-icons type="locked" size="28" color="#666"></uni-icons>
      <input
        class="input"
        v-model="form.password"
        :password="!showPwd"
        placeholder="请设置密码(6-18位字母+数字)"
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
    
    <!-- 密码规则 -->
    <view class="tip">密码规则：6-18位，包含字母和数字，无特殊字符</view>
    <!-- 🔥 新增红色提示文字 -->
    <view class="red-tip">*注册手机号只能是想要开店中填写的通过审核的手机号</view>

    <!-- 注册按钮 -->
    <button class="submit-btn" @tap="register">立即注册</button>

    <!-- 跳转登录 -->
    <view class="link-wrap" @tap="goLogin">
      <text class="link">已有账号？返回登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { postRequest } from '@/utils/request.js'
// 密码可见性
const showPwd = ref(false)
const form = reactive({
  phone: '',
  code: '',
  password: ''
})
const countdown = ref(0)
let timer = null

// 发送验证码（修复：异常捕获 + 适配接口）
const sendCode = async() => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  // 防止重复点击
  if(countdown.value > 0) return
  try {
    const res = await postRequest(`/common/phone_captcha?phone=${form.phone}`, {}) 
    // 验证码发送成功
    uni.showToast({ title: '验证码发送成功', icon: 'success' })
    // 倒计时逻辑
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

// 密码正则：6-18位 字母+数字 无特殊字符
const pwdReg = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,18}$/

// 注册提交（修复：参数错误 + 适配2000状态码）
const register = async () => {
  if (!form.phone) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  if (!form.code) return uni.showToast({ title: '请输入验证码', icon: 'none' })
  if (!form.password) return uni.showToast({ title: '请输入密码', icon: 'none' })
  if (!pwdReg.test(form.password)) {
    uni.showToast({
      title: '密码需6-18位，含字母+数字，无特殊字符',
      icon: 'none',
      duration: 3000
    })
    return
  }
  
  try {
    // 🔥 修复：password 错误写成 form.phone，改为正确的 form.password
    const res = await postRequest('/admin/register',{
      password: form.password,
      phone: form.phone,
      captcha: form.code
    })
    // 注册成功
    // 🔥 适配后端成功码 2000
    if (res.code === 2000){
      uni.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        uni.reLaunch({url:'/pages/user/manager/managerLogin'})
      }, 1500)  
    } else{
      uni.showToast({
      	title: res.message || '注册失败',
      	icon: 'none'
      })
    }
  } catch (err) {
    uni.showToast({ title: '注册请求失败', icon: 'none' })
    console.error(err)
  }
}

// 跳回登录
const goLogin = () => {
  uni.navigateBack()
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.register-container {
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
    margin-bottom: 30rpx;
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

  .tip {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 10rpx;
  }
  
  // 红色提示文字样式
  .red-tip {
    font-size: 24rpx;
    color: #ff4d4f;
    margin-bottom: 60rpx;
    line-height: 1.5;
  }

  .submit-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background-color: #07c160;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;

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
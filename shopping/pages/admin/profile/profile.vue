<template>
  <view class="admin-center">
    <!-- 1. 管理员信息卡片（固定头像 + 管理员+唯一编号） -->
    <view class="card user-card">
      <!-- 固定头像（不可点击修改） -->
      <image class="avatar" src="/static/user/头像.jpg" mode="aspectFill"></image>
      <!-- 管理员名称 + 唯一编号 -->
      <text class="admin-name">管理员{{ adminId }}</text>
    </view>

    <!-- 2. 退出登录按钮 -->
    <view class="logout-btn" @tap="logout">退出登录</view>
	<CustomTabBar />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
// 导入需要的请求方法
import { getRequest, clearToken } from '@/utils/request'

// 管理员唯一编号（永不重复）
const adminId = ref('')

// 生成【永不重复】的管理员编号（页面加载时执行）
onMounted(() => {
  const cacheId = uni.getStorageSync('ADMIN_UNIQUE_ID')
  if (cacheId) {
    adminId.value = cacheId
    return
  }
  const timestamp = new Date().getTime().toString().slice(-4)
  const random = Math.floor(Math.random() * 90 + 10)
  const newId = timestamp + random
  uni.setStorageSync('ADMIN_UNIQUE_ID', newId)
  adminId.value = newId
})

// 退出登录（必须调用后端接口版本）
const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出管理员账号吗？',
    confirmText: '确定',
    cancelText: '取消',
    // 关键：回调函数加 async 支持异步请求
    success: async (res) => {
      // 点击取消，直接退出
      if (!res.confirm) return

      try {
        // 🔥 1. 优先调用【后端登出接口】（后端销毁token）
        // 如果你的后端登出接口地址不是这个，直接替换字符串即可
        const result = await getRequest('/admin/logout')

        // 🔥 2. 只有后端返回 2000 才执行登出操作
        if (result.code === 2000) {
          // 3. 清除前端登录状态
          clearToken() // 清除token
          uni.removeStorageSync('role') // 清除角色

          // 4. 提示成功
          uni.showToast({
            title: '退出登录成功',
            icon: 'success',
            duration: 1500
          })

          // 5. 跳转到首页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/user/index/index'
            })
          }, 1500)
        } else {
          // 后端返回失败
          uni.showToast({
            title: result.message || '退出失败',
            icon: 'none'
          })
        }
      } catch (err) {
        // 接口请求失败
        uni.showToast({ title: '网络异常，退出失败', icon: 'none' })
        console.error('登出接口错误：', err)
      }
    }
  })
}
</script>

<style scoped lang="scss">
.admin-center {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 40rpx 20rpx;
}

// 通用卡片样式
.card {
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
}

// 管理员信息卡片
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid #f0f0f0;
  }

  .admin-name {
    font-size: 36rpx;
    font-weight: 500;
    color: #333;
  }
}

// 退出登录按钮
.logout-btn {
  height: 88rpx;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
  cursor: pointer;
}
</style>
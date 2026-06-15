<template>
  <!-- 🔥 外层绿色容器：固定高度 + 自定义背景色 -->
  <view class="tab-bar-wrapper" v-if="showTabBar">
    <!-- 管理员 TabBar -->
    <view class="tab-bar" v-if="role === 'admin'">
      <view class="tab-item" v-for="item in adminTabList" :key="item.path" @tap="switchTab(item.path)">
        <image class="tab-img" :src="isActive(item.path) ? item.activeIcon : item.icon" mode="widthFix"></image>
        <text :class="isActive(item.path) ? 'active-text' : 'default-text'">{{ item.name }}</text>
      </view>
    </view>

    <!-- 用户 TabBar -->
    <view class="tab-bar" v-if="role === 'user'">
      <view class="tab-item" v-for="item in userTabList" :key="item.path" @tap="switchTab(item.path)">
        <image class="tab-img" :src="isActive(item.path) ? item.activeIcon : item.icon" mode="widthFix"></image>
        <text :class="isActive(item.path) ? 'active-text' : 'default-text'">{{ item.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
const currentPath = ref('')
const showTabBar = ref(true)

// 管理员菜单
const adminTabList = ref([
  { name: '商品管理', path: '/pages/admin/index/index', icon: '/static/admin/商品管理.png', activeIcon: '/static/admin/商品管理选中.png' },
  { name: '订单', path: '/pages/admin/order/order', icon: '/static/admin/订单信息.png', activeIcon: '/static/admin/订单信息选中.png' },
  { name: '店铺设置', path: '/pages/admin/shop/shop', icon: '/static/admin/店铺设置.png', activeIcon: '/static/admin/店铺设置选中.png' },
  { name: '数据统计', path: '/pages/admin/data/data', icon: '/static/admin/数据统计.png', activeIcon: '/static/admin/数据统计选中.png' },
  { name: '我的', path: '/pages/admin/profile/profile', icon: '/static/admin/用户.png', activeIcon: '/static/admin/用户选中.png' }
])
// 用户菜单
const userTabList = ref([
  { name: '首页', path: '/pages/user/index/index', icon: '/static/user/点餐.png', activeIcon: '/static/user/点餐选中.png' },
  { name: '点餐', path: '/pages/user/buy/buy', icon: '/static/user/点餐.png', activeIcon: '/static/user/点餐选中.png' },
  { name: '订单', path: '/pages/user/order/order', icon: '/static/user/订单.png', activeIcon: '/static/user/订单选中.png' },
  { name: '我的', path: '/pages/user/profile/profile', icon: '/static/user/用户.png', activeIcon: '/static/user/用户选中.png' }
])

const role = computed(() => uni.getStorageSync('role') || 'user')
const isActive = (path) => currentPath.value === path
const switchTab = (url) => uni.reLaunch({ url })

const getCurrentPageRoute = () => {
  const pages = getCurrentPages()
  if (!pages.length) return
  currentPath.value = '/' + pages[pages.length - 1].route
}

onMounted(() => {
  getCurrentPageRoute()
  // 登录/注册页隐藏TabBar
  const hideRouteList = ['/pages/login/login', '/pages/register/register']
  showTabBar.value = !hideRouteList.includes(currentPath.value)
})
</script>

<style scoped lang="scss">
/* 🔥 外层父容器：固定高度 + 你指定的绿色背景 + 安全区适配 */
.tab-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  // 总高度：100rpx(TabBar) + 安全区域，固定高度
  height: calc(100rpx + env(safe-area-inset-bottom));
  background-color: rgb(255, 255, 255);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
}

/* 原有TabBar：居中放置，白色背景不变 */
.tab-bar {
  width: 100%;
  height: 100rpx;
  background: #fff;
  border-top: none;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.tab-img {
  width: 40rpx;  /* 图片宽度 */
  height: 40rpx; /* 图片高度 */
}
.default-text { font-size: 24rpx; color: #666; }
.active-text { font-size: 24rpx; color: black; font-weight: 500; }
</style>
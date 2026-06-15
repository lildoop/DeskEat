<template>
  <view class="confirm-page">
    <!-- ========== 商家信息 ========== -->
    <view class="shop-card">
      <text class="shop-name">{{ shopInfo.name }}</text>
      <view class="shop-row">
        <uni-icons type="location-filled" size="13" color="#999"></uni-icons>
        <text class="shop-text">{{ shopInfo.address }}</text>
      </view>
      <view class="shop-row" v-if="deskId">
        <uni-icons type="flag-filled" size="13" color="#999"></uni-icons>
        <text class="shop-text">桌号：{{ deskId }}</text>
      </view>
    </view>

    <!-- ========== 菜品列表 ========== -->
    <view class="items-card">
      <text class="items-title">已选菜品</text>
      <view class="item-row" v-for="entry in cartEntries" :key="entry.entryId">
        <image class="item-img" :src="entry.dishImg || '/static/user/点餐.png'" mode="aspectFill"></image>
        <view class="item-info">
          <text class="item-name">{{ entry.dishName }}</text>
          <text class="item-spec" v-if="entry.specLabel">{{ entry.specLabel }}</text>
        </view>
        <view class="item-right">
          <text class="item-price">¥{{ entry.price }}</text>
          <text class="item-qty">x{{ entry.quantity }}</text>
        </view>
      </view>
    </view>

    <!-- ========== 合计 ========== -->
    <view class="total-card">
      <text class="total-label">合计</text>
      <text class="total-price">¥{{ finalTotal }}</text>
    </view>

    <!-- ========== 下单按钮 ========== -->
    <view class="submit-btn" @tap="placeOrder" :class="{ 'submit-disabled': isSubmitting }">{{ isSubmitting ? '下单中...' : '下单' }}</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { postRequest } from '@/utils/request.js'

const shopInfo = ref({ name: '', address: '' })
const deskId = ref(null)
const cartEntries = ref([])

const finalTotal = computed(() => {
  let p = 0
  cartEntries.value.forEach(e => p += e.price * e.quantity)
  return p.toFixed(2)
})

onMounted(() => {
  try {
    const raw = uni.getStorageSync('checkout_data')
    if (raw) {
      const data = JSON.parse(raw)
      cartEntries.value = data.cartEntries || []
      shopInfo.value = data.shopInfo || { name: '', address: '' }
      deskId.value = data.deskId || null
    }
  } catch (e) {
    console.error('读取下单数据失败：', e)
  }
})

const isSubmitting = ref(false)

const placeOrder = async () => {
  if (isSubmitting.value) return

  // 检查是否已授权微信头像昵称（登录页完成）
  const nickname = uni.getStorageSync('nickname')
  if (!nickname) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/user/login/login' }), 800)
    return
  }

  const userId = uni.getStorageSync('userid')
  if (!userId) {
    uni.showToast({ title: '登录信息异常，请重新进入小程序', icon: 'none' })
    return
  }

  // 构造 shop_list：{ name, tags: [{id, number}], number }
  const shopList = cartEntries.value.map(entry => ({
    name: entry.dishName,
    number: entry.quantity,
    tags: entry.specs
      ? Object.entries(entry.specs).map(([, spec]) => ({ id: spec.tagId, number: 1 }))
      : []
  }))

  isSubmitting.value = true
  uni.showLoading({ title: '下单中...', mask: true })
  try {
    // user_id / desk_id 是 query 参数，shopList 是 body
    // TODO: 餐桌功能完成后从 deskId.value 读取
    const res = await postRequest(`/order/user/add?user_id=${userId}&desk_id=1`, shopList)
    if (res.code === 2000) {
      uni.removeStorageSync('checkout_data')
      // 存储订单数据供订单详情页使用
      const order = res.data
      uni.setStorageSync('order_detail_data', JSON.stringify({
        shopName: order.desk || '堂食',
        shopAddress: '',
        goodsList: (order.shops || []).map(s => ({
          image: '/static/user/点餐.png',
          name: s.name,
          price: s.price,
          count: s.number,
          spec: s.tags || '',
          unit: '份'
        })),
        totalCount: (order.shops || []).reduce((n, s) => n + s.number, 0),
        totalPrice: order.total,
        orderNo: String(order.uid),
        createTime: (order.create_time || '').replace('T', ' ').slice(0, 19),
        tableNo: order.desk || '',
        status: order.status
      }))
      uni.showToast({ title: '下单成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/user/order/order-detail' })
      }, 800)
    } else {
      uni.showToast({ title: res.message || '下单失败', icon: 'none' })
    }
  } catch (err) {
    const msg = err?.data?.message || '下单失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
    console.error('下单错误：', err)
  } finally {
    isSubmitting.value = false
    uni.hideLoading()
  }
}
</script>

<style scoped lang="scss">
$primary: #ffc300;

.confirm-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

// 商家卡片
.shop-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.shop-name { font-size: 34rpx; font-weight: bold; color: #222; display: block; }
.shop-row { display: flex; align-items: center; gap: 6rpx; margin-top: 10rpx; }
.shop-text { font-size: 24rpx; color: #999; }

// 菜品列表
.items-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.items-title { font-size: 30rpx; font-weight: 500; color: #333; margin-bottom: 16rpx; display: block; }
.item-row { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; gap: 16rpx; }
.item-row:last-of-type { border-bottom: none; }
.item-img { width: 80rpx; height: 80rpx; border-radius: 8rpx; flex-shrink: 0; background: #f5f5f5; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 28rpx; color: #333; display: block; }
.item-spec { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; flex-shrink: 0; }
.item-price { font-size: 28rpx; color: #ff4d4f; font-weight: 500; }
.item-qty { font-size: 22rpx; color: #999; }

// 合计
.total-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-label { font-size: 32rpx; font-weight: 500; color: #333; }
.total-price { font-size: 40rpx; font-weight: bold; color: #ff4d4f; }

// 下单按钮
.submit-btn {
  position: fixed;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 40rpx;
  right: 40rpx;
  height: 96rpx;
  background: $primary;
  color: #fff;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 500;
}
.submit-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>

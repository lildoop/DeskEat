<template>
  <view class="zt">
    <OrderDetail :orderData="order" :hideActions="true" />

    <!-- 完成按钮（仅未完成订单显示） -->
    <view class="bottom-btn-wrap" v-if="order.status !== 'completed' && order.id">
      <view class="finish-btn" @tap="handleFinish">完成订单</view>
    </view>
    <view class="bottom-status" v-else-if="order.status === 'completed'">
      <text class="completed-text">该订单已完成</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OrderDetail from '@/components/Order/OrderDetail.vue'
import { postRequest } from '@/utils/request.js'

const order = ref({})

const loadOrder = () => {
  try {
    const raw = uni.getStorageSync('order_detail_data')
    if (raw) {
      order.value = JSON.parse(raw)
    }
  } catch (e) {
    console.error('读取订单数据失败：', e)
  }
}

onMounted(() => { loadOrder() })

const handleFinish = async () => {
  const orderId = order.value.id
  if (!orderId) return

  uni.showModal({
    title: '确认完成',
    content: '确定要将该订单设为已完成吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await postRequest('/order/update', { id: orderId, status: 'completed' })
        if (result.code === 2000) {
          order.value.status = 'completed'
          uni.showToast({ title: '订单已完成', icon: 'success' })
        } else {
          uni.showToast({ title: result.message || '操作失败', icon: 'none' })
        }
      } catch (err) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.zt {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx 0;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.bottom-btn-wrap {
  position: fixed;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 40rpx;
  right: 40rpx;
}
.finish-btn {
  height: 96rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 500;
}

.bottom-status {
  position: fixed;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 40rpx;
  right: 40rpx;
  display: flex;
  justify-content: center;
}
.completed-text {
  font-size: 30rpx;
  color: #999;
}
</style>

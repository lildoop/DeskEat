<template>
  <view class="zt">
    <!-- 状态横幅 -->
    <view class="top-tag" v-if="order.status === 'completed'">
      <text class="top">已完成</text>
      <text class="bottom">亲爱的顾客，欢迎下次光临</text>
    </view>
    <view class="top-tag" v-else>
      <text class="top">制作中</text>
      <text class="bottom">请您耐心等待</text>
    </view>

    <OrderDetail :orderData="order" />

    <!-- 加菜按钮（仅制作中可加） -->
    <view class="append-btn-wrap" v-if="order.status !== 'completed' && order.orderNo">
      <view class="append-btn" @tap="goAddMore">加菜</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OrderDetail from '@/components/Order/OrderDetail.vue'

const order = ref({
  shopName: '',
  shopAddress: '',
  goodsList: [],
  totalCount: 0,
  totalPrice: 0,
  orderNo: '',
  createTime: '',
  tableNo: '',
  status: ''
})

onMounted(() => {
  try {
    const raw = uni.getStorageSync('order_detail_data')
    if (raw) {
      const data = JSON.parse(raw)
      order.value = data
    }
  } catch (e) {
    console.error('读取订单数据失败：', e)
  }
})

const goAddMore = () => {
  // 把订单号存下来，跳回点餐页进入"加菜模式"
  uni.setStorageSync('append_order_id', order.value.orderNo)
  uni.navigateTo({ url: '/pages/user/buy/buy' })
}
</script>

<style lang="scss" scoped>
.zt {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx 0;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.top-tag {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 20rpx 20rpx 20rpx;
  display: flex;
  flex-direction: column;

  .top { font-size: 40rpx; color: #000; font-weight: 500; margin-bottom: 8rpx; }
  .bottom { font-size: 26rpx; color: #666; }
}

.append-btn-wrap {
  position: fixed;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 40rpx; right: 40rpx;
}
.append-btn {
  height: 96rpx;
  background: #ffc300; color: #fff;
  border-radius: 48rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 34rpx; font-weight: 500;
}
</style>

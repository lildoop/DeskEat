<template>
  <view class="detail-page">
    <!-- 1. 门店+商品信息卡片 -->
    <view class="card goods-card">
      <view class="top-section">
        <view class="top-left">
          <text class="shop-name">{{ order.shopName }}</text>
          <text class="shop-address">{{ order.shopAddress }}</text>
        </view>
        <view class="top-right" v-if="!hideActions">
          <view class="phone-btn" @tap="callShop">
            <uni-icons type="phone" size="20" color="#ff4d4f"></uni-icons>
          </view>
          <view class="map-btn" @tap="findShop">
            <uni-icons type="paperplane" size="20" color="#007aff"></uni-icons>
          </view>
        </view>
      </view>

      <view class="divider"></view>

      <view class="bottom-section">
        <view class="goods-list">
          <view class="goods-item" v-for="(item, index) in order.goodsList" :key="index">
            <image class="goods-img" :src="item.image || '/static/user/点餐.png'" mode="aspectFill"></image>
            <view class="goods-content">
              <text class="goods-name">{{ item.name }}</text>
              <text class="goods-spec" v-if="item.spec">{{ item.spec }}</text>
            </view>
            <view class="goods-price-wrap">
              <text class="goods-price">¥{{ item.price }}</text>
              <text class="goods-count">x{{ item.count }}{{ item.unit || '份' }}</text>
            </view>
          </view>
        </view>

        <view class="total-wrap">
          <text class="total-text">共{{ order.totalCount }}份 总价</text>
          <text class="total-price">¥{{ order.totalPrice }}</text>
        </view>
      </view>
    </view>

    <!-- 2. 订单信息卡片 -->
    <view class="card info-card">
      <text class="card-title">订单信息</text>
      <view class="info-list">
        <view class="info-item">
          <text class="info-key">订单编号</text>
          <view class="info-value-wrap">
            <text class="info-value">{{ order.orderNo }}</text>
            <button class="copy-btn" @tap="copyOrderNo">复制</button>
          </view>
        </view>
        <view class="info-item">
          <text class="info-key">下单时间</text>
          <text class="info-value">{{ order.createTime }}</text>
        </view>
        <view class="info-item">
          <text class="info-key">桌台名称</text>
          <text class="info-value">{{ order.tableNo }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  orderData: { type: Object, default: () => ({}) },
  hideActions: { type: Boolean, default: false }
})

const order = reactive({
  shopName: '',
  shopAddress: '',
  goodsList: [],
  totalCount: 0,
  totalPrice: 0,
  orderNo: '',
  createTime: '',
  tableNo: '',
  phone: ''
})

watch(() => props.orderData, (val) => {
  if (val && Object.keys(val).length > 0) {
    order.shopName = val.shopName || ''
    order.shopAddress = val.shopAddress || ''
    order.goodsList = val.goodsList || []
    order.totalCount = val.totalCount || 0
    order.totalPrice = val.totalPrice || 0
    order.orderNo = val.orderNo || ''
    order.createTime = val.createTime || ''
    order.tableNo = val.tableNo || ''
    order.phone = val.phone || ''
  }
}, { immediate: true, deep: true })

const copyOrderNo = () => {
  if (!order.orderNo) return
  uni.setClipboardData({
    data: String(order.orderNo),
    success: () => uni.showToast({ title: '订单号已复制', icon: 'success' })
  })
}

const callShop = () => {
  if (order.phone) {
    uni.makePhoneCall({ phoneNumber: order.phone })
  } else {
    uni.showToast({ title: '暂无商家电话', icon: 'none' })
  }
}

const findShop = () => {
  // TODO: 接入真实经纬度
  uni.showToast({ title: '暂无位置信息', icon: 'none' })
}
</script>

<style scoped lang="scss">
.detail-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.goods-card {
  .top-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
  .top-left { flex: 1; margin-right: 20rpx; }
  .shop-name { display: block; font-size: 32rpx; font-weight: 500; color: #333; margin-bottom: 8rpx; }
  .shop-address { display: block; font-size: 26rpx; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .top-right { display: flex; gap: 20rpx; align-items: center; }
  .phone-btn, .map-btn {
    height: 50rpx; width: 50rpx; background-color: #eee;
    border-radius: 50%; display: flex; justify-content: center; align-items: center;
  }
  .divider { width: 100%; height: 1rpx; background-color: #eee; margin-bottom: 24rpx; }

  .bottom-section {
    .goods-list { margin-bottom: 24rpx; }
    .goods-item { display: flex; align-items: center; margin-bottom: 24rpx; &:last-child { margin-bottom: 0; } }
    .goods-img { width: 120rpx; height: 120rpx; border-radius: 8rpx; flex-shrink: 0; background: #f5f5f5; }
    .goods-content { flex: 1; margin: 0 20rpx; min-width: 0; }
    .goods-name { display: block; font-size: 30rpx; color: #333; font-weight: 500; margin-bottom: 8rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .goods-spec { display: block; font-size: 24rpx; color: #999; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .goods-price-wrap { text-align: right; flex-shrink: 0; }
    .goods-price { display: block; font-size: 28rpx; color: #333; font-weight: 500; margin-bottom: 4rpx; }
    .goods-count { display: block; font-size: 26rpx; color: #999; }

    .total-wrap { text-align: right; font-size: 30rpx; }
    .total-text { color: #333; }
    .total-price { color: #333; font-weight: bold; margin-left: 8rpx; }
  }
}

.info-card {
  .card-title { display: block; font-size: 32rpx; font-weight: 500; color: #333; margin-bottom: 24rpx; }
  .info-list {
    .info-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #eee; &:last-child { border-bottom: none; } }
    .info-key { font-size: 28rpx; color: #333; }
    .info-value { font-size: 28rpx; color: black; }
    .info-value-wrap { display: flex; align-items: center; gap: 16rpx; }
    .copy-btn { border: 1rpx solid #eee; border-radius: 8rpx; padding: 8rpx 16rpx; font-size: 24rpx; color: #666; background-color: #fff; &::after { border: none; } }
  }
}
</style>

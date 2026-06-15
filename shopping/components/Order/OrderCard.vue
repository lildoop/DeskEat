<template>
  <view class="order-card">
    <!-- 订单头部：堂食标签 + 门店名 + 订单状态插槽 -->
    <view class="order-header">
      <view class="header-left">
        <text class="order-type">{{ order.orderType }}</text>
        <text class="shop-name">{{ order.shopName }}</text>
      </view>
      <!-- 🔥 订单状态插槽：管理员自定义按钮/文字 -->
      <slot name="orderStatus"></slot>
    </view>

    <text class="order-time">{{ order.createTime }}</text>

    <!-- 商品区域：固定显示4个，横向滑动 -->
    <view class="goods-section">
      <scroll-view class="goods-scroll" scroll-x show-scrollbar="false">
        <view class="goods-list">
          <view class="goods-item" v-for="(item, index) in order.goodsList" :key="index">
            <view class="goods-img-wrap">
              <image class="goods-img" :src="item.image" mode="aspectFill"></image>
              <view class="count-tag">x{{ item.count }}</view>
            </view>
            <text class="goods-name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="total-info">
        <text class="total-price">¥{{ order.totalPrice }}</text>
        <text class="total-count">共{{ order.totalCount }}件</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  order: {
    type: Object,
    required: true,
    default: () => ({})
  }
})
</script>

<style scoped lang="scss">
.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .order-type {
        border: 2rpx solid #ff4d4f;
        color: #ff4d4f;
        padding: 4rpx 8rpx;
        border-radius: 4rpx;
        font-size: 22rpx;
        font-weight: 500;
      }

      .shop-name {
        font-size: 30rpx;
        font-weight: 500;
        color: #333;
      }
    }
  }

  .order-time {
    display: block;
    font-size: 26rpx;
    color: #999;
    margin-bottom: 24rpx;
  }

  .goods-section {
    display: flex;
    align-items: center;
    gap: 20rpx;

    // 固定显示4个商品，禁止拉伸
    .goods-scroll {
      max-width: calc(4 * 120rpx + 3 * 16rpx);
      flex: none;
      white-space: nowrap;
    }

    .goods-list {
      display: flex;
      gap: 16rpx;
    }

    .goods-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      width: 120rpx;
      flex-shrink: 0;

      .goods-img-wrap {
        position: relative;
        width: 100rpx;
        height: 100rpx;

        .goods-img {
          width: 100%;
          height: 100%;
          border-radius: 8rpx;
        }

        .count-tag {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          font-size: 22rpx;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;
        }
      }

      .goods-name {
        font-size: 24rpx;
        color: #666;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        white-space: normal;
      }
    }

    .total-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8rpx;
      flex: 1;

      .total-price {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .total-count {
        font-size: 26rpx;
        color: #999;
      }
    }
  }
}
</style>
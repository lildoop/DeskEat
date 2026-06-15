<template>
  <view class="goods-manage">
    <view class="goods-card-list" v-if="filteredGoodsList.length > 0">
      <view class="goods-card" v-for="good in filteredGoodsList" :key="good.id">
        <image class="goods-img" :src="good.imgs" mode="aspectFill"></image>
        <view class="goods-info">
          <text class="goods-name">{{ good.name }}</text>
          <text class="goods-category" v-if="good.categoryName || good.category">{{ good.categoryName || good.category }}</text>
          <text class="goods-price">¥{{ good.price }}</text>
          <text class="goods-stock">库存：{{ good.stock }}</text>
        </view>
        <view class="btn-group">
          <button class="edit-btn" @tap="$emit('edit', good)">编辑</button>
          <button class="delete-btn" @tap="$emit('delete', good)">删除</button>
        </view>
      </view>
    </view>
    <view class="empty-state" v-else>
      <text class="empty-text">{{ keyword ? '没有匹配的菜品' : '暂无菜品，点击上方按钮新增' }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  goodsList: { type: Array, default: () => [] },
  keyword: { type: String, default: '' }
})
defineEmits(['edit', 'delete'])

const filteredGoodsList = computed(() => {
  const kw = props.keyword.trim()
  if (!kw) return props.goodsList
  return props.goodsList.filter(item => item.name.includes(kw))
})
</script>

<style scoped lang="scss">
.goods-manage {
  .goods-card-list { display: flex; flex-direction: column; }
  .goods-card {
    background-color: #fff; border-radius: 16rpx; padding: 24rpx;
    display: flex; align-items: center; gap: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05); margin-bottom: 20rpx;
  }
  .goods-img {
    width: 120rpx; height: 120rpx; border-radius: 12rpx;
    background-color: #f5f5f5; flex-shrink: 0;
  }
  .goods-info {
    flex: 1; display: flex; flex-direction: column; gap: 8rpx;
    .goods-name { font-size: 30rpx; color: #333; font-weight: 500; }
    .goods-category { font-size: 22rpx; color: #f6aa1c; background: #fff7e6; padding: 2rpx 12rpx; border-radius: 6rpx; align-self: flex-start; }
    .goods-price { font-size: 28rpx; color: #ff4d4f; font-weight: bold; }
    .goods-stock { font-size: 24rpx; color: #999; }
  }
  .btn-group {
    display: flex; flex-direction: row; gap: 12rpx; flex-shrink: 0;
    .edit-btn {
      background-color: #3a86ff; color: #fff; border: none;
      border-radius: 8rpx; padding: 10rpx 20rpx; font-size: 24rpx;
    }
    .delete-btn {
      background-color: #ff4d4f; color: #fff; border: none;
      border-radius: 8rpx; padding: 10rpx 20rpx; font-size: 24rpx;
    }
  }
  .empty-state {
    display: flex; justify-content: center; align-items: center;
    padding: 80rpx 0;
    .empty-text { font-size: 28rpx; color: #999; }
  }
}
</style>

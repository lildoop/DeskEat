<template>
  <view class="order-page">
    <!-- 循环渲染订单列表 -->
    <view v-for="(item, idx) in orderList" :key="idx" class="order-card-wrap" @tap="goDetail(item)">
      <OrderCard :order="item">
      <template v-slot:orderStatus>
        <text v-if="!item.isFinished" class="user-status-text making">制作中</text>
        <text v-else class="user-status-text finished">已完成</text>
      </template>
      </OrderCard>
    </view>

    <view class="empty-state" v-if="orderList.length === 0">
      <text class="empty-text">暂无订单</text>
    </view>
    <CustomTabBar />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import OrderCard from '@/components/Order/OrderCard.vue'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import { getRequest } from '@/utils/request.js'

const orderList = ref([])

const goDetail = (order) => {
  uni.setStorageSync('order_detail_data', JSON.stringify(order._raw))
  uni.navigateTo({ url: '/pages/user/order/order-detail' })
}

const mapOrderList = (data) => {
  return (data || []).map(item => {
    const goodsList = (item.shops || []).map(shop => ({
      image: '/static/user/点餐.png',
      name: shop.name,
      count: shop.number,
      price: shop.price,
      spec: shop.tags || ''
    }))
    const totalCount = goodsList.reduce((s, g) => s + g.count, 0)
    return {
      orderType: '堂食',
      shopName: item.desk || '堂食',
      createTime: (item.create_time || '').replace('T', ' ').slice(0, 19),
      goodsList,
      totalPrice: item.total,
      totalCount,
      isFinished: item.status === 'completed',
      _raw: {
        shopName: item.desk || '堂食',
        shopAddress: '',
        goodsList,
        totalCount,
        totalPrice: item.total,
        orderNo: item.uid,
        createTime: (item.create_time || '').replace('T', ' ').slice(0, 19),
        tableNo: item.desk || '',
        status: item.status
      }
    }
  })
}

const fetchOrders = async () => {
  const userId = uni.getStorageSync('userid')
  if (!userId) return

  try {
    const [pendingRes, completedRes] = await Promise.all([
      getRequest(`/order/user/list?user_id=${userId}&status=pending`),
      getRequest(`/order/user/list?user_id=${userId}&status=completed`)
    ])
    const allOrders = [
      ...(pendingRes.code === 2000 ? (pendingRes.data || []) : []),
      ...(completedRes.code === 2000 ? (completedRes.data || []) : [])
    ]
    orderList.value = mapOrderList(allOrders)
  } catch (err) {
    console.error('获取订单列表失败：', err)
  }
}

onMounted(() => { fetchOrders() })

// 每次回到页面都刷新（加菜、下单后返回等）
onShow(() => {
  uni.removeStorageSync('need_refresh_orders')
  fetchOrders()
})
</script>

<style scoped lang="scss">
.order-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 10rpx;
}

.user-status-text { font-size: 28rpx; line-height: 1.2; }
.making { color: #000; }
.finished { color: #666; }

.empty-state { display: flex; justify-content: center; padding: 80rpx 0; }
.empty-text { font-size: 28rpx; color: #999; }
</style>

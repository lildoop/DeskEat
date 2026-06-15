<template>
  <view class="order-page">
    <view v-for="(item, idx) in orderList" :key="idx" class="order-card-wrap" @tap="goDetail(item)">
      <OrderCard :order="item">
        <template v-slot:orderStatus>
          <view
            v-if="!item.isFinished"
            class="status-btn"
            hover-class="status-btn-hover"
            @tap.stop="handleFinish(idx)"
          >
            待完成
          </view>
          <text v-else class="status-text">已完成</text>
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
import { ref, onMounted, onUnmounted } from 'vue'
import OrderCard from '@/components/Order/OrderCard.vue'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import { getRequest, postRequest, BASE_URL } from '@/utils/request.js'

const orderList = ref([])
let socketTask = null

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
        id: item.id,           // 订单主键，用于修改状态
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
  try {
    const [pendingRes, completedRes] = await Promise.all([
      getRequest('/order/admin/list?status=pending'),
      getRequest('/order/admin/list?status=completed')
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

const goDetail = (order) => {
  uni.setStorageSync('order_detail_data', JSON.stringify(order._raw))
  uni.navigateTo({ url: '/pages/admin/order/order-detail' })
}

// ---- 完成订单 ----
const handleFinish = (index) => {
  const order = orderList.value[index]
  const orderId = order._raw?.id
  if (!orderId) return

  uni.showModal({
    title: '确认完成',
    content: '确定要将该订单设为已完成吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await postRequest('/order/update', { id: orderId, status: 'completed' })
        if (result.code === 2000) {
          order.isFinished = true
          if (order._raw) order._raw.status = 'completed'
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

// ---- WebSocket ----
const connectWs = () => {
  const adminId = uni.getStorageSync('admin_userid')
  if (!adminId || socketTask) return

  const wsUrl = BASE_URL.replace(/^http/, 'ws') + `/ws/${adminId}`
  socketTask = uni.connectSocket({ url: wsUrl })

  socketTask.onMessage(() => {
    fetchOrders()
  })

  socketTask.onClose(() => {
    socketTask = null
    setTimeout(() => connectWs(), 3000)
  })

  socketTask.onError((err) => {
    console.error('WebSocket 错误：', err)
    socketTask = null
  })
}

onMounted(() => {
  fetchOrders()
  connectWs()
})

onUnmounted(() => {
  if (socketTask) {
    socketTask.close()
    socketTask = null
  }
})
</script>

<style scoped lang="scss">
.order-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 10rpx;
}

.status-btn {
  padding: 12rpx 20rpx;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 8rpx;
  font-size: 26rpx;
  line-height: 1.2;
}
.status-btn-hover {
  background-color: #e04444;
}

.status-text {
  font-size: 28rpx;
  color: #666;
}

.empty-state { display: flex; justify-content: center; padding: 80rpx 0; }
.empty-text { font-size: 28rpx; color: #999; }
</style>

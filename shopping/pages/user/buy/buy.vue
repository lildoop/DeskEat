<template>
  <view class="order-page">
    <!-- ========== 1. 商家信息卡片 ========== -->
    <view class="shop-card">
      <view class="shop-card-top">
        <view class="shop-logo-wrap" @tap="previewShopLogo">
          <image v-if="shopInfo.logo" class="shop-logo" :src="shopInfo.logo" mode="aspectFill"></image>
          <view v-else class="shop-logo-placeholder">
            <text class="shop-logo-letter">{{ (shopInfo.name || '店')[0] }}</text>
          </view>
        </view>
        <view class="shop-main">
          <text class="shop-name">{{ shopInfo.name || '加载中...' }}</text>
          <view class="shop-addr-row">
            <uni-icons type="location-filled" size="13" color="#999"></uni-icons>
            <text class="shop-addr">{{ shopInfo.address }}</text>
          </view>
        </view>
        <view class="fav-btn" :class="{ 'fav-active': isFavorited }" @tap="toggleFavorite">
          <uni-icons :type="isFavorited ? 'star-filled' : 'star'" size="22" :color="isFavorited ? '#ffc300' : '#ccc'"></uni-icons>
          <text class="fav-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      <view class="shop-extras" v-if="shopInfo.business_time || shopInfo.phone || shopInfo.intro">
        <view class="shop-extra-row" v-if="shopInfo.business_time">
          <uni-icons type="clock-filled" size="14" color="#999"></uni-icons>
          <text class="extra-text">{{ shopInfo.business_time }}</text>
        </view>
        <view class="shop-extra-row" v-if="shopInfo.phone">
          <uni-icons type="phone-filled" size="14" color="#999"></uni-icons>
          <text class="extra-text">{{ shopInfo.phone }}</text>
        </view>
        <view class="shop-extra-row shop-intro" v-if="shopInfo.intro">
          <uni-icons type="info-filled" size="14" color="#999"></uni-icons>
          <text class="extra-text">{{ shopInfo.intro }}</text>
        </view>
      </view>
    </view>

    <!-- ========== 2. 分类 + 菜品主体 ========== -->
    <view class="menu-body">
      <scroll-view class="cate-sidebar" scroll-y>
        <view
          v-for="cate in categoryList" :key="cate.id"
          class="cate-item" :class="{ 'cate-active': activeCateId === cate.id }"
          @tap="onCateClick(cate.id)"
        >
          <view class="cate-indicator" v-if="activeCateId === cate.id"></view>
          <text class="cate-text">{{ cate.name }}</text>
        </view>
      </scroll-view>

      <scroll-view
        class="dish-panel" scroll-y
        :scroll-into-view="scrollToId" scroll-with-animation
        @scroll="onDishScroll"
      >
        <view v-for="cate in categoryList" :key="cate.id" :id="`cat-${cate.id}`" class="dish-group">

          <view class="dish-card" v-for="dish in cate.dishes" :key="dish.id">
            <image class="dish-img" :src="dish.imgs || '/static/user/点餐.png'" mode="aspectFill"></image>
            <view class="dish-body">
              <text class="dish-name">{{ dish.name }}</text>
              <text class="dish-stock">库存：{{ dish.stock }}</text>
              <view class="dish-bottom">
                <view class="dish-price">
                  <text class="price-symbol">¥</text>
                  <text class="price-num">{{ dish.price }}</text>
                </view>
                <view class="dish-ctrl">
                  <!-- 有规格的菜 -->
                  <template v-if="hasDishSpec(dish)">
                    <view class="spec-btn" @tap="openSpecPopup(dish)">选规格</view>
                    <template v-if="getDishCartTotal(dish.id) > 0">
                      <uni-icons type="minus" size="18" color="#999" @tap="removeSpecDish(dish)"></uni-icons>
                      <text class="ctrl-num">{{ getDishCartTotal(dish.id) }}</text>
                      <uni-icons type="plus" size="18" color="#ffc300" @tap="addSpecDish(dish)"></uni-icons>
                    </template>
                  </template>
                  <!-- 无规格的菜 -->
                  <template v-else>
                    <template v-if="getDishCartTotal(dish.id) > 0">
                      <uni-icons type="minus" size="18" color="#999" @tap="removeFromCart(dish)"></uni-icons>
                      <text class="ctrl-num">{{ getDishCartTotal(dish.id) }}</text>
                    </template>
                    <uni-icons type="plus" size="18" color="#ffc300" @tap="addToCart(dish)"></uni-icons>
                  </template>
                </view>
              </view>
            </view>
          </view>

        </view>
        <view class="dish-panel-bottom"></view>
      </scroll-view>
    </view>

    <!-- ========== 3. 底部购物车栏 ========== -->
    <view class="cart-bar" v-if="totalNum > 0">
      <view class="cart-left" @tap="showCartPopup = true">
        <view class="cart-icon-wrap">
          <uni-icons type="cart" size="22" color="#fff"></uni-icons>
          <view class="cart-badge">{{ totalNum }}</view>
        </view>
        <view class="cart-price-wrap">
          <text class="cart-price">¥{{ totalPrice }}</text>
          <text class="cart-extra">已选{{ totalNum }}件</text>
        </view>
      </view>
      <view class="cart-submit" @tap="goCheckout">{{ isAppendMode ? '加菜' : '去下单' }}</view>
    </view>

    <!-- ========== 4. 规格选择弹窗 ========== -->
    <view class="popup-mask" v-if="specPopup.show" @tap="closeSpecPopup">
      <view class="spec-popup" @tap.stop>
        <view class="spec-popup-title">{{ specPopup.dish?.name }}</view>
        <view class="spec-groups">
          <view class="spec-group" v-for="group in specPopup.groups" :key="group.id">
            <text class="spec-group-name">{{ group.name }}</text>
            <view class="spec-tags">
              <view
                v-for="tag in group.tags" :key="tag.id"
                class="spec-tag"
                :class="{ 'spec-tag-active': specPopup.selected[group.id] === tag.id }"
                @tap="selectSpecTag(group.id, tag)"
              >
                <text class="spec-tag-name">{{ tag.name }}</text>
                <text class="spec-tag-price" v-if="tag.price !== specPopup.dish?.price">¥{{ tag.price }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="spec-popup-footer">
          <text class="spec-total">¥{{ specTotalPrice }}</text>
          <view class="spec-confirm-btn" @tap="confirmSpec">加入购物车</view>
        </view>
      </view>
    </view>

    <!-- ========== 5. 购物车详情弹窗 ========== -->
    <view class="popup-mask" v-if="showCartPopup" @tap="showCartPopup = false">
      <view class="cart-popup" @tap.stop>
        <view class="cart-popup-header">
          <text class="cart-popup-title">已选菜品</text>
          <view class="cart-clear-btn" @tap="clearCart">清空</view>
        </view>
        <scroll-view class="cart-popup-list" scroll-y>
          <view class="cart-popup-item" v-for="entry in cartEntries" :key="entry.entryId">
            <image class="cart-item-img" :src="entry.dishImg || '/static/user/点餐.png'" mode="aspectFill"></image>
            <view class="cart-item-info">
              <text class="cart-item-name">{{ entry.dishName }}</text>
              <text class="cart-item-spec" v-if="entry.specLabel">{{ entry.specLabel }}</text>
              <text class="cart-item-price">¥{{ entry.price }}</text>
            </view>
            <view class="cart-item-ctrl">
              <uni-icons type="minus" size="18" color="#999" @tap="cartEntryDecrease(entry)"></uni-icons>
              <text class="ctrl-num">{{ entry.quantity }}</text>
              <uni-icons type="plus" size="18" color="#ffc300" @tap="cartEntryIncrease(entry)"></uni-icons>
            </view>
          </view>
          <view class="cart-popup-empty" v-if="cartEntries.length === 0">
            <text class="empty-text">购物车是空的</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <CustomTabBar />
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import { getRequest, postRequest } from '@/utils/request.js'

// ==================== 商家信息 ====================
const shopInfo = ref({ logo: '', name: '', address: '', business_time: '', phone: '', intro: '' })
const deskId = ref(null)
const isFavorited = ref(false)
const merchantId = ref(null)

const toggleFavorite = async () => {
  const openid = uni.getStorageSync('openid')
  if (!openid) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  try {
    await postRequest('/user/favorite/add', { merchant_id: merchantId.value, openid }, { showLoading: false })
    isFavorited.value = true
    uni.showToast({ title: '已收藏', icon: 'none' })
  } catch (e) { /* 已收藏过会报错 */ }
}

const previewShopLogo = () => {
  if (shopInfo.value.logo) uni.previewImage({ urls: [shopInfo.value.logo] })
}

// ==================== 分类 & 菜品 ====================
const categoryList = ref([])
const activeCateId = ref(null)
const scrollToId = ref('')
let scrollLock = false

// ==================== 规格弹窗 ====================
const specPopup = ref({
  show: false,
  dish: null,
  groups: [],
  selected: {}
})

const specTotalPrice = computed(() => {
  if (!specPopup.value.dish) return 0
  let price = specPopup.value.dish.price
  for (const group of specPopup.value.groups) {
    const tagId = specPopup.value.selected[group.id]
    if (tagId) {
      const tag = group.tags.find(t => t.id === tagId)
      if (tag && tag.price) price = tag.price
    }
  }
  return price
})

const hasDishSpec = (dish) => dish.groups && dish.groups.length > 0

const openSpecPopup = (dish) => {
  const selected = {}
  // 尝试回填上次选择的规格
  const lastEntry = getLastSpecEntry(dish.id)
  if (lastEntry) {
    for (const [gId, spec] of Object.entries(lastEntry.specs)) {
      selected[Number(gId)] = spec.tagId
    }
  }
  specPopup.value = { show: true, dish, groups: dish.groups, selected }
}

const closeSpecPopup = () => {
  specPopup.value.show = false
}

const selectSpecTag = (groupId, tag) => {
  specPopup.value.selected[groupId] = tag.id
}

const confirmSpec = () => {
  const { dish, groups, selected } = specPopup.value
  // 检查是否所有规格组都选了
  for (const group of groups) {
    if (!selected[group.id]) {
      uni.showToast({ title: `请选择${group.name}`, icon: 'none' })
      return
    }
  }

  // 检查库存
  const currentTotal = getDishCartTotal(dish.id)
  if (dish.stock != null && currentTotal >= dish.stock) {
    uni.showToast({ title: '已达到该菜品库存上限', icon: 'none' })
    return
  }

  let price = dish.price
  const specLabels = []
  const specs = {}
  for (const group of groups) {
    const tagId = selected[group.id]
    const tag = group.tags.find(t => t.id === tagId)
    if (tag) {
      specLabels.push(tag.name)
      if (tag.price) price = tag.price
      specs[group.id] = { tagId: tag.id, tagName: tag.name, price: tag.price }
    }
  }

  cartEntries.value.push({
    entryId: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    dishId: dish.id,
    dishName: dish.name,
    dishImg: dish.imgs,
    specs,
    specLabel: specLabels.join('，'),
    price,
    quantity: 1
  })

  specPopup.value.show = false
}

// ==================== 购物车 ====================
const cartEntries = ref([])
const showCartPopup = ref(false)

const totalNum = computed(() => {
  let n = 0
  cartEntries.value.forEach(e => n += e.quantity)
  return n
})

const totalPrice = computed(() => {
  let p = 0
  cartEntries.value.forEach(e => p += e.price * e.quantity)
  return p.toFixed(2)
})

// 获取某个菜品的购物车总数量（汇总所有规格条目）
const getDishCartTotal = (dishId) => {
  let n = 0
  cartEntries.value.forEach(e => { if (e.dishId === dishId) n += e.quantity })
  return n
}

// 获取某个菜品的库存
const getDishStock = (dishId) => {
  for (const cate of categoryList.value) {
    const dish = cate.dishes.find(d => d.id === dishId)
    if (dish) return dish.stock
  }
  return null
}

// 获取某个菜品最近一次添加的规格条目
const getLastSpecEntry = (dishId) => {
  for (let i = cartEntries.value.length - 1; i >= 0; i--) {
    if (cartEntries.value[i].dishId === dishId) return cartEntries.value[i]
  }
  return null
}

// ---- 无规格菜品 ----
const addToCart = (dish) => {
  const currentTotal = getDishCartTotal(dish.id)
  if (dish.stock != null && currentTotal >= dish.stock) {
    uni.showToast({ title: '已达到该菜品库存上限', icon: 'none' })
    return
  }
  let entry = cartEntries.value.find(e => e.dishId === dish.id && !e.specs)
  if (!entry) {
    entry = {
      entryId: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dishId: dish.id,
      dishName: dish.name,
      dishImg: dish.imgs,
      specs: null,
      specLabel: '',
      price: dish.price,
      quantity: 0
    }
    cartEntries.value.push(entry)
  }
  entry.quantity++
}

const removeFromCart = (dish) => {
  const idx = cartEntries.value.findIndex(e => e.dishId === dish.id && !e.specs)
  if (idx < 0) return
  const entry = cartEntries.value[idx]
  if (entry.quantity <= 1) {
    cartEntries.value.splice(idx, 1)
  } else {
    entry.quantity--
  }
}

// ---- 有规格菜品 ----
const addSpecDish = (dish) => {
  // 加和上次相同规格
  const lastEntry = getLastSpecEntry(dish.id)
  if (!lastEntry) {
    openSpecPopup(dish)
    return
  }
  const currentTotal = getDishCartTotal(dish.id)
  if (dish.stock != null && currentTotal >= dish.stock) {
    uni.showToast({ title: '已达到该菜品库存上限', icon: 'none' })
    return
  }
  lastEntry.quantity++
}

const removeSpecDish = (dish) => {
  // 减最近一次添加的规格条目
  const lastEntry = getLastSpecEntry(dish.id)
  if (!lastEntry) return
  if (lastEntry.quantity <= 1) {
    const idx = cartEntries.value.findIndex(e => e.entryId === lastEntry.entryId)
    if (idx >= 0) cartEntries.value.splice(idx, 1)
  } else {
    lastEntry.quantity--
  }
}

// ---- 购物车弹窗操作 ----
const cartEntryIncrease = (entry) => {
  const stock = getDishStock(entry.dishId)
  if (stock != null && entry.quantity >= stock) {
    uni.showToast({ title: '已达到该菜品库存上限', icon: 'none' })
    return
  }
  entry.quantity++
}
const cartEntryDecrease = (entry) => {
  if (entry.quantity <= 1) {
    const idx = cartEntries.value.findIndex(e => e.entryId === entry.entryId)
    if (idx >= 0) cartEntries.value.splice(idx, 1)
  } else {
    entry.quantity--
  }
}

const clearCart = () => {
  cartEntries.value = []
  showCartPopup.value = false
}

// ==================== 分类联动 ====================
const onCateClick = (id) => {
  activeCateId.value = id
  scrollToId.value = ''
  scrollLock = true
  nextTick(() => {
    scrollToId.value = `cat-${id}`
    setTimeout(() => { scrollLock = false }, 350)
  })
}

const onDishScroll = (e) => {
  if (scrollLock) return
  const top = e.detail.scrollTop
  for (let i = categoryList.value.length - 1; i >= 0; i--) {
    const cate = categoryList.value[i]
    if (cate._top != null && top >= cate._top - 60) {
      if (activeCateId.value !== cate.id) activeCateId.value = cate.id
      break
    }
  }
}

const calcGroupTops = () => {
  const query = uni.createSelectorQuery()
  categoryList.value.forEach(cate => { query.select(`#cat-${cate.id}`).boundingClientRect() })
  query.select('.dish-panel').boundingClientRect()
  query.exec((res) => {
    if (!res) return
    const groups = res.slice(0, -1)
    const panel = res[res.length - 1]
    if (!panel) return
    groups.forEach((rect, i) => {
      if (rect && categoryList.value[i]) categoryList.value[i]._top = rect.top - panel.top
    })
  })
}

// ==================== 数据加载 ====================
const loadData = async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const mid = (page && page.options && page.options.merchant_id) || 1
  merchantId.value = Number(mid)
  deskId.value = (page && page.options && page.options.desk_id) || null

  // 1. 加载商家信息
  try {
    const mRes = await getRequest('/user/merchant/list', {}, { showLoading: false })
    if (mRes.code === 2000 && mRes.data) {
      const merchant = mRes.data.find(m => m.id === merchantId.value)
      if (merchant) {
        const firstLogo = merchant.logo?.[0]
        shopInfo.value.logo = typeof firstLogo === 'string' ? firstLogo : (firstLogo?.url || '')
        shopInfo.value.name = merchant.name || ''
        shopInfo.value.address = merchant.address_info?.address || ''
        shopInfo.value.business_time = merchant.business_time || ''
        shopInfo.value.phone = merchant.shop_phone || ''
        shopInfo.value.intro = merchant.introduction || ''
      }
    }
  } catch (e) { console.error('获取商家信息失败：', e) }

  // 2. 加载分类和菜品
  try {
    const [cRes, dRes] = await Promise.all([
      getRequest('/user/merchant/category', { merchant_id: merchantId.value }, { showLoading: false }),
      getRequest('/user/merchant/dish/list', { merchant_id: merchantId.value }, { showLoading: false })
    ])

    const categories = cRes.data || []
    const dishes = dRes.data || []

    categoryList.value = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      _top: null,
      dishes: dishes
        .filter(d => d.category === cat.name)
        .map(d => ({
          id: d.id,
          name: d.name,
          price: d.price,
          imgs: d.imgs || '',
          stock: d.stock,
          groups: d.groups || []
        }))
    }))

    if (categoryList.value.length > 0) activeCateId.value = categoryList.value[0].id
    nextTick(() => { calcGroupTops() })
  } catch (e) { console.error('获取菜品分类失败：', e) }

  // 3. 检查是否已收藏
  const openid = uni.getStorageSync('openid')
  if (openid) {
    try {
      const fRes = await getRequest('/user/favorite/list', { openid }, { showLoading: false })
      if (fRes.code === 2000 && fRes.data) {
        isFavorited.value = fRes.data.some(f => f.id === merchantId.value)
      }
    } catch (e) { /* 忽略 */ }
  }
}

// ==================== 加菜模式 ====================
const isAppendMode = ref(false)
const appendOrderId = ref('')

// ==================== 去下单 / 加菜 ====================
const goCheckout = async () => {
  if (totalNum.value === 0) return uni.showToast({ title: '请先选择菜品', icon: 'none' })

  if (isAppendMode.value) {
    // 加菜模式：直接调 append 接口
    const shopList = cartEntries.value.map(e => ({
      name: e.dishName,
      number: e.quantity,
      tags: e.specs
        ? Object.entries(e.specs).map(([, spec]) => ({ id: spec.tagId, number: 1 }))
        : []
    }))

    uni.showLoading({ title: '加菜中...', mask: true })
    try {
      const res = await postRequest(`/order/user/append?order_id=${appendOrderId.value}`, shopList)
      if (res.code === 2000) {
        cartEntries.value = []
        uni.removeStorageSync('append_order_id')
        uni.setStorageSync('need_refresh_orders', '1')
        uni.showToast({ title: '加菜成功', icon: 'success' })
        setTimeout(() => { uni.navigateBack() }, 800)
      } else {
        uni.showToast({ title: res.message || '加菜失败', icon: 'none' })
      }
    } catch (err) {
      uni.showToast({ title: err?.data?.message || '加菜失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  } else {
    // 正常下单：跳确认页
    uni.setStorageSync('checkout_data', JSON.stringify({
      cartEntries: cartEntries.value,
      shopInfo: shopInfo.value,
      deskId: deskId.value,
      merchantId: merchantId.value
    }))
    uni.navigateTo({ url: '/pages/user/order/confirm' })
  }
}

onMounted(() => {
  const oid = uni.getStorageSync('append_order_id')
  if (oid) {
    isAppendMode.value = true
    appendOrderId.value = oid
  }
  loadData()
})
</script>

<style scoped lang="scss">
$primary: #ffc300;

.order-page {
  width: 100%; height: 100vh;
  background: #f5f5f5;
  display: flex; flex-direction: column;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

// ==================== 商家卡片 ====================
.shop-card {
  flex-shrink: 0;
  margin: 20rpx 20rpx 0;
  background: #fff; border-radius: 16rpx; padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.shop-card-top { display: flex; align-items: flex-start; }
.shop-logo-wrap { flex-shrink: 0; margin-right: 20rpx; }
.shop-logo { width: 100rpx; height: 100rpx; border-radius: 14rpx; }
.shop-logo-placeholder {
  width: 100rpx; height: 100rpx; border-radius: 14rpx;
  background: $primary;
  display: flex; align-items: center; justify-content: center;
}
.shop-logo-letter { font-size: 44rpx; color: #fff; font-weight: bold; }
.shop-main { flex: 1; min-width: 0; }
.shop-name { font-size: 34rpx; font-weight: bold; color: #222; display: block; line-height: 1.3; }
.shop-addr-row { display: flex; align-items: center; margin-top: 10rpx; gap: 4rpx; }
.shop-addr { font-size: 24rpx; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-btn { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 2rpx; padding: 8rpx 12rpx; }
.fav-text { font-size: 20rpx; color: #999; }
.fav-active .fav-text { color: $primary; }
.shop-extras { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; display: flex; flex-direction: column; gap: 8rpx; }
.shop-extra-row { display: flex; align-items: center; gap: 6rpx; }
.extra-text { font-size: 24rpx; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shop-intro .extra-text { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

// ==================== 菜单主体 ====================
.menu-body { flex: 1; min-height: 0; display: flex; margin-top: 20rpx; overflow: hidden; }
.cate-sidebar { width: 170rpx; flex-shrink: 0; background: #fff; }
.cate-item { position: relative; display: flex; align-items: center; justify-content: center; height: 96rpx; }
.cate-indicator { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 32rpx; border-radius: 0 3rpx 3rpx 0; background: $primary; }
.cate-text { font-size: 26rpx; color: #666; }
.cate-active { background: #f5f5f5; }
.cate-active .cate-text { color: #222; font-weight: 600; font-size: 28rpx; }

.dish-panel { flex: 1; min-width: 0; padding: 0 20rpx; }
.dish-group { margin-bottom: 10rpx; }
.dish-group-title { font-size: 28rpx; font-weight: 600; color: #333; padding: 16rpx 0 8rpx; }
.dish-card { display: flex; background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.dish-img { width: 150rpx; height: 150rpx; border-radius: 10rpx; flex-shrink: 0; background: #f5f5f5; }
.dish-body { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.dish-name { font-size: 30rpx; font-weight: 500; color: #333; }
.dish-stock { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.dish-bottom { display: flex; align-items: center; justify-content: space-between; }
.dish-price { display: flex; align-items: baseline; }
.price-symbol { font-size: 24rpx; color: #ff4d4f; font-weight: 500; }
.price-num { font-size: 36rpx; color: #ff4d4f; font-weight: bold; }

.dish-ctrl { display: flex; align-items: center; gap: 16rpx; }
.spec-btn {
  font-size: 24rpx; color: #fff; background: $primary;
  padding: 6rpx 16rpx; border-radius: 20rpx; font-weight: 500;
}
.ctrl-num { font-size: 28rpx; color: #333; font-weight: 500; min-width: 30rpx; text-align: center; }
.dish-empty { padding: 40rpx 0; display: flex; justify-content: center; }
.empty-text { font-size: 26rpx; color: #bbb; }
.dish-panel-bottom { height: 30rpx; }

// ==================== 购物车栏 ====================
.cart-bar {
  position: fixed; bottom: calc(100rpx + env(safe-area-inset-bottom)); left: 0;
  width: 100%; height: 100rpx; background: #333; display: flex; align-items: center;
  padding: 0 24rpx; box-sizing: border-box; z-index: 99;
}
.cart-left { flex: 1; display: flex; align-items: center; gap: 16rpx; }
.cart-icon-wrap {
  position: relative; width: 64rpx; height: 64rpx;
  background: $primary; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-top: -30rpx;
}
.cart-badge {
  position: absolute; top: -4rpx; right: -4rpx; min-width: 32rpx; height: 32rpx;
  background: #ff4d4f; color: #fff; font-size: 20rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center; padding: 0 6rpx;
}
.cart-price-wrap { display: flex; flex-direction: column; }
.cart-price { font-size: 36rpx; font-weight: bold; color: #fff; }
.cart-extra { font-size: 20rpx; color: #999; }
.cart-submit {
  width: 180rpx; height: 72rpx; background: $primary; color: #fff;
  border-radius: 36rpx; display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 500;
}

// ==================== 弹窗通用 ====================
.popup-mask {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); z-index: 10000;
  display: flex; align-items: flex-end;
}

// ==================== 规格弹窗 ====================
.spec-popup {
  width: 100%; max-width: 750rpx; background: #fff; border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 30rpx calc(32rpx + env(safe-area-inset-bottom));
  margin: 0 auto;
}
.spec-popup-title { font-size: 34rpx; font-weight: bold; color: #333; text-align: center; margin-bottom: 28rpx; }
.spec-groups { display: flex; flex-direction: column; gap: 24rpx; }
.spec-group-name { font-size: 28rpx; color: #666; margin-bottom: 16rpx; display: block; }
.spec-tags { display: flex; flex-wrap: wrap; gap: 16rpx; }
.spec-tag {
  padding: 14rpx 28rpx; border-radius: 10rpx; background: #f5f5f5;
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  border: 2rpx solid transparent;
}
.spec-tag-active { background: #fff8e1; border-color: $primary; }
.spec-tag-name { font-size: 26rpx; color: #333; }
.spec-tag-price { font-size: 22rpx; color: #ff4d4f; }
.spec-popup-footer {
  margin-top: 32rpx; display: flex; align-items: center; justify-content: space-between;
}
.spec-total { font-size: 36rpx; color: #ff4d4f; font-weight: bold; }
.spec-confirm-btn {
  padding: 16rpx 48rpx; background: $primary; color: #fff;
  border-radius: 40rpx; font-size: 30rpx; font-weight: 500;
}

// ==================== 购物车弹窗 ====================
.cart-popup {
  width: 100%; max-width: 750rpx; max-height: 60vh;
  background: #fff; border-radius: 24rpx 24rpx 0 0;
  padding-bottom: calc(env(safe-area-inset-bottom));
  margin: 0 auto; display: flex; flex-direction: column;
}
.cart-popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28rpx 30rpx; border-bottom: 1rpx solid #f0f0f0;
}
.cart-popup-title { font-size: 32rpx; font-weight: bold; color: #333; }
.cart-clear-btn { font-size: 26rpx; color: #999; padding: 4rpx 12rpx; }
.cart-popup-list { flex: 1; min-height: 0; max-height: 50vh; padding: 0 30rpx; width: 100%; box-sizing: border-box; }
.cart-popup-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; gap: 12rpx; overflow: hidden; }
.cart-item-img { width: 80rpx; height: 80rpx; border-radius: 8rpx; flex-shrink: 0; }
.cart-item-info { flex: 1; min-width: 0; overflow: hidden; }
.cart-item-name { font-size: 28rpx; color: #333; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cart-item-spec { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cart-item-price { font-size: 26rpx; color: #ff4d4f; font-weight: 500; margin-top: 4rpx; display: block; }
.cart-item-ctrl { display: flex; align-items: center; gap: 10rpx; flex-shrink: 0; }
.cart-popup-empty { padding: 60rpx 0; display: flex; justify-content: center; }
</style>

<template>
  <view class="admin-goods-page">
    <!-- 顶部Tab切换 -->
    <view class="top-tab">
      <text class="tab-item" :class="{ active: activeTab === 'category' }" @tap="activeTab = 'category'">分类管理</text>
      <text class="tab-item" :class="{ active: activeTab === 'goods' }" @tap="activeTab = 'goods'">菜品管理</text>
    </view>

    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="search-input-wrap">
        <uni-icons type="search" size="20"></uni-icons>
        <input
          class="search-input"
          :placeholder="activeTab === 'category' ? '搜索分类名称' : '搜索商品名称'"
          v-model="searchKeyword"
        />
      </view>
      <button class="reset-btn" @tap="searchKeyword = ''">重置</button>

      <button class="add-btn" @tap="activeTab === 'category' ? openAddPopup() : openAddGoodsPopup()">
        {{ activeTab === 'category' ? '新增分类' : '新增商品' }}
      </button>
    </view>

    <!-- 内容区 -->
    <view class="content">
      <CategoryList
        v-if="activeTab === 'category'"
        :categoryList="categoryList"
        :keyword="searchKeyword"
        @edit="openEditPopup"
        @deleted="getCategoryList"
      />
      <GoodList
        v-if="activeTab === 'goods'"
        :goodsList="goodsList"
        :keyword="searchKeyword"
        @edit="openEditGoodsPopup"
        @delete="handleDeleteGoods"
      />
    </view>

    <!-- 弹窗组件 -->
    <CategoryPopup
      :showAdd="showAddCategoryPopup"
      :showEdit="showEditCategoryPopup"
      :editCategory="editCategoryItem"
      @closeAdd="showAddCategoryPopup = false"
      @closeEdit="closeEditPopup"
      @success="getCategoryList"
    />

    <GoodsFormPopup
      :show="showGoodsFormPopup"
      :categoryList="categoryList"
      :editDish="editingDish"
      @close="closeGoodsFormPopup"
      @success="onGoodsChanged"
    />

    <CustomTabBar />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import CategoryList from '@/components/adminIndex/CategoryList.vue'
import CategoryPopup from '@/components/adminIndex/CategoryPopup.vue'
import GoodList from '@/components/adminIndex/GoodList.vue'
import GoodsFormPopup from '@/components/adminIndex/GoodsFormPopup.vue'
import { getRequest, deleteRequest } from '@/utils/request.js'

const activeTab = ref('category')
const searchKeyword = ref('')

const categoryList = ref([])
const goodsList = ref([])

// ===================== 分类管理 =====================
const getCategoryList = async () => {
  try {
    const res = await getRequest('/admin/category/list')
    if (res.code === 2000) categoryList.value = res.data
  } catch (err) {
    uni.showToast({ title: '获取分类失败', icon: 'none' })
  }
}

const showAddCategoryPopup = ref(false)
const showEditCategoryPopup = ref(false)
const editCategoryItem = ref(null)

const openAddPopup = () => showAddCategoryPopup.value = true
const openEditPopup = (cat) => { editCategoryItem.value = cat; showEditCategoryPopup.value = true }
const closeEditPopup = () => { showEditCategoryPopup.value = false; editCategoryItem.value = null }

// ===================== 菜品管理 =====================
const getDishList = async () => {
  try {
    const res = await getRequest('/admin/dish/list')
    if (res.code === 2000) {
      // 后端返回 category 为名称字符串（非 ID），需要反查 category_id 和补充 categoryName
      goodsList.value = (res.data || []).map(dish => {
        const matchedCat = categoryList.value.find(c => c.name === dish.category)
        return {
          ...dish,
          category_id: matchedCat?.id || dish.category_id || '',
          categoryName: dish.category || ''
        }
      })
    }
  } catch (err) {
    uni.showToast({ title: '获取菜品列表失败', icon: 'none' })
  }
}

const getCategoryName = (categoryId) => {
  const cat = categoryList.value.find(c => c.id === categoryId)
  return cat ? cat.name : ''
}

const showGoodsFormPopup = ref(false)
const editingDish = ref(null)

const openAddGoodsPopup = () => {
  editingDish.value = null
  showGoodsFormPopup.value = true
}

const openEditGoodsPopup = (dish) => {
  editingDish.value = { ...dish, categoryName: getCategoryName(dish.category_id) }
  showGoodsFormPopup.value = true
}

const closeGoodsFormPopup = () => {
  showGoodsFormPopup.value = false
  editingDish.value = null
}

const onGoodsChanged = () => {
  getDishList()
}

const handleDeleteGoods = (dish) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除菜品「${dish.name}」吗？删除后不可恢复。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await deleteRequest('/admin/dish/delete', { dish_id: dish.id })
          if (result.code === 2000) {
            uni.showToast({ title: '删除成功' })
            getDishList()
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          uni.showToast({ title: err?.data?.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// ===================== 初始化 =====================
onMounted(async () => {
  await getCategoryList()
  getDishList()
})
</script>

<style scoped lang="scss">
.admin-goods-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100rpx;
  box-sizing: border-box;
}

.top-tab {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  .tab-item {
    flex: 1;
    text-align: center;
    height: 80rpx;
    line-height: 80rpx;
    font-size: 30rpx;
    color: #666;
    &.active {
      color: #3a86ff;
      font-weight: 500;
      border-bottom: 4rpx solid #3a86ff;
    }
  }
}

.top-bar {
  padding: 20rpx 30rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  gap: 20rpx;

  .search-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    border: 1rpx solid #eee;
    border-radius: 8rpx;
    padding: 0 20rpx;
    height: 60rpx;
    background-color: #fff;
    uni-icons { color: #999; margin-right: 12rpx; }
    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      background: transparent;
      font-size: 26rpx;
    }
  }

  .reset-btn {
    height: 60rpx;
    padding: 0 24rpx;
    border: 1rpx solid #eee;
    border-radius: 8rpx;
    background: #fff;
    font-size: 26rpx;
    color: #666;
    flex-shrink: 0;
    &::after { border: none; }
  }

  .add-btn {
    height: 60rpx;
    line-height: 60rpx;
    padding: 0 24rpx;
    background-color: #f6aa1c;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    font-size: 26rpx;
    white-space: nowrap;
    flex-shrink: 0;
    &::after { border: none; }
  }
}

.content {
  padding: 15rpx 30rpx;
}
</style>

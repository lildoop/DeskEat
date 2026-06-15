<template>
  <view class="category-manage">
    <view class="category-list">
      <view class="category-item" v-for="cat in filteredCategoryList" :key="cat.id">
        <text class="cat-name">{{ cat.name }}</text>
        <view class="btn-group">
          <button class="edit-btn" @tap="$emit('edit', cat)">修改</button>
          <button class="delete-btn" @tap="deleteCategory(cat)">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { deleteRequest } from '@/utils/request.js'

const props = defineProps({
  categoryList: { type: Array, default: () => [] },
  keyword: { type: String, default: '' } // 接收父页面的搜索词
})
const emit = defineEmits(['edit', 'deleted'])

const filteredCategoryList = computed(() => {
  return props.categoryList.filter(cat => cat.name.includes(props.keyword.trim()))
})

const deleteCategory = (cat) => {
  uni.showModal({
    title: '删除分类',
    content: `确定要删除分类 "${cat.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await deleteRequest('/admin/category/delete', { category: cat.id })
          if (res.code === 2000) {
            uni.showToast({ title: '删除成功' })
            emit('deleted')
          } else {
            uni.showToast({ title: res.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          uni.showToast({ title: err?.data?.message || '删除分类失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<style scoped lang="scss">
.category-manage {
  .category-list { background-color: #fff; border-radius: 12rpx; }
  .category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;
    &:last-child { border-bottom: none; }
    &:first-child { border-top: 1rpx solid #eee; }
  }
  .btn-group { display: flex; gap: 20rpx; }
  .edit-btn {
    background-color: #3a86ff; color: #fff; border: none;
    border-radius: 8rpx; padding: 12rpx 24rpx; font-size: 24rpx;
  }
  .delete-btn {
    background-color: #ff4d4f; color: #fff; border: none;
    border-radius: 8rpx; padding: 12rpx 24rpx; font-size: 24rpx;
  }
}
</style>
<template>
  <!-- ===================== 新增分类弹窗 ===================== -->
  <view class="popup-mask" v-if="showAdd" @tap="$emit('closeAdd')">
    <view class="popup-content" @tap.stop>
      <view class="popup-header">新增商品分类</view>

      <view class="form-list">
        <view class="form-item" v-for="(item, index) in categoryFormList" :key="index">
          <input 
            class="category-input" 
            v-model="item.name" 
            placeholder="请输入分类名称"
          />
          <view class="operate-btns">
            <uni-icons class="icon-plus" type="plus" size="24" @tap="addFormItem" color="#f6aa1c"></uni-icons>
            <uni-icons class="icon-minus" type="minus" size="24" v-if="index !== 0" @tap="delFormItem(index)" color="red"></uni-icons>
          </view>
        </view>
      </view>

      <view class="popup-footer">
        <button class="cancel-btn" @tap="$emit('closeAdd')">取消</button>
        <button class="confirm-btn" @tap="submitCategory">确定</button>
      </view>
    </view>
  </view>

  <!-- ===================== 修改分类弹窗 ===================== -->
  <view class="popup-mask" v-if="showEdit" @tap="$emit('closeEdit')">
    <view class="popup-content" @tap.stop>
      <view class="popup-header">修改分类</view>

      <view class="form-item">
        <input 
          class="category-input" 
          v-model="editCategoryName" 
          placeholder="请输入新分类名称"
        />
      </view>

      <view class="popup-footer">
        <button class="cancel-btn" @tap="$emit('closeEdit')">取消</button>
        <button class="confirm-btn" @tap="updateCategory">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { postRequest, putRequest } from '@/utils/request.js'

const props = defineProps({
  showAdd: { type: Boolean, default: false },
  showEdit: { type: Boolean, default: false },
  editCategory: { type: Object, default: null }
})

const emit = defineEmits(['closeAdd', 'closeEdit', 'success'])

// ===================== 新增分类 =====================
const categoryFormList = ref([{ name: '' }])

watch(() => props.showAdd, (val) => {
  if (val) {
    categoryFormList.value = [{ name: '' }]
  }
})

const addFormItem = () => {
  categoryFormList.value.push({ name: '' })
}

const delFormItem = (index) => {
  categoryFormList.value.splice(index, 1)
}

const submitCategory = async () => {
  const nameList = categoryFormList.value
    .map(item => item.name.trim())
    .filter(name => name)

  if (nameList.length === 0) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }

  try {
    const res = await postRequest('/admin/category/add', nameList)
    if (res.code === 2000) {
      uni.showToast({ title: `添加成功 ${nameList.length} 个分类` })
      emit('closeAdd')
      emit('success')
    } else {
      uni.showToast({ title: res.message || '添加失败', icon: 'none' })
    }
  } catch (err) {
    const msg = err?.data?.message || '添加分类失败'
    uni.showToast({ title: msg, icon: 'none' })
    console.error('添加分类错误：', err)
  }
}

// ===================== 修改分类 =====================
const editCategoryName = ref('')

watch(() => props.showEdit, (val) => {
  if (val && props.editCategory) {
    editCategoryName.value = props.editCategory.name
  }
})

const updateCategory = async () => {
  if (!editCategoryName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }

  try {
    const payload = [{
      id: props.editCategory.id,
      new_name: editCategoryName.value.trim()
    }]
    const res = await putRequest('/admin/category/update', payload)
    if (res.code === 2000) {
      uni.showToast({ title: '修改成功' })
      emit('closeEdit')
      emit('success')
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' })
    }
  } catch (err) {
    console.error('后端校验错误详情：', err?.data?.detail)
    const msg = err?.data?.message || '修改分类失败'
    uni.showToast({ title: msg, icon: 'none' })
    console.error('修改分类错误：', err)
  }
}
</script>

<style scoped lang="scss">
.popup-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.popup-content {
  width: 80%;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}
.popup-header {
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}
.form-list {
  max-height: 500rpx;
  overflow-y: auto;
  margin-bottom: 30rpx;
}
.form-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.category-input {
  flex: 1;
  height: 70rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}
.operate-btns {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.icon-plus { color: #f6aa1c; cursor: pointer; }
.icon-minus { color: #ff4d4f; cursor: pointer; }
.popup-footer {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
}
.cancel-btn, .confirm-btn {
  flex: 1;
  height: 70rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  &::after { border: none; }
}
.cancel-btn { background: #f5f5f5; color: #666; border: none; }
.confirm-btn { background: #f6aa1c; color: #fff; border: none; }
</style>
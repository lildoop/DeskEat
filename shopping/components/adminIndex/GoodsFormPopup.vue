<template>
  <view class="goods-popup-mask" v-if="show" @tap="$emit('close')">
    <view class="goods-popup-page" @tap.stop>
      <!-- 顶部导航栏 -->
      <view class="goods-popup-nav">
        <text class="nav-back" @tap="$emit('close')">✕</text>
        <text class="nav-title">{{ isEditMode ? '编辑菜品' : '新增菜品' }}</text>
        <text class="nav-placeholder"></text>
      </view>

      <!-- 可滚动的表单区 -->
      <scroll-view scroll-y class="goods-form-scroll">

        <!-- ① 菜品图片 -->
        <view class="g-section">
          <view class="g-section-title">菜品图片</view>
          <view class="g-image-picker" @tap="chooseGoodsImage">
            <image v-if="goodsForm.image" :src="goodsForm.image" class="g-preview-img" mode="aspectFill" />
            <view v-else class="g-image-placeholder">
              <uni-icons type="plusempty" size="40" color="#ccc"></uni-icons>
              <text class="g-image-tip">上传图片</text>
            </view>
          </view>
        </view>

        <!-- ② 基础信息 -->
        <view class="g-section">
          <view class="g-section-title">基础信息</view>

          <view class="g-field">
            <text class="g-label">菜品名称 <text class="g-required">*</text></text>
            <input class="g-input" v-model="goodsForm.name" placeholder="请输入菜品名称" />
          </view>

          <view class="g-field">
            <text class="g-label">菜品分类 <text class="g-required">*</text></text>
            <picker :range="categoryList" range-key="name" @change="onCategoryPick">
              <view class="g-picker" :class="{ 'g-picker-placeholder': !goodsForm.categoryId }">
                {{ goodsForm.categoryName || '请选择分类' }}
                <uni-icons type="right" size="16" color="#ccc"></uni-icons>
              </view>
            </picker>
          </view>

          <view class="g-field" v-if="!goodsForm.hasSpec || goodsForm.groups.length === 0">
            <text class="g-label">菜品价格 <text class="g-required">*</text></text>
            <view class="g-input-price">
              <text class="g-price-symbol">¥</text>
              <input class="g-input" type="digit" v-model="goodsForm.price" placeholder="请输入价格" />
            </view>
          </view>

          <view class="g-field">
            <text class="g-label">库存 <text class="g-required">*</text></text>
            <input class="g-input" type="number" v-model="goodsForm.stock" placeholder="请输入库存数量" />
          </view>
        </view>

        <!-- ③ 规格设置 -->
        <view class="g-section">
          <view class="g-section-title-row">
            <text class="g-section-title" style="margin-bottom:0">规格设置</text>
            <view class="g-switch-wrap" @tap="toggleGoodsSpec">
              <view class="g-switch" :class="{ 'g-switch-on': goodsForm.hasSpec }">
                <view class="g-switch-dot"></view>
              </view>
              <text class="g-switch-text">{{ goodsForm.hasSpec ? '已开启' : '未开启' }}</text>
            </view>
          </view>
          <text class="g-section-desc">开启后可添加规格组（如份量、辣度），每个标签可单独设置价格和库存</text>
        </view>

        <!-- ③-A 规格组列表 -->
        <view class="g-section" v-if="goodsForm.hasSpec">
          <view class="g-section-title">规格组</view>

          <view class="g-group-card" v-for="(group, gIdx) in goodsForm.groups" :key="gIdx">
            <view class="g-group-header">
              <input class="g-group-name-input" v-model="group.name" placeholder="组名称，如：份量、辣度" />
              <view class="g-group-del" @tap="removeGroup(gIdx)">
                <uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
              </view>
            </view>

            <view class="g-tag-list">
              <view class="g-tag-row" v-for="(tag, tIdx) in group.tags" :key="tIdx">
                <input class="g-tag-name" v-model="tag.name" placeholder="标签名" />
                <view class="g-tag-price-wrap">
                  <text class="g-price-symbol">¥</text>
                  <input class="g-tag-price" type="digit" v-model="tag.price" placeholder="价格" />
                </view>
                <input class="g-tag-stock" type="number" v-model="tag.stock" placeholder="库存" />
                <view class="g-tag-del" @tap="removeTag(gIdx, tIdx)">
                  <uni-icons type="closeempty" size="18" color="#ff4d4f"></uni-icons>
                </view>
              </view>
            </view>

            <view class="g-add-tag" @tap="addTag(gIdx)">
              <uni-icons type="plusempty" size="16" color="#f6aa1c"></uni-icons>
              <text>添加标签</text>
            </view>
          </view>

          <view class="g-add-row" @tap="addGroup">
            <uni-icons type="plusempty" size="18" color="#f6aa1c"></uni-icons>
            <text class="g-add-text">添加规格组</text>
          </view>
        </view>

        <!-- 底部安全间距 -->
        <view style="height: 40rpx;"></view>
      </scroll-view>

      <!-- 底部提交按钮 -->
      <view class="goods-popup-bottom">
        <button class="g-cancel-btn" @tap="$emit('close')">取消</button>
        <button class="g-submit-btn" :loading="isSubmitting" :disabled="isSubmitting" @tap="submitGoods">{{ isEditMode ? '保存修改' : '确定添加' }}</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { postRequest, putRequest, BASE_URL, getAccessToken } from '@/utils/request.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  categoryList: { type: Array, default: () => [] },
  editDish: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const isSubmitting = ref(false)
const isEditMode = ref(false)

const createEmptyGoodsForm = () => ({
  name: '',
  image: '',
  categoryId: '',
  categoryName: '',
  price: '',
  stock: '',
  hasSpec: false,
  groups: []
})

const goodsForm = ref(createEmptyGoodsForm())

watch(() => props.show, (val) => {
  if (val) {
    if (props.editDish) {
      // 编辑模式：填充已有数据
      isEditMode.value = true
      const d = props.editDish
      goodsForm.value = {
        name: d.name || '',
        image: d.imgs || '',
        categoryId: d.category_id || '',
        categoryName: d.categoryName || '',
        price: d.price != null ? String(d.price) : '',
        stock: d.stock != null ? String(d.stock) : '',
        hasSpec: d.groups && d.groups.length > 0,
        groups: d.groups ? d.groups.map(g => ({
          name: g.name || '',
          tags: (g.tags || []).map(t => ({
            name: t.name || '',
            price: t.price != null ? String(t.price) : '',
            stock: t.stock != null ? String(t.stock) : ''
          }))
        })) : []
      }
    } else {
      // 新增模式
      isEditMode.value = false
      goodsForm.value = createEmptyGoodsForm()
    }
    isSubmitting.value = false
  }
})

// ===================== 图片上传 =====================
const chooseGoodsImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      goodsForm.value.image = tempPath

      uni.showLoading({ title: '上传中...', mask: true })
      try {
        // 构建请求头，携带认证令牌
        const token = getAccessToken()
        const header = token ? { Authorization: token } : {}

        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${BASE_URL}/common/upload`,
            filePath: tempPath,
            name: 'file',
            header,
            timeout: 15000,
            success: resolve,
            fail: reject
          })
        })

        if (uploadRes.statusCode !== 200) throw new Error(`服务器错误(${uploadRes.statusCode})`)

        const data = JSON.parse(uploadRes.data)
        if (data.code !== 2000) throw new Error(data.message || '上传失败')

        // 兼容后端不同返回字段：url / file_url
        goodsForm.value.image = data.data.url || data.data.file_url || ''
      } catch (err) {
        // 上传失败时保留本地预览图，方便用户查看并重试
        // submitGoods 中有本地路径校验，不会将临时路径提交到后端
        uni.showToast({ title: '图片上传失败，请重试', icon: 'none', duration: 2000 })
        console.error('图片上传错误：', err)
      } finally {
        uni.hideLoading()
      }
    },
    fail: (err) => {
      console.error('选择图片失败：', err)
      uni.showToast({ title: '选择图片失败，请重试', icon: 'none' })
    }
  })
}

// ---- 分类选择 ----
const onCategoryPick = (e) => {
  const idx = e.detail.value
  const cat = props.categoryList[idx]
  if (cat) {
    goodsForm.value.categoryId = cat.id
    goodsForm.value.categoryName = cat.name
  }
}

// ---- 规格开关 ----
const toggleGoodsSpec = () => {
  goodsForm.value.hasSpec = !goodsForm.value.hasSpec
  if (!goodsForm.value.hasSpec) {
    goodsForm.value.groups = []
  }
}

// ---- 规格组操作 ----
const addGroup = () => {
  goodsForm.value.groups.push({ name: '', tags: [{ name: '', price: '', stock: '' }] })
}
const removeGroup = (gIdx) => { goodsForm.value.groups.splice(gIdx, 1) }

const addTag = (gIdx) => {
  goodsForm.value.groups[gIdx].tags.push({ name: '', price: '', stock: '' })
}
const removeTag = (gIdx, tIdx) => {
  goodsForm.value.groups[gIdx].tags.splice(tIdx, 1)
}

// ===================== 提交新增菜品 =====================
const submitGoods = async () => {
  const f = goodsForm.value

  if (!f.name.trim()) return uni.showToast({ title: '请输入菜品名称', icon: 'none' })
  if (!f.categoryId) return uni.showToast({ title: '请选择菜品分类', icon: 'none' })
  if (!f.image) return uni.showToast({ title: '请上传菜品图片', icon: 'none' })
  if (!f.stock && f.stock !== 0) return uni.showToast({ title: '请输入库存', icon: 'none' })

  // 检查图片是否还是本地临时路径（上传失败但预览还在）
  if (f.image.startsWith('_') || f.image.startsWith('wxfile://') || f.image.startsWith('http://tmp/')) {
    return uni.showToast({ title: '图片还未上传成功，请稍后重试', icon: 'none' })
  }

  const hasValidSpec = f.hasSpec && f.groups.length > 0

  if (hasValidSpec) {
    // 验证规格组
    for (let i = 0; i < f.groups.length; i++) {
      const g = f.groups[i]
      if (!g.name.trim()) return uni.showToast({ title: `请输入第 ${i + 1} 个规格组名称`, icon: 'none' })
      const validTags = g.tags.filter(t => t.name.trim())
      if (validTags.length === 0) return uni.showToast({ title: `「${g.name}」至少需要一个有效标签`, icon: 'none' })
      for (let j = 0; j < g.tags.length; j++) {
        const t = g.tags[j]
        if (!t.name.trim()) continue
        if (!t.price && t.price !== 0 && t.price !== '') {
          return uni.showToast({ title: `「${g.name}」的标签「${t.name}」价格必填`, icon: 'none' })
        }
      }
    }
  } else {
    if (!f.price && f.price !== 0) return uni.showToast({ title: '请输入菜品价格', icon: 'none' })
  }

  // 清洗规格组数据
  const cleanGroups = hasValidSpec
    ? f.groups
        .map(g => ({
          name: g.name.trim(),
          tags: g.tags
            .filter(t => t.name.trim())
            .map(t => ({
              name: t.name.trim(),
              price: t.price !== '' ? Number(t.price) : 0,
              stock: t.stock !== '' ? Number(t.stock) : null
            }))
        }))
        .filter(g => g.tags.length > 0)
    : []

  const payload = {
    category_id: Number(f.categoryId),
    name: f.name.trim(),
    imgs: f.image,
    price: Number(f.price) || 0,
    stock: Number(f.stock),
    groups: cleanGroups
  }

  isSubmitting.value = true
  try {
    let res
    if (isEditMode.value) {
      res = await putRequest(`/admin/dish/update?dish_id=${props.editDish.id}`, payload)
    } else {
      res = await postRequest('/admin/dish/add', payload)
    }
    if (res.code === 2000) {
      uni.showToast({ title: isEditMode.value ? '修改成功' : '添加成功' })
      emit('close')
      emit('success')
    } else {
      uni.showToast({ title: res.message || '操作失败', icon: 'none' })
    }
  } catch (err) {
    const msg = err?.data?.message || err?.data?.detail || (isEditMode.value ? '修改菜品失败' : '添加菜品失败')
    uni.showToast({ title: msg, icon: 'none' })
    console.error(isEditMode.value ? '修改菜品错误：' : '添加菜品错误：', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
/* 全屏遮罩 */
.goods-popup-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.goods-popup-page {
  width: 100%;
  max-width: 750rpx;
  height: 90vh;
  background: #f5f5f5;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 auto;
  box-sizing: border-box;
}

.goods-popup-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding: 0 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;

  .nav-back { font-size: 36rpx; color: #666; width: 60rpx; text-align: left; }
  .nav-title { font-size: 34rpx; font-weight: bold; color: #333; }
  .nav-placeholder { width: 60rpx; }
}

.goods-form-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.g-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-top: 20rpx;
}
.g-section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; }
.g-section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.g-section-desc { font-size: 24rpx; color: #999; line-height: 1.6; }

/* 图片上传 */
.g-image-picker {
  width: 200rpx; height: 200rpx; border-radius: 12rpx; overflow: hidden;
  border: 2rpx dashed #ddd; display: flex; align-items: center; justify-content: center;
}
.g-preview-img { width: 100%; height: 100%; }
.g-image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.g-image-tip { font-size: 24rpx; color: #ccc; }

/* 表单字段 */
.g-field { margin-bottom: 24rpx; &:last-child { margin-bottom: 0; } }
.g-label { font-size: 26rpx; color: #666; margin-bottom: 12rpx; display: block; }
.g-required { color: #ff4d4f; }
.g-input {
  width: 100%; height: 72rpx; border: 1rpx solid #eee; border-radius: 10rpx;
  padding: 0 20rpx; font-size: 28rpx; color: #333; box-sizing: border-box; background: #fafafa;
}
.g-input-price {
  display: flex; align-items: center; height: 72rpx; border: 1rpx solid #eee;
  border-radius: 10rpx; padding: 0 20rpx; background: #fafafa;
  .g-price-symbol { font-size: 30rpx; color: #ff4d4f; font-weight: bold; margin-right: 8rpx; }
  .g-input { border: none; background: transparent; padding: 0; height: 100%; }
}
.g-picker {
  display: flex; align-items: center; justify-content: space-between; height: 72rpx;
  border: 1rpx solid #eee; border-radius: 10rpx; padding: 0 20rpx; font-size: 28rpx; color: #333; background: #fafafa;
}
.g-picker-placeholder { color: #bbb; }

/* 规格开关 */
.g-switch-wrap { display: flex; align-items: center; gap: 12rpx; }
.g-switch {
  width: 80rpx; height: 44rpx; border-radius: 22rpx; background: #ddd;
  position: relative; transition: background 0.3s;
}
.g-switch-on { background: #f6aa1c; }
.g-switch-dot {
  width: 36rpx; height: 36rpx; border-radius: 50%; background: #fff;
  position: absolute; top: 4rpx; left: 4rpx; transition: transform 0.3s;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
}
.g-switch-on .g-switch-dot { transform: translateX(36rpx); }
.g-switch-text { font-size: 24rpx; color: #999; }

/* 添加行按钮 */
.g-add-row {
  display: flex; align-items: center; justify-content: center; gap: 8rpx;
  padding: 18rpx 0; border: 2rpx dashed #f6aa1c; border-radius: 10rpx; background: #fffdf5;
}
.g-add-text { font-size: 26rpx; color: #f6aa1c; font-weight: 500; }

/* 规格组卡片 */
.g-group-card {
  background: #fafafa; border-radius: 12rpx; padding: 20rpx;
  margin-bottom: 20rpx; border: 1rpx solid #f0f0f0;
}
.g-group-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.g-group-name-input {
  flex: 1; height: 64rpx; border: 1rpx solid #eee; border-radius: 8rpx;
  padding: 0 16rpx; font-size: 26rpx; background: #fff; font-weight: 500;
}
.g-group-del { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }

/* 标签行 */
.g-tag-list { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 12rpx; }
.g-tag-row { display: flex; align-items: center; gap: 10rpx; }
.g-tag-name {
  flex: 1; height: 64rpx; border: 1rpx solid #eee; border-radius: 8rpx;
  padding: 0 14rpx; font-size: 24rpx; background: #fff;
}
.g-tag-price-wrap {
  display: flex; align-items: center; width: 140rpx; height: 64rpx;
  border: 1rpx solid #eee; border-radius: 8rpx; padding: 0 10rpx; background: #fff;
  .g-price-symbol { font-size: 24rpx; color: #ff4d4f; font-weight: bold; margin-right: 4rpx; flex-shrink: 0; }
  .g-tag-price { flex: 1; font-size: 24rpx; height: 100%; background: transparent; border: none; min-width: 0; }
}
.g-tag-stock {
  width: 120rpx; height: 64rpx; border: 1rpx solid #eee; border-radius: 8rpx;
  padding: 0 10rpx; font-size: 24rpx; background: #fff; text-align: center;
}
.g-tag-del { width: 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* 添加标签按钮 */
.g-add-tag {
  display: flex; align-items: center; justify-content: center; gap: 6rpx;
  padding: 12rpx 0; border: 1rpx dashed #f6aa1c; border-radius: 8rpx;
  background: #fffdf5; font-size: 24rpx; color: #f6aa1c;
}

/* 底部提交按钮 */
.goods-popup-bottom {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
}
.g-cancel-btn {
  flex: 1; height: 80rpx; background: #f5f5f5; color: #666;
  border: none; border-radius: 12rpx; font-size: 30rpx; &::after { border: none; }
}
.g-submit-btn {
  flex: 2; height: 80rpx; background: #f6aa1c; color: #fff;
  border: none; border-radius: 12rpx; font-size: 30rpx; font-weight: 500; &::after { border: none; }
}
</style>

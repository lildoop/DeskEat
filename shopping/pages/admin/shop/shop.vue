<template>
  <view class="shop-set-page">
    <!-- 1. 店铺头像设置 -->
    <view class="card avatar-card" @tap="chooseAvatar">
      <text class="label">店铺头像</text>
      <view class="avatar-wrap">
        <image v-if="shopInfo.avatar" class="avatar" :src="shopInfo.avatar" mode="aspectFill"></image>
        <view v-else class="avatar-placeholder">
          <uni-icons type="plusempty" size="36" color="#ccc"></uni-icons>
        </view>
        <text class="edit-tip">{{ shopInfo.avatar ? '更换' : '上传' }}</text>
      </view>
    </view>

    <!-- 2. 表单设置项 -->
    <view class="card form-card">
      <!-- 店铺名称 -->
      <view class="form-item">
        <text class="form-label">店铺名称</text>
        <input class="form-input" v-model="shopInfo.name" placeholder="请输入店铺名称" />
      </view>
      <!-- 详细地址 -->
      <view class="form-item" @tap="chooseAddress">
        <text class="form-label">详细地址</text>
        <view class="form-picker" :class="{ 'picker-placeholder': !shopInfo.address }">
          <text class="picker-text">{{ shopInfo.address || '点击选择地址' }}</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
      </view>
      <!-- 营业时间 -->
      <view class="form-item">
        <text class="form-label">营业时间</text>
        <view class="time-row">
          <picker class="time-picker" mode="time" :value="startTime" start="06:00" end="23:59" @change="onStartTimeChange">
            <view class="time-text" :class="{ 'time-placeholder': !startTime }">{{ startTime || '开始' }}</view>
          </picker>
          <text class="time-dash">—</text>
          <picker class="time-picker" mode="time" :value="endTime" start="06:00" end="23:59" @change="onEndTimeChange">
            <view class="time-text" :class="{ 'time-placeholder': !endTime }">{{ endTime || '结束' }}</view>
          </picker>
        </view>
      </view>
      <!-- 商家电话 -->
      <view class="form-item">
        <text class="form-label">商家电话</text>
        <input class="form-input" v-model="shopInfo.phone" placeholder="请输入联系电话" type="number" />
      </view>
    </view>

    <!-- 3. 店铺简介 -->
    <view class="card desc-card">
      <text class="form-label">店铺简介</text>
      <textarea
        class="desc-textarea"
        v-model="shopInfo.intro"
        placeholder="请输入店铺简介（200字内）"
        maxlength="200"
      ></textarea>
    </view>

    <!-- 4. 保存按钮 -->
    <view class="save-btn" @tap="saveShopInfo">保存设置</view>
    <CustomTabBar />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import { ref, onMounted } from 'vue'
import { putRequest, getRequest, BASE_URL, getAccessToken } from '@/utils/request.js'

const shopInfo = ref({
  avatar: '',
  name: '',
  address: '',
  addressName: '',
  latitude: null,
  longitude: null,
  business_time: '',
  phone: '',
  intro: ''
})

const startTime = ref('')
const endTime = ref('')

const parseBusinessTime = (val) => {
  if (!val) { startTime.value = ''; endTime.value = ''; return }
  const parts = val.split('-')
  if (parts.length === 2) {
    startTime.value = parts[0].trim()
    endTime.value = parts[1].trim()
  }
}

const buildBusinessTime = () => {
  if (startTime.value && endTime.value) return `${startTime.value}-${endTime.value}`
  return ''
}

const onStartTimeChange = (e) => { startTime.value = e.detail.value }
const onEndTimeChange = (e) => { endTime.value = e.detail.value }

// 加载当前店铺信息
const loadShopInfo = async () => {
  try {
    const res = await getRequest('/admin/merchant/info')
    if (res.code === 2000 && res.data) {
      const d = res.data
      shopInfo.value.name = d.name || ''
      shopInfo.value.avatar = (d.logo && d.logo.length > 0) ? d.logo[0] : ''
      shopInfo.value.address = d.address_info?.address || ''
      shopInfo.value.addressName = d.address_info?.name || ''
      shopInfo.value.latitude = d.address_info?.latitude ?? null
      shopInfo.value.longitude = d.address_info?.longitude ?? null
      shopInfo.value.phone = d.phone || ''
      shopInfo.value.intro = d.introduction || ''
      parseBusinessTime(d.business_time)
    }
  } catch (err) {
    console.error('获取店铺信息失败：', err)
  }
}

onMounted(() => {
  loadShopInfo()
})

// 上传头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      shopInfo.value.avatar = tempPath

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
        shopInfo.value.avatar = data.data.url || data.data.file_url || ''
      } catch (err) {
        // 上传失败时保留本地预览图，方便用户查看并重试
        // saveShopInfo 中有本地路径校验，不会将临时路径提交到后端
        uni.showToast({ title: '头像上传失败，请重试', icon: 'none', duration: 2000 })
        console.error('头像上传错误：', err)
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

// 选择地址
const chooseAddress = () => {
  uni.chooseLocation({
    success: async (res) => {
      shopInfo.value.addressName = res.name
      shopInfo.value.address = res.address
      shopInfo.value.latitude = res.latitude
      shopInfo.value.longitude = res.longitude

      uni.showLoading({ title: '保存地址...' })
      try {
        const addrRes = await putRequest('/admin/merchant/address/update', {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        })
        if (addrRes.code === 2000) {
          uni.showToast({ title: '地址已更新', icon: 'success' })
        } else {
          uni.showToast({ title: addrRes.message || '地址更新失败', icon: 'none' })
        }
      } catch (err) {
        const msg = err?.data?.message || err?.message || '地址更新失败'
        uni.showToast({ title: msg, icon: 'none' })
        console.error('地址更新错误：', err)
      } finally {
        uni.hideLoading()
      }
    },
    fail: () => {
      uni.showToast({ title: '请开启定位权限', icon: 'none' })
    }
  })
}

// 保存店铺信息
const saveShopInfo = async () => {
  if (!shopInfo.value.name.trim()) {
    uni.showToast({ title: '请输入店铺名称', icon: 'none' })
    return
  }

  const payload = {
    name: shopInfo.value.name.trim(),
    introduction: shopInfo.value.intro.trim() || null,
    business_time: buildBusinessTime() || null,
    shop_phone: shopInfo.value.phone.trim() || null
  }

  // 只有头像变更过且是远程URL时才传logo
  if (shopInfo.value.avatar && !shopInfo.value.avatar.startsWith('_') && !shopInfo.value.avatar.startsWith('wxfile://') && !shopInfo.value.avatar.startsWith('http://tmp/')) {
    payload.logo = [shopInfo.value.avatar]
  }

  uni.showLoading({ title: '保存中...', mask: true })
  try {
    const res = await putRequest('/admin/merchant/update', payload)
    if (res.code === 2000) {
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' })
    }
  } catch (err) {
    const msg = err?.data?.message || err?.message || '保存失败'
    uni.showToast({ title: msg, icon: 'none' })
    console.error('保存店铺信息错误：', err)
  } finally {
    uni.hideLoading()
  }
}
</script>

<style scoped lang="scss">
.shop-set-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

// 通用卡片
.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

// 头像卡片
.avatar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
  }

  .avatar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      border: 2rpx solid #eee;
    }

    .avatar-placeholder {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      border: 2rpx dashed #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }

    .edit-tip {
      font-size: 24rpx;
      color: #999;
    }
  }
}

// 表单项
.form-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .form-label {
    width: 160rpx;
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
  }

  .form-input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    text-align: right;
  }

  .time-row {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12rpx;
  }
  .time-picker { flex-shrink: 0; }
  .time-text {
    font-size: 28rpx;
    color: #333;
    padding: 8rpx 16rpx;
    background: #fafafa;
    border-radius: 8rpx;
    border: 1rpx solid #eee;
    min-width: 100rpx;
    text-align: center;
  }
  .form-picker {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8rpx;
  }
  .picker-text { font-size: 28rpx; color: #333; }
  .picker-placeholder .picker-text { color: #bbb; }

  .time-placeholder { color: #bbb; }
  .time-dash { font-size: 28rpx; color: #999; }
}

// 简介卡片
.desc-card {
  .form-label {
    display: block;
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 16rpx;
  }

  .desc-textarea {
    width: 100%;
    height: 160rpx;
    padding: 16rpx;
    background-color: #f9f9f9;
    border-radius: 8rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
  }
}

// 保存按钮
.save-btn {
  margin-top: 40rpx;
  height: 88rpx;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
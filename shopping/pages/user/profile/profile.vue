<template>
  <view class="userLayout pageBg">
    <view class="userInfo" @tap="handleUserClick">
      <view class="avatar">
        <image v-if="avatar" :src="avatar" mode="aspectFill"></image>
        <image v-else src="/static/user/头像.jpg" mode="aspectFill"></image>
      </view>
      <view class="nickname">
        <text v-if="nickname">{{ nickname }}</text>
        <text v-else class="nickname-placeholder">请登录</text>
      </view>
    </view>
    <view class="section">
      <view class="list">
        <view class="row" @tap="goToOrder">
          <view class="left">
            <image src="/static/user/订单(个人中心页).png" mode="aspectFill"></image>
            <view class="text">我的订单</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
        <view class="row">
          <view class="left">
            <image src="/static/user/收藏.png" mode="aspectFill"></image>
            <view class="text">我的收藏</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
        <view class="row">
          <view class="left">
            <image src="/static/user/客服.png" mode="aspectFill"></image>
            <view class="text">联系客服</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
          <button open-type="contact">联系客服</button>
        </view>
      </view>
    </view>
    <view class="section">
      <view class="list">
        <view class="row" @tap="goToShop">
          <view class="left">
            <image src="/static/user/开店.png" mode="aspectFill"></image>
            <view class="text">我想开店</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
        <view class="row" @tap="goToManager">
          <view class="left">
            <image src="/static/user/商家.png" mode="aspectFill"></image>
            <view class="text">我是商家</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
        <view class="row">
          <view class="left">
            <image src="/static/user/常见问题.png" mode="aspectFill"></image>
            <view class="text">常见问题</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
        <view class="row">
          <view class="left">
            <image src="/static/user/关于我们.png" mode="aspectFill"></image>
            <view class="text">关于我们</view>
          </view>
          <view class="right">
            <uni-icons type="right" size="15" color="#aaa"></uni-icons>
          </view>
        </view>
      </view>
    </view>
    <CustomTabBar />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/TabBar/TabBar.vue'
import { getRequest } from '@/utils/request.js'

const avatar = ref('')
const nickname = ref('')

const fetchUserInfo = async () => {
  const openid = uni.getStorageSync('openid')
  if (!openid) return
  try {
    const res = await getRequest('/user/info', { openid }, { showLoading: false })
    avatar.value = res.data.avatar || ''
    nickname.value = res.data.nickname || ''
  } catch (e) { /* 忽略 */ }
}

onShow(() => {
  fetchUserInfo()
})

const handleUserClick = () => {
  if (!nickname.value && !avatar.value) {
    uni.navigateTo({ url: '/pages/user/login/login' })
  }
}

const goToOrder = () => { uni.reLaunch({ url: '/pages/user/order/order' }) }
const goToShop = () => { uni.navigateTo({ url: '/pages/user/shop/shop' }) }
const goToManager = () => { uni.navigateTo({ url: '/pages/user/manager/managerLogin' }) }
</script>

<style lang="scss" scoped>
.userLayout{
  .userInfo{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50rpx 0;
    .avatar{
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      overflow: hidden;
      image{
        width: 100%;
        height: 100%;
      }
    }
    .nickname {
      margin-top: 16rpx;
      font-size: 32rpx;
      color: #333;
    }
    .nickname-placeholder {
      margin-top: 16rpx;
      font-size: 28rpx;
      color: #999;
    }
  }
  .section{
    width: 690rpx;
    margin: 50rpx auto;
    border-radius: 10rpx;
    box-shadow: 0 0 30rpx rgba(0,0,0,0.05);
    .list{
      .row{
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 30rpx;
        height:100rpx;
        border-bottom:1px solid #eee ;
        position: relative;
        background: #fff;
        &:last-child{border-bottom: 0}
        .left{
          display: flex;
          align-items: center;
          image{
            width: 40rpx;
            height: 40rpx;
            margin-right: 15rpx;
          }
          .text{
            color: #666;
          }
        }
        .right{
          display: flex;
          align-items: center;
        }
        button{
          position: absolute;
          top: 0;
          left: 0;
          height: 100rpx;
          width: 100%;
          opacity: 0;
        }
      }
    }
  }
}
</style>

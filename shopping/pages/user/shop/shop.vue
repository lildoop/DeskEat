<template>
  <view class="container">
    <!-- 标题区域 -->
    <view class="title-wrap">
      <text class="main-title">在线点餐平台入驻申请</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-wrap">
      <!-- 手机号 -->
      <view class="form-item">
        <view class="label">
          <text class="required">*</text> 您的手机号码
        </view>
        <input
          class="input"
          v-model="form.phone"
          type="number"
          placeholder="请准确填写！"
          maxlength="11"
        />
      </view>

      <!-- 验证码 -->
      <view class="form-item">
        <view class="label">
          <text class="required">*</text> 验证码
        </view>
        <view class="code-wrap">
          <input
            class="code-input"
            v-model="form.code"
            type="number"
            placeholder="请输入短信验证码"
            maxlength="6"
          />
          <button
            class="code-btn"
            :disabled="countdown > 0"
            @tap="getCode"
          >
            {{ countdown > 0 ? `${countdown}s后重发` : "获取验证码" }}
          </button>
        </view>
      </view>
	  <!-- 店铺名称 🔥 修复：type错误，改为文本输入 -->
	  <view class="form-item">
	    <view class="label">
	      <text class="required">*</text> 店铺名称
	    </view>
	    <input
	      class="input"
	      v-model="form.name"
	      placeholder="给你的店铺起个有特色的名字吧！"
	      maxlength="50"
	    />
	  </view>
      <!-- 商圈地址 -->
      <view class="form-item" @tap="chooseLocation">
        <view class="label">
          <text class="required">*</text> 想要加入的商圈地址
        </view>
        <view class="select-content address-row">
          <text class="select-text" :class="{ placeholder: !form.address }">
            {{ form.address || "点击选择地址" }}
          </text>
          <uni-icons type="right" size="26" color="#999"></uni-icons>
        </view>
      </view>

      <!-- 是否有营业执照 -->
      <view class="form-item" @tap="showLicensePicker">
        <view class="select-wrap">
          <view class="label">
            <text class="required">*</text> 是否有营业执照
          </view>
          <view class="select-content">
            <text class="select-text" :class="{ placeholder: !form.hasLicense }">
              {{ form.hasLicense || "请选择" }}
            </text>
            <uni-icons type="right" size="26" color="#999"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 是否有食品经营许可证 -->
      <view class="form-item" @tap="showFoodLicensePicker">
        <view class="select-wrap">
          <view class="label">
            <text class="required">*</text> 是否有食品安全许可证
          </view>
          <view class="select-content">
            <text class="select-text" :class="{ placeholder: !form.hasFoodLicense }">
              {{ form.hasFoodLicense || "请选择" }}
            </text>
            <uni-icons type="right" size="26" color="#999"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 备注 🔥 改为必填 -->
      <view class="form-item">
        <view class="label">
          <text class="required">*</text> 其他问题和备注
        </view>
        <textarea
          class="remark-input"
          v-model="form.remark"
          placeholder="如什么时间方便联系？"
          maxlength="200"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @tap="submitForm">提交申请</view>
  </view>
</template>

<script setup>
import { ref, reactive, onUnmounted } from "vue";
// 🔥 引入请求工具
import { postRequest } from '@/utils/request.js'

// 表单数据
const form = reactive({
  phone: "",
  code: "",
  name:"",
  address: "",
  aname:"",
  latitude: "",
  longitude: "",
  hasLicense: "",
  hasFoodLicense: "",
  remark: "",
});

// 验证码倒计时
const countdown = ref(0);
let timer = null;

// 🔥 获取验证码（接入后端接口）
const getCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: "请输入正确的手机号", icon: "none" });
    return;
  }
  if(countdown.value > 0) return
  
  try {
    // 调用发送验证码接口
    await postRequest(`/common/phone_captcha?phone=${form.phone}`, {})
    uni.showToast({ title: "验证码已发送", icon: "success" });
    // 倒计时逻辑
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch (err) {
    uni.showToast({ title: "验证码发送失败", icon: "none" })
    console.error(err)
  }
};

// 选择营业执照
const showLicensePicker = () => {
  uni.showActionSheet({
    itemList: ['有', '无'],
    success: (res) => {
      form.hasLicense = res.tapIndex === 0 ? '有' : '无';
    }
  });
};

// 选择食品许可证
const showFoodLicensePicker = () => {
  uni.showActionSheet({
    itemList: ['有', '无'],
    success: (res) => {
      form.hasFoodLicense = res.tapIndex === 0 ? '有' : '无';
    }
  });
};

// 选择地址
const chooseLocation = () => {
  uni.chooseLocation({
    success: (res) => {
      form.aname = res.name;
      form.address = res.address;
      form.latitude = res.latitude;
      form.longitude = res.longitude;
    },
    fail: () => {
      uni.showToast({ title: '请开启定位权限', icon: 'none' });
    }
  });
};

// 🔥 提交表单（接入入驻申请接口，严格匹配后端参数）
const submitForm = async () => {
  // 表单校验（新增备注必填）
  if (!form.phone) return uni.showToast({ title: "请输入手机号", icon: "none" });
  if (!form.code) return uni.showToast({ title: "请输入验证码", icon: "none" });
  if (!form.name) return uni.showToast({ title: "请输入店铺名称", icon: "none" });
  if (!form.address) return uni.showToast({ title: "请选择商圈地址", icon: "none" });
  if (!form.hasLicense) return uni.showToast({ title: "请选择是否有营业执照", icon: "none" });
  if (!form.hasFoodLicense) return uni.showToast({ title: "请选择是否有食品许可证", icon: "none" });
  if (!form.remark) return uni.showToast({ title: "请输入备注信息", icon: "none" });

  try {
    // 🔥 组装后端要求的参数格式
    const params = {
      name: form.name,
      // 文字转布尔值：有=true 无=false
      business_license: form.hasLicense === '有',
      food_safety_permit: form.hasFoodLicense === '有',
      phone: form.phone,
      captcha: form.code,
      address: {
        name: form.aname,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude
      },
	  remark:form.remark
    }

    // 调用入驻申请接口
    const res = await postRequest('/admin/merchant/add', params)
    
    // 适配后端成功码 2000
    if (res.code === 2000) {
      uni.showToast({ title: "提交成功", icon: "success" });
      // 提交成功后清空表单（可选）
      Object.keys(form).forEach(key => form[key] = '')
    } else {
      uni.showToast({ title: res.message || '提交失败', icon: "none" });
    }
  } catch (err) {
    uni.showToast({ title: "提交请求失败", icon: "none" });
    console.error("提交错误：", err)
  }
};

// 销毁定时器
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped lang="scss">
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;

  .title-wrap {
    margin-bottom: 30rpx;

    .main-title {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      text-align: center;
      margin: 30rpx 0;
    }
  }

  .form-wrap {
    background-color: #fff;
    border-radius: 12rpx;
    overflow: hidden;

    .form-item {
      padding: 30rpx 24rpx;
      border-bottom: 1rpx solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 32rpx;
        color: #333;
        margin-bottom: 20rpx; /* 标签和下方内容间距 */

        .required {
          color: #ff4d4f;
          margin-right: 8rpx;
        }
      }

      // 统一输入框样式
      .input,
      .remark-input {
        width: 100%;
        font-size: 30rpx;
        color: #666;
        border: none;
        padding: 0;
        outline: none;
        background: transparent;
      }

      // 验证码区域
      .code-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .code-input {
          flex: 1;
          font-size: 30rpx;
          color: #666;
        }

        .code-btn {
          width: 200rpx;
          height: 60rpx;
          line-height: 60rpx;
          color: #333;
          background-color: #f5f5f5;
          border: 1rpx solid #e0e0e0;
          border-radius: 30rpx;
          font-size: 26rpx;
          padding: 0;
          box-shadow: none;
          outline: none;
          overflow: hidden;
          background-clip: padding-box;
          box-sizing: border-box;

          &::after {
            border: none;
            border-radius: 30rpx;
          }

          &:disabled {
            background-color: #ccc;
            color: #fff;
            border-color: #ccc;
          }
        }
      }

      // 选择项区域
      .select-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }
      
      // 地址行专属样式：左右布局，占满宽度
      .address-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .select-content {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .select-text {
          font-size: 30rpx;
          color: #333;

          &.placeholder {
            color: #999;
          }
        }
      }

      // 备注文本域
      .remark-input {
        height: 80rpx;
        margin-top: 16rpx;
      }
    }
  }

  // 提交按钮
  .submit-btn {
    margin: 60rpx 24rpx;
    height: 88rpx;
    line-height: 88rpx;
    background-color: #07c160;
    color: #fff;
    border-radius: 44rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: 500;
  }
}
</style>
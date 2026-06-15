// utils/request.js
/**
 * 微信点餐小程序 企业级请求封装
 * 特性：单Token鉴权 | JSON/FormData自适应 | 统一拦截 | 错误分级处理
 */

// ====================== 基础全局配置 ======================
export const BASE_URL = 'http://127.0.0.1' // 后端根接口地址
const TIME_OUT = 15000 // 请求超时 15秒
// Token 本地存储键名
const TOKEN_KEY = 'access_token'

// ====================== Token 存取工具方法 ======================
// 获取访问令牌
export function getAccessToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}
// 保存Token
export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}
// 清空Token
export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

// ====================== 核心请求主方法 ======================
/**
 * @param {Object} options 请求配置
 * @param {String} options.url 接口地址
 * @param {String} options.method 请求方式 GET/POST
 * @param {Object} options.data 请求参数
 * @param {Boolean} options.isFormData 是否formData格式 默认false=json
 * @param {Boolean} options.showLoading 是否显示加载框 默认true
 * @param {Object} options.header 自定义请求头
 */
function service(options) {
  const {
    url,
    method = 'GET',
    data = {},
    isFormData = false,
    showLoading = true,
    header = {}
  } = options

  return new Promise((resolve, reject) => {
    // 1. 组装请求头
    let headers = { ...header }
    // 自适应数据格式
    if (isFormData) {
      headers['Content-Type'] = 'multipart/form-data'
    } else {
      headers['Content-Type'] = 'application/json;charset=utf-8'
    }
    // 携带访问令牌
    const token = getAccessToken()
    if (token) {
      headers['Authorization'] = token
    }

    // 2. 显示加载弹窗
    if (showLoading) {
      uni.showLoading({ title: '请求中', mask: true })
    }

    // 3. 发起请求
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: headers,
      timeout: TIME_OUT,

      // 请求成功响应
      success: (response) => {
        const { statusCode, data: resData } = response
        // 关闭加载
        if (showLoading) uni.hideLoading()

        // HTTP状态码正常
        if (statusCode === 200) {
          // 业务状态码判断
          switch (resData.code) {
            // 业务请求成功
            case 200:
            case 2000:
              resolve(resData)
              break

            // Token过期或无效，直接跳转登录
            case 401:
              clearToken()
              uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
              setTimeout(() => {
                uni.reLaunch({ url: '/pages/login/login' })
              }, 1200)
              reject(resData)
              break

            // 其他业务错误
            default:
              uni.showToast({ title: resData.message || resData.msg || '请求异常', icon: 'none' })
              reject(resData)
          }
        } else if (statusCode === 422) {
          // 参数校验失败（如缺token等）
          console.error('参数校验失败：', resData)
          uni.showToast({ title: '请求参数错误', icon: 'none' })
          reject(response)
       } else {
         // HTTP异常状态码：优先展示后端业务错误信息
         const errMsg = resData?.message || resData?.msg || `服务器错误${statusCode}`
         uni.showToast({ title: errMsg, icon: 'none' })
         reject(response)
       }
      },

      // 网络请求失败
      fail: (err) => {
        if (showLoading) uni.hideLoading()
        uni.showToast({ title: '网络连接失败，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}

// ====================== 快捷请求方法导出 ======================
// GET 请求 默认JSON格式
export function getRequest(url, data = {}, other = {}) {
  return service({ url, method: 'GET', data, ...other })
}

// POST 请求 默认JSON格式
export function postRequest(url, data = {}, other = {}) {
  return service({ url, method: 'POST', data, ...other })
}

// POST FormData 格式（上传图片、文件专用）
export function postFormData(url, data = {}, other = {}) {
  return service({ url, method: 'POST', data, isFormData: true, ...other })
}
// POST FormData 格式（上传图片、文件专用）
export function putRequest(url, data = {}, other = {}) {
  return service({ url, method: 'PUT', data, ...other })
}
// DELETE 请求
// 修复后的deleteRequest：把params拼接到URL上，作为Query参数
export function deleteRequest(url, params = {}, other = {}) {
  // 拼接Query参数（支持多个参数）
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  const fullUrl = queryString ? `${url}?${queryString}` : url
  
  return service({ 
    url: fullUrl, 
    method: 'DELETE', 
    data: {}, // 不需要body数据
    ...other 
  })
}
export default service
<script>
	import { postRequest } from '@/utils/request.js'

	// 静默登录：拿到 code 直接换 openid，无需用户任何操作
	const silentLogin = async () => {
		const role = uni.getStorageSync('role')
		const openid = uni.getStorageSync('openid')
		if (role === 'admin' || (role === 'user' && openid)) return

		try {
			const code = await new Promise((resolve) => {
				uni.login({ success: (res) => resolve(res.code), fail: () => resolve('') })
			})
			if (!code) return

			const res = await postRequest('/user/login', { code }, { showLoading: false })
			uni.setStorageSync('openid', res.data.openid)
			uni.setStorageSync('userid', res.data.id)
			uni.setStorageSync('role', 'user')
		} catch (e) { /* 网络不通不影响使用 */ }
	}

	const isAdminPage = (url) => {
		if (!url) return false
		return url.split('?')[0].startsWith('/pages/admin/')
	}

	const guardAdminRoute = (args) => {
		if (!isAdminPage(args.url)) return true
		const role = uni.getStorageSync('role')
		const token = uni.getStorageSync('access_token')
		if (role === 'admin' && token) return true
		uni.showToast({ title: '请先登录管理员账号', icon: 'none' })
		uni.reLaunch({ url: '/pages/user/index/index' })
		return false
	}

	export default {
		onLaunch: function() {
			// App Launch
			silentLogin()
			uni.addInterceptor('navigateTo', { invoke: guardAdminRoute })
			uni.addInterceptor('redirectTo', { invoke: guardAdminRoute })
			uni.addInterceptor('switchTab', { invoke: guardAdminRoute })
			uni.addInterceptor('reLaunch', { invoke: guardAdminRoute })
		},
		onShow: function() {
			// App Show
			silentLogin()
		},
		onHide: function() {
			// App Hide
		}
	}
</script>

<style lang="scss">
@import "common/style/common-style.scss"
</style>

<template>
	<div id = "login-dialog">
	 	<el-row type="flex" :gutter="24" align="middle">
	 		<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Username</span>
	 		</el-col>
	        <el-col :offset="2" :span="17">
	        	<el-input v-model="username"></el-input>
	        </el-col>
	    </el-row> 
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Password</span>
	 		</el-col>
	        <el-col :offset="2" :span="17">
	        	<el-input v-model="password" show-password></el-input>
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="11" :span="12">
		    	<el-button @click="open_singup_dialog">Signup</el-button>
		    	<el-button @click="close_login_dialog">Cancel</el-button>
		    	<el-button type="primary" @click="login">Login</el-button>
	    	</el-col>
	    </el-row>
	</div>
</template>

<script>
  import { mapMutations, mapState } from 'vuex'
  import { sendLoginData, queryDataset, queryTemplate } from '@/communication/sendData.js'

  export default {
	name: 'UserDialog',
	components: {

	},
	props: {
      openSignUpDialog: {
        type: Function
      },
      closeLoginDialog: {
        type: Function
      }
    },
	data() {
		return {
			username: '',
			password: ''
		}
	},
	created: function () {
	},
	mounted: function() {
	},
	computed: {
		...mapState([
	      'userInfoObj',
	      'userInfoName'
	    ])
	},
	methods: {
		login: function() {
			let loginInfo = {
				username: this.username,
				password: this.password
			}
			if (this.username === '') {
				this.promptMessage('error', 'The user name is empty.')
			} else {
				if (this.password === '') {
					this.promptMessage('error', 'The user password is empty.')
				} else {
					sendLoginData(loginInfo, this.loginCallback)
				}
			}
		},
		close_login_dialog: function() {
			this.closeLoginDialog()
		},
		open_singup_dialog: function() {
			let self = this
			this.closeLoginDialog()
			setTimeout(function() {
				self.openSignUpDialog()
			}, 500)
		},
		promptMessage: function(type, message) {
			this.$message({
              type: type,
              message: message
            })
		},
		loginCallback: function(resData) {
			let self = this
			this.promptMessage(resData.type, resData.message)
			if (resData.type === 'success') {
				let userInfoObj = resData.userInfoObj
				let username = userInfoObj.username
				this.closeLoginDialog()
				let queryDatasetDefer = $.Deferred()
				let queryTemplateDefer = $.Deferred()
				this.getUserDateset(username, queryDatasetDefer)
				this.getUserTemplate(username, queryTemplateDefer)
				$.when(queryDatasetDefer, queryTemplateDefer).then(function() {
					self.UPDATE_USER_INFO_OBJ(userInfoObj)
					self.UPDATE_USER_INFO_NAME(username)
					self.$cookies.set('user-info-obj', userInfoObj)
				})
			}
		},
		getUserDateset: function (username, queryDatasetDefer) {
			let userInfo = {
				username: username
			}
			queryDataset(userInfo, this.getUserDatesetCallBack, queryDatasetDefer)
		},
		getUserDatesetCallBack: function (resData, queryDatasetDefer) {
			sysDatasetObj.addTreeDatasetArray(resData)
			queryDatasetDefer.resolve()
		},
		getUserTemplate: function (username, queryTemplateDefer) {
			let userInfo = {
				username: username
			}
			queryTemplate(userInfo, this.getUserTemplateCallBack, queryTemplateDefer)
		},
		getUserTemplateCallBack: function (resData, queryTemplateDefer) {
			sysDatasetObj.addTreeTemplateArray(resData)
			queryTemplateDefer.resolve()
		},
		...mapMutations([
			'UPDATE_USER_INFO_NAME',
			'UPDATE_USER_INFO_OBJ'
	    ])
	}
  }
</script>

<style lang="less">
	#login-dialog {
		.demo-input-label {
			display: inline-block;
	    	width: 130px;
	    	text-align: left;
	    	color: black;
		}
		.el-col.el-col-20 {
			margin-top: 10px;
			margin-bottom: 10px;
			cursor: pointer;
		}
		.el-row {
		    margin-bottom: 5px;
		    &:last-child {
		      margin-bottom: 0;
		      margin-top: 10px;
		    }
		}
		.el-button {
			padding: 7px 15px;
			border-radius: 0px;
		}
		.el-input__inner {
			height: 30px;
		}
		.el-input__icon {
			line-height: 30px;
		}
	}
</style>

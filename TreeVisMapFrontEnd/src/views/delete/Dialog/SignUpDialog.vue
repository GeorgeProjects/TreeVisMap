<template>
	<div id = "signup-dialog">
	 	<el-row type="flex" :gutter="24" align="middle">
	 		<el-col :offset="2" :span="4">
	 			<span class="demo-input-label">Username</span>
	 		</el-col>
	        <el-col :offset="2" :span="15">
	        	<el-input v-model="username"></el-input>
	        </el-col>
	    </el-row> 
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="4">
	 			<span class="demo-input-label">Password</span>
	 		</el-col>
	        <el-col :offset="2" :span="15">
	        	<el-input v-model="password" show-password></el-input>
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="4">
	 			<span class="demo-input-label">Confirm Password</span>
	 		</el-col>
	        <el-col :offset="2" :span="15">
	        	<el-input v-model="confirm_password" show-password></el-input>
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="4">
	 			<span class="demo-input-label">Email</span>
	 		</el-col>
	        <el-col :offset="2" :span="15">
	        	<el-input v-model="email"></el-input>
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="14" :span="9">
		    	<el-button @click="close_signup_dialog">Cancel</el-button>
		    	<el-button type="primary" @click="signup">Submit</el-button>
	    	</el-col>
	    </el-row>
	</div>
</template>

<script>
  import { mapMutations, mapState } from 'vuex'
  import { sendSignupData, queryDataset, queryTemplate } from '@/communication/sendData.js'
  export default {
	name: 'UserDialog',
	components: {

	},
	props: {
      closeSignupDialog: {
        type: Function
      }
    },
	data() {
		return {
			appName: 'gotree',
			username: '',
			password: '',
			confirm_password: '',
			email: ''
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
		signup: function() {
			let signupInfo = {
				username: this.username,
				password: this.password,
				email: this.email
			}
			if (this.username === '') {
				this.promptMessage('error', 'user name is empty')
			} else {
				if (this.password === '') {
					this.promptMessage('error', 'password is empty')
				} else {
					if (this.password !== this.confirm_password) {
						this.promptMessage('error', 'passwords do not match')
					} else {
						if (this.email === '') {
							this.promptMessage('error', 'email is empty')
						}
						sendSignupData(signupInfo, this.signupCallback)
					}
				}
			}
		},
		close_signup_dialog: function() {
			this.closeSignupDialog()
		},
		promptMessage: function(type, message) {
			this.$message({
              type: type,
              message: message
            })
		},
		signupCallback: function(resData) {
			this.promptMessage(resData.type, resData.message)
			if (resData.type === 'success') {
				let userInfoObj = resData.userInfoObj
				this.UPDATE_USER_INFO_OBJ(userInfoObj)
				let username = userInfoObj.username
				this.UPDATE_USER_INFO_NAME(username)
				this.closeSignupDialog()
				this.getUserDateset(username)
				this.getUserTemplate(username)
			}
		},
		getUserDateset: function (username) {
			let userInfo = {
				username: username
			}
			queryDataset(userInfo, this.getUserDatesetCallBack)
		},
		getUserDatesetCallBack: function (resData) {
			sysDatasetObj.addTreeDatasetArray(resData)
		},
		getUserTemplate: function (username) {
			let userInfo = {
				username: username
			}
			queryTemplate(userInfo, this.getUserTemplateCallBack)
		},
		getUserTemplateCallBack: function (resData) {
			sysDatasetObj.addTreeTemplateArray(resData)
		},
		...mapMutations([
			'UPDATE_USER_INFO_NAME',
			'UPDATE_USER_INFO_OBJ'
	    ])
	}
  }
</script>

<style lang="less">
	#signup-dialog {
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
			padding: 7px 17px;
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

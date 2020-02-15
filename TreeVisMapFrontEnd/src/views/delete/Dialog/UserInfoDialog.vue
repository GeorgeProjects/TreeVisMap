<template>
	<div id = "user-info-dialog">
	 	<el-row type="flex" :gutter="24" align="middle">
	 		<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Username: </span>
	 		</el-col>
	        <el-col :offset="2" :span="17">
	        	{{
	        		userInfoObj != null? userInfoObj.username : ""
	        	}}
	        </el-col>
	    </el-row> 
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Password: </span>
	 		</el-col>
	        <el-col :offset="2" :span="17">
	        	{{
	        		userInfoObj != null? userInfoObj.password : ""
	        	}}
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Email: </span>
	 		</el-col>
	        <el-col :offset="2" :span="17">
	        	{{
	        		userInfoObj != null? userInfoObj.email : ""
	        	}}
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle" class="table-title">
	    	<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Dataset: </span>
	 		</el-col>
	 		<el-col :offset="2" :span="17">
	        	{{
	        		treeDataArray.filter(data => data.username === userInfoName).length
	        	}}
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="20">
		    	<el-table 
		            ref="treeDataTable"
		            highlight-current-row
		            :default-sort = "{prop: 'date', order: 'ascending'}"
		            :data="treeDataArray.filter(data => data.username === userInfoName)"
		            max-height="120"
		            border
		            stripe>
		            <el-table-column
		              property="filename"
		              label="FileName"
		              sortable
		              >
		            </el-table-column>
		            <el-table-column
		              property="nodeNum"
		              label="NodeNum"
		              sortable
		              >
		            </el-table-column>
		            <el-table-column
		              property="depth"
		              label="Depth"
		              sortable
		              width="95"
		              show-overflow-tooltip>
		            </el-table-column>
		            <el-table-column
		              property="date"
		              label="Date"
		              sortable
		              width="80"
		              show-overflow-tooltip>
		            </el-table-column>
		        </el-table>
	    	</el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle" class="table-title">
	    	<el-col :offset="2" :span="2">
	 			<span class="demo-input-label">Tree Template: </span>
	 		</el-col>
	       	<el-col :offset="2" :span="17">
	        	{{
	        		treeTemplateArray.filter(data => data.username === userInfoName).length
	        	}}
	        </el-col>
	    </el-row>
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="2" :span="20">
		    	<el-table 
		            ref="treeDataTable"
		            highlight-current-row
		            :default-sort = "{prop: 'date', order: 'ascending'}"
		            :data="treeTemplateArray.filter(data => data.username === userInfoName)"
		            max-height="120"
		            border
		            stripe>
		            <el-table-column
		              property="treename"
		              label="Template"
		              sortable
		              >
		            </el-table-column>
		            <el-table-column
		              property="date"
		              label="Date"
		              sortable
		              show-overflow-tooltip>
		            </el-table-column>
		        </el-table>
	    	</el-col>
	    </el-row>	    
	    <el-row type="flex" :gutter="24" align="middle">
	    	<el-col :offset="14" :span="9">
	    		<el-button @click="logout">logout</el-button>
		    	<el-button type="primary" @click="closeUserInfoDialog">OK</el-button>
	    	</el-col>
	    </el-row>
	</div>
</template>

<script>
	// treeDataArray.filter(data => !search || data.filename.toLowerCase().includes(search.toLowerCase()))
  import { mapMutations, mapState } from 'vuex'
  import { queryDataset, queryTemplate } from '@/communication/sendData.js'
  export default {
	name: 'UserDialog',
	components: {
	},
	props: {
      closeUserInfoDialog: {
        type: Function
      }
    },
	data() {
		return {
			username: '',
			password: '',
			treeDataArray: sysDatasetObj.getTreeDatasetArray(),
			treeTemplateArray: sysDatasetObj.getTreeTemplateArray()
		}
	},
	created: function () {
	},
	mounted: function() {
	},
	computed: {
		...mapState([
	      'userInfoObj',
	      'userInfoName',
	      'selectedDSLArray'
	    ])
	},
	methods: {
		promptMessage: function(type, message) {
			this.$message({
              type: type,
              message: message
            })
		},
		logout: function() {
			sysDatasetObj.removeAllUserTemplate()
			sysDatasetObj.removeAllUserDataset()
			this.removeAllUserSelectedDSL()
			this.UPDATE_USER_INFO_NAME('Login')
			this.UPDATE_USER_INFO_OBJ(null)
			this.closeUserInfoDialog()
			this.promptMessage('success', 'Logged out')
			// 删除在cookie中存储的user-info-obj对象
			this.$cookies.remove('user-info-obj')
			this.$cookies.remove('selected-data-name')
			this.$cookies.remove('selected-dsl-array')
		},
		removeAllUserSelectedDSL: function() {
			let self = this
			let systemTreeTemplateArray = sysDatasetObj.getSystemTreeTemplateArray()
			let systemTreeTemplateNameArray = systemTreeTemplateArray.map(function(d) {
				return d.treename
			})
			let filterDSLArray = this.selectedDSLArray.filter(function(dslName) {
				return (systemTreeTemplateNameArray.indexOf(dslName) !== -1)
			})
			this.UPDATE_SELECTED_DSL_ARRAY(filterDSLArray)
		},
		...mapMutations([
			'UPDATE_USER_INFO_NAME',
			'UPDATE_USER_INFO_OBJ',
			'UPDATE_SELECTED_DSL_ARRAY'
	    ])
	}
  }
</script>

<style lang="less">
	#user-info-dialog {
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
		    &.table-title {
		      margin-bottom: -5px;
		    }
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
		.el-table td, .el-table th {
	 		padding: 1px 0 !important;
		}
		.el-button--mini, .el-button--mini.is-round {
			padding: 3px 5px;
		}
	}
</style>

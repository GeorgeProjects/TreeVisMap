<template>
	<div class = "topology-container">
		<div class = "label">
			<span class = "inner-title">Topology</span>
		</div>
		<div class = "component-container">
			<el-row class="row-container" :gutter="20">
				<span class = "sub-title">
					Parend-child relation
				</span>
			</el-row>
			<el-row class="row-container" :gutter="20" v-for="(attrObj, name) in parentChildRelationObject">
			  <el-col :offset="1" :span="1" class="row-bg col-container">
			  </el-col>
			  <el-col :span="3" class="row-bg col-container">
			  	<span class = "inner-label">
			  		<span class="icon iconfont" :class="getIconClass(name)"></span>
			  	</span>
			  </el-col>
			  <el-col :span="15" class="row-bg col-container">
			  	<span class = "inner-label">
			  		{{name}}
			  	</span>
			  </el-col>
			  <el-col :span="3" class="row-bg col-container filter-container">
			  	<span class="inner-label" :class="{active: name === selectedRelationName}"
			  			@click="changeActiveRelation(name)">
			  		<span class="icon iconfont icon-setting"></span>
			  	</span>
			  </el-col>
			  <div class = "detail-component-panel el-col el-col-offset-1 el-col-22" v-if="name === selectedRelationName">
			  </div>
			</el-row>
			<el-row class="row-container" :gutter="20">
				<span class = "sub-title">
					Sibling relation
				</span>
			</el-row>
			<el-row class="row-container" :gutter="20" v-for="(attrObj, name) in siblingRelationObject">
			  <el-col :offset="1" :span="1" class="row-bg col-container">
			  </el-col>
			  <el-col :span="3" class="row-bg col-container">
			  	<span class = "inner-label">
			  		<span class="icon iconfont" :class="getIconClass(name)"></span>
			  	</span>
			  </el-col>
			  <el-col :span="15" class="row-bg col-container">
			  	<span class = "inner-label">
			  		{{name}}
			  	</span>
			  </el-col>
			  <el-col :span="3" class="row-bg col-container filter-container">
			  	<span class="inner-label" :class="{active: name === selectedRelationName}"
			  			@click="changeActiveRelation(name)">
			  		<span class="icon iconfont icon-setting"></span>
			  	</span>
			  </el-col>
			</el-row>
			<div class = "detail-component-panel el-col el-col-offset-1 el-col-22" v-if="name === selectedRelationName">
			</div>
		</div>
	</div>
</template>
<script>
	export default {
		name: 'DataView',
		components: {
			
		},
		data() {
			return {
				selectedRelationName: null, 
				parentChildRelationObject: {
					within: {

					},
					juxtapose: {

					},
					include: {

					}
				},
				siblingRelationObject: {
					align: {

					},
					flatten: {

					}
				}		
			}
		},
		watch: {

		},
		created: function () {
		},
		beforeMount: function() {

		},
		mounted: function() {

		},
		computed: {

		},
		methods: {
			changeActiveRelation: function(relationName) {
				if (this.selectedRelationName !== relationName) {
					this.selectedRelationName = relationName
				} else {
					this.selectedRelationName = null
				}
			},
			getIconClass: function(iconName) {
				return 'icon-' + iconName
			}
		}
	}
</script>
<style lang="less">
  	@border-style: 0.05rem solid rgba(180, 180, 180, 0.3);
 	@content-font-size: 1rem;
	.topology-container {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		width: 100%;
		height: 100%;
		.label {
			text-align: left;
			padding-left: 1rem;
			font-weight: bold;
			height: 2rem;
			right: 0%;
			display: table;
			.inner-title {
			  vertical-align: middle;
			  display: table-cell;
			}
		}
		.component-container {
			position: absolute;
			top: 2rem;
			bottom: 0%;
			left: 0rem;
			right: 0rem;
			border-top: @border-style;
			font-size: @content-font-size;
			overflow-y: auto;
			text-align: left;
			.inner-component-container {
				position: absolute;
				left: 0.2rem;
				right: 0.2rem;
				top: 0rem;
				bottom: 0rem;
			}
			.row-container {
				margin-left: 0 !important;
				margin-right: 0 !important;
			}
			.sub-title {
				padding-left: 1rem;
				font-size: @content-font-size;
			}
			.col-container {
				text-align: left;
				height: 2rem;
				right: 0%;
				display: table;
    			cursor: pointer;
    			padding: 0 !important;
				.inner-label {
				  vertical-align: middle;
				  display: table-cell;
				}
				.iconfont {
				  vertical-align: middle;
				  display: table-cell;
				}
			}
			.filter-container {
				.inner-label {
				  vertical-align: middle;
				  display: table-cell;
				  color: #ddd;
				  &.active {
				  	color: #000;
				  }
				}				
			}
			.el-row {
				&:first-child {
			      margin-top: 0.3rem;
			    }
			   	margin-bottom: 0.3rem;
			   	line-height: 2rem;
			}
			.row-bg {
    			background-color: #f9fafc;
  			}
  			.detail-component-panel {
  				height: 10rem;
  				border-left: @border-style;
  				border-right: @border-style;
  				border-bottom: @border-style;
  			}
		}
	}
</style>
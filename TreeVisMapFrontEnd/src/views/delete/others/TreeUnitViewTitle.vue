<template>
  <div class = "treeunit-view-title">
    <span class = "text">{{title}}</span>
    <span class = "operation">
    	<el-tooltip class='labelIcon' content="remove" effect="light"> 
	        <span class = "operation-icon">
		        <span class="icon iconfont icon-iconfontshanchu"
		                  @click.stop.prevent="removeCurrentDSL"></span>
	        </span>
        </el-tooltip>
    	<el-divider direction="vertical"></el-divider>
    	<el-tooltip class='labelIcon' content="save" effect="light"> 
	    	<span class = "operation-icon">
	    		<span class="icon iconfont icon-lingcunwei"
	                  @click.stop.prevent="saveNewDSL"></span>
	    	</span>
    	</el-tooltip>
    </span>
  </div>
</template>

<script> 
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'Layout',
  props: {
  },
  data() {
    return {
    	title: 'TreeUnitView',
      saveDialogVisible: true
    }
  },
  created: function() {},
  beforeMount: function() {
    this.format = this.defaultFormat
  },
  mounted: function() {
  },
  watch: {
  }, 
  methods: {
  	saveNewDSL: function() {
      console.log('saveNewDSL')
  		this.saveDialogVisible = true
  	},
  	removeCurrentDSL: function() {
  		console.log('remove')
  	}
  }
}
</script>

<style scoped lang="less">
  .treeunit-view-title {
    display: flex; 
    width: 100%; 
    height: 100%; 
    margin: auto; 
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    border-bottom: 1px solid #E4E7ED;
    .text {
       padding-left: 0.5rem;
       margin-left: 0; /* Important */ 
       margin-right: 0; /* Important */ 
       margin-top: auto; /* Important */ 
       margin-bottom: auto; /* Important */ 
       text-align: left;
       font-weight: bold;
    }
    .operation {
       display: flex; 
       flex-direction: row;
       align-items: baseline;
       margin-top: auto; /* Important */ 
       margin-bottom: auto; /* Important */ 
       margin-right: 0.5rem;
       margin-left: auto;
       font-size: 14px;
       .operation-icon {
          padding: 0.2rem;
       }
       .operation-icon:hover {
    	  background: #ccc !important;
  	   }
       .mode-selection {
          margin-left: 0.8rem;
       }
    }
  }
 //  .treeunit-view-title {
	// 	
	// 	width: 100%;
	// 	height: 100%;
	// 	border-bottom: 1px solid #E4E7ED;
	// 	.label {
	// 		text-align: left;
	// 		padding-left: 10px;
	// 		font-weight: bold;
	// 		font-size: 1.2rem;
	// 		height: 2rem;
	// 		display: table;
	// 		.inner-title {
	// 		  vertical-align: middle;
	// 		  display: table-cell;
	// 		}
	// 	}
	// 	.operation {
	// 		text-align: right;
	// 		padding-right: 10px;
	// 		font-weight: bold;
	// 		font-size: 1.2rem;
	// 		height: 2rem;
	// 		display: table;
	// 		.inner-title {
	// 		  vertical-align: middle;
	// 		  display: table-cell;
	// 		}
	// 	}
	// }
</style>

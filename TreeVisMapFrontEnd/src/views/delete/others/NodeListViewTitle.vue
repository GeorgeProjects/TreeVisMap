<template>
  <div class = "container">
    <span class = "text">{{title}}</span>
    <span class = "operation">
      <span class = "mode-selection" v-if="dataNotNull()">
        <el-tooltip content="selection mode" placement="left">
          <el-dropdown @command="handleSelectionModeCommand">
            <span class="el-dropdown-link">
              {{selectionMode}}<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="SingleNode">SingleNode</el-dropdown-item>
              <el-dropdown-item command="Subtree">Subtree</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-tooltip>
      </span>
      <span class = "mode-selection" v-if="dataNotNull()">
        <el-tooltip content="display mode" placement="left">
          <el-dropdown @command="handleDisplayModeCommand">
            <span class="el-dropdown-link">
              {{dataDisplayMode}}<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="tree">tree</el-dropdown-item>
              <el-dropdown-item command="level">level</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-tooltip>
      </span>
      &nbsp;&nbsp;&nbsp;
      <span v-for="(labelIcon) in operation"
        class = "operation-icon">      
        <el-tooltip class='labelIcon' :content="labelIcon" effect="light"> 
            <span class="icon iconfont" :class="[{ active: isActive(labelIcon) }, iconClass(labelIcon)]"
                  @click.stop.prevent="clickHandler(labelIcon)" v-if="dataNotNull()"></span>
        </el-tooltip>
      </span>
      <span class = "operation-icon"
        v-if="uploadFunc">
        <el-upload class="upload-demo" 
        action="uploadDataUrl"
        :http-request="upload"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :auto-upload="true"
        v-if="dataNotNull()"
        :file-list = "fileList">
          <el-tooltip class='labelIcon' content="upload data" effect="light">
              <i class="icon iconfont icon-exchange"></i>
          </el-tooltip>
        </el-upload>
      </span>
    </span>
  </div>
</template>

<script> 
import { mapState, mapMutations } from 'vuex';
import { getHierarchicalData, getHierarchicalDataWithIndex, getNodeArray } from '@/data-processing/get_hierarchical_data.js';

export default {
  name: 'NodeListViewTitle',
  props: {
    title:{
      type: String,
    }, 
    operation: {
      type: Array
    },
    uploadFunc: {
      type: Boolean
    },
    replaceStrategy: {
      type: Object
    },
    defaultFormat: {
      type: String
    }
  },
  data() {
    return {
      fileName: "",
      fileSize: "",
      fileList: [],
      hierarchicalDataStr: "",
      format: ""
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
  computed: {
    ...mapState([
      "treeDataViewSetting",
      "dataDisplayMode",
      "selectionMode",
      "hierarchicalData",
      "partitionDataObjDic"
    ])    
  },  
  methods: {
    upload: function() {
      console.log('call upload')
    },
    dataNotNull: function() {
      return true
      console.log(!(JSON.stringify(this.hierarchicalData)==="null"))
      return (!(JSON.stringify(this.hierarchicalData)==="null"))
    },
    handlePreview(file) {
      console.log(file);
    },
    //  处理dropdown的响应函数
    handleDisplayModeCommand: function(command) {
      console.log('display command', command)
      this.UPDATE_DATA_DISPLAY_MODE(command)
    },
    handleSelectionModeCommand: function(command) {
      console.log('selection command', command)
      this.UPDATE_SELECTION_MODE(command)
    },
    beforeUpload: function(file) {
      var self = this
      var reader = new FileReader() //新建一个FileReader
      reader.readAsText(file, "UTF-8") //读取文件
      reader.onload = function(evt) { //读取完文件之后会回来这里
        let fileString = evt.target.result // 读取文件内容
        self.hierarchicalDataStr = fileString
        self.fileSize = d3.format(".3s")(file.size)
        self.fileName = file.name
        self.update_hierarchical_data_object()
      }
    },
    //  更新数据文本框中的数据
    update_hierarchical_data_object: function() {
        let self = this
        var hierarchicalDataObj = null
        var originalHierarchicalDataObj = null
        var nodeArray = null
        var originalNodeArray = null
        try {
          hierarchicalDataObj = JSON.parse(self.hierarchicalDataStr)
          hierarchicalDataObj = getHierarchicalDataWithIndex(hierarchicalDataObj)
          nodeArray = getNodeArray(hierarchicalDataObj)
          console.log('hierarchicalDataObj', hierarchicalDataObj)
          //  保存另外的原始数据
          originalHierarchicalDataObj = JSON.parse(self.hierarchicalDataStr)
          originalHierarchicalDataObj = getHierarchicalDataWithIndex(originalHierarchicalDataObj)
          originalNodeArray = getNodeArray(originalHierarchicalDataObj)
        } catch(e) {
          return
        }
        //  更新切分的对象
        self.partitionDataObjDic[hierarchicalDataObj.index] = JSON.parse(JSON.stringify(hierarchicalDataObj))
        self.UPDATE_PARTITION_DATA_OBJ_DIC(self.partitionDataObjDic)
        // console.log('hierarchicalDataObj', hierarchicalDataObj)
        self.UPDATE_HIERARCHICAL_DATA(hierarchicalDataObj) 
        self.UPDATE_ORIGINAL_HIERARCHICAL_DATA(originalHierarchicalDataObj) 
        self.UPDATE_NODE_ARRAY(nodeArray)
        self.UPDATE_ORIGINAL_NODE_ARRAY(originalNodeArray)
    },
    //  iconClass
    iconClass: function(label) {
      let iconClass = "icon-" + label
      return iconClass
    },
    //  替换支持的操作
    replace: function (old_operation) {
      let replaceStrategy = this.replaceStrategy
      let new_operation = replaceStrategy[old_operation]
      let oldIndex = this.operation.indexOf(old_operation)
      this.operation.splice(oldIndex, 1, new_operation)
    },
    //  判断是否是对象
    isObject: function (labelIcon) {
      if (typeof(labelIcon) === 'object') {
        return true
      } else {
        return false
      }
    },
    //  判断当前的按钮是否处于被选中的状态
    isActive: function(labelIcon) {
      if ((labelIcon === 'setting') && (this.treeDataViewSetting)) {
        return false
      }
    },
    //  用户点击当前按钮的响应函数
    selectState: function(labelIcon) {
      this.UPDATE_DATA_VIEW_FORMAT(labelIcon)
      this.format = labelIcon
    },
    //  用户点击按钮的响应事件
    clickHandler: function(labelIcon) {
      if (labelIcon === 'setting') {
        this.UPDATE_DATA_VIEW_SETTING(!this.treeDataViewSetting)
      }
      console.log('labelIcon', labelIcon)
    },
    //  使用mapMutation将数组中的mutation与其他的方法结合到一起
    ...mapMutations([
      'UPDATE_HIERARCHICAL_DATA',
      'UPDATE_ORIGINAL_HIERARCHICAL_DATA',
      'UPDATE_DATA_VIEW_FORMAT',
      'UPDATE_DATA_VIEW_SETTING',
      'UPDATE_DATA_DISPLAY_MODE',
      'UPDATE_SELECTION_MODE',
      'UPDATE_NODE_ARRAY',
      'UPDATE_ORIGINAL_NODE_ARRAY',
      'UPDATE_PARTITION_DATA_OBJ_DIC'
    ])
  }
}
</script>

<style scoped lang="less">
  .container {
    display: flex; 
    width: 100%; 
    height: 100%; 
    margin: auto; 
    .text {
       padding-left: 0.5rem;
       margin-left: 0; /* Important */ 
       margin-right: 0; /* Important */ 
       margin-top: auto; /* Important */ 
       margin-bottom: auto; /* Important */ 
       text-align: left;
       font-family: "Lato", "Lucida Grande", "Segoe UI", sans-serif;
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
       font-family: "Lato", "Lucida Grande", "Segoe UI", sans-serif;
       .operation-icon {
          padding: 0.2rem;
       }
       .mode-selection {
          margin-left: 0.8rem;
       }
    }
  }
  .operation-icon:hover {
    background: #ccc !important;
  }
  .icon-setting {
    -webkit-text-fill-color: #ccc;
    &.active {
      -webkit-text-fill-color: black !important;      
    }
  }
  .labelIcon {
    &.labelIcon-bottom {
      padding: 0.1rem;
      border-bottom: 0.2rem solid #ddd;
      cursor: pointer;
    }
  }
  .popup-button {
    border-top: 0px;
    border-left: 0px;
    border-right: 0px;
    padding: 0px;
    border-bottom: 0.2rem solid #ddd;
    padding-bottom: 0.1rem;
    border-radius: 0px;
    -webkit-text-fill-color: black;
  }
  .popup-icon {
     margin-left: 0.8rem;
     padding: 0.2rem;
    &:hover {
      background: #eee;
    }
    &.active {
      background: #eee !important;
    }
  }
  .popup-icon-text {
    margin-left: 0.3rem;
  }
</style>

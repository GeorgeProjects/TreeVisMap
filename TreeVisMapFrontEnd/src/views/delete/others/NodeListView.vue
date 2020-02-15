<template>
    <div id = "container">
      <drop @drop="handleDrop"
        :class="{ over }"
        @dragover="handleDropOver"
        @dragleave="handleDropLeave">
          <div class = "dsl-container">
            <JsonEditor 
              :editorId = "editorId"
              :editorBg = "DSLEditorBg"
              :editorSetting = "setting"
              :editorMode = "mode"
              :content = "reOrganizeData()"
              :key="componentKey"
              :editorExpand="editorExpand"
              :jsonEditorHeight = "jsonEditorHeight"
              v-if="reOrganizeData() != null"
              @updateSelectedItem="updateSelectedItem"
              @updateMode="updateMode" /> 
          </div>
      </drop>
      <el-dialog
        title="Warning"
        :visible.sync="centerDialogVisible"
        width="30%"
        center>
        <span>{{dialogWarning}}</span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="centerDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="centerDialogVisible = false">Confirm</el-button>
        </span>
      </el-dialog>
    </div> 
</template>

<script>
  import Vue from 'vue'
  import iconfont from '../assets/font/iconfont'
  import { mapMutations, mapState, mapActions } from 'vuex'
  import { JsonEditor } from '../components/JsonEditor'
  import { Drag, Drop } from 'vue-drag-drop';
  import { sendData } from '@/communication/sendData.js'

  export default {
    name: 'NodeListView',
    props: {
      minWidth: {
        type: Number,
        default: 0
      },
      jsonEditorHeight: {
        type: Number
      }
    }, 
    data() {
      return {
        DSLEditorBg: "gray",
        editorId: "data-editor",
        setting: false,
        componentKey: 0,
        mode: 'tree',
        over: false,
        selectedItem: null,
        centerDialogVisible: false, 
        dialogWarning: "Please select one node object in Data View.",
        editorExpand: false
      }
    },
    components: {
      JsonEditor, Drag, Drop
    },
    created: function() {},
    beforeMount: function() {
      this.setting = this.treeDataViewSetting
    },
    mounted: function() {
    },
    watch: {
      originalHierarchicalDataObj: function() {
        //  更新了上传的层次结构数据
        this.componentKey = this.componentKey + 1
      },
      hierarchicalDSL: function() {
        let dslName = 'ICICLE'
        // let dslTreeObj = this.parseDSL2Tree(this.hierarchicalDSL, dslName)
        // this.data = new Tree([dslTreeObj])
        console.log('this.data', this.hierarchicalDSL)
      },
      nodeArray: function() {},
      treeDSLViewFormat: function() {},
      treeDataViewSetting: function() {
        this.setting = this.treeDataViewSetting
        this.componentKey = this.componentKey + 1
      },
      dataDisplayMode: function() {
        this.reOrganizeData()
        //  更新了上传的层次结构数据
        this.componentKey = this.componentKey + 1
      }
    },
    computed: {
      ...mapState([
        'hierarchicalData',
        'originalHierarchicalDataObj',
        'nodeArray',
        'originalNodeArray',
        'hierarchicalDSL',
        'treeDSLViewFormat',
        'treeDataViewSetting',
        'dataDisplayMode',
        'treeDSLArray',
        'treeDSLArrayKey',
        'selectionMode'
      ])
    },  
    methods: {
      //  更新DSL视图上的设置选项
      updateSetting: function() {
        // this.DSLDic[name].setting = !this.DSLDic[name].setting
        this.setting = !this.setting
        this.componentKey = this.componentKey + 1
      },
      updateMode: function(newModeObj) {
        let editorId = newModeObj.editorId
        this.mode = newModeObj.mode
      },
      updateSelectedItem: function(selectedItem) {
        this.selectedItem = selectedItem
      },
      //  重新组织数据
      reOrganizeData: function() {
        if (this.dataDisplayMode === 'tree') {
          return this.originalHierarchicalDataObj
        } else if (this.dataDisplayMode === 'level') {
          let treeDepthObj = this.extractNodeArray(this.originalNodeArray)
          return treeDepthObj
        }
      },
      //  提取节点数组
      extractNodeArray: function(nodeArray) {
        let pureNodeArray = []
        for (let i = 0; i < nodeArray.length; i++) {
          let pureNode = {}
          pureNode = nodeArray[i].data
          pureNode.depth = nodeArray[i].depth
          pureNodeArray.push(pureNode)
        }
        //  转换节点的存储方式
        let treeDepthObj = null
        if (pureNodeArray.length !== 0) {
          treeDepthObj = {}
          for (let i = 0; i < pureNodeArray.length; i++) {
            let depthAttr = "depth-" + pureNodeArray[i].depth
            if (typeof(treeDepthObj[depthAttr]) === 'undefined') {
              treeDepthObj[depthAttr] = []
            } 
            treeDepthObj[depthAttr].push(pureNodeArray[i])
            
            // if (typeof(treeDepthObj[depthAttr]) === 'undefined') {
            //   treeDepthObj[depthAttr] = {}
            //   treeDepthObj[depthAttr].name = depthAttr
            //   treeDepthObj[depthAttr].type = 'depth'
            //   treeDepthObj[depthAttr].children = []
            // } 
            // treeDepthObj[depthAttr].children.push(pureNodeArray[i])
          }
           // 删除pureNodeArray中节点的深度属性, 因为是同一个对象，所以也删除了treeLevelObj数据中的depth属性
          for (let i = 0; i < pureNodeArray.length; i++) {
            delete pureNodeArray[i].depth
          }
        }
        return treeDepthObj
      },
      //  弹出提示框关于用户需要选择一个对象
      popupWarningOneObj: function() {
        this.dialogWarning = "Please select one node object in Data."
        this.centerDialogVisible = true
      },
      //  弹出提示框关于用户需要设定全部的节点
      popupWarningSetAllNodes: function() {
        this.dialogWarning = "Please Set all node object in Data."
        this.centerDialogVisible = true
      },
      //  处理drag/drop事件
      handleDrop: function(dslObj) {
        //  获取拖拽的DSL的参数
        let editorId = dslObj.editorId
        let dslName = dslObj.dslName
        let treeDSLArray = this.treeDSLArray
        let treeDSLObj = getTreeDSLObjByEditorId(treeDSLArray, editorId)
        if (this.selectedItem != null) {
          console.log('this.selectedItem', this.selectedItem)
          // if (this.dataDisplayMode === 'tree') { //当数据的展示模式为树形结构
          //  当选择的子树的name不是undefined, 并且选择的子树是一个对象
          // if ((typeof(this.selectedItem.name) !== 'undefined') 
          //       && (typeof(this.selectedItem) === 'object')) {
          if (typeof(this.selectedItem) === 'object') {
            //  对于二者建立关联
            //  遍历全部的节点, 在层次结构数据的每个节点中增加dsl的属性值
            //  在DSL对象中增加选择的根节点
            //  找到原始数据中的节点
            if (Array.isArray(this.selectedItem)) {
              for (let i = 0; i < this.selectedItem.length; i++) {
                let selectedItemObj = this.selectedItem[i]
                addDSLObjToItem(selectedItemObj, treeDSLObj, this)
              }
            } else {
              addDSLObjToItem(this.selectedItem, treeDSLObj, this)
            }
            //  TODO
            //  this.sendDataToServer()
        } else {
            this.popupWarningOneObj()
          }
        } else {
          //  用户在视图中没有选择数据，那么需要将所有的数据进行更新
          addDSLObjToItem(this.hierarchicalData, treeDSLObj, this)          
        }
        //  更新视图
        this.UPDATE_TREE_DSL_ARRAY_KEY(this.treeDSLArrayKey + 1)
        this.over = false
        $('.jsoneditor-selected').removeClass('highlight')
        //  在对象中增加dsl对象
        function addDSLObjToItem (selectedItem, treeDSLObj, self) {
          let nodeArray = self.nodeArray
          var realSelectedItem = findSelectedItem(selectedItem, nodeArray)
          //  设置选择节点中的属性值
          if (self.selectionMode === 'SingleNode') {
            singleAddDSLObj(realSelectedItem, dslObj)
          } else if (self.selectionMode === 'Subtree'){
            recursiveAddDSLObj(realSelectedItem, dslObj)
          }    
          if (!isItemExisted(treeDSLObj.nodeArray, realSelectedItem)) {
            treeDSLObj.nodeArray.push(realSelectedItem)
          }
        }
        //  判断选择的对象增加到DSL对象数组中的节点是否存在
        function isItemExisted(nodeArray, selectItem) {
          let existed = false
          for (let nI = 0; nI < nodeArray.length; nI++) {
            let nodeObj = nodeArray[nI]
            if (nodeObj.name === selectItem.name) {
              existed = true
            }
          }
          return existed
        }
        function getTreeDSLObjByEditorId(treeDSLArray, editorId) {
          for (let i = 0; i < treeDSLArray.length; i++) {
            let treeDSLObj = treeDSLArray[i]
            if (treeDSLObj.editorId === editorId) {
              return treeDSLObj
            }
          }
        }
        //  找到在原始数据中的数据对象
        function findSelectedItem (selectedItem, nodeArray) {
          for (let i = 0; i < nodeArray.length; i++) {
            if (nodeArray[i].data.index === selectedItem.index) {
              return nodeArray[i].data
            }
          }
        }
        //  向原始数据中递归地增加DSL属性
        function recursiveAddDSLObj (realSelectedItem, dslObj) {
          // 如果传入的数据对象不是数组
          realSelectedItem.dsl = dslObj
          let children = realSelectedItem.children
          if (typeof (children) !== 'undefined') {
            for (let i = 0; i < children.length; i++) {
              recursiveAddDSLObj(children[i], dslObj)
            }
          }
        }
        //  修改原始数据中单独的DSL属性
        function singleAddDSLObj (realSelectedItem, dslObj) {
          // 如果传入的数据对象不是数组
          realSelectedItem.dsl = dslObj
        }
      },
      handleDropOver: function() {
        this.over = true
        $('.jsoneditor-selected').addClass('highlight')
        // $('.jsoneditor-selected').css('background-color', '#80cdc1')
      },
      handleDropLeave: function() {
        this.over = false
        $('.jsoneditor-selected').removeClass('highlight')
        // $('.jsoneditor-selected').css('background-color', '#d3d3d3')
      },
      //  确认当前设置的
      confirmDSL: function() {
        this.centerDialogVisible = false
        console.log('treeDSLArray', this.treeDSLArray)
        this.getLayoutParas.treeIndexWithDSL.default = this.treeDSLArray[0].content
      },
      //  将组织好的数据发送给服务器端
      sendDataToServer: function() {
        let treeIndexWithDSL = extractTreeIndexWithDSL(this.nodeArray)
        let treeDSLContentObj = extractDSLContentObject(this.treeDSLArray)
        //  传递的数据包含三个部分
        //  hierarchicalData - 原始的层次结构数据
        //  treeIndexWithDSL - treeNode的index与treeDSL的index的对应关系
        //  treeDSLContentObj - treeDSL的index索引treeDSL的content的对应关系
        let formData = {
          hierarchicalData: JSON.parse(JSON.stringify(this.originalHierarchicalDataObj)),
          treeIndexWithDSL: JSON.parse(JSON.stringify(treeIndexWithDSL)),
          treeDSLContentObj: JSON.parse(JSON.stringify(treeDSLContentObj))
        }
        //  已经指定了treeDSL的节点数量
        let treeItemNum = 0
        for (let item in treeIndexWithDSL) {
          treeItemNum = treeItemNum + 1
        }
        //  只有在所有的节点都指定了对应DSL的情况下才会发送给服务器端
        if (treeItemNum === this.nodeArray.length) {
          this.getLayouts(formData)
        } else {
          //  否则会弹出对话框提示当前的设定不符合要求
          this.popupWarningSetAllNodes()
        }
        //  提取传递的treeNodeIndex与dsl的对应文件
        function extractTreeIndexWithDSL (nodeArray) {
          let treeIndexWithDSL = {}
          for (let nI = 0; nI < nodeArray.length; nI++) {
            let treeData = nodeArray[nI].data
            //  不是所有的节点存在dsl对象，需要判断节点中是否存在dsl对象
            if (typeof(treeData.dsl) !== 'undefined') {
              let index = treeData.index
              treeIndexWithDSL[index] = treeData.dsl.editorId
            }            
          }
          return treeIndexWithDSL
        }
        //  提取传递的treeDsl的文件
        function extractDSLContentObject (treeDSLArray) {
          let dslContentObj = {}
          for (let tI = 0; tI < treeDSLArray.length; tI++) {
            let dslObj = treeDSLArray[tI]
            let editorId = dslObj.editorId
            let content = dslObj.content
            dslContentObj[editorId] = content
          }
          return dslContentObj
        }
      },
      //  使用mapMutation将数组中的mutation与其他的方法结合到一起
      ...mapMutations([
        'UPDATE_TREE_DSL_ARRAY_KEY'
      ]),
      //  使用mapMutation将数组中的action与其他的方法结合到一起      
      ...mapActions([
        'getLayouts'
      ])
    }
  }
</script>

<style lang="less" rel="stylesheet/less" scoped>
  #container {
    position: absolute;
    left: 2px;
    right: 2px;
    top: 2px;
    bottom: 2px;
    background: white;
    .dsl-container {
      width: 100%;
      height: 100%;
      background: white;
    }
  }
  .icon {
    &:hover {
      cursor: pointer;
    }
  }
  .over {
    border: 1px solid #ebebeb;  
  }
</style>
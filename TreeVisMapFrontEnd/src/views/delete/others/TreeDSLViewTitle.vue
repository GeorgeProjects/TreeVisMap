<template>
  <div class = "treeunit-container">
    <span class = "text">{{title}}</span>
    <span class = "operation">
      <span class = "operation-icon"
        v-if="uploadFunc">
        <el-upload class="upload-demo" 
        action="uploadDataUrl"
        :http-request="upload"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :auto-upload="true"
        :file-list = "fileList">
          <el-tooltip class='labelIcon' content="upload data" effect="light">
              <i class="icon iconfont icon-upload1"></i>
          </el-tooltip>
        </el-upload>
      </span>
      <span v-for="(labelIcon) in operation"
        class = "operation-icon"
        @click="click_handler(labelIcon)">
        <el-tooltip class='labelIcon' :content="labelIcon" effect="light">
            <span class="icon iconfont" :class="iconClass(labelIcon)"></span>
        </el-tooltip>
      </span>
    </span>
    <el-dialog
      title="Tips"
      :visible.sync="dialogVisible"
      width="30%">
      <span>{{dialogWarning}}</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
    <el-dialog title="Create New TreeDSL" :visible.sync="outerVisible">
      <el-tabs v-model="activeName" @tab-click="handleClick">
        <el-tab-pane :label="dslObj.dslName" :name="dslIndex" v-for="(dslObj, dslIndex) in treeDslOption">
          <div class = "tab-custom-form" v-if="dslObj.dslName !== 'CUSTOMIZE'">
            <JsonEditor 
              :editorId = "dslIndex"
              :editorBg = "DSLEditorBg"
              :editorSetting = "setting"
              :editorMode = "mode"
              :content = "dslObj.dslContent"
              :editorExpand = "true"
              :key="componentKey" /> 
          </div>
          <div class = "tab-custom-form" v-else>
            <el-form ref="form" :model="form" label-width="120px" >
              <el-form-item label="Node">
                <div class="item-container">
                  <el-radio-group v-model="form.Node">
                    <el-radio label="rect"></el-radio>
                    <el-radio label="circle"></el-radio>
                    <el-radio label="hidden"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>

              <el-form-item label="Link">
                <div class="item-container">
                  <el-radio-group v-model="form.Link">
                    <el-radio label="straight"></el-radio>
                    <el-radio label="orthogonal"></el-radio>
                    <el-radio label="curve"></el-radio>
                    <el-radio label="hidden"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>

              <el-form-item label="Layout">
                <div class="item-container">
                  <el-radio-group v-model="form.Layout">
                    <el-radio label="AxisIndependent"></el-radio>
                    <el-radio label="AxisDependent"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>

              <el-form-item label="Category" v-if="form.Layout === 'AxisDependent'">
                <div class="item-container">
                  <el-radio-group v-model="form.AxisDependent">
                    <el-radio label="SquarifyTreemap"></el-radio>
                    <el-radio label="VoronoiTreemap"></el-radio>
                    <el-radio label="ForceTree"></el-radio>
                    <el-radio label="Packing"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>

              <el-form-item label="Axis" v-if="form.Layout === 'AxisIndependent'">
                <div class="item-container">
                  <el-radio-group v-model="form.AxisIndependent">
                    <el-radio @click.native="selectAxis(1)" label="1"></el-radio>
                    <el-radio @click.native="selectAxis(2)" label="2"></el-radio>
                    <el-radio @click.native="selectAxis(3)" disabled label="3"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>

              <div v-if="form.Layout === 'AxisIndependent'" v-for="(axisObj, index) in form.AxisGroup">
                <el-row class="label-group" :gutter="20" justify="center">Axis-{{index}}</el-row>
                <el-form-item label="Root" >
                  <div class="item-container">
                    <el-radio-group v-model="axisObj.Root">
                      <el-radio label="include"></el-radio>
                      <el-radio label="juxtapose"></el-radio>
                      <el-radio label="included"></el-radio>
                    </el-radio-group>
                  </div>
                </el-form-item>
                <el-form-item label="Subtree" >
                  <div class="item-container">
                    <el-radio-group v-model="axisObj.Root">
                      <el-radio label="flatten"></el-radio>
                      <el-radio label="align"></el-radio>
                    </el-radio-group>
                  </div>
                </el-form-item>
              </div>

              <el-form-item label="CoordinateSystem">
                <div class="item-container">
                  <el-radio-group v-model="form.CoordinateSystem">
                    <el-radio label="cartesian"></el-radio>
                    <el-radio label="polar"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>
              <el-form-item label="LayoutMode">
                <div class="item-container">
                  <el-radio-group v-model="form.LayoutMode">
                    <el-radio label="top-down"></el-radio>
                    <el-radio label="bottom-up"></el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="outerVisible = false">Cancel</el-button>
        <el-button type="primary" @click="addDSL(activeName)">Add</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script> 
import { mapState, mapMutations, mapActions } from 'vuex';
import { JsonEditor } from '../components/JsonEditor'
import { getHierarchicalDSL } from '@/data-processing/get_hierarchical_dsl.js'

export default {
  name: 'TreeDSLViewTitle',
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
      hierarchicalDSLStr: "",
      format: "",
      //  标记customize类型的DSL的标注
      customizeLabel: "customize",
      outerVisible: false,
      //  当前选中的tab
      activeName: "ff",
      //  选中tab下方的json editor的config
      DSLEditorBg: "gray",
      setting: false,
      componentKey: 0,
      mode: 'view',
      dialogVisible: false,
      dialogWarning: "Please Set all node object in Data.",
      defaultTreeDSLContentObj: null,
      defaultMode: 'tree',
      form: {
        Name: '',
        Node: '',
        Link: '',
        Layout: '',
        NonLinear: '',
        CoordinateSystem: '',
        Axis: '',
        AxisGroup: [],
        LayoutMode: ''
      }
    }
  },
  components: {
    JsonEditor
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
      'treeDslOption',
      'treeDSLArray',
      'nodeArray',
      'originalHierarchicalDataObj',
      'selectionMode',
      'focusedDSLObj',
      'treeDSLObj',
      'hierarchicalData',
      'treeDSLArrayKey',
      'partitionDataObjDic'
    ])
  },  
  methods: {
    upload: function() {
      console.log('call upload')
    },
    handlePreview(file) {
      console.log(file);
    },
    beforeUpload: function(file) {
      var self = this
      var reader = new FileReader() //新建一个FileReader
      reader.readAsText(file, "UTF-8") //读取文件
      reader.onload = function(evt) { //读取完文件之后会回来这里
        let fileString = evt.target.result // 读取文件内容
        self.hierarchicalDSLStr = fileString
        self.fileSize = d3.format(".3s")(file.size)
        self.fileName = file.name
        self.update_hierarchical_data_object()
      }
    },
    //  更新数据文本框中的数据
    update_hierarchical_data_object: function() {
        let self = this
        var hierarchicalDSLObj = null
        try {
          hierarchicalDSLObj = JSON.parse(self.hierarchicalDSLStr)
        } catch(e) {
          return
        }
        self.UPDATE_HIERARCHICAL_DSL(hierarchicalDSLObj)       
    },    
    //  iconClass
    iconClass: function(label) {
      return "icon-" + label
    },
    //  清除所有选择的参数
    clearForm: function() {
      let form = this.form
      for (let item in form) {
        form[item] = ''
      }
      this.form = JSON.parse(JSON.stringify(form))
    },
    //  替换支持的操作
    click_handler: function (operation) {
      if (operation === 'add') {
        // 当点击增加DSL的按钮时，会增加新的DSL
        this.clearForm()
        this.outerVisible = true
      } else if (operation === 'reset') {
        //  删除当前层次结构数据中的DSL对象
        removeDSLObjfromItem(this.hierarchicalData)
        this.UPDATE_TREE_DSL_ARRAY_KEY(this.treeDSLArrayKey + 1)
      } else if (operation === 'run') {
        //  运行当前全部的DSL
        this.sendDataToServer()
      }
      //  删除当前层次结构数据中的DSL对象
      function removeDSLObjfromItem(hierarchicalData) {
        if (typeof(hierarchicalData.dsl) !== 'undefined') {
          delete hierarchicalData.dsl
        }
        if (typeof(hierarchicalData.children) !== 'undefined') {
          for (let i = 0;i < hierarchicalData.children.length;i++) {
            let childObj = hierarchicalData.children[i]
            removeDSLObjfromItem(childObj)
          }
        }
      }
    },
    //  点击tab的响应事件
    handleClick: function() {
      console.log('click tab', this.activeName)
    },
    onSubmit: function() {
      console.log('submit!');
    },
    //  选择axis
    selectAxis: function(axis) {
      let axisPara = {
        Relation: ''
      }
      this.form.AxisGroup = []
      for (let i = 0; i < axis; i++) {
        this.form.AxisGroup.push(JSON.parse(JSON.stringify(axisPara)))
      }
    },
    //  增加DSL对象
    addDSL: function(activeName) {
      // let activeName = this.activeName
      let dslContentObj = null
      let dslName = null
      if (activeName !== this.customizeLabel) {
        dslContentObj = this.treeDslOption[activeName].dslContent
        dslName = this.treeDslOption[activeName].dslName
      } else {
        //  在点击创建的时候，会自动生成一个DSL的id
        this.form.Name = 'newdsl-' + Math.round(Math.random() * 10000)
        dslContentObj = this.transformJsonObj(this.form)
      }
      //  将创建的DSL对象添加到Store中的treeDSLArray数组中
      //  随机生成DSL的id
      let treeDSLNum = Math.round(Math.random() * 10000000)
      // let dslName = dslContentObj.dslName
      if ((typeof(dslName) === 'undefined') || (dslName == null)) {
        dslName = 'NewDSL'
      }
      let dslObj = {
        dslName: dslName,
        editorId: "dsl-editor-" + treeDSLNum,
        expand: false,
        setting: true,
        editable: false,
        componentKey: 0,
        mode: this.defaultMode,
        content: dslContentObj,
        nodeArray: [] //  该DSL应用到的层次结构数据
      }
      this.treeDSLArray.push(dslObj)
      this.UPDATE_TREE_DSL_ARRAY(this.treeDSLArray)
      //  将DSL选项页面上的全部参数进行复原
      this.outerVisible = false
      this.activeName = 'first'
      //  获取customize对象的index数值
      // let dslObjIndex = this.getDSLObjIndex(this.customizeLabel)
      // console.log('dslObjIndex', dslObjIndex)
      // this.dslOption[dslObjIndex].dslContent = dslJsonObj
      // console.log()
      // console.log('dslObj', dslObj)
    },
    //  将form变成DSL JSON object的方法
    transformJsonObj: function() {
      let dslJsonObj = {}
      //  创建dsl对象的不同的参数的部分
      dslJsonObj.Element = {}
      dslJsonObj.Layout = {}
      dslJsonObj.CoordinateSystem = {}
      console.log('this.form', this.form)
      for (let item in this.form) {
        //  DSL对象的名称
        if (item === 'Name') {
          dslJsonObj[item] = this.form[item]
        }
        //  只有form中的元素非underined以及元素存在赋值的情况下才会继续
        if ((typeof(this.form[item]) !== 'undefined') && (this.form[item] !== '')) {
          //  DSL对象的视觉元素属性
          if ((item === 'Node') || (item === 'Link')) {
              dslJsonObj.Element[item] = this.form[item]
          }
          //  DSL对象的Layout属性
          if (item === 'Layout') {
            dslJsonObj.Layout['Category'] = this.form[item]
          }
          if (item === 'Mode') {
            dslJsonObj.Layout[item] = this.form[item]
          }
          if (item === 'AxisGroup') {
            dslJsonObj.Layout['AxisIndependent'] = {}
            if (this.form[item].length === 1) {
              dslJsonObj.Layout['AxisIndependent']['X'] = this.form[item][0]
            } else if (this.form[item].length === 2) {
              dslJsonObj.Layout['AxisIndependent']['X'] = this.form[item][0]
              dslJsonObj.Layout['AxisIndependent']['Y'] = this.form[item][1]
            }
          }
          if (item === 'NonLinear') {
            dslJsonObj.Layout[item] = this.form[item]
          }
          // DSL对象的坐标系属性
          if (item === 'CoordinateSystem') {
            dslJsonObj.CoordinateSystem['Category'] = this.form[item]
          }
        }
      }
      return dslJsonObj
    },
    //  获取DSL对象
    getDSLObjIndex: function(dslIndex) {
      for (let i = 0; i < this.treeDslOption.length; i++) {
        if (dslIndex === this.treeDslOption[i].dslIndex) {
          return i
        }
      }
    },
    //  将组织好的数据发送给服务器端
    sendDataToServer: function() {
      let self = this
      //  只是提取能够用到的DSL对象，其中一定包括的是default的DSL
      // let usedTreeDSLEditorArray = extractUsedDSLEditorArray(this.nodeArray, this.treeDSLArray)
      // console.log('usedTreeDSLEditorArray', usedTreeDSLEditorArray)
      //  提取使用到的treeDSL对象，包括default的DSL
      let focusedDSLObj = this.focusedDSLObj
      let treeIndexWithDSL = extractTreeIndexWithDSL(this.nodeArray, this.treeDSLArray, focusedDSLObj)
      let treeDSLContentObj = extractDSLContentObject(this.treeDSLArray)
      //  从treeDSLArray中提取默认的treeDSLArray
      // this.defaultTreeDSLContentObj = extractDefaultDSLContentObject(this.treeDSLArray)
      // console.log('defaultTreeDSLContentObj', this.defaultTreeDSLContentObj)
      let originalHierarchicalDataObj = JSON.parse(JSON.stringify(this.originalHierarchicalDataObj))
      //  传递的数据包含三个部分
      //  hierarchicalData - 原始的层次结构数据
      //  treeIndexWithDSL - treeNode的index与treeDSL的index的对应关系
      //  treeDSLContentObj - treeDSL的index索引treeDSL的content的对应关系
      let formData = {
        hierarchicalData: JSON.parse(JSON.stringify(this.originalHierarchicalDataObj)),
        treeIndexWithDSL: JSON.parse(JSON.stringify(treeIndexWithDSL)),
        treeDSLContentObj: JSON.parse(JSON.stringify(treeDSLContentObj)),
      }
      let hierarchicalDataIndex = formData.hierarchicalData.index
      // if (typeof(this.partitionDataObjDic[hierarchicalDataIndex]) === 'undefined') {
      //   this.partitionDataObjDic[hierarchicalDataIndex] = formData.hierarchicalData
      // }
      //  更新计算树布局的参数信息
      this.UPDATE_LAYOUT_PARAS(formData)
      if (focusedDSLObj != null) {
        //  依次请求更新的树的布局信息
        let partitionDataObjDic = this.partitionDataObjDic
        updateTreeLayoutInfo(formData, partitionDataObjDic)
      } else {
        this.dialogVisible = true
      }
      //  已经指定了treeDSL的节点数量
      // let treeItemNum = 0
      // for (let item in treeIndexWithDSL) {
      //   treeItemNum = treeItemNum + 1
      // }
      // console.log('formData', formData)
      // //  只有在所有的节点都指定了对应DSL的情况下才会发送给服务器端
      // if (treeItemNum === this.nodeArray.length) {
      //   
      // }
      //  更新树布局的函数
      function updateTreeLayoutInfo(formData, partitionDataObjDic) {
        let itemIndex = 0
        for (let item in partitionDataObjDic) {
          let hierarchicalData = JSON.parse(JSON.stringify(partitionDataObjDic[item]))
          itemIndex = itemIndex + 1
          innerUpdateTreeLayoutInfo(formData, hierarchicalData, itemIndex)
        }
      }
      //  内部调用的TreeLayout更新方法
      function innerUpdateTreeLayoutInfo(formData, hierarchicalData, itemIndex) {
        let Delay = 200
        setTimeout(function() { 
          formData.hierarchicalData = hierarchicalData
          self.getLayouts(formData)
        }, Delay * itemIndex)
      }
      //  提取在nodeArray中使用的全部的DSL数组
      function extractUsedDSLEditorArray (nodeArray, treeDSLArray) {
        let usedTreeDSLEditorArray = []
        for (let i = 0; i < nodeArray; i++) {
          let treeData = nodeArray[nI].data
          usedTreeDSLEditorArray.push(treeData.dsl.editorId)
        }
        //  
        let dslObj = this.focusedDSLObj
        let editorId = dslObj.editorId
        usedTreeDSLEditorArray.push(editorId)
        return usedTreeDSLEditorArray
      }
      //  提取传递的treeNodeIndex与dsl的对应文件
      function extractTreeIndexWithDSL (nodeArray, treeDSLArray, focusedDSLObj) {
        let treeIndexWithDSL = {}
        for (let nI = 0; nI < nodeArray.length; nI++) {
          let treeData = nodeArray[nI].data
          //  不是所有的节点存在dsl对象，需要判断节点中是否存在dsl对象
          if (typeof(treeData.dsl) !== 'undefined') {
            let index = treeData.index
            treeIndexWithDSL[index] = treeData.dsl.editorId
          }            
        }
        //  在其中增加default的DSL
        treeIndexWithDSL.default = focusedDSLObj.editorId
        return treeIndexWithDSL
      }
      //  提取传递的默认的treeDsl的文件
      function extractDefaultDSLContentObject(treeDSLArray) {
        let defaultDslContent = {}
        let dslObj = treeDSLArray[0]
        let editorId = dslObj.editorId
        let content = dslObj.content
        defaultDslContent = content
        return defaultDslContent
      }
      //  提取传递的treeDsl的文件
      function extractDSLContentObject (treeDSLArray) {
        let dslContentObj = {}
        for (let tI = 0; tI < treeDSLArray.length; tI++) {
          let dslObj = treeDSLArray[tI]
          let editorId = dslObj.editorId
          //  只有当该editorId被使用才会提取DSL内部的内容
          // if (treeDSLEditorArray.indexOf(editorId) !== -1) {
          let content = dslObj.content
          dslContentObj[editorId] = content
          // }
        }
        return dslContentObj
      }
    },
    //  弹出提示框关于用户需要设定全部的节点
    popupWarningSetAllNodes: function() {
      this.dialogWarning = "You did not specify the default dsl. Setted the default dsl as " 
        + this.treeDSLArray[0].dslName
      this.dialogVisible = true
    },
    //  使用mapMutation将数组中的mutation与其他的方法结合到一起
    ...mapMutations([
      'UPDATE_HIERARCHICAL_DSL',
      'UPDATE_TREE_DSL_OPTION',
      'UPDATE_TREE_DSL_ARRAY',
      'UPDATE_LAYOUT_PARAS',
      'UPDATE_TREE_DSL_ARRAY_KEY'
    ]),
    //  使用mapMutation将数组中的action与其他的方法结合到一起      
    ...mapActions([
      'getLayouts'
    ])
  }
}
</script>

<style scoped lang="less">
  .treeunit-container {
    display: flex; 
    width: 100%; 
    height: 100%; 
    margin: auto; 
    background: #f7f7f7;
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
       .operation-icon {
          padding: 0.2rem;
       }
    }
  }
  .operation-icon:hover {
    background: #ccc !important;
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
  .tab-custom-form {
    height: 20rem;
    min-width: 25rem;
    overflow-y: auto;
  }
  .label-group {
    font-size: 1rem;
    font-weight: bold;
    margin-top: 0rem;
  }
  .el-form-item {
    margin-bottom: 0px;
  }
  .el-checkbox-group, .el-radio-group {
    white-space: nowrap;
  }
  .item-container {
    overflow-x: auto;
  }
</style>

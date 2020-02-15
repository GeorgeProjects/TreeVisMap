<template>
    <div class="drawer-view">
      <div class="operation-choice el-col-5">
      <el-row class="tac">
        <el-col :span="24">
          <el-menu
            :key="componentKey"
            :default-active="activeIndex"
            class="el-menu-vertical-demo">
            <el-menu-item id="title" index="GoT">{{appName}}</el-menu-item>
             <el-submenu index="data" id="data-submenu">
              <template slot="title">
                <i class="icon iconfont icon-data"></i>
                <span>&nbsp;data</span>
              </template>
              <el-menu-item id="template" index="template" @click="selectPanel('template')">
                <!-- <i class="el-icon-minus"></i> -->
                template
              </el-menu-item>
              <el-menu-item id="random" index="random" @click="selectPanel('random')">
                <!-- <i class="el-icon-minus"></i> -->
                random
              </el-menu-item>
              <el-menu-item id="upload" index="upload" @click="selectPanel('upload')">
                <!-- <i class="el-icon-minus"></i> -->
                upload
              </el-menu-item>
            </el-submenu>
            <el-menu-item 
              v-for="operation in operationArray" 
              v-if="operation!=='data'" 
              @click="selectPanel(operation)" 
              :index="operation">
              <i class="icon iconfont" :class="iconClass(operation)"></i>&nbsp;{{operation}}
            </el-menu-item>
          </el-menu>
        </el-col>
      </el-row>
    </div>
    <div class="operation-content el-col-19">
        <el-col :offset="3" :span="18" v-show="selectionState==='random'">
          <h3>
            Random
          </h3>
          <el-form ref="form" :model="randomForm" label-width="200px">
            <el-form-item label="Maximum amount of Child">
              <el-input v-model="randomForm.maxChild"></el-input>
            </el-form-item>
            <el-form-item label="Depth">
              <el-input v-model="randomForm.maxDepth"></el-input>
            </el-form-item>
            <el-form-item label="Maximum value">
              <el-input v-model="randomForm.maxValue"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createTree">Create</el-button>
              <el-button>Cancel</el-button>
            </el-form-item>
          </el-form>
        </el-col> 
        <el-col :offset="2" :span="20" v-show="selectionState==='template'">
           <h3>
            Template
           </h3> 
           <el-table 
            v-if="selectionState==='template'"        
            ref="singleTable"
            highlight-current-row
            @row-dblclick="dataTableRowClick"
            :data="dataTable"
            border
            style="width: 100%"
            @current-change="handleDataSelectionChange">
            <el-table-column
              property="fileName"
              label="FileName"
              width="200">
            </el-table-column>
            <el-table-column
              property="nodeNum"
              label="NodeNum"
              width="150">
            </el-table-column>
            <el-table-column
              property="depth"
              label="Depth"
              show-overflow-tooltip>
            </el-table-column>
          </el-table>
          <!-- <el-row :gutter="20">
            <el-col :offset="9" :span="6"><el-button @click="confirmData()">Comfirm</el-button></el-col>
          </el-row>-->
          </el-col>  
        <el-col :offset="2" :span="20" v-show="selectionState==='upload'">
           <h3>
            Upload
           </h3> 
           <el-upload
            class="upload-demo"
            drag
            action="https://jsonplaceholder.typicode.com/posts/"
            :before-upload="beforeUpload"
            :on-success="handleSuccess"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :file-list="fileList"
            multiple>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
            <div class="el-upload__tip" slot="tip">json files with a size less than 500kb</div>
          </el-upload>
        </el-col> 
        <el-col :offset="2" :span="20" v-show="selectionState===treedslState">
          <h3>
            Tree declarative language
          </h3>
          <el-table 
            v-if="selectionState===treedslState"        
            ref="multipleTable"
            @row-dblclick="dslTableRowClick"
            :data="dslTable"
            border
            style="width: 100%"
            @selection-change="handleDSLSelectionChange">
            <el-table-column
              type="selection"
              width="55">
            </el-table-column>
            <el-table-column
              property="name"
              label="Name"
              width="120">
            </el-table-column>
            <el-table-column
              property="node"
              label="Node"
              width="120">
            </el-table-column>
            <el-table-column
              property="layout"
              label="Layout"
              show-overflow-tooltip>
            </el-table-column>
            <el-table-column
              property="coordinate"
              label="Coordinate"
              show-overflow-tooltip>
            </el-table-column>
          </el-table>
          <!-- <el-row :gutter="20">
            <el-col :offset="9" :span="6"><el-button @click="confirmData()">Comfirm</el-button></el-col>
          </el-row> -->
        </el-col> 
        <el-col :offset="3" :span="18" v-show="selectionState==='export'">
          <h3>
            Export
          </h3>
          <el-row :gutter="24" class="export-panel">
            <el-col :offset="2" :span="20">
              <el-card shadow="hover">
                <div size='mini' class='grid-content' type='text' @click='save_as_png'>
                  <span><i class='icon iconfont icon-png download-icon' slot='suffix'></i></span>
                  &nbsp;
                  <span class="grid-content-title">Export as PNG</span>
                  <br />
                  <br />
                  <span class="grid-content-main">
                    PNG is a bitmap image format which made up of a fixed number of pixels. They have a fixed resolution and cannot be scaled. 
                  </span>
                </div>
              </el-card>
            </el-col>
            <el-col :offset="2" :span="20">
              <el-card shadow="hover">
                <div size='mini' class='grid-content' type='text' @click='save_as_svg'>
                  <span><i class='icon iconfont icon-svg download-icon' slot='suffix'></i></span>
                  &nbsp;
                  <span class="grid-content-title">Export as SVG</span>
                  <br />
                  <br />
                  <span class="grid-content-main">
                    SVG is a vector image format which uses geometric forms to represent differet parts as discrete objects and are infinitely scalable. 
                  </span>
                </div>
              </el-card>
            </el-col>
            <el-col :offset="2" :span="20">
              <el-card shadow="hover">
                <div size='mini' class='grid-content' type='text' @click='save_as_json'>
                  <span><i class='icon iconfont icon-format1 download-icon' slot='suffix'></i></span>
                  &nbsp;
                  <span class="grid-content-title">Export as JSON</span>
                  <br />
                  <br />
                  <span class="grid-content-main">
                    JSON is a lightweight data-interchange format. This serves as the visualization template. 
                  </span>
                </div>
              </el-card>
            </el-col>
          </el-row>         
        </el-col>
        <el-col :offset="1" :span="21" 
          v-if="(selectionState===dataPreviewState)||(selectionState===dslPreviewState)">
          <h3> Preview </h3>
          <JsonEditor 
              :editorId = "editorId"
              :editorBg = "DSLEditorBg"
              :editorSetting = "setting"
              :editorMode = "mode"
              :content = "displayedHierarchicalData"
              :key="componentKey"/> 
          <el-row :gutter="20">
            <el-col :offset="9" :span="6"><el-button @click="goBack()">Back</el-button></el-col>
          </el-row>
        </el-col>    
    </div>
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
  </div>
</template>

<script>
  import Vue from 'vue'
  import iconfont from '../assets/font/iconfont'
  import { mapMutations, mapState } from 'vuex'
  import { JsonEditor } from '../components/JsonEditor'
  import { getHierarchicalData, getHierarchicalDataWithIndex, getNodeArray } from '@/data-processing/get_hierarchical_data.js'
  import saveSvgAsPng from 'save-svg-as-png'

  export default {
    name: 'DrawerView',
    data() {
      return {
        activeIndex: 'template',
        componentKey: 0,
        operationArray: ['data', 'treedsl', 'export'],
        previousSelectionState: null,
        selectionState: 'template',
        randomForm: {},
        fileList: [],
        dataTable: [{
          fileName: 'flare.json',
          nodeNum: 200,
          depth: 4
        }, {
          fileName: 'tmp30.json',
          nodeNum: 30,
          depth: 5
        }, {
          fileName: 'tmp50.json',
          nodeNum: 50,
          depth: 5
        }, {
          fileName: 'tmp80.json',
          nodeNum: 80,
          depth: 5
        }, {
          fileName: 'tmp150.json',
          nodeNum: 150,
          depth: 5
        }, {
          fileName: 'tmp200.json',
          nodeNum: 200,
          depth: 5
        }],
        dslTable: [],
        displayedHierarchicalData: {},
        editorId: 'data-preview',
        DSLEditorBg: "gray",
        setting: true,
        mode: 'code',
        dataPreviewState: 'data-preview',
        dslPreviewState: 'dsl-preview',
        treedslState: 'treedsl',
        uploadHierarchicalData: null,
        check: true,
        dialogVisible: false,
        dialogWarning: "",
        confirmHierarchicalDataTip: "You have selected the hierarchical data.",
        confirmDSLTip: "You have selected the Tree DSL data.",
        defaultMode: 'tree',
        //  选中的DSL对象
        multipleDSLSelection: [],
        //  选中的层次结构数据
        dataSelection: null
      }
    },
    props: {
    },
    components: {
      JsonEditor
    },
    beforeMount: function() {
      
    },
    mounted: function() {
      let self = this
      //  增加默认选择的数据
      setTimeout(function() { 
        self.dataSelection = self.dataTable[1]
        //  确认选中的层次结构数据
        self.confirmHierarchicalData()    
      }, 200)
    },
    watch: {
      hierarchicalDSL: function() {
      },
      drawerViewSelectionState: function() {
        let selectionState = this.drawerViewSelectionState
        //  更新当前选择的状态
        this.selectPanel(selectionState)
      },
      treeDslOption: function() {
        this.initDSLTable()
        this.multipleDSLSelection = this.dslTable
        //  在视图上选中multipleDSLSelection中的数据
        this.highlightDataSelection()    
        //  确认选中的DSL数据
        this.confirmDSLData()
      }
    },
    computed: {
      ...mapState([
        'currentTree',
        'hierarchicalDSL',
        'treeDslOption',
        'treeDSLArray',
        'partitionDataObjDic',
        'layoutParas',
        'nodeArray',
        'drawerViewSelectionState',
        'appName'
      ])
    }, 
    methods: {
      //  save the visualization results as svg
      save_as_svg: function() {
        console.log('save as svg')
      },
      //  save the visualization results as JSON format
      save_as_json: function() {
        console.log('layoutParas', this.layoutParas)
        console.log('nodeArray', nodeArray)
        let nodeArray = this.nodeArray
        let usedDefault = false
        let treeIndexWithDSL = this.layoutParas.treeIndexWithDSL
        let treeDSLContentObj = this.layoutParas.treeDSLContentObj
        // let treeIndexWithDSL = this.layoutParas.treeIndexWithDSL        
        //  判断是否全部的节点中都不存在dsl
        for (let i = 0; i < nodeArray.length; i++) {
          let nodeObj = nodeArray[i]
          if (typeof(nodeObj.data.dsl) === 'undefined') {
            usedDefault = true
            break
          }
        }
        let fileNamePrefix = this.appName + '-template'
        let treeDSLEditorArray = []
        console.log('treeIndexWithDSL', treeIndexWithDSL)
        for (let item in treeIndexWithDSL) {
          if (treeIndexWithDSL[item]  === 'default') {
            if (usedDefault) {
              if (treeDSLEditorArray.indexOf(treeIndexWithDSL[item]) === -1) {
                treeDSLEditorArray.push(treeIndexWithDSL[item])
              }
            }
          } else {
            if (treeDSLEditorArray.indexOf(treeIndexWithDSL[item]) === -1) {
              treeDSLEditorArray.push(treeIndexWithDSL[item])
            }
          }
        }
        console.log('treeDSLEditorArray', treeDSLEditorArray)
        for (var i = 0;i < treeDSLEditorArray.length;i++) {
          let dslEditorId = treeDSLEditorArray[i]
          let dslContent = treeDSLContentObj[dslEditorId]
          var fileName = fileNamePrefix + i
          if (i === 0) {
            fileName = fileNamePrefix
          }
          fileName = fileName + '.json'
          download(dslContent, fileName, 'text/json');
        }
        function download(content, fileName, contentType) {
            let contentStr = JSON.stringify(content)
            var a = document.createElement("a");
            var file = new Blob([contentStr], {type: contentType});
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
        }
      },
      //  save the visualization results as png
      save_as_png: function() {
        let imageName = this.appName + '-vis.png'
        // WARNING: 如果TreeCanvas里的treeCanvasSvgId改了，这里也要改
        let treeCanvasSvgId = 'tree-dsl-svg-canvas'
        let treeCanvasId = 'tree-dsl-canvas'
        let treeSvg = d3.select(document.getElementById(treeCanvasSvgId))
        let treeCanvasG = treeSvg.select('#' + treeCanvasId)
        // 暂时去除辅助线
        treeCanvasG.selectAll('.mark-line').attr('display', 'none')
        // 暂时去除最外围的方框，去除了好像不好看，注释掉了
        // treeCanvasG.selectAll('.canvas-region-outer').attr('display', 'none')
        // 暂时去除resize的circle
        treeCanvasG.select('.tree-g').selectAll('.resize-circle-g').attr('display', 'none')
        saveSvgAsPng.saveSvgAsPng(treeSvg.node(), imageName).then(function () {
          treeCanvasG.selectAll('.mark-line').attr('display', null)
          // treeCanvasG.selectAll('.canvas-region-outer').attr('display', null)
          treeCanvasG.select('.tree-g').selectAll('.resize-circle-g').attr('display', null)
        })
      },
      // ------ TEMP：RandomTree ------
      randomTreeRecursive: function(root, depth, maxDepth, maxValue, maxChildNum) {
        let self = this
        if (depth >= maxDepth) {
          root.value = Math.floor(Math.random() * (maxValue + 1))
          delete root.children
          return root
        } else {
          // 这里设定的是，如果没有到达MaxDepth，则节点至少有一个孩子
          let childNum = 1 + Math.floor(Math.random() * (maxChildNum))
          // 如果改成如下语句，则即使没有到达MaxDepth，节点也可能没有孩子
          // let childNum = Math.floor(Math.random() * (maxChildNum + 1))
          if (childNum == 0) {
            root.value = Math.floor(Math.random() * (maxValue + 1))
            delete root.children
            return root
          } else {
            for (let i = 0; i < childNum; i++) {
              let child = {
                'name': 'N' + (self.randomTreeId++),
                'children': []
              }
              root.children.push(self.randomTreeRecursive(child, depth + 1, maxDepth, maxValue, maxChildNum))
            }
            return root
          }
        }
      },
      getRandomTree: function(maxDepth, maxValue, maxChildNum) {
        let self = this
        self.randomTreeId = 0
        let root = {
          'name': 'N' + (self.randomTreeId++),
          'children': []
        }
        root = self.randomTreeRecursive(root, 1, maxDepth, maxValue, maxChildNum)
        return root
      },
      // ------ TEMP：RandomTree ------
      //  在sidebar上选择高亮的panel
      selectPanel(item) {
        this.previousSelectionState = this.selectionState
        this.drawerShow = true;
        if (item === 'data') {
          this.selectionState = 'template';
        } else {
          this.selectionState = item;
        }
        this.activeIndex = item
        if (item === this.treedslState) {
          if (this.dslTable.length === 0) {
            this.initDSLTable()
          }
          this.selectionState = this.treedslState;
        }
        //用户点击不同的item时，需要删除原始数据
        this.highlightDataSelection()
      },
      //  在代码中切换panel， 此时的切换不需要删除数据 不需要更新activeIndex
      changeState (item) {
        this.previousSelectionState = this.selectionState
        this.drawerShow = true;
        if (item === 'data') {
          this.selectionState = 'template';
        } else {
          this.selectionState = item;
        }
        if (item === this.treedslState) {
          if (this.dslTable.length === 0) {
            this.initDSLTable()
          }
          this.selectionState = this.treedslState;
        }
        this.highlightDataSelection()
      },
      //  高亮选中的数据
      highlightDataSelection () {
        let self = this
        // this.$refs.singleTable.setCurrentRow()
        setTimeout(function() { 
          if (self.selectionState === 'template') {
            self.$refs.singleTable.setCurrentRow(self.dataSelection);
          }
          if (self.selectionState === self.treedslState) {
            self.multipleDSLSelection.forEach(row => {
              self.$refs.multipleTable.toggleRowSelection(row);
            });
          }
          // this.$refs.message.innerText = '延迟2000ms修改h1元素的文本'; 
        }, 100);
      },
      iconClass(operation) {
        return  'icon-' + operation
      },
      //  预览上传的层次结构数据的回调函数
      handlePreview(file) {
        this.displayedHierarchicalData = this.uploadHierarchicalData
        this.changeState(this.dataPreviewState)
      },
      //  删除上传数据的回调函数
      handleRemove(file, fileList) {
        console.log('file', file)
        console.log('fileList', fileList)
      },
      //  上传数据成功的回调函数
      handleSuccess(response, file, fileList) {
        this.fileList.push(file)
      },
      //  点击表格中的一行
      dataTableRowClick(row, column, event) {
        let self = this
        let fileName = row.fileName
        let hierarchicalData = getHierarchicalData(fileName).then(function(data) {
          //  将数据视图展示的层次结构数据转换为选择的层次结构数据
          self.changeState(self.dataPreviewState)
          self.displayedHierarchicalData = data
        })
      },
      dslTableRowClick(row, column, event) {
        let item = row.item
        let treeDslOption = this.treeDslOption
        this.changeState(this.dataPreviewState)
        //  将数据视图展示的层次结构数据转换为当前的DSL
        this.displayedHierarchicalData = treeDslOption[item].dslContent
      },
      beforeUpload: function(file) {
        var self = this
        var reader = new FileReader() //新建一个FileReader
        reader.readAsText(file, "UTF-8") //读取文件
        reader.onload = function(evt) { 
          //  读取完文件之后会回来这里
          let fileString = evt.target.result // 读取文件内容
          self.fileSize = d3.format(".3s")(file.size)
          self.fileName = file.name
          self.uploadHierarchicalData = JSON.parse(fileString)
          //  更新系统当前的层次结构数据
          self.update_hierarchical_data_object(JSON.stringify(self.uploadHierarchicalData))
          self.dialogWarning = self.confirmHierarchicalDataTip
          self.dialogVisible = true
        }
      },
      uploadData () {
        console.log('uploadData')  
      },
      //  删除某一行
      addSelection (index, table) {
        console.log('index', index, 'table', table)
      },
      isChecked (index, table) {
        console.log('index', index, 'table', table)
      },
      //  创建层次结构数据
      createTree () {
        let randomForm = this.randomForm
        let maxValue = randomForm.maxValue
        let maxDepth = randomForm.maxDepth
        let maxChild = randomForm.maxChild
        let generatedTree = this.getRandomTree(maxDepth, maxValue, maxChild)
        this.update_hierarchical_data_object(JSON.stringify(generatedTree))
        this.displayedHierarchicalData = generatedTree
        this.changeState(this.dataPreviewState)
      },
      //  选择的item发生变化
      handleDSLSelectionChange (val) {
        this.multipleDSLSelection = val;
        // console.log('this.multipleDSLSelection', this.multipleDSLSelection)
        //  确认选中的数据
        this.confirmDSLData()
      },
      handleDataSelectionChange (val) {
        this.dataSelection = val
        // console.log('this.dataSelection', this.dataSelection)
        //  确认选中的数据        
        this.confirmHierarchicalData()
      },
      goBack() {
        if (this.selectionState === this.dataPreviewState) {
          console.log('this.previousSelectionState', this.previousSelectionState)
          this.selectionState = this.previousSelectionState
          // this.selectionState = 'template'
        } else if (this.selectionState === this.dslPreviewState) {
          //  点击确认之后再次回到treeDSL的视图
          this.selectionState = this.treedslState
        } 
      },
      // 确认选择的层次结构数据
      confirmHierarchicalData () {
        let self = this
        if (this.dataSelection != null) {
          let fileName = this.dataSelection.fileName
          //  确认传递的层次结构数据
          getHierarchicalData(fileName).then(function(data) {
            //  确认层次结构数据
            self.update_hierarchical_data_object(JSON.stringify(data))
            //  显示确认层次结构数据的提示
            // self.dialogWarning = self.confirmHierarchicalDataTip
            // self.dialogVisible = true
          })
        } else {
          self.dialogWarning = "please click to select the hierarchical data!"
          self.dialogVisible = true
        }
      },
      //  确认选择的DSL数据
      confirmDSLData() {
        let self = this
        //  确认树的描述性语言
        let multipleDSLSelection = this.multipleDSLSelection
        //  清空所有的DSL数组
        this.UPDATE_TREE_DSL_ARRAY([])
        if (multipleDSLSelection.length !== 0) {
          for (let i = 0; i < multipleDSLSelection.length; i++) {
            let selectedObj = multipleDSLSelection[i]
            this.addDSL(selectedObj.content, selectedObj.name)
          }
          //  显示确认树可视化形式DSL的提示
          // this.dialogWarning = this.confirmDSLTip
          // this.dialogVisible = true
        } else {
          self.dialogWarning = "please click to select the tree visualization dsl!"
          self.dialogVisible = true
        }
      },
    //  更新数据文本框中的数据
    update_hierarchical_data_object: function(hierarchicalDataStr) {
        let self = this
        var hierarchicalDataObj = null
        var originalHierarchicalDataObj = null
        var nodeArray = null
        var originalNodeArray = null
        try {
          hierarchicalDataObj = JSON.parse(hierarchicalDataStr)
          hierarchicalDataObj = getHierarchicalDataWithIndex(hierarchicalDataObj)
          nodeArray = getNodeArray(hierarchicalDataObj)
          //  保存另外的原始数据
          originalHierarchicalDataObj = JSON.parse(hierarchicalDataStr)
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
    addDSL: function(dslContentObj, dslName) {
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
    },
    initDSLTable: function() {
        let treeDslOption = this.treeDslOption
        for (let item in treeDslOption) {
          let dslName = item
          if (item !== 'customize') {
            let treeDSLObj = treeDslOption[item]
            let dslObj = {}
            dslObj.name = treeDSLObj.dslName
            let dslContentObj = treeDSLObj.dslContent
            let layoutObj = dslContentObj.Layout
            dslObj.coordinate = dslContentObj.CoordinateSystem
            dslObj.layout = layoutObj.Category
            dslObj.node = dslContentObj.Element.Node
            dslObj.item = item
            dslObj.content = dslContentObj
            this.dslTable.push(dslObj)
          }
        }
      },
      //  使用mapMutation将数组中的mutation与其他的方法结合到一起
      ...mapMutations([
        'UPDATE_HIERARCHICAL_DSL',
        'UPDATE_HIERARCHICAL_DATA',
        'UPDATE_TREE_DSL_ARRAY',
        'UPDATE_ORIGINAL_HIERARCHICAL_DATA',
        'UPDATE_NODE_ARRAY',
        'UPDATE_ORIGINAL_NODE_ARRAY',
        'UPDATE_PARTITION_DATA_OBJ_DIC',
        'UPDATA_SELECTION_STATE'
      ]),
    },
    props: {
      msg: String
    }
  }
</script>

<style lang="less">
  .drawer-view {
    .el-submenu__title {
      font-size: 1.1rem;
      font-weight: bold;
    }
  }
</style>

<style lang="less" scoped>
  .drawer-view {
    height: 100%;
    width: 100%;
    .operation-choice {
      height: 100%;
      box-shadow: 3px 0 5px rgba(0, 0, 0, 0.3);
      .el-submenu .el-menu-item {
        min-width: 0px;
      }
      #data-submenu {
        text-align: left;
      }
      .el-menu-item {
        font-size: 1.1rem;
        font-weight: bold;
      }
      .el-menu-item#template, .el-menu-item#random, .el-menu-item#upload {
        font-size: 1rem;
        font-weight: normal;
      }
      .el-menu-item#title {
        font-size: 1.2rem;
        font-weight: bold;
        color: steelblue;
        border-bottom: 0.08rem solid rgba(200, 200, 200, 0.1);
      }
      .el-submenu__title {
        font-size: 1.1rem;
        font-weight: bold;
      }
      .tac {
        width: 100%;
        height: 100%;
        .el-col {
          height: 100%;
          .el-menu {
            height: 100%;
            text-align: left;
          }
        }
      }
    }
    .download-icon {
      font-size: 1.3rem;
    }
    .grid-content {
      min-height: 7rem;
    }
    .grid-content-title {
      font-size: 1.3rem;      
    }
    .grid-content-main {
      font-size: 0.8rem;   
    }
    .operation-content {
      height: 100%;
      padding-top: 30px;
      overflow-y: auto;
      .el-table td {
        padding: 3px;
      }
      .el-row {
        margin-top: 20px !important;
      }
      .el-col {
        margin-bottom: 30px;
      }
    }
  }
</style>
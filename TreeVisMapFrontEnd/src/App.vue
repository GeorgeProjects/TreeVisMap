<template>
  <div id="app">
    <el-menu
        class="el-menu-demo"
        mode="horizontal"
        background-color="#676767"
        text-color="#fff"
        :key="componentKey"
        :default-active="activeIndex"
        active-text-color="#ffd04b">
        <el-menu-item class='labelIcon' id="title" index="title">
          {{appName}}
        </el-menu-item>
        <el-tooltip class='labelIcon' key="data" content="dataset dialog" effect="light">
          <el-menu-item @click="handleClickDataIcon" index="data">
            <i class="icon iconfont icon-data"></i>
          </el-menu-item>
        </el-tooltip>
        <el-tooltip class='labelIcon' key="treedsl" content="tree template dialog" effect="light">
          <el-menu-item @click="handleClickTemplateIcon" index="treedsl">
            <i class="icon iconfont icon-treedsl"></i>
          </el-menu-item>
        </el-tooltip>
        <el-tooltip class='labelIcon' key="export" content="export option dialog" effect="light">
          <el-menu-item @click="exportDialogVisible=true" index="export">
            <i class="icon iconfont icon-export"></i>
          </el-menu-item>
        </el-tooltip>
        <el-tooltip class='labelIcon' effect="light">
          <el-menu-item id="login-icon">
            <i class="icon iconfont icon-yonghu"></i>
            GoTree template Index: {{ dslNameIndex }}
          </el-menu-item>
        </el-tooltip>
    </el-menu>
    <!--main view-->
    <div class = "content-container"
        v-loading="loadingView">
        <div class = "content"
          v-if = "!loadingData">
          <div class = "left-panel">
            <div class = "left-top-panel">
              <DataView></DataView>
            </div>
            <div class = "left-bottom-panel">
              <TopologyView></TopologyView>
            </div>
          </div>
          <div class = "middle-panel">
            <QueryView></QueryView>
          </div>
          <div class = "right-panel">
            <div class = "bottom-panel">
              <div id = "tree-canvas-view-title">
                <TreeCanvasViewTitle
                  :title="treeCanvasParasTitle">
                </TreeCanvasViewTitle>
              </div>
              <div id = "tree-canvas-view-body">  
                <!-- <div id="original-data-view">
                  <OriginalDataView 
                    @openDataView="openDataView"
                    @closeDataView="closeDataView"/>
                </div> --> 
                <div id = "treecanvas-content-view">
                  <TreeCanvas :treeCanvasKey="treeCanvasKey"/>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    <!--data dialog-->
    <el-dialog title="Dataset" id="dataset-dialog" :visible.sync="dataDialogVisible">
      <DataDialog
        :initTreeDataName="initTreeDataName"
        :dataDialogKey="dataDialogKey"
        @updateSelectedTreeDateName="updateSelectedTreeDateName"
        @closeDataDialog="closeDataDialog">
      </DataDialog>
    </el-dialog>
    <!--tree dsl dialog-->
    <el-dialog title="Tree Template" id="treedsl-dialog" :visible.sync="treedslDialogVisible">
      <TreedslDialog 
        :treedslDialogUpdate="treedslDialogUpdate" 
        :updateCurrentTreeDSLIndex="updateCurrentTreeDSLIndex"/>
    </el-dialog>
    <!--export dialog-->
    <el-dialog title="Export" id="export-dialog" :destroy-on-close="true" :visible.sync="exportDialogVisible">
      <ExportDialog />
    </el-dialog>
  </div>
</template>

<script>
import TreeCanvas from './views/TreeCanvasView/TreeCanvas.vue'
import TreeCanvasViewTitle from './views/TreeCanvasView/TreeCanvasViewTitle.vue'
import OriginalDataView from './views/TreeCanvasView/OriginalDataView.vue'
import DataView from './views/Components/DataView.vue'
import TopologyView from './views/Components/TopologyView.vue'
import QueryView from './views/Query/QueryView.vue'
import DataDialog from './views/Dialog/DataDialog.vue'
import ExportDialog from './views/Dialog/ExportDialog.vue'
import TreedslDialog from './views/Dialog/TreedslDialog.vue'
import { getHierarchicalData } from '@/data-processing/get_hierarchical_data.js'
import { getLatestNCovData } from '@/data-processing/get_latest_ncov_data.js'
import { getHierarchicalDSL } from '@/data-processing/get_hierarchical_dsl.js'
import { getTreeDataInfo } from '@/data-processing/get_tree_data_info.js'
import { getTreeTemplate } from '@/data-processing/get_tree_template.js'
import { getLayoutValue } from '@/data-processing/get_layout_value.js'
import { getTreeLayout } from '@/data-processing/get_tree_layout.js'
import { getNodeLinkAttr } from '@/data-processing/get_node_link_attr.js'
import { getConfig } from '@/config/config.js'
import { Dataset } from '@/Dataset/dataset.js'
import { addDefaultCoordElement } from '@/data-processing/add_default_coord_element.js'
import { mapState, mapMutations, mapActions } from 'vuex'
import * as lscgSolver from 'lscg-solver'
import { queryDataset, queryTemplate, addTreeTemplate } from '@/communication/sendData.js'
import saveSvgAsPng from 'save-svg-as-png'

export default {
  name: 'app',
  components: {
    //  视图组件
    TreeCanvas, TreeCanvasViewTitle, OriginalDataView,
    //  提供三个不同功能的对话框的组件
    DataDialog, ExportDialog, TreedslDialog,
    DataView, TopologyView, QueryView
  },
  data() {
    return {
      appName: 'NaviTreeTor',
      treeCanvasParasTitle: 'Overview',
      initTreeDataName: null,
      treeTemplateObj: null,
      activeIndex: null,
      componentKey: 0,
      //  控制不同对话窗口的变量
      dataDialogVisible: false,
      treedslDialogVisible: false,
      exportDialogVisible: false,
      loading: true,
      loadingData: true,
      loadingView: true,
      OPEN_PREVIEW_PANEL_DURATION: 1000,
      treeCanvasKey: 0,
      systemUserName: 'root',
      userInfoDialogKey: 0,
      dataDialogKey: 0,
      treedslDialogUpdate: 1,
      dslNameIndex: 0,
      maxDslAmountIndex: 2
    }
  },
  created: function() {
      let self = this
  },
  beforeMount: function() {
    let self = this
    let maxDslAmountIndex = this.maxDslAmountIndex
    window.sysDatasetObj = new Dataset()
    let treeUnitDataDeferObj = $.Deferred(), treeDataDeferObj = $.Deferred(),
      treeDSLDeferObj = $.Deferred(), 
      // templateDeferObj = $.Deferred(),
      ncovAreaDisDeferObj = $.Deferred(), ncovAreaDeferObj = $.Deferred()
    // self.loading = false
    // self.loadingData = false
    // self.loadingView = false
    $.when(treeUnitDataDeferObj, treeDataDeferObj, treeDSLDeferObj).then(async() => {
        self.loading = false
        self.loadingData = false
        self.loadingView = false
        while (self.dslNameIndex < maxDslAmountIndex) {
          const i = await self.setTreeDSLContent_Render_Download(self.dslNameIndex);
          self.dslNameIndex = self.dslNameIndex + 1
        }
        console.log('this will print last');
      })
    //  加载TreeUnit的数据
    let treeUnitDateset = 'treeunit.json'
    getHierarchicalData(treeUnitDateset).then(function(hierarchicalData) {
        //  提取hierarchicalData中的数据属性
        sysDatasetObj.updateTreeUnitDataset(hierarchicalData)
        treeUnitDataDeferObj.resolve()
    })
    let initUserName = 'root'
    //  加载canvas的数据集
    let initTreeDataName = 'weibo_reposting.json'
    this.initTreeDataName = initTreeDataName
    getHierarchicalData(initTreeDataName).then(function(hierarchicalData) {
        //  提取hierarchicalData中的数据属性
        let treeDataInfo = getTreeDataInfo(hierarchicalData, initUserName, initTreeDataName)
        sysDatasetObj.addTreeDataset(treeDataInfo)
        self.updateSelectedHierarchicalData(initTreeDataName)
        treeDataDeferObj.resolve()
    })

    let fileNameArray = []
    for (let i = self.dslNameIndex; i < maxDslAmountIndex; i++) {
      fileNameArray.push(i + '')
    }
    let filePath = 'space_align_minus3/'
    getHierarchicalDSL(fileNameArray, filePath).then(function(treeDSLDataCollection) {
      let treeTemplateArray = []
      for (let item in treeDSLDataCollection) {
        treeTemplateArray.push({
          treename: item,
          username: initUserName,
          template: treeDSLDataCollection[item]
        })
      }
      //  提取hierarchicalData中的数据属性
      sysDatasetObj.addTreeTemplateArray(treeTemplateArray)
      sysDatasetObj.initSelectedDSLObject(fileNameArray)
      treeDSLDeferObj.resolve()
    })
  },
  mounted: function() {
    //  初始化线性求解器
    this.initializeLSCG()
  },
  computed: {
    ...mapState([
      'userInfoName',
      'treeViewUpdate',
      'currentTree',
      'treeDataViewFormat',
      'treeDslOption', 
      'previewTreeObj',
      'selectedDataset',
      'focusedTreeObjArray'
    ])
  },
  methods: {
    iconClass(operation) {
      return 'icon-' + operation
    },
    onShow() {
    },
    updateCurrentTreeDSLIndex: function(exampleName) {
      this.dslNameIndex = exampleName
      this.setTreeDSLContent_Render_Download(exampleName)
    },
    computeAllNodeTreeIndexWithDSL: function(nodeArrayWithValueObj, dslNameIndex) {
      let treeIndexWithDSL = {}
      for (let item in nodeArrayWithValueObj) {
        treeIndexWithDSL[item] = dslNameIndex
      }
      return treeIndexWithDSL
    },
    setTreeDSLContent_Render_Download: function(dslNameIndex) {
     return new Promise((res, rej) => {
        setTimeout(() => {
          let layoutParas = sysDatasetObj.getLayoutParas()
          let nodeArrayWithValueObj = sysDatasetObj.getNodeArrayWithValueObj()
          let treeIndexWithDSL = this.computeAllNodeTreeIndexWithDSL(nodeArrayWithValueObj, dslNameIndex)
          layoutParas.treeIndexWithDSL = treeIndexWithDSL
          layoutParas.treeDSLContentObj = this.getTreeDSLContentObj(treeIndexWithDSL)
          // setTimeout(function() {
            this.UPDATE_TREE_CANVAS_LAYOUT_STATE()
            this.computeAreaDataObj()
            res(dslNameIndex)
            // setTimeout(function() {
            //   self.save_as_png()
            // }, 100)
          // }, 3000)
        }, 1000);
     });
    },
    //  计算树可视化的对象所占据的区域
    computeAreaDataObj: function() {
      let layoutParas = sysDatasetObj.getLayoutParas()
      let nodeArray = sysDatasetObj.getNodeArray()
      let assignedAllNodesBoolean = assignedAllNodes(nodeArray, layoutParas.treeIndexWithDSL)
      if (assignedAllNodesBoolean) {
        getLayoutValue(layoutParas).then(function(treeLayout) {
          renderTreeVisResults(treeLayout)
        })
      }
      //  计算树可视化结果中的节点位置的布局
      function renderTreeVisResults (treelayout) {
        let nodeArray = sysDatasetObj.getNodeArray()
        let layoutParas = sysDatasetObj.getLayoutParas()
        let treeIndexWithDSL = layoutParas.treeIndexWithDSL
        let dslContentObject = layoutParas.treeDSLContentObj
        let treeViewPosLenObj = {
          x: 0, y: 0, width: 10, height: 10
        }
        let areaData = getTreeLayout(treeIndexWithDSL, dslContentObject, treelayout, nodeArray, treeViewPosLenObj)
        let dslContentObjectWithDefault = addDefaultCoordElement(dslContentObject)
        let [areaDataArray, linkDataArray] = getNodeLinkAttr(areaData, dslContentObjectWithDefault, treeIndexWithDSL, treeViewPosLenObj, nodeArray)
        console.log('areaDataArray', areaDataArray)
      }
      //  是否在DSL中指定了全部节点
      function assignedAllNodes(nodeArray, treeIndexWithDSL) {
        let nodeIndexArray = []
        for(let i = 0;i < nodeArray.length;i++) {
          nodeIndexArray.push(nodeArray[i].data.index)
        }
        let dslIndexArray = []
        for(let item in treeIndexWithDSL) {
          dslIndexArray.push(item)
        }
        if ((nodeIndexArray.length === dslIndexArray.length) 
            && (nodeIndexArray.length !== 0) && (dslIndexArray.length !== 0)) {
          return true
        }
        return false
      }
    },
    handleClickDataIcon: function() {
      this.dataDialogVisible = true
      this.dataDialogKey = (this.dataDialogKey + 1) % 2
    },
    handleClickTemplateIcon: function() {
      this.treedslDialogVisible = true
      this.treedslDialogUpdate = (this.treedslDialogUpdate + 1) % 2
    },
    promptMessage: function(type, message) {
      this.$message({
        type: type,
        message: message
      })
    },
    getTreeDSLContentObj: function(treeIndexWithDSL) {
      let treeDSLContentObj = {}
      for(let item in treeIndexWithDSL) {
       let dslName = treeIndexWithDSL[item]
       treeDSLContentObj[dslName] = sysDatasetObj.getTreeDSLObject(dslName)
      }
      return treeDSLContentObj
    },
    // closeDataView: function() {
    //   let self = this
    //   let duration = self.OPEN_PREVIEW_PANEL_DURATION
    //   let subtreePreviewPanelWidth = $('#original-data-view').width() 
    //   $('#treecanvas-content-view').animate({
    //       left: '-=' + subtreePreviewPanelWidth,
    //   }, duration, function () {
    //     self.treeCanvasKey = (self.treeCanvasKey + 1) % 2
    //   })
    // },
    // openDataView: function() {
    //   let self = this
    //   let duration = self.OPEN_PREVIEW_PANEL_DURATION
    //   let subtreePreviewPanelWidth = $('#original-data-view').width() 
    //   $('#treecanvas-content-view').animate({
    //       left: '+=' + subtreePreviewPanelWidth,
    //   }, duration, function () {
    //     self.treeCanvasKey = (self.treeCanvasKey + 1) % 2
    //   })
    // },
    //  更新选择的层次结构数据
    updateSelectedTreeDateName: function(selectedFileName) {
      let self = this
      self.updateSelectedHierarchicalData(selectedFileName)
    },
    //  更新数据对话框的可见性
    closeDataDialog: function() {
      this.dataDialogVisible = false
    },
    //  更新当前选择的层次结构数据
    updateSelectedHierarchicalData: function(selectedTreeDataName) {
      let self = this
      sysDatasetObj.updateDataset(selectedTreeDataName)
      let allTreeObjIdArray = sysDatasetObj.getAllTreeObjIdArray()
      let attrObjArray = sysDatasetObj.extractAttrArray()
      self.UPDATE_ATTR_OBJ_ARRAY(attrObjArray)
      self.UPDATE_FOCUS_TREE_OBJ_ARRAY(allTreeObjIdArray)
      self.UPDATE_SELECTED_DATASET(selectedTreeDataName)
      //  更新了层次结构数据之后需要对应地更新TreeIndexWithDsl对象
      self.updateLayoutParas()
      let layoutParas = sysDatasetObj.getLayoutParas()
      //  直接计算TreeCanvas的层次结构数据进行更新
      this.UPDATE_TREE_CANVAS_LAYOUT_STATE()
    },
    //  更新布局的参数
    updateLayoutParas: function() {
      let self = this
      let layoutParas = sysDatasetObj.getLayoutParas()
      let treeIndexWithDSL = layoutParas.treeIndexWithDSL
      let treeDSLContentObj = layoutParas.treeDSLContentObj
      if ((typeof(treeIndexWithDSL) !== 'undefined') && (typeof(treeDSLContentObj) !== 'undefined')) {
          let globalTreeDSL = treeIndexWithDSL['index-0']
          let allTreeObjIdArray = sysDatasetObj.getAllTreeObjIdArray()
          // 增加新的节点的treeDSL
          for (let i = 0;i < allTreeObjIdArray.length;i++) {
            let treeNodeIndex = allTreeObjIdArray[i]
            if (typeof(treeIndexWithDSL[treeNodeIndex]) === 'undefined') {
              treeIndexWithDSL[treeNodeIndex] = globalTreeDSL
            }
          }
          //  删除多余节点的TreeDSL
          for (let item in treeIndexWithDSL) {
            if (allTreeObjIdArray.indexOf(item) === -1) {
              // 当前的层次结构数据不存在这个节点
              delete treeIndexWithDSL[item]
            }
          }
      } 
    },
    computeTreeIndexWithDSL: function() {
      console.log('this.treeTemplateObj', this.treeTemplateObj)
      let templates = this.treeTemplateObj.templates
      let nodeArrayWithValueObj = sysDatasetObj.getNodeArrayWithValueObj()
      let treeIndexWithDSL = {}
      for (let i = 0;i < templates.length;i++) {
        let templateObj = templates[i]
        let queryObject = templateObj.query
        console.log('queryObject', queryObject, 'nodeArrayWithValueObj', nodeArrayWithValueObj)
        let nodeIdArray = this.getQueryNodeIdArray(queryObject, nodeArrayWithValueObj)
        console.log('nodeIdArray', nodeIdArray)
        let recursiveMode = templateObj.recursive
        let focusedTreeObjIdArray = this.getFocusedTreeObjIdArray(nodeIdArray, recursiveMode, nodeArrayWithValueObj)
        let dslname = templateObj.dslname
        for (let j = 0; j < focusedTreeObjIdArray.length; j++) {
          treeIndexWithDSL[focusedTreeObjIdArray[j]] = dslname
        }
      }
      return treeIndexWithDSL
    },
    //  获取节点的Id数组
    getQueryNodeIdArray: function (queryObject, nodeArrayWithValueObj) {
      let attribute = queryObject.attribute
      let criteria = queryObject.criteria
      let nodeIdArray = []
      switch (criteria) {
        case 'odd': {
          for (let item in nodeArrayWithValueObj) {
            if ((nodeArrayWithValueObj[item][attribute] % 2) === 1) {
              nodeIdArray.push(nodeArrayWithValueObj[item].index)
            }
          }
          break
        }
        case 'even': {
          for (let item in nodeArrayWithValueObj) {
            if ((nodeArrayWithValueObj[item][attribute] % 2) === 0) {
              nodeIdArray.push(nodeArrayWithValueObj[item].index)
            }
          }
          break
        }
        default: {
          for (let item in nodeArrayWithValueObj) {
            if (nodeArrayWithValueObj[item][attribute] === criteria) {
              nodeIdArray.push(nodeArrayWithValueObj[item].index)
            }
          }
          break
        }
      }
      return nodeIdArray
    },
    //  高亮选择的节点数组
    getFocusedTreeObjIdArray: function (nodeArray, assignRecursiveMode, nodeArrayObj) {
      let focusedTreeObjIdArray = []
      for (let i = 0;i < nodeArray.length;i++) {
        let nodeId = nodeArray[i]
        let selectedNodeArray = []
        // 根据是否递归的条件判断
        if ((assignRecursiveMode === 'true') || (assignRecursiveMode === true)) {
          selectedNodeArray = getDescendantNodeArray(nodeId)
        } else if ((assignRecursiveMode === 'false') || (assignRecursiveMode === false)) {
          selectedNodeArray = [nodeId]
        }
        for (let sI = 0; sI < selectedNodeArray.length; sI++) {
          if (focusedTreeObjIdArray.indexOf(selectedNodeArray[sI]) === -1) {
            focusedTreeObjIdArray.push(selectedNodeArray[sI])
          }
        }
      }
      return focusedTreeObjIdArray
      //  获取后代的节点
      function getDescendantNodeArray(lightupID) {
        var node = []
        var allNodeArray = [lightupID]
        while(lightupID !== undefined){
          if ('children' in nodeArrayObj[lightupID]) {
            for(let i=0;i<nodeArrayObj[lightupID].children.length;i++){
              let SonID = nodeArrayObj[lightupID].children[i].index
              node.push(SonID)
              allNodeArray.push(SonID)
            }
          }
          lightupID = node.shift()
        }
        return allNodeArray
      }
    },
    //  将画布上的树可视化保存为png
    save_as_png: function() {
        let imageName = this.getDownloadFileName()
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
    //  获取下载文件的名称
    getDownloadFileName: function() {
      let currentTreeDSLName = this.getCurrentDSLName()
      let datasetName = this.selectedDataset.replace('.json', '')
      return 'GoTree-' + datasetName + currentTreeDSLName
    },
    getCurrentDSLName: function() {
      let currentTreeDSLArray = []
      let layoutParas = sysDatasetObj.getLayoutParas()
      let focusedTreeObjArray = this.focusedTreeObjArray
      let treeIndexWithDSL = layoutParas.treeIndexWithDSL
      for(let item in treeIndexWithDSL) {
        //   确保是当前选中的节点
        if (focusedTreeObjArray.indexOf(item) !== -1) {
          let dslName = treeIndexWithDSL[item]
          if (currentTreeDSLArray.indexOf(dslName) === -1) {
                  currentTreeDSLArray.push(dslName)
              }
        }
      }
      let currentTreeDSLName = ''
      // 更新当前选择的DSL数组
      this.currentTreeDSLArray = currentTreeDSLArray
      for (let i = 0; i < currentTreeDSLArray.length; i++) {
        currentTreeDSLName = currentTreeDSLName + '-' + currentTreeDSLArray[i]
      }
      return currentTreeDSLName
    },
    initializeLSCG: async function(){
       await lscgSolver.initialize().then(() => {
       });
       window.lscgSolver = lscgSolver
    },
    //  使用mapMutation将数组中的mutation与其他的方法结合到一起
    ...mapMutations([
      'UPDATE_SELECTED_DATASET',
      'UPDATE_ATTR_OBJ_ARRAY',
      'UPDATE_FOCUS_TREE_OBJ_ARRAY',
      'UPDATE_TREE_CANVAS_LAYOUT_STATE'
    ])
  }
}
</script>
<style lang="less">
  .el-menu-item#login-icon {
    float: right;
  }
  .el-loading-mask {
    background-color: #ffffff;
    .el-loading-spinner {
      margin-top: -5%;
      .circular {
        width: 8%;
        height: 8%;
      }
    }
  }
    // 数据集的选择对话框
  #dataset-dialog {
    .el-dialog {
      width: 40%;
      .el-dialog__header {
        text-align: left;
      }
      .el-dialog__body {
        padding-top: 0px !important;
      }
    }
  }
  //  DSL的选择对话框
  #treedsl-dialog {
    .el-dialog {
      width: 80%;
      height: 70%;
      overflow-y: auto;
      .el-dialog__header {
        position: fixed;
        text-align: left;
        width: calc(~"80% - 40px");
        background-color: white;
        z-index: 100;
      }
      .el-dialog__body {
        padding-top: 54px !important;
      }
    }
  }
  //  export的对话框
  #export-dialog {
    .el-dialog {
      width: 40%;
      .el-dialog__header {
        text-align: left;
      }
      .el-dialog__body {
        padding-top: 0px !important;
      }
    }    
  }
</style>
<style scoped lang="less">
@left_panel-width: 200px;//300px;
@middle_panel-width: 200px;//320px;
@background: #ffffff;//#f7f7f7;
@right_panel_bottom-height: 0px;//150px;
@left_panel_top-height: 50%;
@left_panel_middle-height: 25%;
@left_panel_bottom-height: 21%;
@tree_canvas_view_title-height: 2rem;

#app {
  font-family: @font-family;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  position: absolute;
  top: 0%;
  left: 0%;
  bottom: 0%;
  right: 0%;
  overflow-y: hidden;
  @menu-height: 2.5rem;
  @border-style: 0.05rem solid rgba(180, 180, 180, 0.3);
  @title-border-style: 0.15rem solid rgba(255, 255, 255, 0.8);
  .iconfont {
    font-size: 1rem;
  }
  .el-menu.el-menu--horizontal {
    .el-menu-item {
      height: @menu-height;
      line-height: @menu-height;
    }
    .el-menu-item {
      border-bottom-color: rgb(84, 92, 100) !important;
      font-weight: bolder;
      font-size: 1rem;
      color: #dadada !important;
      padding: 0 10px;
      .icon {
        color: #dadada !important;
      }
    }
  }
  .layout {
    width: 800px;
    height: 100%;
    // background: #f7f7f7;
  }
  .title {
    margin-top: 1rem;
  }
  .content-container {
    position: absolute;
    top: @menu-height;
    left: 0%;
    bottom: 0%;
    right: 0%;
    .content{
      position: absolute;
      top: 0%;
      left: 0%;
      bottom: 0%;
      right: 0%;
      .left-panel {
        position: absolute;
        left: 0px;
        top: 0%;
        width: @left_panel-width;
        bottom: 0%;
        display: flex;
        background-color: @background;
        .left-top-panel {
          position: absolute;
          top: 0%;
          height: @left_panel_top-height;
          left: 0%;
          width: 100%;
          border-bottom: @border-style;
        }
        .left-bottom-panel {
          position: absolute;
          top: @left_panel_top-height;
          bottom: 0%;
          left: 0%;
          width: 100%;
        }
      }
      .middle-panel {
        position: absolute;
        top: 0%;
        left: @left_panel-width;
        width: @middle_panel-width;
        bottom: 0%;
        border-left: @border-style;
      }
      .right-panel {
          position: absolute;
          left: @left_panel-width + @middle_panel-width;
          top: 0%;
          right: 0%;
          bottom: 0%;
          border-left: @border-style;
          background-color: @background;
          .bottom-panel {
            position: absolute;
            top: @right_panel_bottom-height;
            height: calc(~"100% -" @right_panel_bottom-height);
            left: 0%;
            width: 100%;
            #tree-canvas-view-title {
              position: absolute;
              top: 0%;
              height: @tree_canvas_view_title-height;
              left: 0%;
              width: 100%;
              // border-bottom: @title-border-style;
            }
            #tree-canvas-view-body {
              position: absolute;
              width: 100%;
              left: 0%;
              top: @tree_canvas_view_title-height;
              bottom: 0%;
              overflow: auto;
              display: flex;
              background: #f2f2f2;
                #original-data-view {
                  position: absolute;
                  height: auto;
                  width: 20%;
                  top: 0%;
                  left: -20%;
                  bottom: 0%;
                  background-color: white;
                  border-top: solid 1px #E4E7ED;
                  border-right: solid 1px #E4E7ED;
                  border-radius: 0 0 0 0;
                  display: flex;
                  flex-direction: column;
                }
                #treecanvas-content-view {
                  position: absolute;
                  height: auto;
                  right: 0%;
                  top: 0%;
                  bottom: 0%;
                  left: 0%;
                }
            }
          }     
      }
    }
  }
}
</style>

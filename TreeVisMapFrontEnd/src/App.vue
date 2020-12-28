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
        <el-tooltip class='labelIcon' key="export" content="export option dialog" effect="light">
          <el-menu-item @click="exportDialogVisible=true" index="export">
            <i class="icon iconfont icon-export"></i>
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
                <TreeVisMapTitle
                  :title="treeVisMapViewTitle">
                </TreeVisMapTitle>
              </div>
              <div id = "tree-canvas-view-body">  
                <div id = "treecanvas-content-view" :class="{'hide': this.displayedPanel==='map'}">
                  <TreeCanvas :treeCanvasKey="treeCanvasKey" :sendSVGData="true"></TreeCanvas>
                </div>
                <div id = "treemap-content-view" :class="{'hide': this.displayedPanel==='canvas'}">
                  <TreeVisMap :maxDslAmountIndex="maxDslAmountIndex" />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    <!--data dialog-->
    <el-dialog title="Dataset" id="dataset-dialog" :visible.sync="dataDialogVisible">
      <DataDialog
        :dataDialogKey="dataDialogKey"
        @updateSelectedTreeDatasetName="updateSelectedTreeDatasetName"
        @closeDataDialog="closeDataDialog">
      </DataDialog>
    </el-dialog>
    <!--export dialog-->
    <el-dialog title="Export" id="export-dialog" :destroy-on-close="true" :visible.sync="exportDialogVisible">
      <ExportDialog />
    </el-dialog>
  </div>
</template>

<script>
import TreeVisMap from './views/TreeVisMapView/TreeVisMap.vue'
import TreeVisMapTitle from './views/TreeVisMapView/TreeVisMapTitle.vue'
import DataView from './views/Components/DataView.vue'
import TopologyView from './views/Components/TopologyView.vue'
import QueryView from './views/Components/QueryView.vue'
import DataDialog from './views/Dialog/DataDialog.vue'
import ExportDialog from './views/Dialog/ExportDialog.vue'
import TreedslDialog from './views/Dialog/TreedslDialog.vue'
import TreeCanvas from './views/TreeCanvasView/TreeCanvas.vue'
import { getHierarchicalData } from '@/data-processing/get_hierarchical_data.js'
import { getHierarchicalDSL } from '@/data-processing/get_hierarchical_dsl.js'
import { getTreeDataInfo } from '@/data-processing/get_tree_data_info.js'
import { getTreeTemplate } from '@/data-processing/get_tree_template.js'
import { getLayoutValue } from '@/data-processing/get_layout_value.js'
import { getTreeLayout } from '@/data-processing/get_tree_layout.js'
import { addDefaultCoordElement } from '@/data-processing/add_default_coord_element.js'
import { getNodeLinkAttr } from '@/data-processing/get_node_link_attr.js'
import { getConfig } from '@/config/config.js'
import { Dataset } from '@/Dataset/dataset.js'
import { mapState, mapMutations, mapActions } from 'vuex'
import * as lscgSolver from 'lscg-solver'
import { queryDataset, queryTemplate, addTreeTemplate } from '@/communication/sendData.js'
import saveSvgAsPng from 'save-svg-as-png'

export default {
  name: 'app',
  components: {
    DataDialog, ExportDialog, TreedslDialog,
    DataView, TopologyView, QueryView, 
    TreeVisMap, TreeVisMapTitle, TreeCanvas
  },
  data() {
    return {
      appName: 'NaviTreeTor',
      treeVisMapViewTitle: 'Overview',
      initTreeDataName: null,
      treeTemplateObj: null,
      activeIndex: null,
      componentKey: 0,
      dataDialogVisible: false,
      exportDialogVisible: false,
      loading: true,
      loadingData: true,
      loadingView: true,
      OPEN_PREVIEW_PANEL_DURATION: 1000,
      userInfoDialogKey: 0,
      dataDialogKey: 0,
      // treedslDialogUpdate: 1,
      dslNameIndex: 0,
      maxDslAmountIndex: 5, // TODO 200
      treeCanvasKey: 0
    }
  },
  watch: {
    displayedPanel: function() {
      // this.treeCanvasKey = (this.treeCanvasKey + 1) % 2
    }
  },
  created: function() {
      let self = this
  },
  beforeMount: function() {
    let self = this
    let maxDslAmountIndex = this.maxDslAmountIndex
    window.sysDatasetObj = new Dataset()
    let treeUnitDataDeferObj = $.Deferred(), treeDataDeferObj = $.Deferred()
    // after loading treeunit data, original hierarchical data, and tree declarative language,
    // start compute the layout of tree visualizations
    $.when(treeUnitDataDeferObj, treeDataDeferObj).then(async() => {
        self.loading = false
        self.loadingData = false
        self.loadingView = false
    })
    //  加载TreeUnit的数据
    let treeUnitDateset = 'treeunit.json'
    getHierarchicalData(treeUnitDateset).then(function(hierarchicalData) {
        //  提取hierarchicalData中的数据属性
        sysDatasetObj.updateTreeUnitDataset(hierarchicalData)
        treeUnitDataDeferObj.resolve()
    })
    let initUserName = 'root'
    let initTreeDataName = 'flare-vis.json'
    this.initTreeDataName = initTreeDataName
    getHierarchicalData(initTreeDataName).then(function(hierarchicalData) {
        //  提取hierarchicalData中的数据属性
        let treeDataInfo = getTreeDataInfo(hierarchicalData, initUserName, initTreeDataName)
        sysDatasetObj.addTreeDataset(treeDataInfo)
        self.updateSelectedHierarchicalData(initTreeDataName)
        treeDataDeferObj.resolve()
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
      'focusedTreeObjArray',
      'positionArray',
      'displayedPanel',
    ])
  },
  methods: {
    iconClass(operation) {
      return 'icon-' + operation
    },
    onShow() {},
    handleClickDataIcon: function() {
      this.dataDialogVisible = true
      this.dataDialogKey = (this.dataDialogKey + 1) % 2
    },
    promptMessage: function(type, message) {
      this.$message({
        type: type,
        message: message
      })
    },
    // integrate different declarative language objects into one treeDSLcontentObj
    getTreeDSLContentObj: function(treeIndexWithDSL) {
      let treeDSLContentObj = {}
      for(let item in treeIndexWithDSL) {
       let dslName = treeIndexWithDSL[item]
       treeDSLContentObj[dslName] = sysDatasetObj.getTreeDSLObject(dslName)
      }
      return treeDSLContentObj
    },
    //  update name of the selected dataset
    //  update the selected hierarchical dataset in this function
    updateSelectedTreeDatasetName: function(selectedFileName) {
      let self = this
      self.updateSelectedHierarchicalData(selectedFileName)
    },
    //  close the data dialog
    closeDataDialog: function() {
      this.dataDialogVisible = false
    },
    //  update the selected hierarchical dataset in this function
    updateSelectedHierarchicalData: function(selectedTreeDataName) {
      let self = this
      sysDatasetObj.updateDataset(selectedTreeDataName)
      let allTreeObjIdArray = sysDatasetObj.getAllTreeObjIdArray()
      let attrObjArray = sysDatasetObj.extractAttrArray()
      self.UPDATE_ATTR_OBJ_ARRAY(attrObjArray)
      self.UPDATE_FOCUS_TREE_OBJ_ARRAY(allTreeObjIdArray)
      self.UPDATE_SELECTED_DATASET(selectedTreeDataName)
      //  update TreeIndexWithDsl object correspondingly after updating hierarchical data 
      self.updateLayoutParas()
      let layoutParas = sysDatasetObj.getLayoutParas()
      // //  直接计算TreeCanvas的层次结构数据进行更新
      // this.UPDATE_TREE_CANVAS_LAYOUT_STATE()
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
            }
            #tree-canvas-view-body {
              position: absolute;
              width: 100%;
              left: 0%;
              top: @tree_canvas_view_title-height;
              bottom: 0%;
              overflow: hidden;
              display: flex;
              background: #f2f2f2;
              border-top: @border-style;
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
                  right: 0%;
                  top: 0%;
                  bottom: 0%;
                  left: 0%;
                  background-color: white;
                }
                #treemap-content-view {
                  position: absolute;
                  right: 0%;
                  top: 0%;
                  bottom: 0%;
                  left: 0%;
                  background-color: white;
                }
                .hide {
                  opacity: 0;
                }
            }
          }     
      }
    }
  }
}
</style>

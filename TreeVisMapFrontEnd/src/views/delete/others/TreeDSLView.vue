<template>
  <div id = "container">
    <div class = "dsl-container" 
         v-for="(dslObj, dslIndex) in treeDSLArray"
         :id="getDslContainerId(dslObj)">
        <div class = "editor-title" :key="treeDSLArrayKey">
          <el-row type="flex" class="row-bg" justify="space-between" align="middle">
            <el-col :span="2">
              <div class="grid-content">
                <span class="icon treedsl-icon" slot="openTreeNode" v-if="!dslObj.expand" 
                      @click.stop.prevent="opendsl(dslObj.editorId)">
                  <!-- <span class="icon iconfont icon-expand"></span> -->
                  <span class="icon iconfont icon-compress-triangle"></span>
                </span>
                <span class="icon treedsl-icon" slot="closeTreeNode" v-if="dslObj.expand" 
                      @click.stop.prevent="closedsl(dslObj.editorId)">
                  <!-- <span class="icon iconfont icon-compress"></span> -->
                  <span class="icon iconfont icon-xialasanjiao"></span>
                </span>
                <!--<span class="icon treedsl-icon" :class="{'active': dslObj.setting}" slot="treeSettings" 
                      @click.stop.prevent="updateSetting(dslObj.editorId)">
                  <span class="icon iconfont icon-setting"></span>
                </span> -->
                <!-- <span class="icon treedsl-icon" slot="treeSettings" 
                      @click.stop.prevent="resetdsl(dslObj.editorId)">
                  <span class="icon iconfont icon-reset"></span>
                </span> -->
                <!-- <span class="icon treedsl-icon" id="icon-remove" slot="closeTreeNode"
                      @click.stop.prevent="removedsl(dslObj.editorId)">
                  <span class="icon iconfont icon-shanchu"></span>
                </span> -->
              </div>
            </el-col>
            <el-col :offset="1" :span="10">
                <drag :transfer-data="{ dslName: hoveringDSLName, editorId: hoveringDSLEditorId}">
                <div class="grid-content title-text" v-if="!dslObj.editable" @dblclick="setEditable(dslObj)" 
                     @mouseover="mouseOver(dslObj)" @click="updateFocus(dslObj, dslIndex)">
                    {{dslObj.dslName}}
                </div>
                <input v-else class="vtl-input" type="text" ref="nodeInput" 
                    :value="dslObj.dslName" @input="updateName($event, dslObj)" @blur="setUnEditable(dslObj)">
                </drag>
            </el-col>
            <el-col :span="6">
              <div class="grid-content bg-purple">
              <span class="el-dropdown-link">
                  <!-- <el-badge size="small" class="mark" type="warning"  
                  :value=""/> -->
                  <span class="nodenum-span" v-if="getNodeObjArrayNum(dslObj)">{{getNodeObjArrayNum(dslObj)}}</span>
                  <span class="default-nodenum-span" v-if="getDefaultNodeObjArrayNum(dslObj)">{{getDefaultNodeObjArrayNum(dslObj)}}</span>
                  <!-- <el-badge size="small" class="default-mark" type="primary" v-if="getDefaultNodeObjArrayNum(dslObj)"
                  :value="getDefaultNodeObjArrayNum(dslObj)"/> -->
                  <!-- <i class="el-icon-caret-bottom el-icon--right"></i> -->
              </span>
              <!-- <el-dropdown trigger="hover" 
              v-if="(dslObj.nodeArray.length !== 0) && (getNodeObjArrayNum(dslObj, hierarchicalData)) !== 0">
                <span class="el-dropdown-link">
                  <el-badge size="small" class="mark" type="primary"
                  :value="getNodeObjArrayNum(dslObj, hierarchicalData)"/>
                  <i class="el-icon-caret-bottom el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item class="clearfix" 
                    v-for="treeObj in dslObj.nodeArray" 
                    v-if="getNodeObjArrayNum(dslObj, treeObj) !== 0">
                    {{treeObj.name}}
                    <el-badge size="small" type="primary" class="mark" 
                      :value="getNodeObjArrayNum(dslObj, treeObj)" />
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>-->
              </div>
            </el-col>
            <el-col :span="2">
              <div class="grid-content">
                <span class="icon treedsl-icon" id="icon-remove" slot="closeTreeNode"
                    @click.stop.prevent="removedsl(dslObj.editorId)">
                  <span class="icon iconfont icon-shanchu"></span>
                </span>
              </div>
            </el-col>
          </el-row>
        </div>
        <!-- -->        
        <div class = "editor-content">
          <JsonEditor
            :editorId = "dslObj.editorId"
            :editorBg = "DSLEditorBg"
            :editorSetting = "dslObj.setting"
            :editorMode = "dslObj.mode"
            :content = "dslObj.content"
            :autoCompleteOption = "autoCompleteOption"
            :editorExpand = "true"
            :treeDSLSchema = "treeDSLSchema"
            :jsonEditorHeight = "jsonEditorHeight"
            v-if="dslObj.expand" 
            :key="dslObj.componentKey"
            @updateMode="updateMode"
            @updateHierarchicalData = "updateHierarchicalData"
            @updateHoveringItem = "updateHoveringItem"/> 
        </div>
    </div>
  </div>  
</template>

<script>
  import Vue from 'vue'
  import iconfont from '../assets/font/iconfont'
  import { mapMutations, mapState } from 'vuex'
  import { JsonEditor } from '../components/JsonEditor'
  import { Drag, Drop } from 'vue-drag-drop';
  import { getDSLSchema } from '@/data-processing/get_dsl_schema.js'
  import { mapActions } from 'vuex'

  export default {
    name: 'TreeDSLView',
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
        DSLEditorBg: "steelblue",
        treeDSLSchema: {},
        editable: false,
        hoveringDSLName: "",
        hoveringDSLEditorId: "",

      }
    },
    components: {
      JsonEditor, Drag, Drop 
    },
    created: function() {},
    mounted: function() {
      var self = this
    },
    updated: function() {
      // let treeDslBodyHeight = $('.tree-dsl-body').height()
      // $('.editor-content').height(treeDslBodyHeight)
    },
    watch: {
      //  dsl的设计需要与实际的层次结构数据相结合，层次结构可视化形式的某些方面需要与数据中的某些属性值关联起来，
      //  因此就需要获取数据中的指定的属性值，从而保证赋值能够采用层次结构数据中的任意属性
      hierarchicalData: function() {
        let self = this
        //  重新获取schema
        getDSLSchema().then(function(data) {
          let itemArray = []
          self.treeDSLSchema = data
          console.log('self.treeDSLSchema', self.treeDSLSchema)
          for (let item in self.hierarchicalData) {
            if (item !== 'children') {
              itemArray.push(item)
            }
          }
          for (let i = 0; i < itemArray.length; i++) {
            let item  = itemArray[i]
            //  在当前的schema中增加数据中的属性值
            let ColorEnum = self.treeDSLSchema.properties.Element.properties.Color.enum
            let ThicknessEnum = self.treeDSLSchema.properties.Element.properties.LinkWidth.enum
            let RootWidthEnum = self.treeDSLSchema.properties.Element.properties.RootWidth.enum
            let RootHeightEnum = self.treeDSLSchema.properties.Element.properties.RootHeight.enum
            let SubtreeWidthEnum = self.treeDSLSchema.properties.Layout.properties.SubtreeWidth.enum
            let SubtreeHeightEnum = self.treeDSLSchema.properties.Layout.properties.SubtreeHeight.enum
            if (ColorEnum.indexOf(item) === -1) {
              ColorEnum.push(item)
            }
            if (ThicknessEnum.indexOf(item) === -1) {
              ThicknessEnum.push(item)
            }
            if (RootWidthEnum.indexOf(item) === -1) {
              RootWidthEnum.push(item)
            }
            if (RootHeightEnum.indexOf(item) === -1) {
              RootHeightEnum.push(item)
            }
            if (SubtreeWidthEnum.indexOf(item) === -1) {
              SubtreeWidthEnum.push(item)
            }
            if (SubtreeHeightEnum.indexOf(item) === -1) {
              SubtreeHeightEnum.push(item)
            }
          }
          self.UPDATE_TREE_DSL_ARRAY_KEY(self.treeDSLArrayKey + 1)
        })
      },
      hierarchicalDSL: function() {
        let dslName = 'ICICLE'
        // let dslTreeObj = this.parseDSL2Tree(this.hierarchicalDSL, dslName)
        // this.data = new Tree([dslTreeObj])
        console.log('this.data', this.hierarchicalDSL)
      },
      nodeArray: function() {},
      treeDSLViewFormat: function() {}
    },
    computed: {
      ...mapState([
        'hierarchicalData',
        'nodeArray',
        'hierarchicalDSL',
        'treeDSLViewFormat',
        'treeDSLArray',
        'treeDSLArrayKey',
        'focusedDSLObj',
        'focusedDSLObjIndex'
      ]),
      //  获取自动补全的数组
      autoCompleteOption: function() {
        let autoCompleteArray = []
        //  增加DSL对象中的属性值
        let attrNameArray = ["Element", "Node", "Link", "Color", "Width", "Height", 
                             "RootWidth", "RootHeight", 'Theta', "Center", 
                             "PolarAxis", "Direction", "PolarInnerRadius",
                             "Layout", "Category", "X", "Y", "Z", "Relation", 
                             "Padding", "Margin", "Position", "Sibling", "SortingOrder", 
                             "SortingCriteria", "Alignment", "SubtreeWidth", "SubtreeHeight",
                             "Mode", "AxisDependent"]
        let valueArray = ["rect", "circle", "ellipse", "hidden", 
                          "straight", "curveStepX", "orthogonal", "curveStepAfter",  
                          "curveStepBefore", "curve", "linkHorizontal", "arccurve", "arccurveBoth", "hidden",
                          "depth", "value", "adaptive", "AxisIndependent", "AxisDependent", 
                          "include", "juxtapose", "included", 
                          "left", "center", "right", "top", "bottom",
                          "flatten", "align", "asc", "desc",
                          "x-axis", "y-axis", "clockwise", "anticlockwise",
                          "Packing", "Force", "Voronoi", "Squarify",
                          "top-down", "bottom-up",
                          "polar", "cartesian", "root", "parent"]
        for (let i = 0; i < attrNameArray.length; i++) {
          autoCompleteArray.push(attrNameArray[i])
        }
        for (let j = 0; j < valueArray.length; j++) {
          autoCompleteArray.push(valueArray[j])
        }
        return autoCompleteArray
      }
    },  
    methods: {
      //  打开DSL的配置视图
      opendsl: function(editorId) {
        let dslObjIndex = this.findDSLObjIndex(editorId)
        this.treeDSLArray[dslObjIndex].expand = true
      },
      //  关闭DSL的配置视图
      closedsl: function(editorId) {
        let dslObjIndex = this.findDSLObjIndex(editorId)
        this.treeDSLArray[dslObjIndex].expand = false
      },
      //  删除dsl的配置视图
      removedsl: function(editorId) {
        let dslObjIndex = this.findDSLObjIndex(editorId)
        this.treeDSLArray.splice(dslObjIndex, 1)
      },
      //  清空该DSL对象的设置
      resetdsl: function(editorId) {
        let nodeArray = this.nodeArray
        removeDSLObjfromItem(editorId, nodeArray)
        this.UPDATE_TREE_DSL_ARRAY_KEY(this.treeDSLArrayKey + 1)
        function removeDSLObjfromItem(editorId, nodeArray) {
          for (let i = 0; i < nodeArray.length; i++) {
            let nodeObj = nodeArray[i].data
            if (typeof(nodeObj.dsl) !== 'undefined'){
              if (nodeObj.dsl.editorId === editorId) {
                delete nodeObj.dsl
              }
            }
          }
          // if (typeof(hierarchicalData.dsl) !== 'undefined') {
          //   if (hierarchicalData.dsl.editorId === editorId) {
          //     delete hierarchicalData.dsl
          //   }     
          // }
          // if (typeof(hierarchicalData.children) !== 'undefined') {
          //   for (let i = 0;i < hierarchicalData.children.length;i++) {
          //     let childObj = hierarchicalData.children[i]
          //     removeDSLObjfromItem(editorId, childObj)
          //   }
          // }
        }
      },
      updateSetting: function(editorId) {
        let dslObjIndex = this.findDSLObjIndex(editorId)
        // this.DSLDic[name].setting = !this.DSLDic[name].setting
        this.treeDSLArray[dslObjIndex].setting = !this.treeDSLArray[dslObjIndex].setting
        this.treeDSLArray[dslObjIndex].componentKey = this.treeDSLArray[dslObjIndex].componentKey + 1
      },
      //  根据名字name属性值索引对应的dsl对象
      findDSLObjIndex: function(editorId) {
        for (let i = 0;i < this.treeDSLArray.length;i++) {
          let dslObj = this.treeDSLArray[i]
          if (dslObj.editorId === editorId) {
            let dslObjIndex = i
            return dslObjIndex
          }
        }
      },
      updateMode: function(newModeObj) {
        let editorId = newModeObj.editorId
        let dslObjIndex = this.findDSLObjIndex(editorId)
        let dslObj = this.treeDSLArray[dslObjIndex]
        dslObj.mode = newModeObj.mode
      },
      updateName (e, dslObj) {
        var oldName = e.target._value
        var newName = e.target.value
        dslObj.dslName = newName
      },
      //  更新层次结构数据
      updateHierarchicalData: function(treeDSLContent, editorId) {
        this.updateTreeDSL({treeDSLContent: treeDSLContent, editorId: editorId})
        if (this.focusedDSLObj.editorId === editorId) {
          //  当前的编辑的是focued的节点， 那么需要及时更新treeUnit视图
          let focusedDSLObjIndex = this.focusedDSLObjIndex
          this.UPDATE_FOCUSED_DSL_OBJ_INDEX(focusedDSLObjIndex + 1)
        }
      },
      //  更新
      updateHoveringItem: function(hoveringDSLItem) {
        this.UPDATE_HOVERING_DSL_ITEM(hoveringDSLItem)
      },
      //  点击其他的地方的情况下的响应函数
      setUnEditable (dslObj) {
        dslObj.editable = false
      },
      //  设置点击的响应函数，将title设置为editable
      setEditable(dslObj) {
        dslObj.editable = true
      },
      //  找到对应的DSL对象
      findDSLObjIndexByName: function(name) {
        console.log('name', name, 'treeDSLArray', this.treeDSLArray)
        for (let tI = 0; tI < this.treeDSLArray.length; tI++) {
          if (this.treeDSLArray[tI].dslName === name) {
            return tI
          }
        }
      },
      // 鼠标悬停的响应事件
      mouseOver: function(dslObj) {
        this.hoveringDSLName = dslObj.dslName
        this.hoveringDSLEditorId = dslObj.editorId
      },
      getDefaultNodeObjArrayNum: function(dslObj) {
        let nodeSum = 0
        let dslName = dslObj.dslName
        let treeObj = this.hierarchicalData
        let focusedDSLObj = this.focusedDSLObj
        let nodeArray = this.nodeArray
        //  计算节点的数量
        // if (treeObj != null) {
        nodeSum = innerGetNodeObjArrayNum (dslName, nodeArray, nodeSum, focusedDSLObj)
        // }
        return nodeSum
        function innerGetNodeObjArrayNum (dslName, nodeArray, nodeSum, focusedDSLObj) {
          for (let i = 0; i < nodeArray.length; i++) {
            let nodeObj = nodeArray[i].data
            if (typeof(nodeObj.dsl) === 'undefined'){
              if (focusedDSLObj != null) {
                if (focusedDSLObj.dslName === dslName) {
                  nodeSum = nodeSum + 1
                }
              }
            }
          }
          return nodeSum
        }
        //  计算treeObj的下属全部节点中DSL为DSLName的数量
        // function innerGetNodeObjArrayNum (dslName, treeObj, nodeSum, focusedDSLObj) {
        //   if (typeof(treeObj.dsl) === 'undefined') {
        //     if (focusedDSLObj != null) {
        //       //  如果treeObj的DSL为undefined，那么说明当前的dslName为当前选择部分的dslName
        //       if (focusedDSLObj.dslName === dslName) {
        //         nodeSum = nodeSum + 1
        //       }
        //     }
        //   }
        //   let children = treeObj.children
        //   if (typeof(children) !== 'undefined') {
        //     for (let i = 0; i < children.length; i++) {
        //       nodeSum = innerGetNodeObjArrayNum(dslName, children[i], nodeSum, focusedDSLObj)
        //     }
        //   }
        //   return nodeSum
        // }
      },
      //  计算层次结构数据数组中的节点数量
      getNodeObjArrayNum: function(dslObj) {
        let nodeSum = 0
        let dslName = dslObj.dslName
        let treeObj = this.hierarchicalData
        let focusedDSLObj = this.focusedDSLObj
        let nodeArray = this.nodeArray
        //  计算节点的数量
        // if (treeObj != null) {
        nodeSum = innerGetNodeObjArrayNum (dslName, nodeArray, nodeSum, focusedDSLObj)
        // }
        return nodeSum

        function innerGetNodeObjArrayNum (dslName, nodeArray, nodeSum, focusedDSLObj) {
          for (let i = 0; i < nodeArray.length; i++) {
            let nodeObj = nodeArray[i].data
            if (typeof(nodeObj.dsl) !== 'undefined') {
              if (nodeObj.dsl.dslName === dslName) {
                nodeSum = nodeSum + 1
              }
            }
          }
          return nodeSum
        }
        //  计算treeObj的下属全部节点中DSL为DSLName的数量
        // function innerGetNodeObjArrayNum (dslName, treeObj, nodeSum, focusedDSLObj) {
        //   if (typeof(treeObj.dsl) !== 'undefined') {
        //     if (treeObj.dsl.dslName === dslName) {
        //       nodeSum = nodeSum + 1
        //     }
        //   }
        //   let children = treeObj.children
        //   if (typeof(children) !== 'undefined') {
        //     for (let i = 0; i < children.length; i++) {
        //       nodeSum = innerGetNodeObjArrayNum(dslName, children[i], nodeSum, focusedDSLObj)
        //     }
        //   }
        //   return nodeSum
        // }
      },
      //  计算层次结构数据中的节点数量
      getNodeObjNum: function(treeObj) {
        let initNum = 0
        let nodeNum = innerGetNodeNum(treeObj, initNum)
        return nodeNum
        function innerGetNodeNum(treeObj, num) {
          num = num + 1
          let children = treeObj.children
          if (typeof(children) !== 'undefined') {
            for(let i = 0; i < children.length; i++) {
              num = innerGetNodeNum(children[i], num)
            }
          }
          return num
        }
      },
      //  设定dslcontainer的focus的状态
      updateFocus: function(dslObj, dslIndex) {
        let editorContainerId = this.getDslContainerId(dslObj)
        if ($('.dsl-container#' + editorContainerId).hasClass('focus')) {
          // 删除focus的class
          $('.dsl-container#' + editorContainerId).removeClass('focus')
          this.UPDATE_FOCUSED_DSL_OBJ(null)
        } else {
          // 增加focus的class, 同时删除DSL container中的全部的focus的class
          $('.dsl-container').removeClass('focus')
          $('.dsl-container#' + editorContainerId).addClass('focus')
          this.UPDATE_FOCUSED_DSL_OBJ(dslObj)
        }
      },
      //  获取dsl container的id
      getDslContainerId: function(dslObj) {
        return dslObj.editorId + '-container'
      },
      //  使用mapMutation将数组中的action与其他的方法结合到一起      
      ...mapActions([
        'updateTreeDSL'
      ]),
      ...mapMutations([
        'UPDATE_HOVERING_DSL_ITEM',
        'UPDATE_FOCUSED_DSL_OBJ',
        'UPDATE_FOCUSED_DSL_OBJ_INDEX',
        'UPDATE_TREE_DSL_ARRAY_KEY'
      ])
    }
  }
</script>

<style lang="less" scoped>
  #container {
    position: absolute;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    background: #f2f2f2;
    .dsl-container {
      border: 0.5px #ccc solid; 
      border-radius: 0.3rem;
      background: white;
      &.focus{
        border: 0.1rem #238af8 solid; 
        // background: #ccc;
        // border: 1px black solid !important; 
        // box-shadow: 2px 2px 2px gray;
      }
      .editor-title {
        padding: 0.3rem;
        border-radius: 0.3rem;
        .title-text {
          cursor: pointer;
          text-align: left;
          font-size: 0.8rem;
        }
        &:hover {
          // background: #efefef !important;
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
        }
      }
      .editor-content {
        width: 100%;
        // overflow-y: auto;
      }
      .nodenum-span {
        color: #DAA520;
      }
      .default-nodenum-span {
        color: steelblue;
      }
      margin-bottom: 0.8rem;
    }
    .treedsl-icon {
      font-size: 0.8rem;
      -webkit-text-fill-color: black;
      .icon.iconfont {
        font-size: 0.8rem;
      }
      &:hover {
        -webkit-text-fill-color: steelblue !important;
      }
      &.active {
        -webkit-text-fill-color: steelblue !important;
      }
    }
    #icon-remove {
      -webkit-text-fill-color: #c30014 !important;
    }
  }
  .icon {
    &:hover {
      cursor: pointer;
    }
  }
</style>
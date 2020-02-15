<template>
  <div id="preview-figure-container">
    <el-carousel indicator-position="outside" :autoplay="false">
        <el-carousel-item v-for="(dslRow, index) in dslArrangement" :key="getPanelKey(index)" v-if="showPanel">
          <div class="treedsls" :style="DSLsStyleObject">
            <div class="single-treedsl" 
               v-for="dslItem in dslRow"
               :id="dslItem"
               :class="{ selected: (currentTreeDSLArray.indexOf(dslItem) != -1) }"
               :style="singleDSLStyleObject" 
               @click="updateHybridTreeVis(dslItem)">
              <SinglePreviewFigure
                :key="dslItem"
                :dslId="dslItem"
                :treeDSLObj="getTreeDSLObj(dslItem)">
                {{dslItem}}
              </SinglePreviewFigure>
            </div>
          </div>
        </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script>
  import SinglePreviewFigure from './SinglePreviewFigure.vue';
  import { Drag, Drop } from 'vue-drag-drop';
  import { mapState, mapMutations, mapActions } from 'vuex';

  export default {
  name: 'DSLList',
  components: {
    SinglePreviewFigure, Drag, Drop
  },
  props: {
  },
  data() {
    return {
      treeDSLNum: 5,
      dslArrangement: [],
      showPanel: false,
      singleDSLStyleObject: {},
      deleteButtonContainerStyleObj: {},
      infoButtonContainerStyleObj: {},
      buttonStyleObj: {},
      DSLsStyleObject: {},
      singleDSLHorizontalSpace: 0,
      currentTreeDSLArray: []
    }
  },
  watch: {
    selectedDSLArray: function() {
      // 更新选择的层次结构数据DSL
      this.updateDSLArrangement()
    },
    focusedTreeObjArray: function() {
      this.updateCurrentDSLArray()
    }
  },
  created: function () {
  },
  beforeMount: function() { 
  },
  mounted: function() {
    this.updateDSLArrangement()

    //  在获取DSL的排布之后，显示具体的DSL面板
    this.showPanel = true
  },
  computed: {
    ...mapState([
      // 全部需要展示的层次结构数据类型
        'selectedDSLArray',
        'focusedTreeObjArray',
        'previewTreeObj'
      ])
  },
  methods: {
    //  获取slide panel上的每一个panel的key值
    getPanelKey: function(index) {
      return 'row-' + index
    },
    //  获取TreeDSL对象
    getTreeDSLObj: function(dslItem) {
      let dslObj = sysDatasetObj.getSelectedDSLObject(dslItem)
      return dslObj
    },
    //  更新DSL Arrangement视图
    updateDSLArrangement: function() {
      this.initDSLNum()
      this.initDSLArrangement()
      this.setContainerPadding()
    },
    //  初始化当前的DSL
    updateCurrentDSLArray: function() {
      let self = this
      let currentTreeDSLArray = []
      let focusedTreeObjArray = this.focusedTreeObjArray
      let layoutParas = sysDatasetObj.getLayoutParas()
      let treeIndexWithDSL = layoutParas.treeIndexWithDSL
      for (let i = 0; i < focusedTreeObjArray.length; i++) {
        let treeObjIndex = focusedTreeObjArray[i]
        let dslItem = treeIndexWithDSL[treeObjIndex] 
        if (typeof(dslItem) === "undefined") {
          dslItem = treeIndexWithDSL.default
        }
        if (currentTreeDSLArray.indexOf(dslItem) === -1) {
          currentTreeDSLArray.push(dslItem)
        }
      }
      this.currentTreeDSLArray = currentTreeDSLArray
    },
    //  mounted之后需要计算每一行内能够容纳多少个treedsl, DSLContainer的高度是一个固定的数值, 需要按照DSLContainer的高度计算一个宽度值
    initDSLNum: function() {
      let treeDSLContainerHeight = $('#preview-figure-container').height()
      let treeDSLContainerWidth = $('#preview-figure-container').width()
      let marginTopBottom = 0.08
      let marginLeftRight = 0.1
      //  计算singleTreeDSL的高度以及纵向的margin
      let singleTreeDSLWidth = treeDSLContainerWidth * (1 - 2 * marginLeftRight)
      let singleTreeDSLMarginLeftRight = treeDSLContainerWidth * marginLeftRight
      //  计算singleTreeDSL的宽度以及横向的margin 
      let singleTreeDSLHeight = singleTreeDSLWidth / 0.877
      let singleTreeDSLMarginTopBottom = singleTreeDSLHeight * marginTopBottom
      this.singleDSLVerticalSpace = singleTreeDSLHeight + singleTreeDSLMarginTopBottom * 2
      //  计算可以支持横向排布多少个单个TreeDSL
      let treeDSLNum = treeDSLContainerHeight / this.singleDSLVerticalSpace
      if ((treeDSLNum % 1) > 0.9) {
        treeDSLNum = Math.round(treeDSLNum)
      }

      treeDSLNum = Math.floor(treeDSLNum)
      this.treeDSLNum = treeDSLNum
      this.singleDSLStyleObject = {
        height: singleTreeDSLHeight + 'px',
        width: singleTreeDSLWidth + 'px',
        marginLeft: singleTreeDSLMarginLeftRight + 'px',
        marginRight: singleTreeDSLMarginLeftRight + 'px',
        marginTop: singleTreeDSLMarginTopBottom + 'px',
        marginBottom: singleTreeDSLMarginTopBottom + 'px'
      }     
    },
    //  初始化对于DSL的排布
    initDSLArrangement: function() {
      let selectedDSLArray = this.selectedDSLArray
      let treeDSLNum = this.treeDSLNum
      let dslArrangement = []
      for (let i = 0; i < selectedDSLArray.length; i++) {
        if ((i % treeDSLNum) === 0) {
          dslArrangement.push([])
        }
        dslArrangement[dslArrangement.length - 1].push(selectedDSLArray[i])
      }
      this.dslArrangement = dslArrangement
    },
    //  设置DSL container的padding数值
    setContainerPadding: function() {
      let treeDSLContainerHeight = $('#treedsl-container').height()
      let treeDSLNum = this.treeDSLNum
      //  再次计算累加的DSL长度，计算左右的padding数值
      let wholeOccupySpace = this.singleDSLVerticalSpace * treeDSLNum
      //  如果所占据的宽度较小，那么设置左右的padding数值
      if (treeDSLContainerHeight > wholeOccupySpace) {
        let paddingTopBottom = (treeDSLContainerHeight - wholeOccupySpace) / 2
        this.DSLsStyleObject = {
          paddingTop: paddingTopBottom + 'px',
          paddingBottom: paddingTopBottom + 'px'
        }
      }
    },
    updateHybridTreeVis: function(dslItem) {
      let layoutParas = sysDatasetObj.getLayoutParas()
      //  设置复合的TreeDSLIndex对象
      this.setHybridTreeDSL(dslItem, layoutParas)
      //  更新当前选择的DSL数组
      this.updateCurrentDSLArray()
      this.getLayouts(layoutParas)   
    },
    setHybridTreeDSL: function(dslItem, layoutParas) {
      let focusedTreeObjArray = this.focusedTreeObjArray
      let treeIndexWithDSL = layoutParas.treeIndexWithDSL
      changeSingleDSLIndex(focusedTreeObjArray, treeIndexWithDSL, dslItem)
      //  更新DSLContent对象 
      layoutParas.treeDSLContentObj = getTreeDSLContentObj(treeIndexWithDSL)
      // 改变一个节点的DSL index
      function changeSingleDSLIndex(treeNodeObjArray, treeIndexWithDSL, dslItem) {
        for (let i = 0; i < treeNodeObjArray.length; i++) {
          let treeNodeObjIndex = treeNodeObjArray[i]
          treeIndexWithDSL[treeNodeObjIndex] = dslItem
        }
      }
      //  更新treeDSLContentObj对象
      function getTreeDSLContentObj(treeIndexWithDSL) {
        let treeDSLContentObj = {}
        for(let item in treeIndexWithDSL) {
          let dslName = treeIndexWithDSL[item]
          if (typeof(treeDSLContentObj[dslName]) === 'undefined') {
            treeDSLContentObj[dslName] = sysDatasetObj.getTreeDSLObject(dslName)
          }
        }
        return treeDSLContentObj
      }
    },
    //  计算属于默认的DSL的节点数量
    getDefaultNodeObjArrayNum: function(dslItem) {

    },
    //  计算属于hybrid类型的DSL的节点数量
    getHybridNodeObjArrayNum: function() {

    },
    ...mapActions([
        'getLayouts',
        'getTreeUnitLayouts'
      ])
  }
  }
</script>

<style lang="less">
  @slide-control_width: 3%;
  #preview-figure-container {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    width: 100%;
    height: 100%;
    .el-carousel {
      position: absolute;
      width: 100%;
      height: 100%;
      .el-carousel__container {
        position: absolute;
        height: 100%;
        width: 100%;
        .treedsls {
          position: absolute;
          left: 0px;
          top: 0%;
          right: 0px;
          height: 100%;
          display: flex;
          flex-direction: column;
          .single-treedsl {
            .el-button.is-circle {
              padding: 6px;
            }
            &:hover {
              box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
            }
          }
          .single-treedsl[class~=selected] {
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); 
          }
        }
      }
    }
    .el-carousel__item {
    }

    .el-carousel__arrow--left {
      left: 5px;
    }

    .el-carousel__arrow--right {
      right: 5px;
    }

    .el-carousel__indicators {
      position: absolute;
      width: 100%;
      left: 0%;
      bottom: 0%;
      .el-carousel__indicator {
        padding: 3px 4px;
      }
    }
  }
</style>
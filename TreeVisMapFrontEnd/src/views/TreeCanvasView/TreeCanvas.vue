<template>
  <div class='container' :id="treeCanvasContainerId">
    <svg :id="treeCanvasSvgIdCopy">
    </svg>
    <svg class='tree-canvas' :id="treeCanvasSvgId">
      <g :id="treeCanvasId"></g>
    </svg>
    <div id="NodeLabel"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */
/* jshint esversion: 8 */
/* eslint-disable no-undef */
import { mapState, mapMutations, mapActions } from 'vuex'
import { Cartesian } from '@/coordinatesystem/cartesian.js'
import { Polar } from '@/coordinatesystem/polar.js'
import { getTreeLayout } from '@/data-processing/get_tree_layout.js'
import { getLayoutValue } from '@/data-processing/get_layout_value.js'
import { getNodeLinkAttr } from '@/data-processing/get_node_link_attr.js'
import { extractTreeIndexWithDSL } from '@/data-processing/extract_tree_index_with_dsl.js'
import { tweenPaths } from 'svg-tween'
import { tween } from 'svg-tween'
import OriginalDataView from './OriginalDataView.vue'
// 计算visual element属性值的方法
import { getTreeNodeStyle } from '@/treevis-style/get_tree_node_style.js'
import { getTreeLinkStyle } from '@/treevis-style/get_tree_link_style.js'
import { addDefaultCoordElement } from '@/data-processing/add_default_coord_element.js'
// let parseSVG = require('svg-path-parser');

export default {
  name: 'TreeCanvas',
  props: {
    treeCanvasKey: {
      type: Number
    }
  },
  data() {
    return {
      nodeArray: [],
      hierarchicalData: {},
      layoutParas: {},
      //  用于绘制树可视化形式的svg的id
      treeCanvasSvgId: 'tree-dsl-svg-canvas',
      //  用于绘制树可视化形式的svg的拷贝
      treeCanvasSvgIdCopy: 'tree-dsl-svg-canvas-copy',
      //  用于绘制树可视化形式的svg外部的div的id
      treeCanvasContainerId: 'tree-dsl-canvas-container',
      //  用于绘制树可视化形式的svg内部的g的id
      treeCanvasId: 'tree-dsl-canvas',
      //  用于展示用户能够绘制的树的大小所增加的矩形的id
      treeCanvasRectId: 'canvas-region-outer-rect',
      //  进行动画变换的时长
      DURATION: 500,
      //  用户点击选择的子树对象
      selectedItem: null,
      //  用于控制子树中节点的位置以及长度的对象的集合
      posLenCollectionObj: {},
      //  用于表示切割的子树之间连线的集合
      regionOuterRectPos: {},
      //  在svg上增加的g的class
      singleTreeG: 'tree-g',
      //  发生动画变换的时长
      POSITION_DURATION: 400,
      // ===========================
      colorAttr: 'depth',
      treeViewPosLenObj: {},
      currentRootID: 'index-0',
      treeGId: 'index-0-g',
      previewPanelOpen: false, // 初始的preview视图处于关闭的状态
      hybridNodeObjectNum: 10,
      OPEN_PREVIEW_PANEL_DURATION: 250,
      horizontalArray: [0, 0.5, 1], //  横向的控制线的位置
      verticalArray: [0, 0.5, 1], //  纵向的控制线的位置
      treeViewWidth: 0, // 绘制层次结构数据视图的宽度
      treeViewHeight: 0, // 绘制层次结构数据视图的高度
      viewWidth: 0, //  视图的宽度
      viewHeight: 0, //  视图的高度
      layouts: {}, //计算得到的节点的布局
      areaDataArray: [],
      linkDataArray: []
    }
  },
  components: {
    OriginalDataView
  },
  created: function() {},
  mounted: function() {
    let self = this
    // setTimeout(function() {
      self.adjustTreeCanvas()
      self.addZoomFunc()
    // }, 100)
  },
  watch: {
    // 计算得到的树的布局会存储在state的layout参数中，如果数据发生变化，那么就会对应地调用方法并且更新
    treeCanvasKey: function() {
      this.adjustTreeCanvas()
      this.updateTreeVisResults()
    },
    assignRecursiveMode: function() {
      this.highlightFocusedTreeObjIdArray(this.previewTreeObj)
    },
    assignNodeQuery: function() {
      this.highlightFocusedTreeObjIdArray(this.previewTreeObj)
    },
    changedDSLNameState: function() {
      let layoutParas = sysDatasetObj.getLayoutParas()
      let dslContentObject = layoutParas.treeDSLContentObj
      if ((typeof(dslContentObject) !== 'undefined') && (this.treeUnitDSLName != null)) {
        if (typeof(dslContentObject[this.treeUnitDSLName]) !== 'undefined') {
          this.updateTreeVisResults()
        }        
      }
    },
    treeCanvasLayoutState: function() {
      this.updateTreeVisResults()
    },
    currentTreeDSLArray: function() {
      if (this.currentTreeDSLArray.length === 0) {
        //  清空treecanvas视图
        d3.select(this.$el)
          .selectAll('.link').remove()
        d3.select(this.$el)
          .selectAll('.lineartree-node').remove()
        d3.select(this.$el)
          .selectAll('.node-label').remove()        
      }
    }
  },
  computed: {
    ...mapState([
      'treeDSLArray',
      'assignRecursiveMode',
      'assignNodeQuery',
      'focusedTreeObjArray',
      'changedDSLNameState',
      'treeUnitDSLName',
      'treeCanvasLayoutState',
      'previewTreeObj',
      'currentTreeDSLArray'
    ])
  },  
  methods: {
    updateTreeVisResults: function() {
      let self = this
      let layoutParas = sysDatasetObj.getLayoutParas()
      let nodeArray = sysDatasetObj.getNodeArray()
      let assignedAllNodesBoolean = assignedAllNodes(nodeArray, layoutParas.treeIndexWithDSL)
      if (assignedAllNodesBoolean) {
        getLayoutValue(layoutParas).then(function(treeLayout) {
          self.layouts = treeLayout
          self.renderTreeVisResults(treeLayout)
        })
      } else {
        //  重置state中的layoutParas中treeIndexWithDSL变量
        let layoutParas = sysDatasetObj.getLayoutParas()
        layoutParas.treeIndexWithDSL = {}
        //  重置state中的currentTreeDSLArray变量
        let currentTreeDSLArray = sysDatasetObj.getCurrentTreeDSLArray(this.focusedTreeObjArray)
        self.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)
        //  清空所有绘制的部分
        d3.select('#' + this.treeGId)
          .selectAll('*')
          .remove()
      }
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
    //  根据当前参数渲染树可视化形式
    renderTreeVisResults: function(treelayout) {
      //  层次结构数据遍历得到的节点数组
      let nodeArray = sysDatasetObj.getNodeArray()
      this.nodeArray = nodeArray
      this.layoutParas = sysDatasetObj.getLayoutParas()
      this.hierarchicalData = this.layoutParas.hierarchicalData
      //  index为dsl的id，属性值为dsl的具体参数的对象
      let dslContentObject = this.layoutParas.treeDSLContentObj
      this.dslContentObject = dslContentObject
      //  treeIndexWithDSLWithDefault; index为节点id, 属性值为DSL的index; 增加default值表示如果未赋值的情况下则取default数值
      let treeIndexWithDSL = this.layoutParas.treeIndexWithDSL
      //  treeIndexWithDSL对象为index为节点的id，属性值为DSL的id
      this.treeIndexWithDSL = treeIndexWithDSL
      let treeViewPosLenObj = this.treeViewPosLenObj
      let currentRootID = this.currentRootID
      //  对treelayout进一步计算，得到各个结点在笛卡尔坐标系下的绝对坐标
      if ((typeof(treeIndexWithDSL) === 'undefined') || (typeof(dslContentObject) === 'undefined') 
          || (treelayout == null) || (typeof(treelayout) === 'undefined')) {
        return
      }
      this.AreaData = getTreeLayout(treeIndexWithDSL, dslContentObject, treelayout, nodeArray, treeViewPosLenObj)
      //  调整视图的位置
      this.appendTreeVisBoundingBox()
      //  获取所有的linear对象的link参数
      this.renderTree()
      //  调整层次结构可视化形式的位置
      this.adjustTreePos()
    },
    negativeExisted: function(areaData) {
      let self = this
      for (let item in areaData) {
        let RootHeight = areaData[item].RootHeight
        let RootWidth = areaData[item].RootWidth
        if ((RootWidth < 0) || (RootHeight < 0)) {
          return true
        }
      }
      return false
    },
    //  在svg上增加zoom的函数
    addZoomFunc: function() {
      let self = this
      let svgWidth = +$('#' + self.treeCanvasSvgId).width();
      let svgHeight = +$('#' + self.treeCanvasSvgId).height();
      var zoom = d3.zoom()
        .scaleExtent([0.1, 40])
        .translateExtent([[-100, -100], [svgWidth + 90, svgHeight + 100]])
        .on("zoom", zoomed);
      //  对于视图进行zoom
      function zoomed() {
        let treeCanvasRect = d3.select('#' + self.treeCanvasRectId)
        d3.select('#' + self.treeCanvasId).attr("transform", d3.event.transform);
      }
      d3.select('#' + self.treeCanvasSvgId).call(zoom);
    },
    //  调整层次结构可视化形式的位置
    adjustTreePos: function() {
      let currentRootGId = this.treeGId
      let treeViewPosLenObj = this.treeViewPosLenObj
      //  调整视图的位置
      d3.select('#' + currentRootGId)
        .transition()
        .duration(this.POSITION_DURATION)
        .attr('transform', 'translate(' + treeViewPosLenObj.x + ',' + treeViewPosLenObj.y + ')')
    }, 
    /**
     * 确定视图的大小以及视图内部中矩形的大小
     */
    adjustTreeCanvas: function() {
      let self = this
      //  在svg上增加背景矩形
      //  svg上的背景矩形的width与height的比例
      let widthHeightRatio = 0.668
      let miniPadding = 0.1
      this.viewWidth = $('#' + this.treeCanvasSvgId).width()
      this.viewHeight = $('#' + this.treeCanvasSvgId).height()
      let innerViewWidth = this.viewWidth * 0.88
      let innerViewHeight = this.viewHeight * 0.88
      if ((innerViewWidth * widthHeightRatio) >= innerViewHeight) {
        //  如果按照innerViewWidth计算的数值超过innerViewHeight，那么就按照innerViewHeight计算
        innerViewWidth = innerViewHeight / widthHeightRatio
      } else {
        //  否则就按照innerViewWidth进行计算
        innerViewHeight = innerViewWidth * widthHeightRatio
      }
      this.treeWidth = innerViewWidth
      this.treeHeight = innerViewHeight
      this.viewPaddingTop = (this.viewHeight - this.treeHeight) / 2
      this.viewPaddingLeft = (this.viewWidth - this.treeWidth) / 2      
      let canvasOuterPosLenObj = {
        x: this.viewPaddingLeft,
        y: this.viewPaddingTop,
        width: this.treeWidth,
        height: this.treeHeight
      }
      if (d3.select('#' + this.treeCanvasId).select('#' + this.treeCanvasRectId).empty()) {
        d3.select('#' + this.treeCanvasId)
          .append('rect')
          .attr('class', 'canvas-region-outer')
          .attr('id', this.treeCanvasRectId)
          .attr('x', canvasOuterPosLenObj.x)
          .attr('y', canvasOuterPosLenObj.y)
          .attr('width', canvasOuterPosLenObj.width)
          .attr('height', canvasOuterPosLenObj.height)
          .on('click', function() {
            //  关闭树可视化形式的preview视图
            self.removeControlHighlight()
          })
      } else {
          d3.select('#' + this.treeCanvasId)
            .select('#' + this.treeCanvasRectId)
            .attr('x', canvasOuterPosLenObj.x)
            .attr('y', canvasOuterPosLenObj.y)
            .attr('width', canvasOuterPosLenObj.width)
            .attr('height', canvasOuterPosLenObj.height)
      }
      //  计算内部的可视化形式的大小
      this.treeViewPaddingTop = this.treeHeight * 0
      this.treeViewPaddingBottom = this.treeHeight * 0
      this.treeViewPaddingLeft = this.treeWidth * 0
      this.treeViewPaddingRight = this.treeWidth * 0
      this.treeViewWidth = this.treeWidth - this.treeViewPaddingLeft - this.treeViewPaddingRight
      this.treeViewHeight = this.treeHeight - this.treeViewPaddingTop - this.treeViewPaddingBottom
      //  树可视化形式的boundingBox的位置以及长度的属性信息
      let treeViewPosLenObj = {
        x: this.treeViewPaddingLeft + this.viewPaddingLeft,
        y: this.treeViewPaddingTop + this.viewPaddingTop,
        width: this.treeViewWidth,
        height: this.treeViewHeight
      }
      this.treeViewPosLenObj = treeViewPosLenObj
      //  在canvas上增加树可视化形式的boundingBox的背景矩形
      self.appendTreeVisBoundingBox()
      //  在画布上增加guideline
      // this.renderGuideline(treeViewPosLenObj)
      //  在svg上增加绘制树可视化形式的g, 移动currentRootG的位置
      d3.select('#' + this.treeCanvasId).select('#' + this.treeGId).remove();
      d3.select('#' + this.treeCanvasId)
        .append('g')
        .attr('id', this.treeGId)
        .attr('class', this.singleTreeG)
        .attr('transform', 'translate(' + treeViewPosLenObj.x + ',' + treeViewPosLenObj.y + ')')
    },
    /**
     * 增加整个树可视化形式背后的背景
     */
    appendTreeVisBoundingBox: function() {
      let self = this
      let currentRootGId = this.treeGId
      //  获取修改数据之后的bounding box
      let treeViewPosLenObj = this.treeViewPosLenObj
      let paddingX = treeViewPosLenObj.width * 0
      let paddingY = treeViewPosLenObj.height * 0
      let currentRootBgId = currentRootGId.replace('-g', '') + '-bg'
      if (d3.select('#' + this.treeCanvasId)
              .select('#' + currentRootBgId)
              .empty()) {
          //  如果当前不存在背景的矩形，那么需要增加背景矩形
          //  拖拽放大缩小
          d3.select('#' + this.treeCanvasId)
            .append('rect')
            .attr('id', currentRootBgId)
            .attr('class', 'tree-vis-region-outer')
            .attr('x', treeViewPosLenObj.x - paddingX)
            .attr('y', treeViewPosLenObj.y - paddingY)
            .attr('width', (treeViewPosLenObj.width + paddingX * 2))
            .attr('height', (treeViewPosLenObj.height + paddingY * 2))
            .on('click', function() {
              // 删除当前选择的preview对象
              self.removePreviewObjectSelection()
              self.addControlHighlight()
              //  更新当前选中的DSL数组
              let currentTreeDSLArray = sysDatasetObj.getCurrentTreeDSLArray(self.focusedTreeObjArray)
              self.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)
            })
          self.appendResizeCircle(currentRootGId)
        } else {
          //  如果当前存在背景矩形，只需要修改大小即可
          d3.select('#' + this.treeCanvasId)
            .select('#' + currentRootBgId)
            .attr('x', treeViewPosLenObj.x - paddingX)
            .attr('y', treeViewPosLenObj.y - paddingY)
            .attr('width', (treeViewPosLenObj.width + paddingX * 2))
            .attr('height', (treeViewPosLenObj.height + paddingY * 2))
            self.repositionResizeCircle(currentRootGId)
        }
    },
    /**
     * 点击背景矩形之后，取消对于控制数可视化形式大小的矩形的高亮
     */
    removeControlHighlight: function() {
      let self = this
      d3.select('#' + this.treeCanvasId)
        .selectAll('.resize-circle-g')
        .classed('highlight', false)
      d3.select('#' + this.treeCanvasId)
        .selectAll('.tree-vis-region-outer')
        .classed('highlight', false)
    },
    /**
     * 点击背景矩形即将控制书可视化大小的控制点以及背景矩形显示出来
     */
    addControlHighlight: function() {
      let self = this
      d3.select('#' + self.treeCanvasId)
        .select('.resize-circle-g')
        .classed('highlight',true)
      d3.select('#' + self.treeCanvasId)
        .select('.tree-vis-region-outer')
        .classed('highlight',true)
    },
    /**
     * 绘制出现在视图上的guideline
     */
    renderGuideline: function(treeViewPosLenObj) {
      var self = this
      let treeViewPosLenObjX = treeViewPosLenObj.x
      let treeViewPosLenObjY = treeViewPosLenObj.y
      let treeViewPosLenObjWidth = treeViewPosLenObj.width
      let treeViewPosLenObjHeight = treeViewPosLenObj.height
      //  清空纵向直线
      d3.select('#' + this.treeCanvasId)
        .selectAll('.horizontal-mark-line')
        .remove()
      //  增加纵向直线
      d3.select('#' + this.treeCanvasId)
        .selectAll('.horizontal-mark-line')
        .data(this.horizontalArray)
        .enter()
        .append('line')
        .attr('class', 'horizontal-mark-line mark-line')
        .attr('x1', function(d, i) {
          return treeViewPosLenObjX + d * treeViewPosLenObjWidth
        })
        .attr('y1', function(d, i) {
          return -10000
        })
        .attr('x2', function(d, i) {
          return treeViewPosLenObjX + d * treeViewPosLenObjWidth
        })
        .attr('y2', function(d, i) {
          return +10000
        })
      //  清空纵向直线
      d3.select('#' + this.treeCanvasId)
        .selectAll('.vertical-mark-line')
        .remove()
      //  增加横向直线
      d3.select('#' + this.treeCanvasId)
        .selectAll('.vertical-mark-line')
        .data(this.verticalArray)
        .enter()
        .append('line')
        .attr('class', 'vertical-mark-line mark-line')
        .attr('x1', function(d, i) {
          return -10000
        })
        .attr('y1', function(d, i) {
          return treeViewPosLenObjY + d * treeViewPosLenObjHeight
        })
        .attr('x2', function(d, i) {
          return +10000
        })
        .attr('y2', function(d, i) {
          return treeViewPosLenObjY + d * treeViewPosLenObjHeight
        })
    },
    //  渲染节点之间的link
    renderTreeLink: function (linkDataArray) {
      let self = this
      let currentRootGId = self.treeGId
      //绘制link
      let linkElements = d3.select('#' + currentRootGId)
        .selectAll('.link')
        .data(linkDataArray.filter(function(d){
          return ((typeof(d.pathAttr) !== 'undefined') && (d.pathAttr.indexOf('NaN') === -1))
        }))
      //  增加视觉元素
      linkElements.enter()
        .append('path')
        .attr('id', function(d, i) {
          return 'link' + d.beginid + 'to' + d.endid
        })
        .attr('class', function(d, i) {
          return 'link' + ' link-parent-' + d.beginid + ' link-child-' + d.endid
        })
        .attr('d', function(d, i){
          return d.pathAttr
        })
        .attr('stroke-width', function(d, i) {
          return d.link_width
        })
        .attr('fill', 'none')
      //  对于节点采用动画变换的方式进行过渡
      let fromLinkArray = []
      let toLinkArray = []
      let linkPathArray = []
      //  对于节点之间的连线通过动画的方式进行过渡
      linkElements.each(function(d, i) {
        let currentPath = d3.select(this).attr("d")
        if ((currentPath != null) && (typeof(currentPath) !== 'undefined')) {
          fromLinkArray.push(currentPath)
        }
        let targetPath = d.pathAttr
        if ((targetPath != null) && (typeof(targetPath) !== 'undefined')) {
          toLinkArray.push(targetPath)              
        }
        linkPathArray.push(d3.select(this).node())
        //  除path形状之外的其他的style的动画过渡
        d3.select(this)
          .transition()
          .duration(self.DURATION)
          .attr('stroke-width', function (d, i) {
            return d.link_width
          })
          .attr('fill','none')
      })
      linkElements.exit().remove()
      //  节点之间连线的路径进行变形的动画
      let tweenLinkPathsCallback = function () {
        linkElements.each(function(d, i) {
          d3.select(this)
            .attr('d', d.pathAttr)
            .attr('stroke-width', function (d, i) {
              return d.link_width
            })
        })
      }
      //  判断fromLinkArray与toLinkArray中的对象是否是null
      if ((fromLinkArray.length > 0) && (toLinkArray.length > 0)) {
          if ((fromLinkArray.length === toLinkArray.length) && (fromLinkArray[0] != null) && (toLinkArray[0] != null) && 
              (typeof(fromLinkArray[0]) !== 'undefined') && (typeof(toLinkArray[0]) !== 'undefined')) {
          //  只有fromLinkArray与toLinkArray中的对象都不为null时，才会进行transition的动画
          tweenPaths({duration: self.DURATION, complete: tweenLinkPathsCallback, from: fromLinkArray, to: toLinkArray, next: (d, i) => linkPathArray[ i ].setAttribute('d', d)})
        } 
      } else {
        tweenLinkPathsCallback()
      }
    },
    //  重新增加
    appendTreeNode: function(areaDataArray) {
      let self = this
      let nodeArray = self.nodeArray
      let currentRootGId = self.treeGId
      let treelayout = this.layouts
      //  表示节点的视觉元素
      let treeNodeElementG = d3.select(this.$el)
        .select('#' + currentRootGId)
        .selectAll('.lineartree-node-g')
        .data(areaDataArray, function(d, i) {
          return d.id
        })
      //  创建视觉元素
      treeNodeElementG.enter()
        .append('g')
        .attr('class', 'lineartree-node-g')
        .attr('id',function(d,i) {
          return 'nodeg'+d.id
        })
        .append('path')
        .attr('class', 'lineartree-node')
        .attr('id',function(d,i) {
          return 'rootnode'+d.id
        })
        .attr('d', function(d, i) {
          return d.element
        })
        .on("mousemove", this.mousemove)
        .on("mouseover",this.mouseover)
        .on("mouseout",this.mouseout)
        .on("click", function(d, i) {
          let dataObj = JSON.parse(JSON.stringify(d.data))
          dataObj.fatherID = d.fatherID
          self.onclick(dataObj)
        })
        .attr('fill', function(d) {
          return d.node_color
        })
        .style('stroke-width', function(d) {
          return d.stroke_width
        })
        .style("opacity",1)
      //  增加节点的label
      d3.select(this.$el).select('#' + currentRootGId)
        .selectAll('.lineartree-node-g')
        .each(function(d, i) {
          //  只有当TreeNodeElementG中不存在node-label, 才会在G中增加文本，否则会造成重复
          if ((d3.select(this).select('.node-label').empty()) && (d.fontSize !== 0) && (d.labelValue !== "")) {
            d3.select(this)
              .append("defs")
              .append("path")
              .attr('class', 'label-curve')
              .attr("id", function(d) {
                return "curve-" + d.id
              })
              .attr("d", function(d) {
                return d.labelPath
              });
            d3.select(this)
              .append("text")
              .attr('class','node-label')
              .attr("id", function(d) {
                return "node-label-" + d.id 
              })
              .append("textPath")
              .attr("xlink:href", function(d, i) {
                return "#curve-" + d.id
              })
              .text(function(d, i) {
                return d.labelValue
              })
              .style('text-anchor', function(d) {
                return d.textAnchor
              })
              .attr('transform', function(d) {
                return 'translate(' + 0 + ',' + 0 + ')rotate(' + d.rotation +')' 
              })
              .style('font-size', function(d) {
                return d.fontSize
              })
              .attr('alignment-baseline', 'middle')
              .attr('startOffset', function(d, i) {
                return d.labelPathPos + '%'
              })
          }
        })
    },
    renderTreeNode: function(areaDataArray) {
      let self = this
      let nodeArray = self.nodeArray
      let currentRootGId = self.treeGId
      let treelayout = this.layouts
      //  表示节点的视觉元素
      let treeNodeElementG = d3.select(this.$el)
        .select('#' + currentRootGId)
        .selectAll('.lineartree-node-g')
        .data(areaDataArray, function(d, i) {
          return d.id
        })
      //  创建视觉元素
      treeNodeElementG.enter()
        .append('g')
        .attr('class', 'lineartree-node-g')
        .attr('id',function(d,i) {
          return 'nodeg'+d.id
        })
        .append('path')
        .attr('class', 'lineartree-node')
        .attr('id',function(d,i) {
          return 'rootnode'+d.id
        })
        .attr('d', function(d, i) {
          return d.element
        })
        .on("mousemove", this.mousemove)
        .on("mouseover",this.mouseover)
        .on("mouseout",this.mouseout)
        .on("click", function(d, i) {
          let dataObj = JSON.parse(JSON.stringify(d.data))
          dataObj.fatherID = d.fatherID
          self.onclick(dataObj)
        })
        .attr('fill', function(d) {
          return d.node_color
        })
        .style('stroke-width', function(d) {
          return d.stroke_width
        })
        .style("opacity",1)
      //  增加节点的label
      treeNodeElementG.each(function(d, i) {
        //  只有当TreeNodeElementG中不存在node-label, 才会在G中增加文本，否则会造成重复
        if ((d3.select(this).select('.node-label').empty()) && (d.fontSize !== 0) && (d.labelValue !== "")) {
          d3.select(this)
            .append("defs")
            .append("path")
            .attr('class', 'label-curve')
            .attr("id", function(d) {
              return "curve-" + d.id
            })
            .attr("d", function(d) {
              return d.labelPath
            });
          d3.select(this)
            .append("text")
            .attr('class','node-label')
            .attr("id", function(d) {
              return "node-label-" + d.id 
            })
            .append("textPath")
            .attr("xlink:href", function(d, i) {
              return "#curve-" + d.id
            })
            .text(function(d, i) {
              return d.labelValue
            })
            .style('text-anchor', function(d) {
              return d.textAnchor
            })
            .attr('transform', function(d) {
              return 'translate(' + 0 + ',' + 0 + ')rotate(' + d.rotation +')' 
            })
            .style('font-size', function(d) {
              return d.fontSize
            })
            .attr('alignment-baseline', 'middle')
            .attr('startOffset', function(d, i) {
              return d.labelPathPos + '%'
            })
        }
      })
      //  更新每一个treeNodeElementG里面的path
      let fromArray = []
      let toArray = []
      let pathArray = []
      treeNodeElementG.each(function(d, i) {
          let targetAnimationPath = d.element
          let currentAnimationPath = d3.select(this).select('.lineartree-node').attr("d")
          pathArray.push(d3.select(this).select('.lineartree-node').node())
          fromArray.push(currentAnimationPath)
          toArray.push(targetAnimationPath)
          //  除path之外的其他的style的动画过渡
          d3.select(this)
            .select('.lineartree-node')
            .transition()
            .duration(self.DURATION)
            .attr('fill', function (d) {
              return d.node_color
            })
            .style('stroke-width', function(d) {
              return d.stroke_width
            })
            .style("opacity",1)
          d3.select(this)
            .transition()
            .duration(self.DURATION)
            .select('.label-curve')
            .attr("d", function(d) {
              return d.labelPath
            });
          //  更新节点的标签
          d3.select(this)
            .select('.node-label')
            .select('textPath')
            .transition()
            .duration(self.DURATION)
            .attr("xlink:href", function(d, i) {
              return "#curve-" + d.id
            })
            .style('text-anchor', function(d) {
              return d.textAnchor
            })
            .style('font-size', function(d) {
              return d.fontSize
            })
            .text(function(d, i) {
              return d.labelValue
            })
            .attr('transform', function(d) {
              return 'translate(' + 0 + ',' + 0 + ')rotate(' + d.rotation +')' 
            })
            .attr('alignment-baseline', 'middle')
            .attr('startOffset', function(d, i) {
              return d.labelPathPos + '%'
            })
      })
      //  transition之后结束的方法
      let tweenPathsCallback = function () {
        treeNodeElementG.each(function(d, i) {
            let targetPath = d.element
            d3.select(this)
              .select('.lineartree-node')
              .attr('d', targetPath)
        })
        // 全部变化完成之后，删除全部的linearnode节点，重新绘制，保证节点是在最上方的 
        setTimeout(function() {
          d3.select('#' + currentRootGId).selectAll('.lineartree-node-g') .remove()
          // 先删除节点，然后增加节点
          self.appendTreeNode(areaDataArray)
          if ((typeof(self.previewTreeObj) !== 'undefined') && (self.previewTreeObj != null)) {
            self.highlightFocusedTreeObjIdArray(self.previewTreeObj)              
          }
        }, 200)        
      }
      if ((fromArray.length > 0) && (toArray.length > 0)) {
        if ((fromArray.length === toArray.length) && (fromArray[0] != null) && (toArray[0] != null) && 
              (typeof(fromArray[0]) !== 'undefined') && (typeof(toArray[0]) !== 'undefined')) {
          tweenPaths({duration: self.DURATION, complete: tweenPathsCallback, from: fromArray, to: toArray, next: (d, i) => pathArray[ i ].setAttribute('d', d)})
        }
      } else {
        tweenPathsCallback()
      }
      //  删除多余的视觉元素
      treeNodeElementG.exit().remove()
    },
    mousemove: function(d) {
      let treeViewPosLenObj = this.treeViewPosLenObj
      d3.select("#NodeLabel").style("visibility", "visible")
      d3.select("#NodeLabel").style("opacity", .9)
      let tooltipAttrArray = d.tooltip
      let offset = $('#tree-dsl-canvas-container').offset()
      if (tooltipAttrArray.length > 0) {
        d3.select("#NodeLabel").html(NodeLabelHtml(d, tooltipAttrArray))
          .style("left", (d3.event.pageX - offset.left) + "px")
          .style("top", (d3.event.pageY - offset.top) + "px")
        d3.select("#NodeLabel").style("visibility", "visible")
      } else {
        d3.select("#NodeLabel").style("visibility", "hidden")
      }
      // d3.select("#NodeLabel").style("left", (d3.event.pageX) + "px")
      //   .style("top", (d3.event.pageY - 28) + "px")
      //  hover显示label中的文字排版
      function NodeLabelHtml(d, tooltipAttrArray) {
        let innerContent = '<h4>'
        for (let i = 0; i < tooltipAttrArray.length; i++) {
          if (i === (tooltipAttrArray.length - 1)) {
            innerContent = innerContent + tooltipAttrArray[i] + ': ' + d[tooltipAttrArray[i]]
          } else {
            innerContent = innerContent + tooltipAttrArray[i] + ': ' + d[tooltipAttrArray[i]] + "<br/>"
          }
        }
        innerContent = innerContent + "</h4>"
        return innerContent
      }
    },
    mouseover: function(d) {
    },
    //  鼠标移开的事件
    mouseout: function (d) {
      d3.select("#NodeLabel").style("visibility", "hidden")
    },
    //  获取单个节点，兄弟节点，或者同层节点的数组
    getSelectedTreeUnitRootIdArray: function(selectId) {
      let AreaData = this.AreaData
      let treelayout = this.layouts
      let viewSelectionMode = this.viewSelectionMode
      let assignNodeQuery = this.assignNodeQuery
      let selectedTreeUnitRootIdArray = []
      let assignNodeAttr = this.previewTreeObj[assignNodeQuery]
      for (let i = 0;i < this.areaDataArray.length;i++) {
        if (assignNodeQuery === 'fatherID') {
          if (this.areaDataArray[i][assignNodeQuery] === assignNodeAttr) {
            selectedTreeUnitRootIdArray.push(this.areaDataArray[i]['data'].index)
          }
        } else {
          if (this.areaDataArray[i]['data'][assignNodeQuery] === assignNodeAttr) {
            selectedTreeUnitRootIdArray.push(this.areaDataArray[i]['data'].index)
          }
        }
      }
      return selectedTreeUnitRootIdArray   
      // if (viewSelectionMode === 'SingleNode') {
      //   let singleNodeArray = [ selectId ]
      //   return singleNodeArray     
      // } else if (viewSelectionMode === 'Sibling') {
      //   let siblingNodeArray = getSiblingNodeArray(selectId)
      //   return siblingNodeArray
      // } else if (viewSelectionMode === 'SameDepth') {
      //   let sameDepthNodeArray = getSameDepthNodeArray(selectId)
      //   return sameDepthNodeArray
      // }  
      //  获取兄弟节点
      function getSiblingNodeArray(selectId) {
        var nodeArray = []
        var sfatherid = AreaData[selectId].fatherID
        if (sfatherid != null) {
          for(let i=0;i<treelayout[sfatherid].subtreeLayout.length;i++){
            let siblingNodeId = treelayout[sfatherid].subtreeLayout[i].id
            nodeArray.push(siblingNodeId)
          }
        } else {
          nodeArray.push(selectId)
        }
        return nodeArray
      }
      //  获取同层的节点
      function getSameDepthNodeArray(selectid) {
         var nodeArray = []
         var selectObj = AreaData[selectId]
         for (let item in AreaData) {
            let areaDataObj = AreaData[item]
            if (areaDataObj.depth === selectObj.depth) {
              nodeArray.push(areaDataObj.id)
            }
         }
         return nodeArray
      }      
    },
    // d3.select('#'+this.treeCanvasId)
    //     .selectAll('.lineartree-node')
    //     .classed('clickunhighlight',false)
    //     .classed('clickhighlight',false)
    //     .classed('select-root-node', false)
    //   //  将所有的节点变暗
    //   d3.select('#'+this.treeCanvasId)
    //     .selectAll('.lineartree-node')
    //     .classed('clickunhighlight',true)
    //             d3.select('#'+this.treeCanvasId)
          // .selectAll("#" + "rootnode" + nodeId)
          // .classed('clickhighlight',true)
          // .classed('clickunhighlight',false)
          // d3.select('#'+this.treeCanvasId)
            // .selectAll("#" + "rootnode" + selectedNodeArray[sI])
            // .classed('clickhighlight',true)
            // .classed('clickunhighlight',false)
    highlightFocusedTreeObjIdArray: function(dataObj) {
      let nodeId = dataObj.index
      if (dataObj.name !== 'A') {
        d3.select('#'+this.treeCanvasId)
          .selectAll('.select-root-node')
          .classed('select-root-node', false)
        //  仅仅高亮点击的节点
        d3.select('#'+this.treeCanvasId)
          .select('#'+"rootnode"+nodeId)
          .classed('select-root-node', true)
      }      
      //  更新当前点击的节点的对象
      let nodeArray = this.getSelectedTreeUnitRootIdArray(nodeId)
      // 高亮数组中的节点
      let focusedTreeObjIdArray = this.getFocusedTreeObjIdArray(nodeArray)
      this.UPDATE_FOCUS_TREE_OBJ_ARRAY(focusedTreeObjIdArray)
      //  按照选择的节点进行高亮
      d3.select('#'+this.treeCanvasId)
        .selectAll('.lineartree-node')
        .classed('clickhighlight', false)
        .classed('clickunhighlight', false)
      d3.select('#'+this.treeCanvasId)
        .selectAll('.lineartree-node')
        .classed('clickunhighlight',true)
      for (let i = 0; i < focusedTreeObjIdArray.length; i++) {
        d3.select('#'+this.treeCanvasId)
          .selectAll("#" + "rootnode" + focusedTreeObjIdArray[i])
          .classed('clickhighlight',true)
          .classed('clickunhighlight',false)
      }
    },
    //  高亮选择的节点数组
    getFocusedTreeObjIdArray: function (nodeArray) {
      let assignRecursiveMode = this.assignRecursiveMode   
      let treelayout = this.layouts
      let AreaData = this.AreaData  
      let focusedTreeObjIdArray = []
      for (let i = 0;i < nodeArray.length;i++) {
        let nodeId = nodeArray[i]
        let selectedNodeArray = []
        // 根据是否递归的条件判断
        if (assignRecursiveMode === 'true') {

          selectedNodeArray = getDescendantNodeArray(nodeId)
        } else if (assignRecursiveMode === 'false') {
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
          for(let i=0;i<treelayout[lightupID].subtreeLayout.length;i++){
            let SonID = treelayout[lightupID].subtreeLayout[i].id
            node.push(SonID)
            allNodeArray.push(SonID)
          }
          lightupID = node.shift()
        }
        return allNodeArray
      }
    },
    //  取消选择节点
    unhighlightSelectedNodeArray: function() {
      d3.select('#'+this.treeCanvasId)
        .selectAll('.lineartree-node')
        .classed('clickunhighlight',false)
        .classed('clickhighlight',false)
        .classed('select-root-node', false)
    },
    //  鼠标的节点点击事件
    onclick: function (dataObj) {
      let self = this
      let nodeId = dataObj.index
      //  显示树可视化形式背后的控制点
      self.addControlHighlight()   
      if (!d3.select('#'+self.treeCanvasId)
          .select('#' + "rootnode" + nodeId)
          .classed('select-root-node')) {
          //  更新当前点击选中的节点id
          self.UPDATE_SELECTED_PREVIEW_NODE_ID(nodeId)
          //  该节点的父亲节点，需要获取该节点的id，计算该计算的属性值
          //  更新当前点击的层次结构数据
          self.UPDATE_PREVIEW_TREE_OBJ(dataObj)
          //  高亮选中的节点
          self.highlightFocusedTreeObjIdArray(dataObj)
      } else {
        self.removePreviewObjectSelection()
      }
      //  更新当前选中的DSL数组
      let currentTreeDSLArray = sysDatasetObj.getCurrentTreeDSLArray(this.focusedTreeObjArray)
      self.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)   
    },
    //  删除当前preview object的选择
    removePreviewObjectSelection: function() {
      let self = this
      //  清除当前选中的节点id
      self.UPDATE_SELECTED_PREVIEW_NODE_ID(null)
      //  取消高亮数组中的节点
      self.unhighlightSelectedNodeArray()
      //  取消选中，应该将focusedTreeObjIdArray置为全部的节点数组
      let allTreeObjIdArray = sysDatasetObj.getAllTreeObjIdArray()
      self.UPDATE_FOCUS_TREE_OBJ_ARRAY(allTreeObjIdArray)
      //  该节点的父亲节点，需要获取该节点的id，计算该计算的属性值
      //  更新当前点击的层次结构数据
      let areaDataArray = self.areaDataArray
      let previewAllDataObj = JSON.parse(JSON.stringify(areaDataArray[0].data))
      self.UPDATE_PREVIEW_TREE_OBJ(previewAllDataObj)
    },
    /**
     * 渲染最终的树可视化形式的方法，需要保证这个方法中只能绘制单纯的树可视化形式，而不包括其他的部分，这样可以将GoTree实现为一个library
     * 将link与node绘制的部分区分开
     */
    renderTree: function () {
        let self = this
        let treeIndexWithDSL = this.treeIndexWithDSL
        let dslContentObject = this.dslContentObject
        let treeViewPosLenObj = this.treeViewPosLenObj
        let treelayout = this.layouts
        let AreaData = this.AreaData
        let nodeArray = this.nodeArray
        let currentRootID = this.currentRootID
        //  遍历得到全部nodeId的数组
        // let nodeIdArray = []
        // //  treeLayoutArray是存储所有的节点属性值的数组，将对象转换为数组
        // let treeLayoutArray = []
        // //  treelayout是一个存储树中所有节点属性值的对象
        // for (let nodeId in treelayout) {
        //   nodeIdArray.push(nodeId)
        //   treeLayoutArray.push(treelayout[nodeId])
        // }
        // let typecolorArray = self.typecolorArray
        // let ordinalColor = d3.scaleOrdinal().range(typecolorArray)
        // //  结点颜色数组，typecolorArray为adaptive类型；valuecolorArray为depth类型
        // let valuecolorArray = self.valuecolorArray
        // //将nodeIdArray按照从小到大排序，以得到根节点id
        // nodeIdArray = nodeIdArray.sort(function(a, b) {
        //   var aNum = a.replace('index-', '')
        //   var bNum = b.replace('index-', '')
        //   return aNum - bNum
        // })
        let dslContentObjectWithDefault = addDefaultCoordElement(dslContentObject)
        //  根据节点的id得到节点所对应的g
        let [areaDataArray, linkDataArray] = getNodeLinkAttr(AreaData, dslContentObjectWithDefault, treeIndexWithDSL, treeViewPosLenObj, nodeArray)
        areaDataArray = getTreeNodeStyle(areaDataArray, dslContentObjectWithDefault, treeIndexWithDSL, nodeArray)
        linkDataArray = getTreeLinkStyle(linkDataArray, AreaData, dslContentObjectWithDefault, treeIndexWithDSL, nodeArray, this.treeViewWidth, this.treeViewHeight)
        this.areaDataArray = areaDataArray
        this.linkDataArray = linkDataArray
        //  调用绘制节点之间链接边的方法
        self.renderTreeLink(linkDataArray)
        //  调用绘制树可视化上节点
        self.renderTreeNode(areaDataArray)
    },
    //  提取传递的treeDsl的文件
    extractDSLContentObject: function () {
      let treeDSLArray = this.treeDSLArray
      let dslContentObj = {}
      for (let tI = 0; tI < treeDSLArray.length; tI++) {
        let dslObj = treeDSLArray[tI]
        let editorId = dslObj.editorId
        let content = dslObj.content
        dslContentObj[editorId] = content
      }
      return dslContentObj
    },
    // ZWT ADD HERE
    getSvgCoordinates(g, x, y) {
      let svg = document.getElementById(this.treeCanvasSvgId);
      let pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      let globalPoint = pt.matrixTransform(g.getScreenCTM().inverse());
      return globalPoint;
    },
    repositionResizeCircle: function (currentRootGId) {
      let self = this
      let g = d3.select('#'+self.treeCanvasId)
      let circleG = g.select('.resize-circle-g')
      let rect = g.select('.tree-vis-region-outer')
      let x = +rect.attr('x')
      let y = +rect.attr('y')
      let w = +rect.attr('width')
      let h = +rect.attr('height')
      circleG.select('.topleft')
        .attr("cx", x)
        .attr("cy", y)
      circleG.select('.bottomright')
        .attr("cx", x + w)
        .attr("cy", y + h)
    },
    //  输入的是某一个group的id，该方法即在这个group内部增加控制点，进而控制可视化形式的大小
    appendResizeCircle: function (currentRootGId) {
      let self = this
      //  选中绘制树的canvas
      let treeCanvas = d3.select('#'+self.treeCanvasId)
      //  选中这个g中的矩形
      let rect = d3.select('#' + self.treeCanvasId)
        .select('.tree-vis-region-outer')
      //  获取g中矩形的属性值
      let x = +rect.attr('x')
      let y = +rect.attr('y')
      let w = +rect.attr('width')
      let h = +rect.attr('height')
      //  在这个g中增加resize的控制
      let circleG = treeCanvas.append('g').attr('class', 'resize-circle-g')
      circleG.append("circle")
        .attr("class", "topleft")
        .attr("cx",  x)
        .attr("cy", y)
        .call(d3.drag()
          .container(d3.select('#'+self.treeCanvasId).node())
          .subject(function () {
            return {x: d3.event.x, y: d3.event.y}
          })
          .on("start end", rectResizeStartEnd)
          .on("drag", rectResizing)
        )
      circleG.append("circle")
        .attr("class", "bottomright")
        .attr("cx", x + w)
        .attr("cy", y + h)
        .call(d3.drag()
          .container(d3.select('#'+self.treeCanvasId).node())
          .subject(function () {
            return {x: d3.event.x, y: d3.event.y}
          })
          .on("start end", rectResizeStartEnd)
          .on("drag", rectResizing)
        )
      function rectResizeStartEnd() {
        let treeViewPosLenObj = self.treeViewPosLenObj
        let el = d3.select(this), isStarting = d3.event.type === "start"
        // d3.select(this)
        //   .classed("resizing", isStarting)
        //   .attr("r", isStarting || el.classed("hovering") ? circleActiveRadius : circleRadius)
        if (isStarting || el.classed("hovering")) {
          d3.select('#'+self.treeCanvasId)
            .select('.tree-vis-region-outer')
            .classed('resizing', true)
        } else {
          d3.select('#'+self.treeCanvasId)
            .select('.tree-vis-region-outer.resizing')
            .classed('resizing', false)
        }
        //  开始时的响应函数
        if (isStarting) {
          let rect = d3.select('#'+self.treeCanvasId)
          .select('.tree-vis-region-outer')
          let x = +rect.attr('x')
          let y = +rect.attr('y')
          let w = +rect.attr('width')
          let h = +rect.attr('height')
          self.regionOuterRectPos = {x: x, y: y, width: w, height: h}
        }
        // 拖动之后，输出修改之后的x, y, width, height
        if (!isStarting) {
          let rect = d3.select('#'+self.treeCanvasId)
            .select('.tree-vis-region-outer')
          let x = +rect.attr('x')
          let y = +rect.attr('y')
          let w = +rect.attr('width')
          let h = +rect.attr('height')
          let diffX = x - self.regionOuterRectPos.x
          let diffY = y - self.regionOuterRectPos.y
          let diffWidth = w - self.regionOuterRectPos.width
          let diffHeight = h - self.regionOuterRectPos.height
          //  改变对应的g的范围
          treeViewPosLenObj.x = treeViewPosLenObj.x + diffX
          treeViewPosLenObj.y = treeViewPosLenObj.y + diffY
          treeViewPosLenObj.width = treeViewPosLenObj.width + diffWidth
          treeViewPosLenObj.height = treeViewPosLenObj.height + diffHeight
          //  重新请求数据
          let currentRootIndex = currentRootGId.replace('-g', '')
          //   调整大小之后更新渲染结果
          self.updateTreeVisResults()
        }
      }
      // 限制矩形位置和大小
      let MAX_TRANSLATE_X = self.treeWidth + self.viewPaddingLeft
      let MIN_TRANSLATE_X = self.viewPaddingLeft
      let MAX_TRANSLATE_Y = self.treeHeight + self.viewPaddingTop
      let MIN_TRANSLATE_Y = self.viewPaddingTop
      let MIN_RECT_WIDTH = 0
      let MIN_RECT_HEIGHT = 0
      function rectResizing(d) {
        let pt = self.getSvgCoordinates(treeCanvas.node(), d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY)
        let dragX = Math.max(
          Math.min(pt.x, MAX_TRANSLATE_X),
          MIN_TRANSLATE_X
        );
        let dragY = Math.max(
          Math.min(pt.y, MAX_TRANSLATE_Y),
          MIN_TRANSLATE_Y
        );
        // let dragX = Math.max(
        //   Math.min(pt.x, MAX_TRANSLATE_X),
        //   MIN_TRANSLATE_X
        // );
        // let dragY = Math.max(
        //   Math.min(pt.y, MAX_TRANSLATE_Y),
        //   MIN_TRANSLATE_Y
        // );
        let rect = d3.select('#'+self.treeCanvasId)
          .select('.tree-vis-region-outer')
        let x = +rect.attr('x')
        let y = +rect.attr('y')
        let w = +rect.attr('width')
        let h = +rect.attr('height')
        if (d3.select(this).classed("topleft")) {
          let newWidth = Math.max(w + x - dragX, MIN_RECT_WIDTH)
          x += w - newWidth;
          w = newWidth;
          let newHeight = Math.max(h + y - dragY, MIN_RECT_HEIGHT)
          y += h - newHeight;
          h = newHeight;
          d3.select(this)
            .attr('cx', x)
            .attr('cy', y)
        } else {
          // w = Math.max(dragX - x, MIN_RECT_WIDTH)
          // h = Math.max(dragY - y, MIN_RECT_HEIGHT)
          w = dragX - x, h = dragY - y
          d3.select(this)
            .attr('cx', x + w)
            .attr('cy', y + h)
        }
        rect.attr('x', x)
          .attr('y', y)
          .attr('width', w)
          .attr('height', h)
      }
    },
    // ZWT ADD END
    ...mapMutations([
      'UPDATE_TREE_DSL_ARRAY_KEY',
      'UPDATE_FOCUS_TREE_OBJ_ARRAY',
      'UPDATE_PREVIEW_TREE_OBJ',
      'UPDATE_SELECTED_PREVIEW_NODE_ID',
      'UPDATE_CURRENT_TREE_DSL_ARRAY'
    ])
  }
}
</script>

<!-- ZWT ADD HERE -->
<style lang="less">
.resize-circle-g circle:hover {
  cursor: move;
  r: 0.2rem;
}
.resize-circle-g circle.resizing {
  fill: #fff;
  fill-opacity: 1;
}
.resize-circle-g circle {
  stroke: #dadada;
  stroke-width: 0.05rem;
  fill: #dadada;
  fill-opacity: 1;
  visibility: hidden;
  r: 0.3rem;
}
.resize-circle-g.highlight circle {
  stroke: #dadada;
  stroke-width: 0.05rem;
  fill: #dadada;
  fill-opacity: 1;
  visibility: visible;
  r: 0.3rem;
}
</style>
<!-- ZWT ADD END -->

<style lang="less">
  .lineartree-node {
    stroke: white;
    // stroke-width: 0.01rem;
  }
  .lineartree-node.clickunhighlight:not(.mouseoverhighlight) {
    fill: #ccc;
    stroke: white;
    // opacity: 0.3;
  }
  .lineartree-node.mouseoverunhighlight:not(.clickhighlight) {
    fill: #ccc;
    // opacity: 0.3;
  }
  .lineartree-node[class~=mouseoverhighlight] {
    opacity: 1 !important;
  }
  .lineartree-node[class~=clickhighlight] {
    opacity: 1 !important;
  }
  .lineartree-node[class~=unselecttree] {
    opacity: 0 !important;
  }
  .lineartree-node[class~=select-root-node] {
    stroke: #fdae61;
    stroke-width: 0.15rem !important;
  }
</style>

<style lang="less">
  .tree-canvas {
    .canvas-region-outer{
      fill: #fff;
      stroke: #9e9e9e;
      stroke-width: 0.05rem;
    }
    .mark-line {
      stroke: #dadada;
      fill: none;
    }
    .link {
      stroke: #606060;
      fill: none;
      &.unhighlight{
        opacity: 0.1;
      }
      shape-rendering: geometricPrecision;
    }
    .tree-vis-region-outer {
      fill: white;
      stroke-width: 0.1rem;
      &.highlight {
        stroke: #238af8;
      }
      &.hidden {
        opacity: 0;
      }
    }
    .resize-circle-g {
      &.hidden {
        opacity: 0 !important;
      }      
    }
    .partition-link-circle {
      fill: gray;
      r: 0.25rem;
      opacity: 0.3;
    }
    .partition-link-path {
      stroke: gray;
      stroke-width: 0.4rem;
      fill: none;
      opacity: 0.3;
    }
  }
</style>
<style scoped lang="less">
  // .container, .tree-canvas {
  //   margin: 0;
  //   height: 100%;
  //   width: 100%;
  //   overflow: hidden;
  // }
  .container {
    position: absolute;
    left: 0%;
    top: 0%;
    bottom: 0%;
    right: 0%;
    // border: solid 0.05rem #ccc;
    background: white;
    touch-action: pinch-zoom;
    .tree-canvas {
      position: absolute;
      left: 0%;
      top: 0%;
      height: 100%;
      width: 100%;
      background: #f2f2f2;
      touch-action: pinch-zoom;
    }
  }
  .container.highlight {
    background: #eeeeee;
  }
  .tree-node {
    stroke: white;
  }
  .Label {
    font: 8px sans-serif;
    text-anchor: middle;
  }
  #NodeLabel {   
    position: absolute;           
    text-align: left;
    padding: 20px;             
    margin: 10px;
    font: 12px sans-serif;        
    background: lightsteelblue;   
    border: 1px;      
    border-radius: 2px;           
    pointer-events: none;         
  }
  #NodeLabel h4{
    margin:0;
    font-size:14px;
  }
  #NodeLabel{
    background:rgba(0,0,0,0.9);
    border:1px solid grey;
    border-radius:5px;
    font-size:12px;
    width:auto;
    padding:4px;
    color:white;
    opacity:0;
  }
  #NodeLabel table{
    table-layout:fixed;
  }
  #NodeLabel tr td{
    padding:0;
    margin:0;
  }
  #NodeLabel tr td:nth-child(1){
    width:50px;
  }
  #NodeLabel tr td:nth-child(2){
    text-align:center;
  }

</style>
<template>
  <div class='single-preview-figure-container'>
    <div class="dsl-figure">
      <svg class="dsl-preview-canvas">
        <g class='tree-preview-g' :id="treeGId"></g>
      </svg>
    </div>
    <div class="dsl-name">{{dslId}}</div>
  </div>
</template>

<script> 
  import { mapState, mapActions } from 'vuex';
  import { extractTreeIndexWithDSL } from '@/data-processing/extract_tree_index_with_dsl.js'
  import { getTreeLayout } from '@/data-processing/get_tree_layout.js'
  import { getNodeLinkAttr } from '@/data-processing/get_node_link_attr.js'
  import { getLayoutValue } from '@/data-processing/get_layout_value.js'
  import { addDefaultCoordElement } from '@/data-processing/add_default_coord_element.js'

  import { tweenPaths } from 'svg-tween'
  import { tween } from 'svg-tween'

  export default {
    name: 'SinglePreviewFigure',
    components: {
    },
    props: {
      dslId: {
        type: String
      },
      treeDSLObj: {
        type: Object
      }
    },
    data() {
      return {
        treeGId: 'preview-g',
        treeViewPosLenObj: {}
      }
    },
    created: function() {},
    mounted: function() {
      let self = this
      setTimeout(function() {
        self.initTreePreviewCanvas()
      }, 200)
    },
    updated: function() {
    },
    watch: {
      previewTreeObj: function() {
        this.getPreViewTreeLayout()
      }
    },
    computed: {
      ...mapState([
        'previewTreeObj'
      ])
    },
    methods: {
      initTreePreviewCanvas: function() {
        let dslPreviewCanvasHeight = $('.dsl-preview-canvas').height()
        let dslPreviewCanvasWidth = $('.dsl-preview-canvas').width()
        let paddingLeft = dslPreviewCanvasWidth * 0.05, paddingRight = dslPreviewCanvasWidth * 0.05,
            paddingTop = dslPreviewCanvasHeight * 0.05, paddingBottom = dslPreviewCanvasHeight * 0.05;
        let dslPreviewWidth = dslPreviewCanvasWidth - paddingLeft - paddingRight
        let dslPreviewHeight = dslPreviewCanvasHeight - paddingTop - paddingBottom
        //  移动TreePreviewG
        d3.select(this.$el)
          .select('.tree-preview-g')
          .attr('transform', 'translate(' + paddingLeft + ',' + paddingTop + ')')
        this.treeViewPosLenObj = {
          x: 0, y: 0,
          width: dslPreviewWidth,
          height: dslPreviewHeight
        }
      },
      getPreViewTreeLayout: function() {
        let self = this
        let dslId = this.dslId
        let treeIndexWithDSLWithDefault = {default: dslId}
        let previewTreeObj = JSON.parse(JSON.stringify(this.previewTreeObj))
        let focusedTreeNodeArray = sysDatasetObj.computeNodeArray(previewTreeObj)
        let dslContentObject = {}
        dslContentObject[dslId] = sysDatasetObj.getSelectedDSLObject(dslId)
        let dslContentObjectWithDefault = addDefaultCoordElement(dslContentObject)
        let parasObj = {
          hierarchicalData: previewTreeObj, 
          treeDSLContentObj: dslContentObjectWithDefault, 
          treeIndexWithDSL: treeIndexWithDSLWithDefault
        }
        getLayoutValue(parasObj).then(function(treeLayouts) {
          self.renderPreViewTree(treeLayouts, dslContentObjectWithDefault, treeIndexWithDSLWithDefault, focusedTreeNodeArray)
        })
      },
      //  渲染previewTree的视图
      renderPreViewTree: function(treeLayouts, dslContentObject, treeIndexWithDSLWithDefault, focusedTreeNodeArray) {
        let treeViewPosLenObj = this.treeViewPosLenObj
        let treeIndexWithDSL = extractTreeIndexWithDSL(treeIndexWithDSLWithDefault, focusedTreeNodeArray)
        let AreaData = getTreeLayout(treeIndexWithDSL, dslContentObject, treeLayouts, focusedTreeNodeArray, treeViewPosLenObj)
        let [areaDataArray, linkDataArray] = getNodeLinkAttr(AreaData, dslContentObject, treeIndexWithDSL, treeViewPosLenObj)
        //  计算坐标轴上的参数
        this.renderTreeLink(linkDataArray)
        this.renderTreeNode(areaDataArray)
      },
      //  渲染节点之间的link
      renderTreeLink: function (linkDataArray) {
        let self = this
        let currentRootGId = self.treeGId
        //绘制link
        let linkElements = d3.select(this.$el)
          .select('#' + currentRootGId)
          .selectAll('.link')
          .data(linkDataArray)
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
          .attr('stroke-width', self.linkWidth)
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
            .attr('stroke-width',self.linkWidth)
            .attr('fill','none')
        })
        linkElements.exit().remove()
        //  节点之间连线的路径进行变形的动画
        let tweenLinkPathsCallback = function () {
          linkElements.each(function(d, i) {
            d3.select(this)
              .attr('d', d.pathAttr)
          })
        }
        //  判断fromLinkArray与toLinkArray中的对象是否是null
        if (fromLinkArray.length === toLinkArray.length) {
          //  只有fromLinkArray与toLinkArray中的对象都不为null时，才会进行transition的动画
          tweenPaths({duration: self.DURATION, complete: tweenLinkPathsCallback, from: fromLinkArray, to: toLinkArray, next: (d, i) => linkPathArray[ i ].setAttribute('d', d)})
        } else {
          tweenLinkPathsCallback()
        }
      },
      //  渲染树中的节点
      renderTreeNode: function (areaDataArray) {
        let self = this
        let currentRootGId = self.treeGId
        //  计算层次结构数据的最大深度
        let maxdepth = 1
        for (let i = 0; i < areaDataArray.length; i++) {
          if (maxdepth < areaDataArray[i].depth) {
            maxdepth = areaDataArray[i].depth
          }
        }
        //  表示节点的视觉元素
        let treeNodeElement = d3.select(this.$el)
          .select('#' + currentRootGId)
          .selectAll('.lineartree-node')
          .data(areaDataArray, function(d, i) {
            return d.id
        })
        //  创建视觉元素
        treeNodeElement.enter()
          .append('path')
          .attr('class', 'lineartree-node')
          .attr('id',function(d,i) {
            return 'rootnode'+d.id
          })
          .attr('d', function(d, i) {
            return d.element
          })
          // .on("dblclick",doubleclick)
          .attr('fill', self.nodeFillColor)
          .style('stroke-width', self.NodeStrokeWidth)
          .style("opacity",1)  
          //  对于节点采用动画变换的方式进行过渡
          let fromArray = []
          let toArray = []
          let pathArray = []
          treeNodeElement.each(function(d, i) {
            let targetAnimationPath = d.element
            let currentAnimationPath = d3.select(this).attr("d")
            pathArray.push(d3.select(this).node())
            fromArray.push(currentAnimationPath)
            toArray.push(targetAnimationPath)
            //  除path之外的其他的style的动画过渡
            d3.select(this)
              .transition()
              .duration(self.DURATION)
              .attr('fill', self.nodeFillColor)
              .style('stroke-width', self.NodeStrokeWidth)
              .style("opacity",1)
          })
          tweenPaths({duration: self.DURATION, complete: tweenPathsCallback, from: fromArray, to: toArray, next: (d, i) => pathArray[ i ].setAttribute('d', d)})
          //  transition之后结束的方法
          let tweenPathsCallback = function () {
            treeNodeElement.each(function(d, i) {
              let targetPath = d.element
              d3.select(this)
                // .attr('transform', targetTransform)
                .attr('d', targetPath)
            })
          }
          //  删除多余的视觉元素
          treeNodeElement.exit().remove()  
          //  鼠标悬停的事件
          function mouseover(d) {
            d3.select("#NodeLabel").style("visibility", "visible")
            d3.select("#NodeLabel").style("opacity", .9)
            let value = 0
            let name = 'a'
            for (let i=0; i < nodeArray.length; i++) {
              if (nodeArray[i].data.index === d.id) {
                value = nodeArray[i].data.value
                name = nodeArray[i].data.name
                break
              }
            }
            d3.select("#NodeLabel").html(NodeLabelHtml(name,value))
              .style("left", (d3.event.pageX - 28) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
          }
          //  hover显示label中的文字排版
          function NodeLabelHtml(name,value) {
            return "<h4>"+"name: "+name+"<br/>"+"value: "+value+"</h4><table>";
          }
          //  鼠标移开的事件
          function mouseout(d) {
            d3.select("#NodeLabel").style("visibility", "hidden")
          }
      }
    }
  }
</script>

<style lang="less">
  .single-preview-figure-container {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    width: 100%;
    height: 100%;
    .dsl-figure {
      width: 100%;
      height: 85%;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat; 
      .dsl-preview-canvas {
        width: 100%;
        height: 100%;
      }
    }
    .dsl-name {
      width: 100%;
      height: 15%;
      font-size: 12px;
      text-align: center;
    }
  }
</style>
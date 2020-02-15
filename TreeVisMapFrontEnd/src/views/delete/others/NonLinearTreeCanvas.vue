<template>
	<div class='container'>
	  <svg class='tree-canvas' :id="treeCanvasId">
    <g class='tree-g' :id="treeGId"></g>
	  </svg>
	</div>
</template>

<script>
import { squarify } from 'squarify'
import { voronoiTreemap } from 'd3-voronoi-treemap'
import { mapState } from 'vuex'
import { Cartesian } from '@/coordinatesystem/cartesian.js'
import { Polar } from '@/coordinatesystem/polar.js'
import { computeHeight, computeWidth, computeX, computeY, computeLength, computePosition, createVisualElement, reorderNodeArray, computeAbsoluteNodePosition, initializeLinks } from '@/computation/visual_element_attr.js'

export default {
  name: 'NonLinearTreeCanvas',
  props: [],
  data() {
    return {
      treeCanvasId: 'tree-dsl-canvas',
      treeGId: 'tree-dsl-g',
      viewWidth: 0,
      viewHeight: 0,
      NODE_STROKE: 0,
      LINK_STROKE: 1,
      NODE_RADIUS: 3,
      DURATION: 1000
    }
  },
  created: function () { },
  mounted: function () {
    this.viewWidth = $('#' + this.treeCanvasId).width()
    this.viewHeight = $('#' + this.treeCanvasId).height()
    this.viewPaddingTop = this.viewHeight * 0.1
    this.viewPaddingBottom = this.viewHeight * 0.1
    this.viewPaddingLeft = this.viewWidth * 0.1
    this.viewPaddingRight = this.viewWidth * 0.1
    this.treeWidth = this.viewWidth - this.viewPaddingLeft - this.viewPaddingRight
    this.treeHeight = this.viewHeight - this.viewPaddingTop - this.viewPaddingBottom
    //  节点的stroke是根据最小的边计算得到
    this.NODE_STROKE = this.treeWidth > this.treeHeight ? this.treeHeight / 200 : this.treeWidth / 200
    //  调整视图的位置
    d3.select('#' + this.treeGId)
      .attr('transform', 'translate(' + this.viewPaddingLeft + ',' + this.viewPaddingTop + ')')
  },
  watch: {
    hierarchicalDSL: function () {
      this.computeVisualElementsArray()
    }
  },
  computed: {
    ...mapState([
      'hierarchicalData',
      'nodeArray',
      'hierarchicalDSL',
    ])
  },
  methods: {
    computeVisualElementsArray: function () {
      let nodeArray = this.nodeArray
      let hierarchicalDSL = this.hierarchicalDSL
      let hierarchicalData = this.hierarchicalData
      let treeWidth = this.treeWidth
      let treeHeight = this.treeHeight
      if ((typeof (nodeArray) !== 'undefined') && (typeof (hierarchicalDSL.node) !== 'undefined')) {
        //  定义了节点以及树的描述语言之后
        this.initializeNodes(hierarchicalDSL, nodeArray, treeWidth, treeHeight)
        // this.renderLinearTree(hierarchicalDSL, hierarchicalData, nodeArray)
      }
    },
    // [WenTao] 计算树可视化形式的节点位置以及属性值
    initializeNodes: function (hierarchicalDSL, nodeArray, treeWidth, treeHeight) {
      var self = this
      //  coordinate system的对象
      let coordinateSystemParaObj = hierarchicalDSL.coordinateSystemParaObj
      let nodeType = hierarchicalDSL.node
      let nodeAttribute = hierarchicalDSL.nodeAttribute
      //  nodeArray[0]是数组中的根节点
      let rootNode = nodeArray[0]
      let treeLevels = rootNode.height + 1
      //  在node link的情况下是节点固定的大小
      let NODE_HEIGHT = 10
      let NODE_WIDTH = 10
      //  在inclusion的情况下主要是基于整个视图的大小
      let rootNodeSize = rootNode.data.size
      let valueScale = d3.scaleLinear().domain([0, rootNodeSize])
      let depthScale = d3.scaleLinear().domain([0, treeLevels])
      //  调整视图的宽度与高度
      let viewWidthRatio = hierarchicalDSL.viewWidth
      if (typeof (viewWidthRatio) !== 'undefined') {
        treeWidth = treeWidth * viewWidthRatio
      }
      let viewHeightRatio = hierarchicalDSL.viewHeight
      if (typeof (viewHeightRatio) !== 'undefined') {
        treeHeight = treeHeight * viewHeightRatio
      }

      self.treeWidth = treeWidth
      self.treeHeight = treeHeight

      let linkArray = new Array()

      // 获得node之间的link，便于d3.force计算layout
      for (let i = 0; i < nodeArray.length; i++) {
        if (nodeArray[i].children != undefined) {
          for (let j = 0; j < nodeArray[i].children.length; j++) {
            linkArray.push({
              'source': nodeArray[i].data.originalNodeIndex,
              'target': nodeArray[i].children[j].data.originalNodeIndex
            })
          }
        }
      }

      // 将nodeArray转化为d3的层次结构
      let stratify = d3.stratify()
        .id(function (d) { return d.data.originalNodeIndex })
        .parentId(function (d) {
          if (d.parent) {
            return d.parent.data.originalNodeIndex
          }
          else return null
        })
      let root = stratify(nodeArray)
        .sum(function (d) {
          // console.log(d)
          return d.data.size
        })
        .sort(function (a, b) {
          return b.data.size - a.data.size
        })
      console.log(root)

      let LayoutType = 'force'

      if (LayoutType === 'force') {
        this.drawForceLayout(nodeArray, linkArray, treeWidth, treeHeight)
      } else if (LayoutType === 'circlepacking') {
        this.drawCirclePacking(root, linkArray, treeWidth, treeHeight)
      } else if (LayoutType === 'voronoi') {
        this.drawVoronoiTreemap(root, linkArray, treeWidth, treeHeight)
      } else if (LayoutType === 'squarify') {
        this.drawSquarifyTreemap(root, linkArray, treeWidth, treeHeight)
      }

      // 原来的代码，用于Linear Layout
      /*
      //  按照level计算每个节点的横向以及纵向宽度只有在adjacent以及overlapping的情况下才需要用到这个属性
      let LEVEL_HEIGHT = treeHeight / treeLevels
      let LEVEL_WIDTH = treeWidth / treeLevels
      //  布局纵向以及横向的DSL
      let horizontalDSL = hierarchicalDSL.layout.horizontal
      let verticalDSL = hierarchicalDSL.layout.vertical
      //  初始化每个节点对应的视觉元素的参数
      for (let i = 0; i < nodeArray.length; i++) {
        nodeArray[i].visualAttr = {}
      }
      //  初始化渲染可视化结果的coordinate system的中心节点 x = treeWidth / 2, y = 0
      //  在某些情况下计算节点的宽度需要递归进行计算
      //  计算横向与纵向的坐标值
      let horiztonalLengthAttrName = 'width', horiztonalPosAttrName = 'x',
        verticalPosAttrName = 'y', verticalLengthAttrName = 'height'
      //  计算横向的节点长度
      nodeArray = computeLength(horiztonalLengthAttrName, nodeArray, nodeAttribute, treeWidth, valueScale, depthScale, LEVEL_WIDTH, horizontalDSL)
      //  计算纵向的节点长度
      nodeArray = computeLength(verticalLengthAttrName, nodeArray, nodeAttribute, treeHeight, valueScale, depthScale, LEVEL_HEIGHT, verticalDSL)
      //  计算节点相对于父节点的横向位置
      nodeArray = computePosition(horiztonalPosAttrName, horiztonalLengthAttrName, treeWidth, nodeArray, horizontalDSL)
      //  计算节点相对于父节点的纵向位置
      nodeArray = computePosition(verticalPosAttrName, verticalLengthAttrName, treeHeight, nodeArray, verticalDSL)
      //  按照深度优先遍历的顺序进行排序
      nodeArray = reorderNodeArray(nodeArray)
      //  重新计算节点的横向的绝对位置，将父节点的偏移累加到当前节点
      nodeArray = computeAbsoluteNodePosition(horiztonalPosAttrName, nodeArray, horizontalDSL)
      //  重新计算节点的纵向的绝对位置
      nodeArray = computeAbsoluteNodePosition(verticalPosAttrName, nodeArray, verticalDSL)
      //  所有的节点都在一个g中渲染，因此需要计算所有节点的大小以及范围并且将节点置于中心位置
      this.adjust2Center(nodeArray, coordinateSystemParaObj) 
      for (let i = 0; i < nodeArray.length; i++) {
        let nodeObj = nodeArray[i]
        createVisualElement(nodeType, nodeObj, treeWidth, treeHeight, coordinateSystemParaObj, horizontalDSL, verticalDSL)
      }
      */

    },
    // TODO: 文字标注
    drawSquarifyTreemap: function (root, linkArray, treeWidth, treeHeight) {
      let self = this

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, root.height])

      var treemap = d3.treemap()
        .size([treeWidth, treeHeight])
        .padding(3)
        .round(true)
      
      treemap(root)

      var cell = d3.select('#' + this.treeGId)
          .selectAll("g")
          .data(root.descendants())
          .enter().append("g")
          .attr("class", "cell")
          .attr("transform", function(d) {
            return "translate(" + (d.x0) + "," + (d.y0) + ")"
            })

      cell.append("rect")
          .attr("width", function (d) {
            return d.x1 - d.x0
            })
          .attr("height", function (d) {
            return d.y1 - d.y0
            })
          .style("fill", function (d) {
            return 'white'
            // return color(d.height)
            })
          .attr("stroke", function (d) {
            return 'grey'
            })
          .attr("stroke-width", function (d) {
            return '1'
            })
      /*
      cell.append("text")
      .attr("x", function(d) { return (d.x1 - d.x0) / 2; })
      .attr("y", function(d) { return (d.y1 - d.y0) / 2; })
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text(function(d) {
        return d.data.data.name
      })
      */

    },
    // TODO: 文字标注
    // TODO: 存在重叠问题
    drawVoronoiTreemap: function (root, linkArray, treeWidth, treeHeight) {
      // console.log(voronoiTreemap)
      let self = this

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, root.height])
      
      let vTreemap = voronoiTreemap().clip([[0, 0], [0, treeHeight], [treeWidth, treeHeight], [treeWidth, 0]]); // sets the clipping polygon
      vTreemap(root); // computes the weighted Voronoi tessellation of the d3-hierarchy; assigns a 'polygon' property to each node of the hierarchy

      d3.select('#' + this.treeGId)
        .selectAll('path')
        .data(root.descendants())
        .enter()
        .append('path')
        .attr('d', function(d) {
          return d3.line()(d.polygon) + 'z'
        })
        .attr('fill', function (d) {
          return 'white'
        })
        .style('stroke', function (d) {
          return 'grey'
        })
        .style('stroke-width', function (d) {
          return self.LINK_STROKE * (d.height + 1)
        })

      /*
      let labels = d3.select('#' + this.treeGId)
        .selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", function(d){
          if (d.polygon.site) {
            return "translate("+[d.polygon.site.x, d.polygon.site.y]+")"
          } else {
            return "translate(0,0)"
          }
        })
        .style("font-size", "12px")

      labels.append("text")
        .text(function(d){
          if (d.polygon.site) {
            return d.data.data.name
          }
          else return ''
        })
      */
    },
    // TODO: 文字标注
    drawCirclePacking: function (root, linkArray, treeWidth, treeHeight) {
      // console.log(linkArray)

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, root.height])

      let pack = d3.pack()
        .size([treeWidth - 2, treeHeight - 2])
        .padding(3)

      pack(root)

      let node = d3.select('#' + this.treeGId)
        .selectAll('g')
        .data(root.descendants())
        .enter().append('g')
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
        .attr('class', function (d) { return 'node' + (!d.children ? ' node--leaf' : d.depth ? '' : ' node--root') })
        .each(function (d) { d.node = this })

      node.append('circle')
        .attr('id', function (d) { return 'node-' + d.id })
        .attr('r', function (d) { return d.r })
        .style('fill', function (d) { return color(d.depth) })

      var leaf = node.filter(function (d) { return !d.children })

      leaf.append('clipPath')
        .attr('id', function (d) { return 'clip-' + d.id })
        .append('use')
        .attr('xlink:href', function (d) { return '#node-' + d.id + '' })

      /*
      leaf.append('text')
        .attr('clip-path', function (d) { return 'url(#clip-' + d.id + ')' })
        .selectAll('tspan')
        .data(function (d) { return d.data.data.name })
        .enter().append('tspan')
        .attr('x', 0)
        .attr('y', function (d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10 })
        .text(function (d) { return d })
        .attr('font-size', '10px')
      */
    },
    // TODO: Node Link的其它Visual Channel的Encoding
    drawForceLayout: function (nodeArray, linkArray, treeWidth, treeHeight) {      
      let simulation = d3.forceSimulation(nodeArray)
        .force('link', d3.forceLink(linkArray).distance(20))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(treeWidth / 2, treeHeight / 2))

      let treeG = d3.select('#' + this.treeGId)
        .append('g')
        .attr('class', 'force-tree')

      this.treeNodeElement = treeG.selectAll('.tree-node')
        .data(nodeArray, function (d, i) {
          return d.data.name + '-' + d.depth
        })
        .enter()
        .append('circle')
        .attr('class', 'tree-node')
        .attr('id', function (d, i) {
          return d.data.name
        })
        .attr('r', this.NODE_RADIUS + 'px')
        .attr('fill', 'grey')

      this.treeLinkElement = treeG.selectAll('.tree-link')
        .data(linkArray, function (d, i) {
          return i
        })
        .enter()
        .append('line')
        .attr('class', 'tree-link')
        .attr('id', function (d, i) {
          return i
        })
        .style('stroke', 'grey')
        .style('stroke-width', this.LINK_STROKE + 'px')

      // console.log(nodeArray)
      simulation.on('tick', this.updateLayout)
    },
    // 根据当前布局的大小进行缩放
    updateLayout: function () {
      let self = this
      let maxX = -100000
      let maxY = -100000
      let minX = 100000
      let minY = 100000

      this.treeNodeElement.each(function (d) {
          if (d.x > maxX) {
            maxX = d.x
          }
          if (d.x < minX) {
            minX = d.x
          }
          if (d.y > maxY) {
            maxY = d.y
          }
          if (d.y < minY) {
            minY = d.y
          }
      })

      let scaleX = self.treeWidth / (maxX - minX)
      let scaleY = self.treeHeight / (maxY - minY)
      let scale = Math.min(scaleX, scaleY)

      this.treeNodeElement
        .attr('cx', function (d, i) {
          return (d.x - minX) * scale
        })
        .attr('cy', function (d, i) {
          return (d.y - minY) * scale
        })

      this.treeLinkElement
        .attr('x1', function (d, i) {
          return (d.source.x - minX) * scale
        })
        .attr('y1', function (d, i) {
          return (d.source.y - minY) * scale
        })
        .attr('x2', function (d, i) {
          return (d.target.x - minX) * scale
        })
        .attr('y2', function (d, i) {
          return (d.target.y - minY) * scale
        })
    },
    //  [WenTao] 渲染最终的树可视化形式，
    renderLinearTree: function (hierarchicalDSL, hierarchicalData, nodeArray) {
      let self = this
      let DURATION = this.DURATION
      let coordinateSystemParaObj = hierarchicalDSL.coordinateSystemParaObj
      let coordinateSystem = coordinateSystemParaObj.coordinateSystem
      let treeNodeElement = d3.select('#' + this.treeGId)
        .selectAll('.tree-node')
        .data(nodeArray, function (d, i) {
          return d.data.name + '-' + d.depth
        })
      treeNodeElement.enter()
        .append('path')
        .attr('class', 'tree-node')
        .attr('id', function (d, i) {
          return d.data.name
        })
        .attr('d', function (d, i) {
          return d.visualAttr.rectPathObj
        })
        .style('stroke', 'white')
        .style('stroke-width', this.NODE_STROKE + 'px')
      treeNodeElement.each(function (d, i) {
        let targetPath = d.visualAttr.rectPathObj
        let currentPath = d3.select(this).attr('d')
        let targetPathType = self._path_type(targetPath)
        let currentPathType = self._path_type(currentPath)
        if (targetPathType === currentPathType) {
          //  如果前后是相同的PATH类型，那么需要增加transition的过渡
          d3.select(this).transition()
            .duration(DURATION)
            .attr('d', d.visualAttr.rectPathObj)
        } else {
          //  否则直接进行更新，不增加transition
          d3.select(this).attr('d', d.visualAttr.rectPathObj)
        }
      })
      //  TODO 尝试做不同类型节点之间的transition
      // treeNodeElement.transition()
      // .duration(DURATION)
      // .attrTween('d',function(d) {
      //   let targetArc = d.visualAttr.rectPathObj
      //   let currentArc = d3.select(this).attr('d')
      //   let basic = d3.interpolateString(currentArc, targetArc)
      //   return function(t) {
      //   let originalStr = basic(t)
      //   let modifiedStr = originalStr.replace(/A[^A-Z]+/g, function(match) {
      //     let changedStr = 'A' + match.substr(1).split(/[, ]+/).map(function(value, index) {
      //     if ((index == 3) || (index == 4)) {
      //       return String(Math.round(parseFloat(value)))
      //     } else {
      //       return value
      //     }
      //     }).join(',')
      //     return changedStr
      //   })
      //   console.log('modifiedStr', modifiedStr)
      //   return modifiedStr
      //   }
      // })
      treeNodeElement.exit().remove()
    },
    //  判断节点的类型是矩形Rect还是rc
    _path_type: function (pathStr) {
      let aIndex = pathStr.indexOf('A')
      if (aIndex === -1) {
        //  如果PATH中不存在A，那么这个PATH是Rect
        return 'RECT'
      } else {
        //  如果PATH中存在A，那么这个PATH是Arc
        return 'ARC'
      }
    },
    //  将渲染的g调整到视图的中心位置
    adjust2Center: function (nodeArray, coordinateSystemParaObj) {
      //  坐标系的类型
      let DURATION = this.DURATION
      let coordinateSystem = coordinateSystemParaObj.coordinateSystem
      let top = 10000000, left = 10000000, bottom = 0, right = 0
      for (let nI = 0; nI < nodeArray.length; nI++) {
        let nodeObj = nodeArray[nI]
        let visualAttr = nodeObj.visualAttr
        if (visualAttr.x < top) {
          top = visualAttr.x
        }
        if (visualAttr.y < left) {
          left = visualAttr.y
        }
        if ((visualAttr.x + visualAttr.width) > right) {
          right = visualAttr.x + visualAttr.width
        }
        if ((visualAttr.y + visualAttr.height) > bottom) {
          bottom = visualAttr.y + visualAttr.height
        }
      }
      let occupyViewWidth = right - left
      let occupyViewHeight = bottom - top
      let viewPaddingLeft = (this.viewWidth - occupyViewWidth) / 2
      let viewPaddingTop = (this.viewHeight - occupyViewHeight) / 2
      //  根据坐标系类型对于视图位置进行调整
      if (coordinateSystem === 'cartesian') {
        d3.select('#' + this.treeGId)
          .transition()
          .duration(DURATION)
          .attr('transform', 'translate(' + viewPaddingLeft + ',' + viewPaddingTop + ')')
      } else if (coordinateSystem === 'polar') {
        d3.select('#' + this.treeGId)
          .attr('transform', 'translate(' + this.viewWidth / 2 + ',' + this.viewHeight / 2 + ')')
      }
    }
  }
}
</script>

<style scoped lang="less">
	.container {
		position: absolute;
		left: 10%;
		top: 10%;
		height: 80%;
		width: 80%;
		background-color: #eeeeee;
		.tree-canvas {
			position: absolute;
			left: 0%;
			top: 0%;
			height: 100%;
			width: 100%;
		}
	}
  .tree-node {
  stroke: white;
  }
</style>

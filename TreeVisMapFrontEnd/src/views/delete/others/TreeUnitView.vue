<template>
  <div class='treeunit-container'>
    <drop @drop="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      id="drop-container">
      <svg class='tree-unit-canvas' width='100%' height='100%' :id="treeCanvasId">
        <g class='tree-unit-g' :id="treeGId"></g>
      </svg>
    </drop>
  </div>
</template>

<script> 
// Wentao
import { mapState, mapActions, mapMutations} from 'vuex';
import { Drag, Drop } from 'vue-drag-drop';

export default {
  name: 'TreeUnitView',
  components: {
    Drag, Drop
  },
  props: [],
  data() {
    return {
      treeCanvasId: "tree-canvas",
      treeGId: "tree-g",
      layouts: undefined,
      width: 0,
      height: 0,
      treeWidth: 0,
      treeHeight: 0,
      gridTotalX: 20,
      gridTotalY: 15,
      gridWidth: 0,
      gridHeight: 0,
      padding: 0.12,
      lastEvent: undefined,
      parentFill: '#ffffff',
      childFill: '#bbbbbb',
      relationRectHeight: 7,
      markerLen: 6,
      paddingHeight: 15,
      paddingArrowLen: 20,
      subtreeAreaRectPadding: 0,
      axisFontSize: 12,
      nodeFontSize: 16,
      currentOffset: undefined,
      lineBlack: {
        'endMarker': false,
        'stroke': '#000000',
        'strokeWidth': '1px',
        'strokeDasharray': false
      },
      lineGrey: {
        'endMarker': false,
        'stroke': '#999999',
        'strokeWidth': '1px',
        'strokeDasharray': false
      },
      lineGreyMark: {
        'endMarker': true,
        'stroke': '#999999',
        'strokeWidth': '1px',
        'strokeDasharray': false
      },
      lineParentDash: {
        'endMarker': false,
        'stroke': '#000000',
        'strokeWidth': '2px',
        'strokeDasharray': '3, 6'
      },
      lineChildDash: {
        'endMarker': false,
        'stroke': '#888888',
        'strokeWidth': '2px',
        'strokeDasharray': '0, 4.5, 3, 1.5'
      },
      rectNormal: {
        'fill': '#bbbbbb',
        'fillOpacity': '1',
        'stroke': 'none',
        'strokeWidth': '1px',
        'strokeDasharray': false,
        'stripe': false,
        'innerPadding': 0
      },
      rectParent: {
        'fill': 'none',
        'fillOpacity': '1',
        'stroke': '#000000',
        'strokeWidth': '1px',
        'strokeDasharray': false,
        'stripe': false,
        'innerPadding': 0.5
      },
      rectChild: {
        'fill': '#bbbbbb',
        'fillOpacity': '1',
        'stroke': 'none',
        'strokeWidth': '1px',
        'strokeDasharray': false,
        'stripe': false,
        'innerPadding': 0
      },
      rectSubtree: {
        'fill': 'none',
        'fillOpacity': '1',
        'stroke': '#bbbbbb',
        'strokeWidth': '1.5px',
        'strokeDasharray': '2,2',
        'stripe': false,
        'innerPadding': 0
      },
      rectStripeX: {
        'fill': '#bbbbbb',
        'fillOpacity': '1',
        'stroke': 'none',
        'strokeWidth': '1px',
        'strokeDasharray': false,
        'stripe': 'url(#lgStripeX)',
        'innerPadding': 0
      },
      rectStripeY: {
        'fill': '#bbbbbb',
        'fillOpacity': '1',
        'stroke': 'none',
        'strokeWidth': '1px',
        'strokeDasharray': false,
        'stripe': 'url(#lgStripeY)',
        'innerPadding': 0
      }
    }
  },
  created: function() {},
  mounted: function() {
    let self = this
    self.appendRectStripe()
    self.appendMarker()
    window.addEventListener('load', function () {
      self.width = document.getElementById(self.treeCanvasId).clientWidth
      self.height = document.getElementById(self.treeCanvasId).clientHeight
      self.computeSize()
      d3.select('#'+self.treeGId)
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
      self.unitG = d3.select('#' + self.treeCanvasId).append('g').attr('id', 'tree-unit')
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
      self.subtreeG = d3.select('#' + self.treeCanvasId).append('g').attr('id', 'subtree-rect-g')
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
    })
    /*
    window.addEventListener('resize', function () {
      self.width = +document.getElementById(self.treeCanvasId).clientWidth
      self.height = +document.getElementById(self.treeCanvasId).clientHeight
      self.computeSize()
      d3.select('#'+self.treeGId)
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
      self.unitG = d3.select('#tree-unit')
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
      self.subtreeG = d3.select('#subtree-rect-g')
        .attr('transform', 'translate(' + self.treeX1 + ',' + self.treeY1 + ')')
    })
    */
  },
  updated: function() {
    console.log('updated')
  },
  watch: {
    hierarchicalData: function() {
    },
    nodeArray: function() {
    },
    hoveringDSLItem: function() {
      let self = this
      // console.log('hoveringDSLItem', self.hoveringDSLItem)
      // console.log('focusedDSLObj', self.focusedDSLObj)
      if (self.hoveringDSLItem == null || self.focusedDSLObj == null || self.focusedDSLObj.content == null) {
        // 如果没有hoveringDSLItem或者focusedDSLObj，则去掉所有标注
        // self.unitG.selectAll('*').remove()
      } else {
        self.unitG.selectAll('*').remove()
        // console.log('self.hoveringDSLItem.path', self.hoveringDSLItem.path)
        let DSLNode = []
        DSLNode[0] = self.focusedDSLObj.content
        let text = ''
        for (let i = 0; i < self.hoveringDSLItem.path.length; i++) {
          DSLNode[i + 1] = DSLNode[i][self.hoveringDSLItem.path[i]]
          if (i != 0) {
            if (i != self.hoveringDSLItem.path.length - 1) {
              text = text + self.hoveringDSLItem.path[i] + ': '
            } else {
              text = text + self.hoveringDSLItem.path[i]
            }
          }
        }
        // console.log('DSLNode', DSLNode)
        if (self.inPath('X', self.hoveringDSLItem.path) || self.inPath('Y', self.hoveringDSLItem.path)) {
          // 轴的方向
          let axis = 'x'
          let start = self.xAxis.Start
          let end = self.xAxis.End
          let pos = self.xAxis.Pos
          let tickNum = self.xAxis.TickNum
          let tickHeight = self.xAxis.TickHeight
          if (self.hoveringDSLItem.path[1] === 'Y') {
            axis = 'y'
            start = self.yAxis.Start
            end = self.yAxis.End
            pos = self.yAxis.Pos
            tickNum = self.yAxis.TickNum
            tickHeight = self.yAxis.TickHeight
          }
          // 轴附近标注的文字
          if (DSLNode.length == 5) {
            text = text + ': ' + DSLNode[DSLNode.length - 1]
          }
          // Layout:X/Y:Root
          if (self.inPath('Root', self.hoveringDSLItem.path)) {
            // 获取Relation
            let relation = DSLNode[3]['Relation']
            // 获取Padding
            let padding = 0
            if (DSLNode[3]['Padding']) {
              padding = DSLNode[3]['Padding']
            }
            // 获取Margin
            let margin = 0
            if (DSLNode[3]['Margin']) {
              margin = DSLNode[3]['Margin']
            }
            if (self.inPath('Margin', self.hoveringDSLItem.path) || self.inPath('Padding', self.hoveringDSLItem.path)) {
              self.drawRelation(self.unitG, axis, relation, pos, true)
            } else {
              self.drawRelation(self.unitG, axis, relation, pos, true)
            }
            if (self.inPath('Alignment', self.hoveringDSLItem.path)) {
              let alignment = 0.5
              if (DSLNode[3]['Alignment']) {
                alignment = DSLNode[3]['Alignment']
              }
              self.drawParentDashline(self.unitG, axis, alignment)
            }
          }
          if (self.inPath('Siblings', self.hoveringDSLItem.path)) {
            // 获取Relation
            let relation = DSLNode[3]['Relation']
            if (relation == 'align') {
              let alignment = 0.5
              if (DSLNode[3]['Alignment']) {
                alignment = DSLNode[3]['Alignment']
              }
              self.drawChildDashline(self.unitG, axis, alignment)
            } else if (relation == 'flatten') {
              self.drawSubtreeRelation(self.unitG, axis, pos)
            }
          }
          // 画Axis，并标注text
          // self.drawParentDashline(self.unitG, axis)
          // self.drawChildDashline(self.unitG, axis)
          self.drawAxis(self.unitG, axis, start - 1, end + 1, pos - tickHeight / Math.abs(tickHeight), tickNum, tickHeight, text)
        }
      }
    },
    focusedDSLObj: function() {
      this.updateTreeUnitLayout()
    },
    focusedDSLObjIndex: function() {
      this.updateTreeUnitLayout()
    },
    treeUnitLayout: function() {
      this.layouts = this.treeUnitLayout
      if (this.treeUnitLayout) {
        this.renderLinearTree(this.treeUnitLayout)
        if (d3.select('#unit-legend').empty()){
          this.drawLegend()
        }
      }
    },
    dragComponentState: function() {
      if (this.dragComponentState === 'DRAG-START') {
        console.log('the state is start drag, but not over', 'show the blue layer')
      } else if (this.dragComponentState === 'DRAG-OVER') {
        console.log('the state is start drag, and also over', 'show the orange layer')
      } else if (this.dragComponentState === 'DRAG-END') {
        console.log('the state is drag end, and also over', 'remove all the layers')        
      }
    }
  },
  computed: {
    ...mapState([
      'hierarchicalData',
      'nodeArray',
      'hierarchicalDSL',
      'hoveringDSLItem',
      'focusedDSLObj',
      'focusedDSLObjIndex',
      'treeUnitLayout',
      'dragComponentState',
      'dslComponentObject'
    ])
  },  
  methods: {
    ...mapMutations([
        'UPDATE_DRAG_COMPONENT_STATE',
        'UPDATE_DSL_COMPONENT_OBJECT_STATE'
    ]),
    handleDragEnter: function() {
      let dragComponentState = 'DRAG-OVER'
      this.UPDATE_DRAG_COMPONENT_STATE(dragComponentState)
    },
    handleDragLeave: function() {
      let dragComponentState = 'DRAG-START'
      this.UPDATE_DRAG_COMPONENT_STATE(dragComponentState)      
    },
    handleDrop: function(dslComponent) {
      let componentType = dslComponent.componentType
      this.dslComponentObject[componentType] = dslComponent.type
      //  更新DSL component的状态
      this.UPDATE_DSL_COMPONENT_OBJECT_STATE()
    },
    computeSize: function () {
      let self = this
      self.treeWidth = self.width * (1 - 3 * self.padding)
      self.treeX1 = self.width * (1.5 * self.padding)
      self.treeX2 = self.treeX1 + self.treeWidth
      self.treeHeight = self.height * (1 - 4 * self.padding)
      self.treeY1 = self.height * (2 * self.padding)
      self.treeY2 = self.treeY1 + self.treeHeight

      self.xAxis = {}
      self.xAxis.Start = self.treeX1 - self.treeX1
      self.xAxis.End = self.treeX2 - self.treeX1
      self.xAxis.Pos = self.height * (1 - 1 * self.padding) - self.treeY1
      self.xAxis.TickNum = 2
      self.xAxis.TickHeight = -5

      self.yAxis = {}
      self.yAxis.Start = self.treeY1 - self.treeY1
      self.yAxis.End = self.treeY2 - self.treeY1
      self.yAxis.Pos = self.width * (0.75 * self.padding) - self.treeX1
      self.yAxis.TickNum = 2
      self.yAxis.TickHeight = 5
    },
    // 更新TreeUnit视图的布局
    updateTreeUnitLayout: function() {
      let focusedDSLObj = this.focusedDSLObj
      let hierarchicalData = window.treeunitData
      if (focusedDSLObj != null) {
        let treeIndexWithDSL = {default: focusedDSLObj.editorId}
        let treeDSLContentObj = {}
        treeDSLContentObj[focusedDSLObj.editorId] = focusedDSLObj.content
        let formData = {
          hierarchicalData: JSON.parse(JSON.stringify(hierarchicalData)),
          treeIndexWithDSL: JSON.parse(JSON.stringify(treeIndexWithDSL)),
          treeDSLContentObj: JSON.parse(JSON.stringify(treeDSLContentObj)),
        }
        this.getTreeUnitLayouts(formData)
      }
    },
    inPath: function(node, path) {
      for (let i = 0; i < path.length; i++) {
        if (node == path[i]) {
          return true
        }
      }
      return false
    },
    drawLegend: function () {
      let self = this
      let subtreeGroup = "subtree group"
      let subtree = "sutree"
      let root = "root"
      let g = d3.select('#' + self.treeGId)
        .append('g')
        .attr('id', 'unit-legend')
      let legendWidth = 0.05
      let fontSize = 12
      let paddingGap = self.width * 0.25
      let paddingOffset = -self.width * 0.08
      let legendX1 = self.width / 2 - 2 * self.padding * self.width - self.width * legendWidth / 2 + paddingOffset - paddingGap
      let legendX2 = self.width / 2 - 2 * self.padding * self.width - self.width * legendWidth / 2 + paddingOffset
      let legendX3 = self.width / 2 - 2 * self.padding * self.width - self.width * legendWidth / 2 + paddingOffset + paddingGap
      let textXOffset = 2.5 * self.width * legendWidth / 2
      self.appendRectXY(g, legendX1, -self.padding * self.height - self.width * legendWidth / 2, self.width * legendWidth, self.height * legendWidth, self.rectParent)
      g.append('text')
        .attr('transform', 'translate(' + (legendX1 + textXOffset) + ',' + -self.padding * self.height + ')')
        .text(root)
        //.attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('font-size', fontSize + 'px')
      self.appendRectXY(g, legendX2, -self.padding * self.height - self.width * legendWidth / 2, self.width * legendWidth, self.height * legendWidth, self.rectChild)
      g.append('text')
        .attr('class', 'legend-la')
        .attr('transform', 'translate(' + (legendX2 + textXOffset) + ',' + -self.padding * self.height + ')')
        .text(subtree)
        //.attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('font-size', fontSize + 'px')
      self.appendRectXY(g, legendX3, -self.padding * self.height - self.width * legendWidth / 2, self.width * legendWidth, self.height * legendWidth, self.rectSubtree)
      g.append('text')
        .attr('transform', 'translate(' + (legendX3 + textXOffset) + ',' + -self.padding * self.height + ')')
        .text(subtreeGroup)
        //.attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('font-size', fontSize + 'px')
    },
    // 画出表示Padding的图案：
    //    direction：'x'横着画，'y'竖着画
    drawPM: function (paddingG, direction, start, end, pos, height, arrowHeight = 0.5, padding = 0) {
      let self = this
      if (direction === 'x') {
        self.appendLineXY(paddingG, start - padding, start - padding, pos, pos + height, self.lineGrey)
        self.appendLineXY(paddingG, end + padding  , end + padding  , pos, pos + height, self.lineGrey)
        self.appendLineXY(paddingG, start - self.paddingArrowLen, start, pos + arrowHeight * height, pos + arrowHeight * height, self.lineGreyMark)
        self.appendLineXY(paddingG, end + self.paddingArrowLen  , end  , pos + arrowHeight * height, pos + arrowHeight * height, self.lineGreyMark)
      } else {
        self.appendLineYX(paddingG, start - padding, start - padding, pos, pos + height, self.lineGrey)
        self.appendLineYX(paddingG, end + padding  , end + padding  , pos, pos + height, self.lineGrey)
        self.appendLineYX(paddingG, start - self.paddingArrowLen, start, pos + arrowHeight * height, pos + arrowHeight * height, self.lineGreyMark)
        self.appendLineYX(paddingG, end + self.paddingArrowLen  , end  , pos + arrowHeight * height, pos + arrowHeight * height, self.lineGreyMark)
      }
    },

    drawSubtreeRelation: function (g, direction, pos) {
      let self = this
      if (direction == 'x') {
        self.appendRectXY(g, self.AreaData['index-1']['x'], pos - self.relationRectHeight, self.AreaData['index-1']['Width'], self.relationRectHeight, self.rectChild)
        self.appendRectXY(g, self.AreaData['index-2']['x'], pos - self.relationRectHeight, self.AreaData['index-2']['Width'], self.relationRectHeight, self.rectChild)
        self.appendRectXY(g, self.AreaData['index-3']['x'], pos - self.relationRectHeight, self.AreaData['index-3']['Width'], self.relationRectHeight, self.rectChild)
        let childXEnds = [+self.AreaData['index-1']['x'] + self.AreaData['index-1']['Width'], 
                          +self.AreaData['index-2']['x'] + self.AreaData['index-2']['Width'], 
                          +self.AreaData['index-3']['x'] + self.AreaData['index-3']['Width']]
        let childXStarts = [+self.AreaData['index-1']['x'], 
                            +self.AreaData['index-2']['x'], 
                            +self.AreaData['index-3']['x']]
        childXEnds.sort(function (a, b) {return a - b})
        childXStarts.sort(function (a, b) {return a - b})
        if (childXEnds[0] > childXStarts[1]) {
          self.drawPM(g, direction, childXStarts[1], childXEnds[0], pos - self.relationRectHeight, -self.paddingHeight)
        } else {
          self.drawPM(g, direction, childXEnds[0], childXStarts[1], pos - self.relationRectHeight, -self.paddingHeight)
        }
      } else {
        self.appendRectYX(g, self.AreaData['index-1']['y'], pos                          , self.AreaData['index-1']['Height'], self.relationRectHeight, self.rectChild)
        self.appendRectYX(g, self.AreaData['index-2']['y'], pos                          , self.AreaData['index-2']['Height'], self.relationRectHeight, self.rectChild)
        self.appendRectYX(g, self.AreaData['index-3']['y'], pos                          , self.AreaData['index-3']['Height'], self.relationRectHeight, self.rectChild)
        let childYEnds = [+self.AreaData['index-1']['y'] + self.AreaData['index-1']['Height'], 
                          +self.AreaData['index-2']['y'] + self.AreaData['index-2']['Height'], 
                          +self.AreaData['index-3']['y'] + self.AreaData['index-3']['Height']]
        let childYStarts = [+self.AreaData['index-1']['y'], 
                            +self.AreaData['index-2']['y'], 
                            +self.AreaData['index-3']['y']]
        childYEnds.sort(function (a, b) {return a - b})
        childYStarts.sort(function (a, b) {return a - b})
        if (childYEnds[0] > childYStarts[1]) {
          self.drawPM(g, direction, childYStarts[1], childYEnds[0], pos + self.relationRectHeight, self.paddingHeight)
        } else {
          self.drawPM(g, direction, childYEnds[0], childYStarts[1], pos + self.relationRectHeight, self.paddingHeight)
        }
      }
    },

    drawParentDashline: function (g, axis, alignment) {
      let self = this
      if (alignment === 'top') {
        alignment = 0
      } else if (alignment === 'left') {
        alignment = 0
      } else if (alignment === 'bottom') {
        alignment = 1
      } else if (alignment === 'right') {
        alignment = 1
      } else if (alignment === 'center') {
        alignment = 0.5
      }
      if (axis === 'x') {
        let xPos = (self.parentPos.X2 - self.parentPos.X1) * alignment + self.parentPos.X1
        self.appendLineYX(g, self.xAxis.Pos, self.yAxis.Start, xPos, xPos, self.lineParentDash)
      } else {
        let yPos = (self.parentPos.Y2 - self.parentPos.Y1) * alignment + self.parentPos.Y1
        self.appendLineXY(g, self.yAxis.Pos, self.xAxis.End, yPos, yPos, self.lineParentDash)
      }
    },

    drawChildDashline: function (g, axis, alignment) {
      let self = this
      if (alignment === 'top') {
        alignment = 0
      } else if (alignment === 'left') {
        alignment = 0
      } else if (alignment === 'bottom') {
        alignment = 1
      } else if (alignment === 'right') {
        alignment = 1
      } else if (alignment === 'center') {
        alignment = 0.5
      }
      if (axis === 'x') {
        let xPos = (self.childPos.X2 - self.childPos.X1) * alignment + self.childPos.X1
        self.appendLineYX(g, self.xAxis.Pos, self.yAxis.Start, xPos, xPos, self.lineChildDash)
      } else {
        let yPos = (self.childPos.Y2 - self.childPos.Y1) * alignment + self.childPos.Y1
        self.appendLineXY(g, self.yAxis.Pos, self.xAxis.End, yPos, yPos, self.lineChildDash)
      }
    },

    // 画出表示Relation的图案：
    //    direction：'x'横着画，'y'竖着画
    //    category：Relation的种类
    // 表示Padding的图形也在这里调用
    drawRelation: function (relationG, direction, category, pos, ifDrawPM = false) {
      let self = this
      let rectHeight = self.relationRectHeight
      if (category === 'included') {
        if (direction === 'x') {
          self.appendRectXY(relationG, self.parentPos.X1, pos - 2 * rectHeight, self.parentPos.X2 - self.parentPos.X1, rectHeight, self.rectParent)
          self.appendRectXY(relationG, self.childPos.X1 , pos - 1 * rectHeight, self.childPos.X2  - self.childPos.X1 , rectHeight, self.rectChild)
          if (self.childPos.X1 - self.parentPos.X1 < 0 && ifDrawPM) {
            self.drawPM(relationG, direction, self.childPos.X1, self.parentPos.X1, pos - rectHeight, -self.paddingHeight, 0.75)
          }
        } else {
          self.appendRectYX(relationG, self.parentPos.Y1, pos + 1 * rectHeight, self.parentPos.Y2 - self.parentPos.Y1, rectHeight, self.rectParent)
          self.appendRectYX(relationG, self.childPos.Y1 , pos + 0 * rectHeight, self.childPos.Y2  - self.childPos.Y1 , rectHeight, self.rectChild)
          if (self.childPos.Y1 - self.parentPos.Y1 < 0 && ifDrawPM) {
            self.drawPM(relationG, direction, self.childPos.Y1, self.parentPos.Y1, pos + rectHeight, self.paddingHeight, 0.75)
          }
        }
      } else if (category == 'juxtapose') {
          if (direction === 'x') {
            self.appendRectXY(relationG, self.childPos.X1 , pos - rectHeight, self.childPos.X2  - self.childPos.X1 , rectHeight, self.rectChild)
            self.appendRectXY(relationG, self.parentPos.X1, pos - rectHeight, self.parentPos.X2 - self.parentPos.X1, rectHeight, self.rectParent)
            if (self.childPos.X2 - self.parentPos.X1 > 0 && ifDrawPM) {
              self.drawPM(relationG, direction, self.parentPos.X2, self.childPos.X1, pos - rectHeight, -self.paddingHeight)
            } else if (self.childPos.X2 - self.parentPos.X1 < 0 && ifDrawPM) {
              self.drawPM(relationG, direction, self.childPos.X1, self.parentPos.X2, pos - rectHeight, -self.paddingHeight)
            }
          } else {
            self.appendRectYX(relationG, self.childPos.Y1 , pos             , self.childPos.Y2  - self.childPos.Y1 , rectHeight, self.rectChild)
            self.appendRectYX(relationG, self.parentPos.Y1, pos             , self.parentPos.Y2 - self.parentPos.Y1, rectHeight, self.rectParent)
            if (self.childPos.Y2 - self.parentPos.Y1 > 0 && ifDrawPM) {
              self.drawPM(relationG, direction, self.parentPos.Y2, self.childPos.Y1, pos + rectHeight, self.paddingHeight)
            } else if (self.childPos.Y2 - self.parentPos.Y1 < 0 && ifDrawPM) {
              self.drawPM(relationG, direction, self.childPos.Y1, self.parentPos.Y2, pos + rectHeight, self.paddingHeight)
            }
          }
      } else if (category === 'include') {
        if (direction === 'x') {
          self.appendRectXY(relationG, self.parentPos.X1, pos - 1 * rectHeight, self.parentPos.X2 - self.parentPos.X1, rectHeight, self.rectParent)
          self.appendRectXY(relationG, self.childPos.X1 , pos - 2 * rectHeight, self.childPos.X2  - self.childPos.X1 , rectHeight, self.rectChild)
          if (self.childPos.X1 - self.parentPos.X1 > 0 && ifDrawPM) {
            self.drawPM(relationG, direction, self.parentPos.X1, self.childPos.X1, pos - rectHeight, -self.paddingHeight, 0.75)
          }
        } else {
          self.appendRectYX(relationG, self.parentPos.Y1, pos + 0 * rectHeight, self.parentPos.Y2 - self.parentPos.Y1, rectHeight, self.rectParent)
          self.appendRectYX(relationG, self.childPos.Y1 , pos + 1 * rectHeight, self.childPos.Y2  - self.childPos.Y1 , rectHeight, self.rectChild)
          if (self.childPos.Y1 - self.parentPos.Y1 > 0 && ifDrawPM) {
            self.drawPM(relationG, direction, self.parentPos.Y1, self.childPos.Y1, pos + rectHeight, self.paddingHeight, 0.75)
          }
        }
      }
    },

    // 画X轴或者Y轴，由direction指定
    drawAxis: function (axisG, direction, start, end, pos, tickNum, tickHeight, text) {
      let self = this
      let length = end - start
      let textDirection = Math.abs(tickHeight) / tickHeight
      let fontSize = self.axisFontSize
      let fontPadding = 2
      if (direction == 'x') {
        self.appendLineXY(axisG, start, end, pos, pos, self.lineGrey)
        for (let i = 0; i < tickNum; i++) {
          self.appendLineXY(axisG, start + i * length / (tickNum - 1), start + i * length / (tickNum - 1), pos, pos + tickHeight, self.lineGrey)
        }
        axisG.append('text')
        .text(text)
        .attr('transform', 'translate(' + (start + end) / 2 + ',' + (pos - textDirection * (fontSize + fontPadding)) + ')')
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('font-size', fontSize + 'px')
      } else {
        self.appendLineYX(axisG, start, end, pos, pos, self.lineGrey)
        for (let i = 0; i < tickNum; i++) {
          self.appendLineYX(axisG, start + i * length / (tickNum - 1), start + i * length / (tickNum - 1), pos, pos + tickHeight, self.lineGrey)
        }
        axisG.append('text')
        .text(text)
        .attr('transform', 'translate(' + (pos - textDirection * (fontSize + fontPadding)) + ',' + (start + end) / 2 + ')')
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('writing-mode', 'vertical-rl')
        .attr('font-size', fontSize + 'px')
      }
    },

    //  [QinMei] 渲染最终的树可视化形式，
    renderLinearTree: function (treelayout) {
      let self = this
      //  遍历得到全部nodeId的数组
      let nodeIdArray = []
      let treeLayoutArray = []
      for (let nodeId in treelayout) {
        nodeIdArray.push(nodeId)
        treeLayoutArray.push(treelayout[nodeId])
      }
      // nodeIdArray = nodeIdArray.sort()
      nodeIdArray = nodeIdArray.sort(function(a, b) {
        var aNum = a.replace('index-', '')
        var bNum = b.replace('index-', '')
        return aNum - bNum
      })
      let currentRootID = nodeIdArray[0]

      // console.log('treelayout',treelayout)
      let AreaData = {}
      //  用于数据绑定的数组
      let AreaDataArray = []
      let LinkData = []
      //嵌套创建每个子树的绘制区域以及存储实际，最后循环绘图
      //递归初始化
      let beginID = 1
      //  根据索引得到的posLen对象设置宽度和高度
      let beginRealWidth = self.treeWidth
      let beginRealHeight = self.treeHeight 
      let beginX = 0
      let beginY = 0
      let depth = 1
      AreaData[treelayout[currentRootID].id] = {
        'fatherID':null,
        'x':0,
        'isLeaf':1,
        'y':0,
        'Rootx':0,
        'Rooty':0,
        'RootWidth':0,
        'RootHeight':0,
        'Width':beginRealWidth,
        'Height':beginRealHeight,
        'depth':1,
        'id':treelayout[currentRootID].id
      }
      for (let index = 0; index < nodeIdArray.length; index++) {
        let nodeId = nodeIdArray[index]
        let currentNode = AreaData[treelayout[nodeId].id]
        let widthscale = currentNode.Width/treelayout[nodeId].width
        let heightscale = currentNode.Height/treelayout[nodeId].height
        currentNode.Rootx = treelayout[nodeId].root.x * widthscale
        currentNode.Rooty = treelayout[nodeId].root.y * heightscale
        currentNode.RootWidth = treelayout[nodeId].root.width * widthscale
        currentNode.RootHeight = treelayout[nodeId].root.height * heightscale
        depth = currentNode.depth
        AreaData[treelayout[nodeId].id] = currentNode
        for(let j=0;j<treelayout[nodeId].subtreeLayout.length;j++){
          currentNode.isLeaf = 0
          let SonID = treelayout[nodeId].subtreeLayout[j].id
          AreaData[SonID] = 
            {'fatherID':treelayout[nodeId].id,
              'x': currentNode.x+treelayout[nodeId].subtreeLayout[j].x * widthscale,
              'y': currentNode.y+treelayout[nodeId].subtreeLayout[j].y * heightscale,
              'Rootx': 0,
              'Rooty': 0,
              'RootWidth': 0,
              'RootHeight': 0,
              'isLeaf': 1,
              'Width': treelayout[nodeId].subtreeLayout[j].width * widthscale,
              'Height':treelayout[nodeId].subtreeLayout[j].height * heightscale,
              'depth':currentNode.depth + 1,
              'id': SonID}
          let linkdata = {'beginid':treelayout[nodeId].id,'endid':SonID}
          LinkData.push(linkdata)
        }
      }
      for (let item in AreaData) {
        AreaDataArray.push(AreaData[item])
      }
      // console.log('AreaData',AreaData)
      // console.log('AreaDataArray',AreaDataArray)
      self.AreaData = AreaData
      // 画Subtree虚线框
      //self.renderSubtreeRect()
      // ---------------- 各种辅助函数 ----------------
      let lastSubtreeId = 4
      // 计算文字位置的函数
      let textTransform = function (d) {
        let textX = AreaData[d.id].x + AreaData[d.id].Rootx + AreaData[d.id].RootWidth / 2
        let textY = AreaData[d.id].y + AreaData[d.id].Rooty + AreaData[d.id].RootHeight / 2
        let id = d.id.split('-')
        id = +id[1]
        if (id > 0 && id < lastSubtreeId) {
          textX = AreaData[d.id].x + AreaData[d.id].Width / 2
          textY = AreaData[d.id].y + AreaData[d.id].Height / 2
        }
        return 'translate(' + textX + ',' + textY + ')'
      }
      let rectX = function (d) {
        let id = d.id.split('-')
        id = +id[1]
        if (id > 0 && id < lastSubtreeId) {
          return AreaData[d.id].x + 1
        } else {
          return AreaData[d.id].x + AreaData[d.id].Rootx + 1
        }
      }
      let rectY = function (d) {
        let id = d.id.split('-')
        id = +id[1]
        if (id > 0 && id < lastSubtreeId) {
          return AreaData[d.id].y + 1
        } else {
          return AreaData[d.id].y + AreaData[d.id].Rooty + 1
        }
      }
      let rectWidth = function (d) {
        let id = d.id.split('-')
        id = +id[1]
        if (id > 0 && id < lastSubtreeId) {
          return AreaData[d.id].Width - 2
        } else {
          return AreaData[d.id].RootWidth - 2
        }
      }
      let rectHeight = function (d) {
        let id = d.id.split('-')
        id = +id[1]
        if (id > 0 && id < lastSubtreeId) {
          return AreaData[d.id].Height - 2
        } else {
          return AreaData[d.id].RootHeight - 2
        }
      }
      let rectFill = function (d) {
        let id = d.id.split('-')
        id = id[1]
        if (id === '0') {
          return "none"
        } else if (id === '1') {
          return self.childFill
        } else if (id === '2') {
          return self.childFill
        } else if (id === '3') {
          return self.childFill
        } else return self.childFill
      }
      let rectStroke = function (d) {
        let id = d.id.split('-')
        id = id[1]
        if (id === '0') {
          return '#000000'
        } else if (id === '1') {
          return '#ffffff'
        } else if (id === '2') {
          return '#ffffff'
        } else if (id === '3') {
          return '#ffffff'
        } else return '#ffffff'
      }
      let gDisplay = function (d) {
        let id = d.id.split('-')
        id = +id[1]
        if (id > 3) {
          return 'none'
        } else {
          return null
        }
      }
      let textText = function (d) {
        let id = d.id.split('-')
        id = id[1]
        if (id === '0') {
          return 'R'
        } else if (id === '1') {
          return 'A'
        } else if (id === '2') {
          return 'B'
        } else if (id === '3') {
          return 'C'
        } else return id
      }
      let textFill = function (d) {
        let id = d.id.split('-')
        id = id[1]
        if (id === '0') {
          return '#000000'
        } else if (id === '1') {
          return '#000000'
        } else if (id === '2') {
          return '#000000'
        } else if (id === '3') {
          return '#000000'
        } else return '#000000'
      }
      // 自适应字体大小
      let textFontSize = function (d) {
        let x = +rectWidth(d)
        let y = +rectHeight(d)
        let minxy = Math.min(x, y)
        if (minxy > self.nodeFontSize) {
          return self.nodeFontSize
        } else {
          return minxy
        }
      }
      // 如果root被Subtrees包围了，为了避免遮挡，root不再进行标注
      let textDisplay = function (d) {
        let id = d.id.split('-')
        id = id[1]
        if (id === '0') {
          if (self.parentPos.X1 < self.childPos.X1 && self.parentPos.Y1 < self.childPos.Y1 && self.parentPos.X2 > self.childPos.X2 && self.parentPos.Y2 > self.childPos.Y2) {
            return 'none'
          } else {
            return null
          }
        } else {
          return gDisplay(d)
        }
      }
      // ---------------- ----------- ----------------
      // treeNodeElement与data绑定
       
      if (isNaN(AreaDataArray[AreaDataArray.length - 1]['RootHeight'])) return 0
      self.renderSubtreeRect()
      let treeNodeElement = d3.select('#'+self.treeGId)
        .selectAll('.treeunit-node')
        .data(AreaDataArray, function (d) {
          return d.id[d.id.length - 1]
        })
      // 添加视觉元素
      let treeNodeElementEnterG = treeNodeElement.enter()
        .append('g')
        .attr('class', 'treeunit-node')
        .attr('id',function(d,i){
          return 'root'+d.id
        })
        .attr('display', gDisplay)
      treeNodeElementEnterG.append('rect')
        .attr('x', rectX)
        .attr('y', rectY)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('fill', rectFill)
        .style('stroke', rectStroke)
        .style('stroke-width', '1px')
      treeNodeElementEnterG.append('text')
        .text(textText)
        .attr('transform', textTransform)
        .attr('font-size', textFontSize)
        .attr('display', textDisplay)
        .attr('fill', textFill)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
      // 更新视觉元素的属性
      treeNodeElement
        .transition()
        .duration(1000)
        .select('rect')
        .attr('x', rectX)
        .attr('y', rectY)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('fill', rectFill)
        .style('stroke', rectStroke)
        .style('stroke-width', '1px')
      treeNodeElement
        .transition()
        .duration(1000)
        .select('text')
        .attr('transform', textTransform)
        .attr('font-size', textFontSize)
        .attr('display', textDisplay)
      // 去除多余的视觉元素
      treeNodeElement.exit().remove()
    },
    renderSubtreeRect: function () {
      let self = this
      self.parentPos = {}
      self.parentPos.X1 = self.AreaData['index-0']['x'] + self.AreaData['index-0']['Rootx']
      self.parentPos.X2 = self.AreaData['index-0']['x'] + self.AreaData['index-0']['Rootx'] + self.AreaData['index-0']['RootWidth']
      self.parentPos.Y1 = self.AreaData['index-0']['y'] + self.AreaData['index-0']['Rooty']
      self.parentPos.Y2 = self.AreaData['index-0']['y'] + self.AreaData['index-0']['Rooty'] + self.AreaData['index-0']['RootHeight']
      self.childPos = {}
      self.childPos.X1 = Math.min(self.AreaData['index-1']['x'], 
                                  self.AreaData['index-2']['x'], 
                                  self.AreaData['index-3']['x'])
      self.childPos.X2 = Math.max(self.AreaData['index-1']['x'] + self.AreaData['index-1']['Width'], 
                                  self.AreaData['index-2']['x'] + self.AreaData['index-2']['Width'], 
                                  self.AreaData['index-3']['x'] + self.AreaData['index-3']['Width'])
      self.childPos.Y1 = Math.min(self.AreaData['index-1']['y'], 
                                  self.AreaData['index-2']['y'], 
                                  self.AreaData['index-3']['y'])
      self.childPos.Y2 = Math.max(self.AreaData['index-1']['y'] + self.AreaData['index-1']['Height'], 
                                  self.AreaData['index-2']['y'] + self.AreaData['index-2']['Height'], 
                                  self.AreaData['index-3']['y'] + self.AreaData['index-3']['Height'])
      let padding = self.subtreeAreaRectPadding
      if (d3.select('#subtree-rect-g').select('rect').empty()){
        d3.select('#subtree-rect-g')
          .append('rect')
          .attr('x', self.childPos.X1 - padding)
          .attr('y', self.childPos.Y1 - padding)
          .attr('width', self.childPos.X2 - self.childPos.X1 + padding * 2)
          .attr('height', self.childPos.Y2 - self.childPos.Y1 + padding * 2)
          .style('fill', 'none')
          .style('stroke', self.childFill)
          .style('stroke-width', '2px')
          .style('stroke-dasharray', '5,5')
      } else {
        if (isNaN(self.childPos.X1) || isNaN(self.childPos.Y1) || (isNaN(self.childPos.X2)) || (isNaN(self.childPos.Y2))) {
          d3.select('#subtree-rect-g')
            .select('rect')
            .remove()
        } else {
          //  只有在矩形的属性值是合法数值时，才支持进行动画过渡
          d3.select('#subtree-rect-g')
            .select('rect')
            .transition()
            .duration(1000)
            .attr('x', self.childPos.X1 - padding)
            .attr('y', self.childPos.Y1 - padding)
            .attr('width', self.childPos.X2 - self.childPos.X1 + padding * 2)
            .attr('height', self.childPos.Y2 - self.childPos.Y1 + padding * 2)
        }     
      }
    },

    treeLayoutArrayCompare: function (a, b) {
      return a.id[a.id.length - 1] - b.id[b.id.length - 1]
    },

    // -------- 根据指定的参数画Rect --------
    appendRectXY: function (g, x, y, width, height, config) {
        let self = this
        if (!config) {
          config = self.rectNormal
        }
        let fill = config.fill
        let stroke = config.stroke
        let strokeWidth = config.strokeWidth
        let strokeDasharray = config.strokeDasharray
        let fillOpacity = config.fillOpacity
        let stripe = config.stripe
        let innerPadding = config.innerPadding
        let rect = g.append('rect')
        .attr('x', x + innerPadding)
        .attr('y', y + innerPadding)
        .attr('width', width - 2 * innerPadding)
        .attr('height', height - 2 * innerPadding)
        .style('fill', fill)
        .style('fill-opacity', fillOpacity)
        .style('stroke', stroke)
        .style('stroke-width', strokeWidth)
        .style('stroke-linecap', 'butt')
        .style('stroke-linejoin', 'miter')
      if (stripe) {
        rect.style('fill', stripe)
      }
      if (strokeDasharray) {
        rect.style('stroke-dasharray', strokeDasharray)
      }
    },
    appendRectYX: function (g, y, x, height, width, config) {
        let self = this
        if (!config) {
          config = self.rectNormal
        }
        let fill = config.fill
        let stroke = config.stroke
        let strokeWidth = config.strokeWidth
        let strokeDasharray = config.strokeDasharray
        let fillOpacity = config.fillOpacity
        let stripe = config.stripe
        let innerPadding = config.innerPadding
        let rect = g.append('rect')
        .attr('x', x + innerPadding)
        .attr('y', y + innerPadding)
        .attr('width', width - 2 * innerPadding)
        .attr('height', height - 2 * innerPadding)
        .style('fill', fill)
        .style('fill-opacity', fillOpacity)
        .style('stroke', stroke)
        .style('stroke-width', strokeWidth)
      if (stripe) {
        rect.style('fill', stripe)
      }
      if (strokeDasharray) {
        rect.style('stroke-dasharray', strokeDasharray)
      }
    },
    // -------- ------------------ --------

    // -------- 根据指定的参数画Line --------
    appendLineXY: function (g, x1, x2, y1, y2, config) {
      let self = this
      if (!config) {
        config = self.lineBlack
      }
      let endMarker = config.endMarker
      let stroke = config.stroke
      let strokeWidth = config.strokeWidth
      let strokeDasharray = config.strokeDasharray
      var line = null
      if ((!isNaN(x1)) && (!isNaN(x2)) && (!isNaN(y1)) && (!isNaN(y2))) {
        line = g.append('line')
          .attr('x1', x1)
          .attr('x2', x2)
          .attr('y1', y1)
          .attr('y2', y2)
          .style('stroke', stroke)
          .style('stroke-width', strokeWidth)
        if (endMarker) {
          line.attr('marker-end', 'url(#markerArrow)')
          if (x1 > x2) {
            line.attr('x2', x2 + self.markerLen)
          } else {
            line.attr('x2', x2 - self.markerLen)
          }
        }
      }
      if (strokeDasharray) {
        if (line != null) {
          line.style('stroke-dasharray', strokeDasharray)
        }
      }
    },
    appendLineYX: function (g, y1, y2, x1, x2, config) {
      let self = this
      if (!config) {
        config = self.lineBlack
      }
      let endMarker = config.endMarker
      let stroke = config.stroke
      let strokeWidth = config.strokeWidth
      let strokeDasharray = config.strokeDasharray
      let line = g.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y1)
        .attr('y2', y2)
        .style('stroke', stroke)
        .style('stroke-width', strokeWidth)
      if (endMarker) {
        line.attr('marker-end', 'url(#markerArrow)')
        if (y1 > y2) {
          line.attr('y2', y2 + self.markerLen)
        } else {
          line.attr('y2', y2 - self.markerLen)
        }
      }
      if (strokeDasharray) {
        line.style('stroke-dasharray', strokeDasharray)
      }
    },
    // -------- ------------------ --------

    // 添加Marker，用于表示箭头 
    appendMarker: function () {
      let self = this
      let marker = d3.select('#' + self.treeCanvasId)
        .append('defs')
        .append('marker')
        .attr('id', 'markerArrow')
        .attr('viewBox', '0 0 20 20')
        .attr('markerWidth', self.markerLen)
        .attr('markerHeight', self.markerLen)
        .attr('refX', '0')
        .attr('refY', '10')
        .attr('orient', 'auto')
      marker.append('path')
        .attr('d', 'M 0 0 L 20 10 L 0 20 z')
        .style('fill', '#999999')
    },
    // 添加斜条纹，用来表示Overlapping的区域
    appendRectStripe: function () {
      let self = this
      let lGX = d3.select('#' + self.treeCanvasId)
      .append('defs')
      .append('linearGradient')
      .attr('id', 'lgStripeX')
      .attr('x1', '0%')
      .attr('x2', '10%')
      .attr('y1', '0%')
      .attr('y2', '2%')
      .attr('spreadMethod', 'repeat')
      lGX.append('stop')
      .attr('stop-color', self.parentFill)
      .attr('offset', '50%')
      lGX.append('stop')
      .attr('stop-color', self.childFill)
      .attr('offset', '50%')
      let lGY = d3.select('#' + self.treeCanvasId)
      .append('defs')
      .append('linearGradient')
      .attr('id', 'lgStripeY')
      .attr('x1', '0%')
      .attr('x2', '2%')
      .attr('y1', '0%')
      .attr('y2', '10%')
      .attr('spreadMethod', 'repeat')
      lGY.append('stop')
      .attr('stop-color', self.parentFill)
      .attr('offset', '50%')
      lGY.append('stop')
      .attr('stop-color', self.childFill)
      .attr('offset', '50%')
    },

    ...mapActions([
      'getTreeUnitLayouts'
    ])
  }
}
</script>

<style scoped lang="less">
  .treeunit-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0%;
    left: 0%;
    .tree-unit-canvas {
      width: 100%;
      height: 100%;
    }
  }
  
  // .container {
  //   position: absolute;
  //   left: 2.5%;
  //   top: 2.5%;
  //   right: 2.5%;
  //   bottom: 2.5%;
  //   background-color: #fff;
  //   #drop-container {
  //     width: 100%;
  //     height: 100%;
  //   }
  // }
</style>

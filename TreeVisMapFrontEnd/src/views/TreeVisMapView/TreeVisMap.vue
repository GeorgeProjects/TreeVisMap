<template>
	<div class="tree-vis-map">
		<svg :id="treeVisMapCanvasId">
		</svg>
	</div>
</template>
<script>
	import { mapState, mapMutations, mapActions } from 'vuex'
	import { getTreeDistanceMatrix } from '@/data-processing/get_tree_distance_matrix.js'
	import { getTSNEProjectionResult } from '@/data-processing/get_tsne_projection_result.js'
	export default {
		name: 'TreeVisMapView',
		components: {
		},
		props: {
			maxDslAmountIndex: {
			  	type: Number
			}
		},
		data() {
			return {
				treeVisMapCanvasId: 'tree-vis-map-canvas',
				treeVisMapCanvasWidth: 0,
				treeVisMapCanvasHeight: 0
			}
		},
		watch: {

		},
		created: function () {

		},
		beforeMount: function() {

		},
		mounted: function() {
			console.log('computeTreeDistance')
			this.treeVisMapCanvasWidth = $('#' + this.treeVisMapCanvasId).width()
      		this.treeVisMapCanvasHeight = $('#' + this.treeVisMapCanvasId).height()
      		this.computeTreeDistance()
		},
		computed: {
		    ...mapState([
		    ])
		},
		methods: {
			...mapMutations([
		    ]),
		    computeTreeDistance: function() {
		    	let treeDistanceMatrix = null
		    	let computeDistanceMatrixDefer = $.Deferred()
		    	// $.when(computeDistanceMatrixDefer).then(function () {
		    	// 	console.log('treeDistanceMatrix', treeDistanceMatrix)
		    		
		    	// })
		    	getTreeDistanceMatrix(this.maxDslAmountIndex, this.callbackFunc)
		    	// render the projection results
		    	this.render_projection_result()
		    },
		    callbackFunc: function(treeDistanceMatrix) {
				let projectionResult = getTSNEProjectionResult(treeDistanceMatrix)
				this.render_projection_result(projectionResult)
		    },
		    render_projection_result: function(projectionResult) {
		    	let self = this
		    	let treeVisMapCanvasWidth = self.treeVisMapCanvasWidth
		    	let treeVisMapCanvasHeight = self.treeVisMapCanvasHeight
		    	let xScale = d3.scaleLinear()
				  .domain([-1, 1])
				  .range([0, treeVisMapCanvasWidth])
				let yScale = d3.scaleLinear()
				  .domain([-1, 1])
				  .range([0, treeVisMapCanvasHeight])
		    	console.log('projectionResult', projectionResult)
		    	if (typeof(projectionResult) !== 'undefined') {
		    		let treeNodeElementG = d3.select(this.$el)
				        .select('#' + this.treeVisMapCanvasId)
				        .selectAll('.treevis-node')
				        .data(projectionResult)
				      //  创建视觉元素
				    treeNodeElementG.enter()
				      .append('circle')
				      .attr('class', 'treevis-node')
				      .attr('cx', function(d, i) {
				      	return xScale(d[0])
				      })
				      .attr('cy', function(d, i) {
				      	return yScale(d[1])
				      })
				      .attr('r', 5)
		    	}
		    	
		    }
		}
	}
</script>
<style lang="less">
	@border-style: 0.05rem solid rgba(180, 180, 180, 0.3);
	.tree-vis-map {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		width: 100%;
		height: 100%;
		#tree-vis-map-canvas {
			width: 100%;
			height: 100%;
			background-color: white;
			border: 1px solid #ddd;
			.treevis-node {
				fill: steelblue;
			}
		}
	}
</style>
<template>
	<div class = "dsl-teaser-container">
		<div class = "example">
			<div class = "preview" :style="dslObj.styleObject"></div>
			<div class = "name">{{dslObj.name}}</div>
		</div>
	</div>
</template>

<script>
  import GoTreeSketchFigure from './GoTreeSketchFigure.vue';
  import { Drag, Drop } from 'vue-drag-drop';
  import { mapMutations } from 'vuex';

  export default {
	name: 'GoTreeSketchFigure',
	components: {
		GoTreeSketchFigure, Drag, Drop
	},
	props: {
		dslId: {
			type: String
		}
	},
	data() {
	  return {
	  	dslObj: {}
	  }	
	},
	created: function () {
	},
	beforeMount: function() {
		let dslId = this.dslId
		let dslTemplateObj = {
			name: dslId,
			styleObject: {
				backgroundImage: 'url(examples/' + dslId + '.png)'
			}
		}
		this.dslObj = dslTemplateObj
	},
	mounted: function() {
	},
	computed: {
	},
	methods: {
 	}
  }
</script>

<style lang="less">
	.dsl-teaser-container {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		// width: 100%;
		height: 100%;
		.example {
			width: 100%;
			height: 100%;
			cursor: pointer;
			// border-radius: 0.4rem 0.4rem 0.4rem 0.4rem ;
			// border: #eeeeee solid 1px;
				.preview {
		  			width: 100%;
		  			height: 85%;
					background-size: contain;
					background-position: center;
					background-repeat: no-repeat;	  		
				}
				.name {
					width: 100%;
					height: 15%;
					// border-top: solid 1px #666;
					font-size: 12px;
					text-align: center;
				}
				// &:hover {
				// 	box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
				// }
		}
	}
</style>

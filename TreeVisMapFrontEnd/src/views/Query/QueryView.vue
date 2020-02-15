<template>
	<div class = "query-container">
		<div class = "label">
			<span class = "inner-title">Query</span>
		</div>
		<div class = "component-container">
		</div>
	</div>
</template>
<script>
	export default {
		name: 'DataView',
		components: {
			
		},
		data() {
			return {

			}
		},
		watch: {

		},
		created: function () {
		},
		beforeMount: function() {

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
  	@border-style: 0.05rem solid rgba(180, 180, 180, 0.3);
	.query-container {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		width: 100%;
		height: 100%;
		.label {
			text-align: left;
			padding-left: 10px;
			font-weight: bold;
			height: 2rem;
			right: 0%;
			display: table;
			.inner-title {
			  vertical-align: middle;
			  display: table-cell;
			}
		}
		.component-container{
			position: absolute;
			width: 100%;
			top: 2rem;
			bottom: 0%;
			left: 0%;
			display: flex;
			border-top: @border-style;
		}
	}
</style>
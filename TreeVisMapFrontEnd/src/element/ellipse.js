//	定义circle内部的参数
export function Ellipse (centerPos, radiusX, radiusY) {
	this.cx = centerPos.x
	this.cy = centerPos.y
	this.radiusX = Math.round(radiusX);
	this.radiusY = Math.round(radiusY);
}
//	定义circle的prototype, 即rect对象内部的方法
Ellipse.prototype = {
	init: function() {
		
	},
	updateData: function() {
		
	},
	generatePath: function (){
		let cx = this.cx
		let cy = this.cy
		let rx = this.radiusX
		let ry = this.radiusY 
   		return 'M' + (cx - rx)+',' + cy + 'a' + rx+',' + ry+' 0 1,0 '+ 2*rx + ',0a' + rx + ',' + ry + ' 0 1,0 ' + (-2 * rx) + ',0'
	}
}

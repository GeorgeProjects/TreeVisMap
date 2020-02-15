//	定义circle内部的参数

export function Triangle (tx, ty, tw, th, direction) {
	this.tx = tx
	this.ty = ty
	this.tw = tw
	this.th = th
	this.direction = direction
}
//	定义circle的prototype, 即rect对象内部的方法
Triangle.prototype = {
	getNodePosArray: function () {
		let tx = this.tx, ty = this.ty, tw = this.tw, th = this.th, direction = this.direction
		let triangleNodePosArray = [
	      {x: tx + tw / 2,  y: ty}, 
	      {x: tx,           y: ty + th}, 
	      {x: tx + tw,      y: ty + th}, 
	      {x: tx + tw / 2,  y: ty}
	    ]
		if (direction === 'bottom') {
          triangleNodePosArray = [
            {x: tx,           y: ty}, 
            {x: tx + tw / 2,  y: ty + th}, 
            {x: tx + tw,      y: ty}, 
            {x: tx,           y: ty}
          ] 
        } else if (direction === 'left') {
          triangleNodePosArray = [
            {x: tx + tw,      y: ty}, 
            {x: tx,           y: ty + th / 2}, 
            {x: tx + tw,      y: ty + th}, 
            {x: tx + tw,      y: ty}
          ]
        } else  if (direction === 'right') {
          triangleNodePosArray = [
            {x: tx,           y: ty}, 
            {x: tx + tw,      y: ty + th / 2}, 
            {x: tx,           y: ty + th}, 
            {x: tx,           y: ty}
          ]
        }
        return triangleNodePosArray
	}
}

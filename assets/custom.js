var lib = {
	randomInt:function(min, max) {
		if(min!=undefined && max!=undefined)
			return Math.floor(Math.random() * (max - min + 1) + min);
		else
			return Math.floor((Math.random()*100000000)+1);
	},
	//This works with hex: HHH, #HHH, HHHHHH, #HHHHHH
	color:{
		isDark: function(hex){
			var v = this.getV(hex);
			return v<75;
		},
		getV: function(hex){
			var rgb = this.hexToRgb(hex),
			r = rgb.r / 255,
			g = rgb.g / 255,
			b = rgb.b / 255;

			var v = Math.max(r, g, b);
			return Math.round(v*100)
		},
		hexToRgb: function(hex) {
		    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		    	return r + r + g + g + b + b;
		    });

		    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    return result ? {
		    	r: parseInt(result[1], 16),
		    	g: parseInt(result[2], 16),
		    	b: parseInt(result[3], 16)
		    } : null;
		},
		random:function(){
			return Math.floor(Math.random()*16777215).toString(16);
		}
	}
}





Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)]
}

Array.prototype.randomRemove = function () {
	return this.splice(Math.floor(Math.random() * this.length), 1)[0];
}

Array.prototype.max = function() {
	return Math.max.apply(null, this)
}
Array.prototype.min = function() {
	return Math.min.apply(null, this)
}
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};
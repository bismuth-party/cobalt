function Graph(ctx) {
	if (ctx.constructor.name !== 'CanvasRenderingContext2D') {
		throw new TypeError("ctx isn't a valid Context2D");
	}

	this.ctx = ctx;
	this.datasets = [];
}


Graph.prototype.get_scale = function() {
	let width  = this.ctx.canvas.width  * 0.80;
	let y_padding = this.ctx.canvas.width * 0.1; // padding left of the y-axis

	let height = this.ctx.canvas.height * 0.90;
	let x_padding = this.ctx.canvas.height * 0.05; // padding under the x-axis


	// Collect all data from all datasets
	let data = this.datasets.reduce((acc, dataset) => acc.concat(dataset.data), []);

	// Get extreme values
	let minx = Infinity;
	let maxx = -Infinity;
	let miny = Infinity;
	let maxy = -Infinity;

	data.forEach(([x, y]) => {
		if (x < minx) minx = x;
		if (x > maxx) maxx = x;
		if (y < miny) miny = y;
		if (y > maxy) maxy = y;
	});

	// Calculate scales
	let x_scale = width / (maxx - minx);
	let y_scale = height / (maxy - miny);


	return {
		x: x_scale,
		y: y_scale,
		minx, maxx,
		miny, maxy,
		width, height,
		x_padding, y_padding,
	};
};

function scale_data(scale, data) {
	return data.map(
		([x, y]) => ([
			scale.y_padding + (x - scale.minx) * scale.x,

			// The canvas has (0,0) top left, but we want (0,0) to be bottom left,
			// so subtract y value from height
			scale.height - ((y - scale.miny) * scale.y) + scale.x_padding,
		])
	);
}


/* round `x` on `d` decimals */
function dec(x, d) {
	const f = Math.pow(10, d);

	return Math.round(x * f) / f;
}



Graph.prototype.add_dataset = function(data, color) {
	this.datasets.push({
		data,
		color,
	});
};


Graph.prototype.draw_bar = function() {
	let actual_height = this.ctx.canvas.height;
	let actual_width = this.ctx.canvas.width;

	// Calculate scale
	let scale = this.get_scale();

	// x-axis
	this.ctx.fillRect(scale.y_padding, actual_height - scale.x_padding - 1, actual_width - 2*scale.y_padding, 1);
	this.ctx.font = scale.x_padding + 'px monospace';
	this.ctx.strokeStyle = 'black';

	let amount = (scale.maxx - scale.minx) / 3;
	for (let i=0; i <= amount; i++) {
		let actual_x = scale.width * (i / amount) + scale.y_padding;
		let x = (i / amount) * (scale.maxx - scale.minx) + scale.minx;

		this.ctx.fillText(dec(x, 2), actual_x - this.ctx.measureText(dec(x, 2)+'').width / 2, actual_height);

		this.ctx.beginPath();
		this.ctx.moveTo(actual_x, actual_height - scale.x_padding);
		this.ctx.lineTo(actual_x, scale.x_padding);
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
		this.ctx.closePath();
	}


	// y-axis
	this.ctx.fillRect(scale.y_padding, scale.x_padding, 1, actual_height - 2*scale.x_padding);
	this.ctx.font = (scale.y_padding / 2) + 'px monospace';
	this.ctx.strokeStyle = 'black';


	const STEP_SIZE = 100;

	amount = 10;
	for (let i=0; i <= amount; i++) {
		let actual_y = actual_height - (scale.width * (i / amount) + scale.x_padding);
		let y = (i / amount) * (scale.maxy - scale.miny) + scale.miny;

		y /= STEP_SIZE;

		this.ctx.fillText(dec(y, 0), 0, actual_y);

		this.ctx.beginPath();
		this.ctx.moveTo(scale.y_padding, actual_y);
		this.ctx.lineTo(actual_width - scale.y_padding, actual_y);
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
		this.ctx.closePath();
	}



	// Draw all datasets
	this.datasets.forEach((dataset) => {
		// Apply scale
		let scaled_data = scale_data(scale, dataset.data);

		// Draw path
		this.ctx.beginPath();

		let first = scaled_data.shift();
		this.ctx.moveTo(first[0], first[1]);

		scaled_data.forEach(([x, y]) => {
			this.ctx.lineTo(x, y);
		});

		this.ctx.strokeStyle = dataset.color;
		this.ctx.stroke();

		this.ctx.closePath();
	});
};

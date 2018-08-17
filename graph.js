function Graph(ctx) {
	if (ctx.constructor.name !== 'CanvasRenderingContext2D') {
		throw new TypeError("ctx isn't a valid Context2D");
	}

	this.ctx = ctx;
	this.datasets = [];
}


Graph.prototype.get_scale = function() {
	let width  = this.ctx.canvas.width  * 0.90;
	let height = this.ctx.canvas.height * 0.90;

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
		x_padding: this.ctx.canvas.height * 0.05,
		y_padding: this.ctx.canvas.width * 0.05,
	};
};

function scale_data(scale, data) {
	return data.map(
		([x, y]) => ([
			scale.y_padding + (x - scale.minx) * scale.x,

			// The canvas has (0,0) top left, but we want (0,0) to be bottom left,
			// so subtract y value from height
			scale.height - ((y - scale.miny) * scale.y),
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
}


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
		this.ctx.lineTo(actual_x, 0);
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
		this.ctx.closePath();
	}


	// y-axis
	this.ctx.fillRect(scale.y_padding, scale.x_padding, 1, actual_height - 2*scale.x_padding);

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



function drawGraphs() {
	// Fake data
	let raw_data_0 = [[0, 1000], [3, 2000], [6, 5000], [9, 0000], [12, 2000], [15, 1000], [18, 4000], [21, 2000], [24, 5000]];
	let raw_data_1 = [[0, 4000], [3, 1000], [6, 2000], [9, 1000], [12, 6000], [15, 5000], [18, 2000], [21, 3000], [24, 1000]];

	let msgs_hour_canvas = document.createElement('canvas');
	msgs_hour_canvas.width = 500;
	msgs_hour_canvas.height = 500;
	msgs_hour_canvas.style.width = '500px';
	msgs_hour_canvas.style.height = '500px';

	let ctx = msgs_hour_canvas.getContext('2d');

	let msgs_hour_graph = new Graph(ctx);
	msgs_hour_graph.add_dataset(raw_data_0, 'red');
	msgs_hour_graph.add_dataset(raw_data_1, 'green');
	msgs_hour_graph.draw_bar();

	let msgs_hour_elem = document.getElementById('graph-msgs-hour');
	msgs_hour_elem.appendChild(msgs_hour_canvas);
}

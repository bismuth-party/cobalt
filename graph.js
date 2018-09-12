// The fallback palette if none is specified
const PALETTE = [
	'#d00',  // R
	'#d60',
	'#dd0',
	'#6d0',
	// '#0d0',  // G
	'#0d6',
	'#0dd',
	'#06d',
	'#00d',  // B
	'#60d',
	'#d0d',
	'#d06',

	'#400',  // r
	'#480',
	'#440',
	'#840',
	'#040',  // g
	'#048',
	'#044',
	'#084',
	'#004', // b
	'#804',
	'#404',
	'#408',
];


// Limit of which groups get merged into a single "others" group
const SMALL_PERC = 0.03;


const deg360 = 2 * Math.PI;
const deg90 = 0.5 * Math.PI;



function Graph(ctx, palette) {
	if (ctx.constructor.name !== 'CanvasRenderingContext2D') {
		throw new TypeError("ctx isn't a valid Context2D");
	}

	this.palette = palette || PALETTE;
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
function round(x, d) {
	const f = Math.pow(10, d);

	return Math.round(x * f) / f;
}


function isNumber(x) {
	return typeof x === 'number' && ! isNaN(x);
}
function isString(x) {
	return typeof x === 'string';
}


function processPieDataset(input, palette) {
	// dataset.data has to be of type [num,str]
	input.forEach((dataset) => {
		if (
			! Array.isArray(dataset.data) ||
			dataset.data.length !== 2 ||
			! isNumber(dataset.data[0]) ||
			! isString(dataset.data[1])
		) {
			console.error(dataset.data);

			throw new TypeError("Invalid dataset, see above");
		}
	});


	// Calculate total amount of data
	let total = input.reduce((acc, dataset) => acc + dataset.data[0], 0);

	// Add percentages to dataset
	input.map((dataset) => {
		dataset.perc = dataset.data[0] / total;
	});


	// Bundle small sets into "others" group
	let small_sets = input.filter((dataset) => dataset.perc < SMALL_PERC);

	let others = small_sets.reduce((acc, dataset) => acc + dataset.data[0], 0);
	let others_group = {
		data: [others, 'others'],
		color: '#000',
		perc: others / total,
	};


	// Create new dataset with the big sets and the others group
	let big_sets = input.filter((dataset) => dataset.perc >= SMALL_PERC);
	big_sets.sort((a, b) => b.data[0] - a.data[0]);
	let output = big_sets.concat(others_group);


	output.forEach((dataset, ix) => {
		dataset.color = palette[ix % palette.length];
	});

	return output;
}




Graph.prototype.add_dataset = function(data, color) {
	if (! Array.isArray(data)) {
		console.error(data);

		throw new TypeError("data has to be array, `" + typeof data + "` given");
	}

	if (typeof color !== 'undefined' && typeof color !== 'string') {
		console.error(color);

		throw new TypeError(
			"color has to be a string or undefined, `" + typeof color + "` given"
		);
	}

	this.datasets.push({
		data,
		color,
	});
};



Graph.prototype.draw_bar = function() {
	// datasets.data has to be of type [[num,num]*]
	this.datasets.forEach((dataset) => {
		dataset.data.forEach((data) => {
			if (
				! Array.isArray(data) ||
				data.length !== 2 ||
				! isNumber(data[0]) ||
				! isNumber(data[1])
			) {
				console.error(data);

				throw new TypeError("Invalid data in dataset, see above");
			}
		});
	});


	let actual_height = this.ctx.canvas.height;
	let actual_width = this.ctx.canvas.width;

	// Calculate scale
	let scale = this.get_scale();

	// x-axis
	this.ctx.fillRect(scale.y_padding, actual_height - scale.x_padding - 1, actual_width - 2*scale.y_padding, 1);
	this.ctx.font = scale.x_padding + 'px monospace';
	this.ctx.strokeStyle = '#000';

	// x guide lines
	let amount = (scale.maxx - scale.minx) / 3;
	for (let i=0; i <= amount; i++) {
		let actual_x = scale.width * (i / amount) + scale.y_padding;
		let x = (i / amount) * (scale.maxx - scale.minx) + scale.minx;

		let text = round(x, 2).toString();
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text, actual_x - textWidth / 2, actual_height);

		this.ctx.beginPath();
		this.ctx.moveTo(actual_x, actual_height - scale.x_padding);
		this.ctx.lineTo(actual_x, scale.x_padding);
		this.ctx.strokeStyle = '#000';
		this.ctx.stroke();
		this.ctx.closePath();
	}


	// y-axis
	this.ctx.fillRect(
		scale.y_padding
		, scale.x_padding
		, 1
		, actual_height - 2 * scale.x_padding
	);

	this.ctx.font = (scale.y_padding / 2) + 'px monospace';
	this.ctx.strokeStyle = '#000';


	// y guide lines
	amount = 10;
	for (let i=0; i <= amount; i++) {
		let actual_y = actual_height - (scale.height * (i / amount) + scale.x_padding);
		let y = (i / amount) * (scale.maxy - scale.miny) + scale.miny;

		let text = round(y, 0).toString();
		this.ctx.fillText(
			text
			, 0
			, actual_y
		);

		this.ctx.beginPath();
		this.ctx.moveTo(scale.y_padding, actual_y);
		this.ctx.lineTo(actual_width - scale.y_padding, actual_y);
		this.ctx.strokeStyle = '#000';
		this.ctx.stroke();
		this.ctx.closePath();
	}


	// Draw all datasets
	this.datasets.forEach((dataset, ix) => {
		// Apply scale
		let scaled_data = scale_data(scale, dataset.data);

		// Draw path
		this.ctx.beginPath();

		let first = scaled_data.shift();
		this.ctx.moveTo(...first);

		scaled_data.forEach((coor) => {
			this.ctx.lineTo(...coor);
		});

		this.ctx.strokeStyle = dataset.color || this.palette[ix % this.palette.length];
		this.ctx.stroke();

		this.ctx.closePath();
	});
};


Graph.prototype.draw_pie = function() {
	let datasets = processPieDataset(this.datasets, this.palette);


	let actual_height = this.ctx.canvas.height;
	let actual_width = this.ctx.canvas.width;


	// Draw outline
	this.ctx.beginPath();

	this.ctx.arc(
		actual_width / 2		// x
		, actual_height / 2		// y
		, actual_width / 2		// radius
		, 0						// startAngle
		, 2 * Math.PI			// endAngle
	);

	this.ctx.strokeStyle = '#000';
	this.ctx.stroke();

	this.ctx.closePath();


	// Draw data
	let prevperc = 0;
	datasets.forEach((dataset) => {
		this.ctx.beginPath();

		this.ctx.arc(
			actual_width / 2,		// x
			actual_height / 2,		// y
			actual_width / 2 - 1,	// r   (-1 for the stroke width)

			// subtract 90 degrees because instead of the x-axis,
			// it should start on the y-axis
			prevperc * deg360 - deg90, // startAngle
			(prevperc + dataset.perc) * deg360 - deg90 // endAngle
		);
		prevperc += dataset.perc;


		this.ctx.lineTo(actual_width / 2, actual_height / 2);

		this.ctx.fillStyle = dataset.color;
		this.ctx.strokeStyle = '#000';
		this.ctx.stroke();
		this.ctx.fill();
		this.ctx.closePath();
	});
};


Graph.prototype.draw_pie_legend = function(legendId) {
	let datasets = processPieDataset(this.datasets, this.palette);
	let legendElem = document.getElementById(legendId);

	datasets.forEach((dataset) => {
		let [amount, name] = dataset.data;

		if (amount === 0) return;

		let field = document.createElement('li');
		field.className = '';
		field.style.backgroundColor = dataset.color;
		field.innerHTML = name + ' [' + amount + ']';
		legendElem.appendChild(field);
	});


	console.log(datasets);
};

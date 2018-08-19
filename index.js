/* globals Graph */


function onload() {
	makeGroupsClickable();


	document.querySelector('.grouplist li[data-groupid="-1"]').classList.add('active');
	activateGroup(-1);
}



function makeGroupsClickable() {
	Array.from(document.querySelectorAll('.grouplist > ul > li')).forEach((groupElem) => {
		groupElem.style.cursor = 'pointer';

		groupElem.addEventListener('click', (event) => {
			// Remove active class from current active group(s)
			Array.from(document.querySelectorAll('.grouplist > ul > li.active'))
				.forEach((activeGroupElem) => {
					activeGroupElem.classList.remove('active');
				});


			// Get `li` parent
			let target = event.target;
			if (target.nodeName === 'IMG') {
				target = target.parentNode;
			}

			// Set new active class
			target.classList.add('active');

			// Execute tasks linked to groupid
			let groupid = target.dataset.groupid;
			activateGroup(groupid);
		});
	});
}



function activateGroup(groupid) {
	let token = getUserToken();
	console.log(`Activated group ${groupid} for ${token}`);

	// TODO: Get data from backend
	let groupname = "Bismuth.party";

	// Generate random data
	let raw_data = [[], [], []];

	for (let x=0; x <= 24; x += 3) {
		raw_data[0].push([x, Math.random() * 1000]);
		raw_data[1].push([x, Math.random() * 1000]);
		raw_data[2].push([x, Math.random() * 1000]);
	}


	// Set new title
	document.querySelector('.groupname').innerHTML = `<code style="font-size: 12pt;">{${token}}</code> ${groupname}  [${groupid}]`;

	// Remove old graphs
	Array.from(document.querySelectorAll('.graph')).forEach((graphElem) => {
		graphElem.innerHTML = '';
	});

	// Draw new graphs
	drawGraphs([
		[raw_data[0], 'red'],
		[raw_data[1], 'green'],
		[raw_data[2], 'blue'],
	]);
}


function getUserToken() {
	return location.hash.substr(1);
}



function drawGraphs(datasets) {
	let msgs_hour_canvas = document.createElement('canvas');
	msgs_hour_canvas.width = 500;
	msgs_hour_canvas.height = 500;
	msgs_hour_canvas.style.width = '500px';
	msgs_hour_canvas.style.height = '500px';

	let ctx = msgs_hour_canvas.getContext('2d');

	let msgs_hour_graph = new Graph(ctx);

	datasets.forEach((dataset) => {
		msgs_hour_graph.add_dataset(...dataset);
	});

	msgs_hour_graph.draw_bar();

	let msgs_hour_elem = document.getElementById('graph-msgs-hour');
	msgs_hour_elem.appendChild(msgs_hour_canvas);
}



if (location.protocol === 'file:') {
	// DOMContentLoaded is unreliable for files, so just fire onload
	setTimeout(onload, 0);
}
else {
	document.addEventListener('DOMContentLoaded', onload);
}



// Refresh page every second
let timeout_id = setTimeout(location.reload.bind(location), 1000);

// Stop refreshing if clicked anywhere on the page
document.addEventListener('click', clearTimeout.bind(null, timeout_id));

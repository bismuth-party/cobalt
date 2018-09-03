/* globals Graph */


const ROOT_URL = 'http://thorium.bismuth.party/api/';
let __activeGroup = 0;


// `url` should start with a /
function send(method, url, data, cb) {
	let xml = new XMLHttpRequest();

	function onload(event) {
		let data = JSON.parse(event.target.response);

		cb && cb(data);
	}
	xml.addEventListener('load', onload);
	xml.addEventListener('error', onload);

	xml.open(method, ROOT_URL + getUserToken() + url);
	xml.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
	xml.send(JSON.stringify(data));
}


function onload() {
	createGroupList();
}



function createGroupList() {
	send('GET', '/user', null, (userdata) => {
		let avatar = userdata.avatar;
		if (typeof avatar !== 'undefined') {
			document.getElementById('js-avatar').src = avatar;
		}

		let chats = userdata.chats;
		let grouplistElem = document.getElementById('js-grouplist');

		chats.forEach((chatid) => {
			let chatElem = document.createElement('li');
			chatElem.classList.add('group');
			chatElem.dataset.groupid = chatid;

			// TODO: Get chat avatar
			chatElem.innerHTML = '<img src="imgs/group1.png">';


			chatElem.addEventListener('click', (event) => {
				// Remove active class from current active group(s)
				Array.from(document.querySelectorAll('.group.active'))
					.forEach((activeGroupElem) => {
						activeGroupElem.classList.remove('active');
					});


				// Set new active class
				let target = event.target;
				target.classList.add('active');

				// Execute tasks linked to groupid
				let groupid = target.dataset.groupid;
				activateGroup(groupid);
			});

			grouplistElem.appendChild(chatElem);
		});
	});
}



function activateGroup(groupid) {
	__activeGroup = groupid;

	let token = getUserToken();
	console.log(`Activated group ${groupid} for ${token}`);

	send('GET', '/chat/' + groupid, null, (data) => {
		// Set new title
		document.getElementById('js-title')
			.innerHTML = `<code style="font-size: 12pt;">{${token}}</code> ${data.last_title}  [${groupid}]`;
	});

	drawGraphs();
}


function getUserToken() {
	return location.hash.substr(1);
}



function createGraph(datasets, parentElemID) {
	let canvas = document.createElement('canvas');
	canvas.width = 500;
	canvas.height = 500;
	canvas.style.width = '500px';
	canvas.style.height = '500px';

	let ctx = canvas.getContext('2d');
	let graph = new Graph(ctx);

	datasets.forEach((dataset) => {
		graph.add_dataset(...dataset);
	});

	let parent_elem = document.getElementById(parentElemID);
	parent_elem.appendChild(canvas);
}



function objectToKVArray(obj) {
	return Object.keys(obj).map((key) => [key, obj[key]]);
}


function drawGraphs() {
	// Remove old graphs
	Array.from(document.querySelectorAll('.graph')).forEach((graphElem) => {
		graphElem.innerHTML = '';
	});


	/*
	//// BAR CHART
	// Generate random data
	let raw_data = [[], [], [],
		[[0, 0], [24, 1000]],
	];

	for (let x=0; x <= 24; x += 3) {
		raw_data[0].push([x, Math.random() * 1000]);
		raw_data[1].push([x, Math.random() * 1000]);
		raw_data[2].push([x, Math.random() * 1000]);
	}

	let datasets = [
		[raw_data[0], '#f00'],
		[raw_data[1], '#0f0'],
		[raw_data[2], '#00f'],
		[raw_data[3], '#f0f'],
	];


	//// PIE CHART
	// Generate random data
	let datasets = [];

	for (let i=1; i <= 20; i++) {
	datasets.push([Math.random() * Math.pow(1.3, i)]);
	*/



	send('GET', '/chat/' + __activeGroup + '/extended', null, (data) => {
		let stats = data.stats;
		let raw_msgs_user = stats.messages_per_user;
		let raw_msgs_hour = stats.messages_per_hour;
		let raw_msgs_weekday = stats.messages_per_weekday;

		let msgs_user = Object.keys(raw_msgs_user).map(key => [raw_msgs_user[key]]);

		let msgs_user_graph = createGraph(msgs_user, 'graph-msgs-user');
		msgs_user_graph.draw_pie();

		let msgs_hour = objectToKVArray(raw_msgs_hour);
		let msgs_hour_graph = createGraph(msgs_hour, 'graph-msgs-hour');
		msgs_hour_graph.draw_bar();

		let msgs_weekday = objectToKVArray(raw_msgs_weekday);
		let msgs_weekday_graph = createGraph(msgs_weekday, 'graph-msgs-weekday');
		msgs_weekday_graph.draw_bar();
	});
}



if (location.protocol === 'file:') {
	// DOMContentLoaded is unreliable for files, so just fire onload
	setTimeout(onload, 0);
}
else {
	document.addEventListener('DOMContentLoaded', onload);
}



const reload = () => location.reload(location);

// Reload page if hash changes
document.addEventListener('hashchange', reload, false);

/*
// Refresh page every second
let timeout_id = setTimeout(reload, 1000);

// Stop refreshing if clicked anywhere on the page
document.addEventListener('click', clearTimeout.bind(null, timeout_id));
*/

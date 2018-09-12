/* globals Graph */


const ROOT_URL = 'http://thorium.bismuth.party/api/';
// const ROOT_URL = 'http://localhost:8467/api/';

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

		chats.forEach((groupid) => {
			let chatElem = document.createElement('li');
			chatElem.classList.add('group');
			chatElem.dataset.groupid = groupid;

			// TODO: Get chat avatar
			chatElem.innerHTML = '<img src="imgs/group1.png">';


			chatElem.addEventListener('click', (event) => {
				// Remove active class from current active group(s)
				Array.from(document.querySelectorAll('.group.active'))
					.forEach((activeGroupElem) => {
						activeGroupElem.classList.remove('active');
					});


				let target = event.target;

				// The image is clicked, but the target should be the li parent.
				if (target.nodeName === 'IMG') {
					target = target.parentNode;
				}

				// Set new active class
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



// datasets has to be of type [[[number*], string?]*]
function createGraph(datasets, parentElemID) {
	let canvas = document.createElement('canvas');
	canvas.width = 500;
	canvas.height = 500;
	canvas.style.width = '500px';
	canvas.style.height = '500px';

	let ctx = canvas.getContext('2d');
	let graph = new Graph(ctx);

	datasets.forEach((dataset) => {
		graph.add_dataset(dataset);
	});

	let parent_elem = document.getElementById(parentElemID);
	parent_elem.appendChild(canvas);

	return graph;
}



function objectToNumKVArray(obj) {
	return Object.keys(obj).map((key) => [parseFloat(key), obj[key]]);
}


function drawGraphs() {
	// Remove old graphs
	Array.from(document.querySelectorAll('.graph')).forEach((graphElem) => {
		graphElem.innerHTML = '';
	});


	// Get and draw new graphs
	send('GET', '/chat/' + __activeGroup + '/extended', null, (data) => {
		let stats = data.stats;
		let raw_msgs_user = stats.messages_per_user;
		let raw_msgs_hour = stats.messages_per_hour;
		let raw_msgs_weekday = stats.messages_per_weekday;

		console.log(stats);


		let msgs_user = Object.keys(raw_msgs_user).map((key) => {
			// TODO: Get actual username
			let username = key.toString();
			return [raw_msgs_user[key], username];
		});
		let msgs_user_graph = createGraph(msgs_user, 'graph-msgs-user');
		msgs_user_graph.draw_pie();
		msgs_user_graph.draw_pie_legend('graph-msgs-user-legend');


		let msgs_hour = objectToNumKVArray(raw_msgs_hour);
		let msgs_hour_graph = createGraph([msgs_hour], 'graph-msgs-hour');
		msgs_hour_graph.draw_bar();


		let msgs_weekday = objectToNumKVArray(raw_msgs_weekday);
		let msgs_weekday_graph = createGraph([msgs_weekday], 'graph-msgs-weekday');
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

'use strict';

function onload() {
	// Make all groups clickable
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

			target.classList.add('active');
		});
	});


	// Draw the graph(s)
	drawGraphs();
}


if (location.protocol === 'file:') {
	// DOMContentLoaded is unreliable for files, so just fire onload
	setTimeout(onload, 100);
}
else {
	document.addEventListener('DOMContentLoaded', onload);
}



// Refresh page every second
let timeout_id = setTimeout(() => { location.href += '' }, 1000);

// Stop refreshing if clicked anywhere on the page
document.addEventListener('click', () => { clearTimeout(timeout_id) });

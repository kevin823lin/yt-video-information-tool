//icon from https://materialdesignicons.com/
function videoInfo(id, href, data){
	var videoPrimaryInfoRenderer = data.contents.twoColumnWatchNextResults.results.results.contents.find(obj => obj.videoPrimaryInfoRenderer).videoPrimaryInfoRenderer;
	var videoSecondaryInfoRenderer = data.contents.twoColumnWatchNextResults.results.results.contents.find(obj => obj.videoSecondaryInfoRenderer).videoSecondaryInfoRenderer;
	var video = {
		id: id,
		href: href,
		imgURL: "https://img.youtube.com/vi/" + id +"/0.jpg",
		title: videoPrimaryInfoRenderer.title.runs[0].text,
		viewCount: videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText,
		date: videoPrimaryInfoRenderer.dateText.simpleText,
		like: videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons[0].toggleButtonRenderer.defaultText.simpleText,
		dislike: videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons[1].toggleButtonRenderer.defaultText.simpleText,
		author: videoSecondaryInfoRenderer.owner.videoOwnerRenderer.title.runs[0].text
	};
	return video;
}
function insertHTML(a, video){
	var likeSVG = `
		<svg style="width:20px;height:20px;flex: 1;" viewBox="0 0 20 20">
			<path fill="currentColor" d="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z" />
		</svg>
	`;
	var dislikeSVG = `
		<svg style="width:20px;height:20px;flex: 1;" viewBox="0 0 20 20">
			 <path fill="currentColor" d="M19,15V3H23V15H19M15,3A2,2 0 0,1 17,5V15C17,15.55 16.78,16.05 16.41,16.41L9.83,23L8.77,21.94C8.5,21.67 8.33,21.3 8.33,20.88L8.36,20.57L9.31,16H3C1.89,16 1,15.1 1,14V12C1,11.74 1.05,11.5 1.14,11.27L4.16,4.22C4.46,3.5 5.17,3 6,3H15M15,5H5.97L3,12V14H11.78L10.65,19.32L15,14.97V5Z" />
		</svg>
	`;
	a.parentElement.parentElement.parentElement.insertAdjacentHTML('beforeend', `
		<a id="content-text" class="ytd-comment-renderer" style="max-width: 350px;font-size: initial;display: flex;align-items: center;background-color: rgba(128, 128, 128, 0.3);margin-top: 4px;margin-bottom: 4px;border-radius: 10px;padding: 5px;cursor: pointer;font-size: small;text-decoration:none;" href="${video.href}">
			<div style="flex: 1; width: min-content;">
				<div class="yt-simple-endpoint">${video.title}</div>
				<br/>
				${video.author}
				<br/>
				${video.viewCount}
				<br/>
				${video.date}
				<br/>
                <div style="display: flex;flex-direction: row;align-items: center;">
					${likeSVG}
					<span style="flex: 1;">${video.like}</span>
					${dislikeSVG}
					<span style="flex: 1;">${video.dislike}</span>
                </div>
			</div>
			<img src="${video.imgURL}" style="max-width: 150px;flex: 1;height: fit-content;margin: 5px;border-radius: 10px;">
		</a>`);
}
function allThing(a){
	a.setAttribute("hasInfo", "true");
	var id = a.href.split('/watch?v=')[1].split('&')[0];
	var videoURL = "https://www.youtube.com/watch?v=" + id
	var xhr = new XMLHttpRequest();
	xhr.open("GET", videoURL, true);
	xhr.onreadystatechange = function() { 
	  if (xhr.readyState == 4) {
		var data = JSON.parse((/var ytInitialData = (.*?)};/m).exec(xhr.responseText)[1] + '}');
		insertHTML(a, videoInfo(id, a.href, data));
	  }
	}
	xhr.send();
}

document.addEventListener('DOMSubtreeModified', function() {
	if (!document.querySelectorAll('a[hasInfo=true]').length) {
		document.querySelectorAll('.yt-comment-video').forEach(ele => ele.remove());
	}
	[...document.querySelectorAll('#content-text > a[href^="/watch"]:not([hasInfo=true])')].filter(function(a){return a.text.indexOf('//') != -1}).forEach(a => allThing(a));
}, false);
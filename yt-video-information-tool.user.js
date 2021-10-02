// ==UserScript==
// @name         YT Video Information Tool
// @namespace    https://github.com/kevin823lin
// @version      0.4
// @description  Show the video information which is mentioned in the description or the comments on YouTube™ videos.
// @author       kevin823lin
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @grant        none
// @date         2021-09-17
// ==/UserScript==

//icon(svg) from https://youtube.com/

(function () {
    'use strict';

    // Your code here...

    /*-----------------------define-----------------------*/
    const meta = 0;
    const comments = 1;

    var infoIndex = 0;
    var oldInfoIndex = 0;
    var addLock = false;
    var removeLock = false;
    var ytNavigate = false;

    var verifyIcon = `
        <svg style="min-width: 1.3rem;min-height: 1.3rem;max-width: 1.3rem;max-height: 1.3rem;margin-left: 2px;" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2C6.5,2,2,6.5,2,12c0,5.5,4.5,10,10,10s10-4.5,10-10C22,6.5,17.5,2,12,2z M9.8,17.3l-4.2-4.1L7,11.8l2.8,2.7L17,7.4 l1.4,1.4L9.8,17.3z"/>
        </svg>
    `;
    var likeIcon = `
        <div style="flex: 1;margin: 5px;">
            <svg style="flex: 1;width: 24px;height: 24px;float: right;" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"/>
            </svg>
        </div>
    `;
    var dislikeIcon = `
        <div style="flex: 1;margin: 5px;">
            <svg style="flex: 1;width: 24px;height: 24px;float: right;" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z"/>
            </svg>
        </div>
    `;
    /*-----------------------enddefine-----------------------*/

    window.addEventListener('load', function () {
        let style = `
			.yt-video-info{
				display:block;
				max-width: 360px;
				margin-top: 4px;
				padding: 5px;
				border-radius: 15px;
				font-size: small;
				line-height: 1.9rem;
				word-break: break-all;
				letter-spacing: var(--ytd-user-comment_-_letter-spacing);
				text-decoration: none; color: var(--yt-spec-text-secondary);
				background-color: rgba(128,128,128,0.3);
				--yt-endpoint-color: var(--yt-spec-text-primary);
				--yt-endpoint-hover-color: var(--yt-spec-text-primary);
				--yt-endpoint-visited-color: var(--yt-spec-text-primary);
			}
            .yt-video-info span {
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
		`;
        let styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = style;
        document.head.appendChild(styleSheet);

        let primaryInnerObserver = new MutationObserver(function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.target.id == 'primary-inner') {
                    observer.disconnect();
                    addEventListenerToPrimaryInner();
                    break;
                }
            }
        });

        if (document.querySelector('#primary-inner')) {
            addEventListenerToPrimaryInner();
        } else {
            primaryInnerObserver.observe(document, {
                childList: true,
                subtree: true
            });
        }
    });

    // change page
    window.addEventListener('yt-navigate-start', function () {
        ytNavigate = true;
        oldInfoIndex = infoIndex;
    });
    window.addEventListener('yt-navigate-finish', function () {
        setTimeout(function () {
            ytNavigate = false
        }, 500);
    });

    function addEventListenerToPrimaryInner() {
        try {
            document.querySelector('#primary-inner').addEventListener('DOMSubtreeModified', function () {
                removeElement();
                addElement();
            }, false);
        } catch (e) {
            console.error(`addEventListenerToPrimaryInner: ${e}`);
        }
    }

    async function removeElement() {
        try {
            if (!removeLock) {
                removeLock = true;
                for (let i = 0; i < 2; i++) {
                    const temp = oldInfoIndex;
                    document.querySelectorAll('a.yt-video-url').forEach(function (ele) {
                        if (ele.getAttribute('infoIndex') < temp || !ele.getAttribute('href').match('^/watch')) {
                            ele.classList.remove('yt-video-url');
                        }
                    });
                    document.querySelectorAll('a.yt-video-info').forEach(function (ele) {
                        if (![...document.querySelectorAll(`a.yt-video-url[href^="/watch"][infoIndex="${ele.getAttribute('infoIndex')}"]`)].filter(function (a) {
                            return a.text.indexOf('/') != -1;
                        }).length) {
                            ele.remove();
                        }
                    });
                    if (i == 0) {
                        await wait(1000);
                    }
                }
                removeLock = false;
            }
        } catch (e) {
            console.error(`removeElement: ${e}`);
        }
    }

    async function addElement() {
        try {
            if (!addLock && !ytNavigate && location.href.match('^https://www.youtube.com/watch')) {
                addLock = true;
                // description
                let metaList = [...document.querySelectorAll(`#primary-inner #meta a[href^="/watch"]:not(.yt-video-info):not([yt-video-info-error=true])`)].filter(function (a) {
                    return (a.text.indexOf('/') != -1) && (a.getAttribute('infoIndex') ? a.getAttribute('infoIndex') < oldInfoIndex : true);
                });
                metaList.forEach(ele => {
                    ele.area = meta;
                });
                // comments
                let commentsList = [...document.querySelectorAll(`#primary-inner #comments a[href^="/watch"]:not(.yt-video-info):not([yt-video-info-error=true])`)].filter(function (a) {
                    return (a.text.indexOf('/') != -1) && (a.getAttribute('infoIndex') ? a.getAttribute('infoIndex') < oldInfoIndex : true);
                });
                commentsList.forEach(ele => {
                    ele.area = comments;
                });
                let aList = metaList.concat(commentsList);
                await insertHTML(aList);
                addLock = false;
            }
        } catch (e) {
            console.error(`addElement: ${e}`);
        }
    }

    async function insertHTML(aList) {
        try {
            let responseList = getResponseList(aList);
            for (let i = 0; i < responseList.length; i++) {
                let a = aList[i];
                if (!a.href.match('^https://www.youtube.com/watch')) {
                    continue;
                };
                let res = await responseList[i];
                let videoInfo = getVideoInfo(a, res);
                if (!videoInfo) {
                    a.setAttribute('yt-video-info-error', true);
                    continue;
                }
                if (videoInfo.id != videoInfo.idFromRes) {
                    let response = getResponseList([a]);
                    res = await response[0];
                    videoInfo = getVideoInfo(a, res);
                    if (!videoInfo) {
                        a.setAttribute('yt-video-info-error', true);
                        continue;
                    }
                    if (videoInfo.id != videoInfo.idFromRes) {
                        continue;
                    }
                }
                a.classList.add('yt-video-url');
                a.setAttribute('infoIndex', infoIndex);

                let observer = new MutationObserver(function (mutations) {
                    let mutation = mutations[0];
                    mutation.target.removeAttribute('yt-video-info-error');
                    mutation.target.infoIndex = 0;
                    observer.disconnect();
                });
                observer.observe(a, {
                    attributes: true,
                    attributeFilter: ['href']
                });

                let path = a.parentElement.parentElement.parentElement;
                if (a.area == meta) {
                    path = path.parentElement;
                }
                await path.insertAdjacentHTML('beforeend', `
                    <a infoIndex=${infoIndex++} class="yt-video-info" href="${videoInfo.href}">
                        <div style="display: flex;align-items: center;margin: 5px;">
                            <div style="flex: 1;width: min-content;margin-right: 5px;">
                                <span class="yt-simple-endpoint">${videoInfo.title}</span>
                                <div style="display: flex;align-items: center;">
                                    <span style="-webkit-line-clamp: 1;">${videoInfo.author}</span>
                                    ${videoInfo.authorVerify ? verifyIcon : ''}
                                </div>
                                <span>${videoInfo.viewCount}</span>

                                <span>${videoInfo.date}</span>

                            </div>
                            <img src="${videoInfo.imgURL}" style="max-width: 170px;flex: 1;height: fit-content;border-radius: 10px;margin-left: 5px;">
                        </div>
                        <div class="yt-simple-endpoint" style="display: flex;align-items: center;">
                            <div style="flex: 1;display: flex;align-items: center">
                                ${likeIcon}
                                <span style="flex: 1;margin: 5px;">${videoInfo.like}</span>
                            </div>
                            <div style="flex: 1;display: flex;align-items: center">
                                ${dislikeIcon}
                                <span style="flex: 1;margin: 5px;">${videoInfo.dislike}</span>
                            </div>
                        </div>
                    </a>`);
            }
        } catch (e) {
            console.error(`insertHTML: ${e}`);
        }
    }

    function getVideoInfo(a, res) {
        try {
            let data = JSON.parse((/var ytInitialData = (.*?)};/m).exec(res)[1] + '}');
            let videoPrimaryInfoRenderer = data.contents.twoColumnWatchNextResults.results.results.contents.find(obj => obj.videoPrimaryInfoRenderer).videoPrimaryInfoRenderer;
            let videoSecondaryInfoRenderer = data.contents.twoColumnWatchNextResults.results.results.contents.find(obj => obj.videoSecondaryInfoRenderer).videoSecondaryInfoRenderer;
            let id = getVideoIdByURL(a.href);
            let idFromRes = getVideoIdByURL(decodeURIComponent(JSON.parse(`"${res.split("originalUrl\"")[1].split("\"", 2)[1]}"`)));
            return {
                id: id,
                idFromRes: idFromRes,
                href: a.getAttribute('href'),
                imgURL: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                title: videoPrimaryInfoRenderer.title.runs.map(ele => ele.text).join(''),
                viewCount: videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.shortViewCount.simpleText,
                date: videoPrimaryInfoRenderer.dateText.simpleText,
                like: videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons[0].toggleButtonRenderer.defaultText.simpleText,
                dislike: videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons[1].toggleButtonRenderer.defaultText.simpleText,
                author: videoSecondaryInfoRenderer.owner.videoOwnerRenderer.title.runs.map(ele => ele.text).join(''),
                authorVerify: (Boolean)(videoSecondaryInfoRenderer.owner.videoOwnerRenderer.badges)
            };
        } catch (e) {
            console.error(`getVideoInfo: ${e}`);
            return null;
        }
    }

    function getResponseList(aList) {
        try {
            return aList.map(async function (a) {
                return (await fetch(a.href, {
                    headers: new Headers({
                        'content-type': 'text/html; charset=utf-8'
                    })
                })).text();
            });
        } catch (e) {
            console.error(`getResponseList: ${e}`);
        }
    }

    function getVideoIdByURL(url) {
        try {
            let regex = /(\?v=|\&v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/;
            let id = url.match(regex);
            return id ? id[2] : null;
        } catch (e) {
            console.error(`getVideoIdByURL: ${e}`);
        }
    }

    function wait(ms) {
        try {
            return new Promise(r => setTimeout(r, ms));
        } catch (e) {
            console.error(`wait: ${e}`);
        }
    }

})();

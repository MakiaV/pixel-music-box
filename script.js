import { songs } from "./data/songs.js";
import { parseLyric, syncLyric, getTime } from "./lib/index.js";

const playBtn = document.querySelector("#play-btn");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const repeatBtn = document.querySelector("#repeat-btn");
const audio = document.querySelector("#audio");
const progressBar = document.querySelector(".progress-bar");
const progress = document.querySelector(".progress");
const tracksList = document.querySelector("#tracks-list");
const trackDuration = document.querySelector(".track-duration");
const trackCurrentTime = document.querySelector(".track-current-time");
const trackTemplate = document.querySelector("#track-template");
const cover = document.querySelector(".track-cover");
const visualizer = document.querySelector("#visualizer");
const lyric = document.querySelector(".lyric");
const myDate = document.querySelector(".my-date");
const leftTrackName = document.querySelector(
	".player-left .track-infos .track-name"
);
const leftTrackArtist = document.querySelector(
	".player-left .track-infos .track-artist"
);

songs.map((song, i) => {
	let content = trackTemplate.content.cloneNode(true);
	content.querySelector(".track-number").textContent = i + 1 + ".";
	content.querySelector(".track-artist").textContent = song.artist;
	content.querySelector(".track-name").textContent = song.title;
	content.querySelector(".info-track-duration").textContent = song.duration;
	content.querySelector("#track").classList.add(`track${i}`);
	tracksList.appendChild(content);
});

let currentSongIndex = 0;
let isPlaying = false;
let repeatOne = false;
let myLyrics = [];
let myText = "";
const dt = new Date();
const dateYear = dt.getFullYear();
myDate.innerText = dateYear;

const trackUpdate = (songIndex) => {
	const songLyric = songs[currentSongIndex].lyric;
	cover.setAttribute("src", songs[currentSongIndex].cover);
	leftTrackName.textContent = songs[currentSongIndex].title;
	leftTrackArtist.textContent = songs[currentSongIndex].artist;
	audio.setAttribute("src", songs[currentSongIndex].src);
	trackDuration.textContent = songs[currentSongIndex].duration;
	const myTrack = document.querySelector(`.track${songIndex}`);
	myTrack.style.backgroundColor = "rgb(56, 67, 32)";
	async function loadLrc() {
		const res = await fetch(`${songLyric}`);
		const lrc = await res.text();
		const lyrics = parseLyric(lrc);
		myLyrics = lyrics;
	}
	loadLrc();
};

trackUpdate(currentSongIndex);

const playSong = () => {
	playBtn.querySelector("i.fas").classList.remove("fa-play");
	playBtn.querySelector("i.fas").classList.add("fa-pause");
	isPlaying = true;
	audio.play();
};

const pauseSong = () => {
	playBtn.querySelector("i.fas").classList.add("fa-play");
	playBtn.querySelector("i.fas").classList.remove("fa-pause");
	isPlaying = false;
	audio.pause();
};

const repeatOneSong = () => {
	repeatOne = !repeatOne;
	if (repeatOne) {
		repeatBtn.querySelector("i.fas").classList.add("fa-1");
		repeatBtn.querySelector("i.fas").classList.remove("fa-repeat");
	} else {
		repeatBtn.querySelector("i.fas").classList.add("fa-repeat");
		repeatBtn.querySelector("i.fas").classList.remove("fa-1");
	}
};

const nextSong = () => {
	lyric.innerText = "";
	const myTrack = document.querySelector(`.track${currentSongIndex}`);
	myTrack.style.backgroundColor = "";
	currentSongIndex++;
	if (currentSongIndex > songs.length - 1) {
		currentSongIndex = 0;
	}
	trackUpdate(currentSongIndex);
	playSong();
};

const nextSongOnEnded = () => {
	if (repeatOne) {
		isPlaying = true;
		currentSongIndex = currentSongIndex;
		lyric.innerText = "";
		trackUpdate(currentSongIndex);
		playSong();
	} else {
		isPlaying = true;
		lyric.innerText = "";
		const myTrack = document.querySelector(`.track${currentSongIndex}`);
		myTrack.style.backgroundColor = "";
		currentSongIndex++;
		if (currentSongIndex > songs.length - 1) {
			currentSongIndex = 0;
		}
		trackUpdate(currentSongIndex);
		playSong();
	}
};

const prevSong = () => {
	lyric.innerText = "";
	const myTrack = document.querySelector(`.track${currentSongIndex}`);
	myTrack.style.backgroundColor = "";
	currentSongIndex--;
	if (currentSongIndex < 0) {
		lyric.innerText = "";

		currentSongIndex = songs.length - 1;
	}
	trackUpdate(currentSongIndex);
	repeatOne = false;
	playSong();
};

const updateSongProgress = (e) => {
	const { duration, currentTime } = e.srcElement;
	trackCurrentTime.textContent = getTime(currentTime);
	const progressPercent = (currentTime / duration) * 100;
	progress.style.width = `${progressPercent}%`;
	const index = syncLyric(myLyrics, currentTime);
	if (index == null) return;
	const lyrics = myLyrics[index];
	myText = lyrics;
	lyric.innerText = myText.text;
};

function songProgress(e) {
	const width = this.clientWidth;
	const clickX = e.offsetX;
	const duration = audio.duration;
	audio.currentTime = (clickX / width) * duration;
}

async function start(e) {
	const context = new AudioContext();
	const src = context.createMediaElementSource(audio);
	const analyser = context.createAnalyser();
	const ctx = visualizer.getContext("2d");
	src.connect(analyser);
	analyser.connect(context.destination);
	analyser.fftSize = 256;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	const WIDTH = visualizer.width;
	const HEIGHT = visualizer.height;
	const barWidth = WIDTH / bufferLength;
	let barHeight;
	let x = 0;

	function renderFrame() {
		requestAnimationFrame(renderFrame);
		x = 0;
		analyser.getByteFrequencyData(dataArray);
		ctx.fillStyle = "rgb(56, 67, 32)";
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
		for (let i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];
			const r = barHeight + 25 * (i / bufferLength);
			const g = 250 * (i / bufferLength);
			const b = 50;
			ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
			ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
			x += barWidth + 1;
		}
	}
	renderFrame();
}

playBtn.addEventListener("click", () => {
	if (isPlaying) {
		pauseSong();
	} else {
		playSong();
	}
});

nextBtn.addEventListener("click", () => {
	nextSong();
});

prevBtn.addEventListener("click", () => {
	prevSong();
});

repeatBtn.addEventListener("click", () => {
	repeatOneSong();
});

audio.addEventListener("timeupdate", updateSongProgress);

progressBar.addEventListener("click", songProgress);

audio.addEventListener("ended", nextSongOnEnded);

audio.addEventListener("playing", start);

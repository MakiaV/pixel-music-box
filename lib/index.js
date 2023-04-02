export const parseLyric = (lrc) => {
	const regex = /^\[(?<time>\d{2}:\d{2}(.\d{2})?)\](?<text>.*)/;

	const lines = lrc.split("\n");

	const output = [];

	lines.forEach((line) => {
		const match = line.match(regex);

		if (match == null) return;

		const { time, text } = match.groups;

		output.push({
			time: parseTime(time),
			text: text.trim(),
		});
	});

	function parseTime(time) {
		const minsec = time.split(":");

		const min = parseInt(minsec[0]) * 60;
		const sec = parseFloat(minsec[1]);

		return min + sec;
	}

	return output;
};

export const syncLyric = (lyrics, time) => {
	const scores = [];

	lyrics.forEach((lyric) => {
		const score = time - lyric.time;

		if (score >= 0) scores.push(score);
	});

	if (scores.length == 0) return null;

	const closest = Math.min(...scores);

	return scores.indexOf(closest);
};

export const getTime = (time) =>
	`0${Math.floor(time / 60)}:${`0${Math.floor(time % 60)}`.slice(-2)}`;

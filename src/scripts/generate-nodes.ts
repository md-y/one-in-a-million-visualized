import axios from 'axios';
import { load } from 'cheerio';
import type { ElementDefinition } from 'cytoscape';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const ROOT_ID = 'PmWQmZXYd74';

async function getVideo(id: string): Promise<string[] | null> {
	const res = await axios.get(`https://www.youtube.com/watch?v=${id}`);
	const body = res.data as string;

	const $ = load(body);
	const infoScript = $('body > script:contains("ytInitialPlayerResponse")').text();
	const title = $('title').text();

	const children: string[] = [];

	if (!title.startsWith('.') && !title.startsWith('-') && id !== ROOT_ID) {
		console.warn(
			`Found a probably non-RPS video in an endscreen, stopping route here: ${id} (${title})`
		);
		return null;
	}

	const startIndex = infoScript.indexOf(`"endscreen":{`);
	if (startIndex < 0) {
		throw new Error('Could not find endpoint start in script tag.');
	}

	let endIndex = startIndex;
	for (let bracketPairs = 1; bracketPairs > 0; endIndex++) {
		if (infoScript[endIndex] == '{') bracketPairs++;
		else if (infoScript[endIndex] == '}') bracketPairs--;
	}

	const endscreenObject = infoScript.slice(startIndex, endIndex);
	const regex = /watch\?v=([^"]+)"/gm;

	let match;
	while ((match = regex.exec(endscreenObject)) != null) {
		children.push(match[1]);
	}

	if (children.length == 0) console.warn(`No children found for ${id} (${title})`);
	else console.log(`Found ${children.length} children for ${id} (${title})`);

	return children;
}

type CacheObj = { visited: Record<string, string[] | null>; queue: string[] };

async function searchAllVideos(rootId: string): Promise<Record<string, string[]>> {
	let visitedVideos: Record<string, string[] | null> = {};
	let videoQueue: string[] = [rootId];

	const fileCacheLocation = './videos.temp.json';
	if (existsSync(fileCacheLocation)) {
		const fileStr = await readFile(fileCacheLocation, { encoding: 'utf-8' });
		const cacheObj: CacheObj = JSON.parse(fileStr);
		visitedVideos = cacheObj.visited;
		videoQueue = cacheObj.queue;
		console.log(
			`Starting from cached point with ${Object.keys(visitedVideos).length} visited videos` +
				`and ${videoQueue.length} in progress`
		);
	}

	while (videoQueue.length > 0) {
		const videoId = videoQueue.splice(0, 1)[0];
		const children = await getVideo(videoId);
		visitedVideos[videoId] = children;
		if (children !== null) {
			const newChildren = children.filter(
				(child) => !(child in visitedVideos) && !videoQueue.includes(child)
			);
			videoQueue.push(...newChildren);
		}
		const cacheObj: CacheObj = { visited: visitedVideos, queue: videoQueue };
		await writeFile(fileCacheLocation, JSON.stringify(cacheObj));
	}

	const filteredVideos: Record<string, string[]> = {};
	for (const id in visitedVideos) {
		const val = visitedVideos[id];
		if (val !== null) {
			filteredVideos[id] = val.filter((c) => visitedVideos[c] !== null);
		}
	}
	return filteredVideos;
}

function buildElementsFromCache(videos: Record<string, string[]>): ElementDefinition[] {
	const elements: ElementDefinition[] = [];

	Object.entries(videos).forEach(([parent, children]) => {
		elements.push({ data: { id: parent } });
		children.forEach((child) => {
			elements.push({ data: { id: `${parent}-${child}`, source: parent, target: child } });
		});
	});

	return elements;
}

const allVideos = await searchAllVideos(ROOT_ID);
const elements = buildElementsFromCache(allVideos);
writeFile('./src/elements.json', JSON.stringify(elements));

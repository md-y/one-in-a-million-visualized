<script lang="ts">
	import cytoscape, { type Core } from 'cytoscape';
	import elements from '../elements.json';

	let width: number, height: number;
	const parsedElements = elements.map((elem) => {
		let classes;

		// Specific nodes
		switch (elem.data.id) {
			case 's3rUNS68AKs':
			case 'PmWQmZXYd74':
				classes = 'endpoint';
				break;
			case 'd0R5Csv7ogU':
			case 'LvcxrEP2U-o':
			case 'AgHpWh77STQ':
			case 'wUjs_vVwh68':
				classes = 'loss';
				break;
			case '4wUukNXczpM':
			case 'GG6AZGhLCS4':
			case 'E3pdr5hNBe4':
			case '87zN8iWo5pU':
			case 'HunlKDzXNv0':
				classes = 'win';
				break;
		}

		if (classes) {
			return {
				...elem,
				classes: classes
			};
		}
		return elem;
	});

	let cyContainer: HTMLDivElement;
	$: {
		const cy = cytoscape({
			container: cyContainer,
			elements: parsedElements,

			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#666',
						label: 'data(id)'
					}
				},
				{
					selector: 'edge',
					style: {
						width: 3,
						'line-color': '#cccccc',
						'target-arrow-color': '#555555',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier'
					}
				},
				{
					selector: '.endpoint',
					style: {
						'background-color': '#5566ff',
						shape: 'star'
					}
				},
				{
					selector: '.loss',
					style: {
						'background-color': '#ff5555'
					}
				},
				{
					selector: '.win',
					style: {
						'background-color': '#1db52a'
					}
				}
			],

			layout: {
				name: 'breadthfirst',
				roots: ['PmWQmZXYd74'],
				directed: true,
				nodeDimensionsIncludeLabels: true
			}
		});

		cy.on('tap', 'node', (ev) => {
			let videoId: string = ev.target.id();
			window.open(`https://youtube.com/watch?v=${videoId}`);
		});
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css?family=Roboto:regular,bold&display=swap"
	/>
	<title>1 in a million</title>
</svelte:head>

<div
	id="cy-container"
	bind:this={cyContainer}
	bind:clientWidth={width}
	bind:clientHeight={height}
/>

<div id="overlay">
	<h1>CGP Grey 1-in-a-million visualization</h1>
	<h2>Every node is a video and is clickable.</h2>
	<h3>Controls</h3>
	<section>
		<ul>
			<li>Scroll to zoom</li>
			<li>Drag to pan</li>
			<li>Tap node to watch video</li>
		</ul>
	</section>
	<a href="https://www.youtube.com/watch?v=PmWQmZXYd74" target="_blank">Original Video</a>
</div>

<style>
	:global(body) {
		padding: 0;
		margin: 0;
		overflow: hidden;
	}

	#cy-container {
		width: 100vw;
		height: 100vh;
		display: block;
		margin: 0;
	}

	#overlay {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 10;
		padding: 1rem;
		pointer-events: none;

		font-family: 'Roboto', sans-serif;
		font-weight: 600;
	}

	#overlay a {
		text-decoration: underline;
		color: black;
		pointer-events: all;
	}

	#overlay h3 {
		margin-bottom: 0;
	}

	#overlay ul {
		margin-top: 0;
	}
</style>

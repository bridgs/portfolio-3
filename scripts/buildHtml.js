import Mustache from 'mustache';
import loadFile from './helper/loadFile';
import saveFile from './helper/saveFile';
import config from '../data/config.json';
import pixels from '../data/pixels.json';

let isLoaded = false;
let templates;
let content;
let styles;
let siteData;

async function load() {
	isLoaded = true;
	templates = {
		base: await loadFile('templates/base.mustache'),
		layout: await loadFile('templates/layout.mustache'),
		header: await loadFile('templates/header.mustache'),
		nav: await loadFile('templates/nav.mustache'),
		footer: await loadFile('templates/footer.mustache'),
		githubIcon: await loadFile('icons/github.svg'),
		twitterIcon: await loadFile('icons/twitter.svg')
	};
	content = {
		project: await loadFile('templates/project.mustache'),
		gallery: await loadFile('templates/gallery.mustache')
	};
	styles = {
		universal: await loadFile('styles/universal.css'),
		project: await loadFile('styles/project.css'),
		gallery: await loadFile('styles/gallery.css')
	};
	siteData = {
		siteName: config.siteName,
		sections: config.nav.map(section => config.sections[section]),
		githubUri: config.links.github,
		twitterUri: config.links.twitter,
		showDebugColors: config.showDebugColors
	};
}

export async function buildGalleryHtml(galleryData, projects, buildOptions) {
	if (!isLoaded) {
		await load();
	}
	let html = Mustache.render(templates.base, {
		...siteData,
		...buildOptions,
		projects: Object.values(projects),
		title: galleryData.title,
		showSubheading: true,
		navInHeader: false,
		showFooterText: true,
		isPixelArt: galleryData.isPixelArt,
		minBodyWidth: 300,
		minBodyHeight: null,
	}, {
		...templates,
		main: content.gallery,
		style: styles.universal + styles.gallery
	});
	await saveFile(`build/public/${galleryData.uri}.html`, html);
}

export async function buildProjectHtml(galleryData, projectData, buildOptions) {
	if (!isLoaded) {
		await load();
	}
	let html = Mustache.render(templates.base, {
		...siteData,
		...projectData,
		...buildOptions,
		showSubheading: false,
		navInHeader: true,
		showFooterText: false,
		isPixelArt: galleryData.isPixelArt,
		minBodyWidth: Math.max(projectData.image.project.width + 20, 300),
		minBodyHeight: Math.max(projectData.image.project.height + 200, 400),
		mainWidth: Math.max(projectData.image.project.width, 280)
	}, {
		...templates,
		main: content.project,
		style: styles.universal + styles.project
	});
	await saveFile(`build/public/${galleryData.uri}/${projectData.project}.html`, html);
};
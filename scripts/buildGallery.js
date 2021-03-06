import config from '../data/config.json';
import addGalleryMetadata from './addGalleryMetadata';
import processProjectImages from './processProjectImages';
import buildSpriteSheet from './buildSpriteSheet';
import determineGridSizes from './determineGridSizes';
import buildGrid from './buildGrid';
import { buildGalleryHtml, buildProjectHtml } from './buildHtml';

export default async (galleryData, projects) => {
	console.log(`Building ${galleryData.title}`);
	console.log('  Adding project metadata...');
	let proxies = await addGalleryMetadata(galleryData, projects);
	console.log('  Determining grid sizes...');
	await determineGridSizes(galleryData, projects);
	console.log('  Processing project images...');
	await processProjectImages(galleryData, projects);
	console.log('  Building spritesheet...');
	await buildSpriteSheet(galleryData, projects);
	console.log('  Building grid...');
	await buildGrid(projects);
	console.log('  Building gallery html...');
	await buildGalleryHtml(galleryData, projects);
	if (config.index === galleryData.section) {
		await buildGalleryHtml(galleryData, projects, {
			title: null,
			uri: 'index'
		});
	}
	console.log('  Building project html...');
	for (let [ project, projectData ] of Object.entries(projects)) {
		if (projectData.type !== 'link') {
			await buildProjectHtml(galleryData, projectData);
		}
	}
	console.log(`  Done building ${galleryData.title}!`);
	return proxies;
};
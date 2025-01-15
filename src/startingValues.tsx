import { Tools, Vector3 } from 'babylonjs';
import { MeshesTooltips } from './components/SkillsContext';

export interface loadingModelProps {
	modelName: string;
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
}

export interface meshStartingProps {
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
}

const startingLoadingModels: loadingModelProps[] = [
	{
		modelName: 'css3.gltf',
		position: new Vector3(0, 0.6, -1.6),
		rotation: new Vector3(0, Tools.ToRadians(270), 0),
		scaling: new Vector3(-0.007, 0.007, 0.007),
		visibility: 1
	},
	{
		modelName: 'react.gltf',
		position: new Vector3(0, 2.1, 0),
		rotation: new Vector3(0, Tools.ToRadians(270), 0),
		scaling: new Vector3(0.3, 0.3, 0.3),
		visibility: 1
	},
	{
		modelName: 'logos.gltf',
		position: new Vector3(0, 4.1, -1.1),
		rotation: new Vector3(0, Tools.ToRadians(270), 0),
		scaling: new Vector3(0.7, 0.7, -0.7),
		visibility: 0
	},
	{
		modelName: 'html5.gltf',
		position: new Vector3(0, 2, 1.6),
		rotation: new Vector3(0, Tools.ToRadians(180), 0),
		scaling: new Vector3(0.25, 0.25, -0.25),
		visibility: 1
	}
];

const meshStartingPropsObject: { [key: string]: meshStartingProps } = {
	JAVASCRIPT_5: {
		visibility: 1
	}
};

const loadingAnimationModelsNames: string[] = [
	'css3',
	'html5',
	'logos',
	'react'
];

const startingTooltips: MeshesTooltips[] = [
	{
		name: 'css3_tooltip',
		targetMeshName: 'css3',
		text: 'CSS3 Model Tooltip'
	}
];

export {
	startingLoadingModels,
	loadingAnimationModelsNames,
	meshStartingPropsObject,
	startingTooltips
};

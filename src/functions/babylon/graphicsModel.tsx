import {
	AbstractMesh,
	Scene,
	Vector3,
	MeshBuilder,
	StandardMaterial,
	Mesh,
	Color3,
	ActionManager,
	ExecuteCodeAction,
	DynamicTexture
} from 'babylonjs';
import {
	changeMeshVisibility,
	MeshMetadataI,
	ModelGroupsI,
	toColor3
} from './models';
import {
	GraphicsModelsT,
	LoadedNodesType
} from '../../components/SkillsContext';

export const createGraphicModels = async (
	graphicModelsNames: GraphicsModelsT,
	scene: Scene,
	modelGroups: ModelGroupsI
): Promise<AbstractMesh[]> => {
	const createGraphicModel = async (
		name: string,
		position: Vector3,
		rotation: Vector3,
		scene: Scene,
		boxSize: { width: number; height: number; depth: number }
	): Promise<AbstractMesh> => {
		const mesh = MeshBuilder.CreateBox(name, boxSize, scene);
		mesh.position = position;
		mesh.rotation = rotation;
		const meshMetadata: MeshMetadataI = {
			visibility: 1,
			mainParent: mesh,
			mainParentName: name.toLocaleLowerCase(),
			linkName: name,
			linkGroupName:
				Object.entries(modelGroups).find(([, group]) =>
					group.linkNames.includes(name)
				)?.[0] || 'common',
			currentTheme: localStorage.getItem('theme') || 'default'
		};
		mesh.metadata = meshMetadata;

		const rootStyles = getComputedStyle(document.documentElement);
		const bgColor =
			rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';
		const lineColor =
			rootStyles.getPropertyValue('--button-text') || 'rgba(0, 0, 0, 1)';

		const textureSize: number = 1024;
		const texture = new DynamicTexture(
			'dynamicTexture',
			textureSize,
			scene,
			false
		);
		texture.hasAlpha = true;

		const context = texture.getContext();

		context.fillStyle = bgColor;
		context.fillRect(0, 0, textureSize, textureSize);
		texture.update();

		const material = new StandardMaterial('paintableMaterial', scene);
		material.diffuseTexture = texture;
		material.specularColor = new Color3(0, 0, 0);
		mesh.material = material;

		const sphereObjects = {
			0: { position: new Vector3(-0.25, 1.4, 1.6), diameter: 0.3 },
			1: { position: new Vector3(0.15, 3.5, 1), diameter: 0.3 },
			3: { position: new Vector3(0.15, 3.5, -1), diameter: 0.3 },
			4: { position: new Vector3(-0.25, 1.4, -1.6), diameter: 0.3 }
		};
		Object.entries(sphereObjects).forEach(([key, value]) => {
			const sphere = createVectorSphere(
				scene,
				key,
				value.position,
				value.diameter,
				lineColor
			);
			sphere.setParent(mesh);
		});

		return mesh;
	};

	const graphicModels = await Promise.all(
		Object.entries(graphicModelsNames).map(async ([modelName, value]) => {
			return await createGraphicModel(
				modelName,
				value.position,
				value.rotation,
				scene,
				value.boxSize
			);
		})
	);

	return graphicModels;
};

const createVectorSphere = (
	scene: Scene,
	indexName: string,
	position: Vector3,
	diameter: number = 1,
	color: string = 'rgba(255, 0, 0, 1)'
): Mesh => {
	const sphere = MeshBuilder.CreateSphere(
		'redSphere_' + indexName,
		{ diameter: diameter },
		scene
	);
	sphere.position = position;
	const material = new StandardMaterial('redMaterial', scene);
	material.diffuseColor = toColor3(color);
	sphere.material = material;

	sphere.actionManager = new ActionManager(scene);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
			changeMeshVisibility(sphere, 0, true, 0.1);
			// Добавить точку на канвас текстуры
		})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
			if (sphere.visibility !== 0) {
				changeMeshVisibility(sphere, 0.5);
			}
		})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
			if (sphere.visibility !== 0) {
				changeMeshVisibility(sphere, 0.1);
			}
		})
	);

	return sphere;
};

export function changeVectorModelsColor(
	graphicModelsNames: GraphicsModelsT,
	loadedNodes: LoadedNodesType
) {
	const keys1 = Object.keys(graphicModelsNames);
	const keys2 = Object.keys(loadedNodes);
	const commonKeys = keys1.filter(key => keys2.includes(key));
	const result: LoadedNodesType = {};
	commonKeys.forEach(key => {
		result[key] = loadedNodes[key];
	});
	Object.entries(result).forEach(([, node]) => {
		const mesh = node.node as AbstractMesh;
		const rootStyles = getComputedStyle(document.documentElement);
		const bgColor =
			rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';
		const lineColor =
			rootStyles.getPropertyValue('--button-text') || 'rgba(0, 0, 0, 1)';
		if (mesh) {
			const texture = (mesh.material as StandardMaterial)
				.diffuseTexture as DynamicTexture;
			if (texture) {
				const context = texture.getContext();
				context.fillStyle = bgColor;
				context.fillRect(0, 0, 1024, 1024);
				texture.update();
			}
		}
		const meshChildren = mesh.getChildMeshes();
		if (meshChildren.length > 0) {
			meshChildren.forEach(child => {
				if (child.material && child.material instanceof StandardMaterial) {
					child.material.diffuseColor = toColor3(lineColor);
				}
			});
		}
	});
}

import {
	AbstractMesh,
	Scene,
	Vector3,
	MeshBuilder,
	StandardMaterial,
	Texture,
	Mesh,
	Color3,
	ActionManager,
	ExecuteCodeAction
} from 'babylonjs';
import { changeMeshVisibility, MeshMetadataI, ModelGroupsI } from './models';
import { GraphicsModelsT } from '../../components/SkillsContext';

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
				)?.[0] || 'common'
		};
		mesh.metadata = meshMetadata;

		// TODO Сделать текстуру СВГ
		// Рассчитать точку клика, взяв за положение мышки 2Д проекцию меша
		// В нужном месте отрисовать точку на СВГ текстуре

		// TODO Создать меши сферы, добавить им клики
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
				value.diameter
			);
			sphere.setParent(mesh);
		});
		// по клику будет создаваться точка
		// сделать что можно в любой последовательности жамкать и будет правильно рисоваться линии между точками

		const material = new StandardMaterial('boxMaterial', scene);
		const texture = new Texture(
			'./babylon/models/textures/SWIFT_baseColor.png',
			scene
		);
		material.diffuseTexture = texture;
		material.specularColor.set(0.1, 0.1, 0.1);
		material.emissiveColor.set(0, 0, 0);
		material.ambientColor.set(1, 1, 1);
		mesh.material = material;

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
	diameter: number = 1
): Mesh => {
	const sphere = MeshBuilder.CreateSphere(
		'redSphere_' + indexName,
		{ diameter: diameter },
		scene
	);
	sphere.position = position;
	const material = new StandardMaterial('redMaterial', scene);
	material.diffuseColor = Color3.Red();
	sphere.material = material;

	sphere.actionManager = new ActionManager(scene);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
			// TODO После клика удалять меш из сцены.
			// Добавить точку на канвас текстуры
		})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
			changeMeshVisibility(sphere, 0.5);
		})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
			changeMeshVisibility(sphere, 0.1);
		})
	);

	return sphere;
};

import {
	AbstractMesh,
	Node,
	Scene,
	SceneLoader,
	Tools,
	Vector3
} from 'babylonjs';

export const changeMeshVisibility = (node: Node, visibility: number): void => {
	if (node instanceof AbstractMesh) {
		const isVisible = visibility === 0 ? false : true;
		node.visibility = visibility;
		node.isPickable = isVisible;
	}
	node.getChildren().forEach(child => {
		changeMeshVisibility(child, visibility);
	});
};

export const delay = (ms: number) =>
	new Promise(resolve => setTimeout(resolve, ms));

export const loadModels = async (
	modelsNames: string[],
	scene: Scene
): Promise<AbstractMesh[]> => {
	const loadedModels = await Promise.all(
		modelsNames.map(async modelName => {
			try {
				const model = await SceneLoader.ImportMeshAsync(
					'',
					'./babylon/models/',
					modelName,
					scene
				);

				await Promise.all(
					model.meshes.map(mesh =>
						mesh.material?.getActiveTextures().map(texture => texture?.readPixels?.())
					)
				);

				const mainMesh = model.meshes[0];
				mainMesh.name = modelName.slice(0, modelName.indexOf('.'));

				if (modelName === 'css3.gltf') {
					mainMesh.position = new Vector3(0, 0.6, -1.6);
					mainMesh.scaling = new Vector3(-0.007, 0.007, 0.007);
					mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
				} else if (modelName === 'react.gltf') {
					mainMesh.position = new Vector3(0, 2.1, 0);
					mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
					mainMesh.scaling = new Vector3(0.3, 0.3, 0.3);
				} else if (modelName === 'logos.gltf') {
					mainMesh.position = new Vector3(0, 4.1, -1.1);
					mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
					mainMesh.scaling = new Vector3(0.7, 0.7, -0.7);
				} else if (modelName === 'html5.gltf') {
					mainMesh.position = new Vector3(0, 2, 1.6);
					mainMesh.scaling = new Vector3(0.25, 0.25, -0.25);
				}
				changeMeshVisibility(mainMesh, 0);

				return mainMesh;
			} catch (error) {
				console.error(`Ошибка при загрузке модели ${modelName}:`, error);
				return null;
			}
		})
	);

	return loadedModels.filter((model): model is AbstractMesh => model !== null);
};

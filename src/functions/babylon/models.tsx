import {
	AbstractMesh,
	ActionEvent,
	ActionManager,
	Animation,
	ArcRotateCamera,
	Color4,
	DirectionalLight,
	Engine,
	ExecuteCodeAction,
	HDRCubeTexture,
	Mesh,
	Node,
	Scene,
	SceneLoader,
	ShadowGenerator,
	Tools,
	Vector3
} from 'babylonjs';
import { randomNumber } from './common';
import { babylonProjectStatesI } from '../../components/SkillsContext';
import {
	loadingAnimationModelsNames,
	loadingModelProps,
	meshStartingPropsObject,
	startingLoadingModels
} from '../../startingValues';

interface MeshMetadataI {
	mainParent?: Node | AbstractMesh | Mesh;
	mainParentName?: string;
}

interface animationOptionsI {
	amplitude?: number;
	speed?: number;
	axis?: 'x' | 'y' | 'z';
	type?: 'position' | 'rotation';
}

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

export const loadModels = async (
	startingModels: loadingModelProps[],
	scene: Scene
): Promise<AbstractMesh[]> => {
	const loadedModels = await Promise.all(
		startingModels.map(async startingModel => {
			try {
				const model = await SceneLoader.ImportMeshAsync(
					'',
					'./babylon/models/',
					startingModel.modelName,
					scene
				);
				const mainMesh = model.meshes[0];
				mainMesh.name = startingModel.modelName.slice(
					0,
					startingModel.modelName.indexOf('.')
				);
				mainMesh.rotation = new Vector3(0, 0, 0);

				await Promise.all(
					model.meshes.map(mesh => {
						const meshMetadata: MeshMetadataI = {
							mainParent: mainMesh,
							mainParentName: mainMesh.name
						};
						mesh.metadata = meshMetadata;
						mesh.material
							?.getActiveTextures()
							.map(texture => texture?.readPixels?.());
					})
				);

				if (startingModel.position) {
					mainMesh.position = startingModel.position;
				}
				if (startingModel.rotation) {
					mainMesh.rotation = startingModel.rotation;
				}
				if (startingModel.scaling) {
					mainMesh.scaling = startingModel.scaling;
				}

				return mainMesh;
			} catch (error) {
				console.error(
					`Ошибка при загрузке модели ${startingModel.modelName}:`,
					error
				);
				return null;
			}
		})
	);

	return loadedModels.filter((model): model is AbstractMesh => model !== null);
};

export const addCycleMeshAnimation = (
	mesh: Node,
	scene: Scene,
	options: animationOptionsI = {}
): void => {
	const amplitude = options.amplitude || 0.1;
	const speed = options.speed || 1;
	const type = options.type || 'position';
	const axis = options.axis || 'y';
	const startValue = mesh[type as keyof Node][axis];

	const animation = new Animation(
		`${mesh.name}_cycle_${type}_${axis}`,
		`${type}.${axis}`,
		60,
		Animation.ANIMATIONTYPE_FLOAT,
		Animation.ANIMATIONLOOPMODE_CYCLE
	);

	const keyFrames = [
		{ frame: 0, value: startValue },
		{ frame: 30, value: startValue + amplitude },
		{ frame: 60, value: startValue }
	];
	animation.setKeys(keyFrames);

	animation.framePerSecond = 60;

	mesh.animations.push(animation);
	scene.beginAnimation(mesh, 0, 60, true, 60 / (speed * 60));
};

export const meshLookAtCamera = (mesh: Node): void => {
	const scene = mesh.getScene();
	const camera = scene.activeCamera;
	if (camera) {
		const observer = camera.getScene().onBeforeRenderObservable.add(() => {
			(mesh as AbstractMesh).lookAt(camera.position);
		});

		scene.onDisposeObservable.add(() => {
			scene.onBeforeRenderObservable.remove(observer);
		});
	}
};

export function triggerMouseMeshLogic(type: string, e: ActionEvent) {
	if (type === 'OnPointerOverTrigger') {
		triggerOverMesh(e);
	}
	if (type === 'OnPointerOutTrigger') {
		triggerOutMesh(e);
	}

	function triggerOverMesh(e: ActionEvent) {
		const mainParentName = e.meshUnderPointer?.metadata.mainParentName || null;
		if (mainParentName) {
			revialTooltip(mainParentName);
		}
	}
	function triggerOutMesh(e: ActionEvent) {
		const mainParentName = e.meshUnderPointer?.metadata.mainParentName || null;
		if (mainParentName) {
			hideTooltip(mainParentName);
		}
	}
}

export const createScene = async (engine: Engine): Promise<Scene> => {
	const scene = new Scene(engine);
	scene.clearColor = new Color4(0, 0, 0, 0);
	scene.hoverCursor = 'pointer';
	return scene;
};

export const createCamera = async (
	scene: Scene,
	canvas: HTMLCanvasElement
): Promise<ArcRotateCamera> => {
	const camera = new ArcRotateCamera(
		'camera',
		Math.PI / 2,
		Math.PI / 2,
		6,
		new Vector3(-1, 2.5, 0),
		scene
	);
	camera.alpha = Tools.ToRadians(180);
	camera.beta = Tools.ToRadians(80);
	camera.attachControl(canvas, true);
	return camera;
};

export const createLight = async (scene: Scene): Promise<DirectionalLight> => {
	const light = new DirectionalLight('dir01', new Vector3(0.3, -1, 0), scene);
	light.position = new Vector3(0, 0, 0);
	light.intensity = 3;

	scene.environmentTexture = new HDRCubeTexture(
		'./babylon/HDR-environment.hdr',
		scene,
		150
	);
	scene.createDefaultEnvironment({
		groundSize: 50,
		skyboxSize: 50,
		environmentTexture: './babylon/HDR-environment.hdr'
	});

	return light;
};

export const createModels = async (
	scene: Scene
): Promise<(Mesh | AbstractMesh)[]> => {
	const modelsArray = await loadModels(startingLoadingModels, scene);

	modelsArray.forEach(model => {
		if (model) {
			changeMeshVisibility(model, 0);
			addActionManagerToMesh(model, [
				'OnPointerOverTrigger',
				'OnPointerOutTrigger',
				'OnPickDownTrigger',
				'OnPickUpTrigger'
			]);
		}
	});

	loadingAnimationModelsNames.forEach(modelName => {
		const mesh = scene.getNodeByName(modelName);
		if (mesh) {
			const randomAmplitudePosition = randomNumber(-0.5, 0.5);
			const randomSpeedPosition = randomNumber(3, 5);
			addCycleMeshAnimation(mesh, scene, {
				amplitude: randomAmplitudePosition,
				speed: randomSpeedPosition,
				axis: 'y',
				type: 'position'
			});

			const randomAmplitudeRotation = randomNumber(-1, 1);
			const randomSpeedRotation = randomNumber(5, 10);
			addCycleMeshAnimation(mesh, scene, {
				amplitude: randomAmplitudeRotation,
				speed: randomSpeedRotation,
				axis: 'y',
				type: 'rotation'
			});
		}
	});

	const followCameraMeshes: string[] = ['react'];
	followCameraMeshes.forEach(modelName => {
		const mesh = scene.getNodeByName(modelName);
		if (mesh) {
			meshLookAtCamera(mesh);
		}
	});

	startingLoadingModels.forEach(model => {
		const mesh = scene.getNodeByName(
			model.modelName.slice(0, model.modelName.indexOf('.'))
		);

		if (mesh && typeof model.visibility === 'number') {
			changeMeshVisibility(mesh, model.visibility);
		}
	});

	for (const key in meshStartingPropsObject) {
		const mesh = scene.getNodeByName(key);

		if (mesh && typeof meshStartingPropsObject[key].visibility === 'number') {
			changeMeshVisibility(mesh, meshStartingPropsObject[key].visibility);
		}
	}
	console.log(meshStartingPropsObject);

	return modelsArray;
};

export const createShadows = async (
	light: DirectionalLight,
	models: (Mesh | AbstractMesh)[]
): Promise<ShadowGenerator> => {
	const shadowGenerator = new ShadowGenerator(1024, light);
	shadowGenerator.useBlurExponentialShadowMap = true;
	shadowGenerator.blurKernel = 32;
	models.forEach(model => {
		shadowGenerator.addShadowCaster(model);
		model.receiveShadows = true;
	});
	light.autoCalcShadowZBounds = true;
	return shadowGenerator;
};

export const createBabylonProject = async (
	canvas: HTMLCanvasElement,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
): Promise<() => void> => {
	const engine = new Engine(canvas, true, {
		adaptToDeviceRatio: true,
		antialias: true
	});
	setBabylonProjectStates(prevState => ({
		...prevState,
		engine: engine
	}));
	const scene = await createScene(engine);
	if (scene.isReady()) {
		const camera = await createCamera(scene, canvas);
		const light = await createLight(scene).catch(() => null);
		const models = await createModels(scene).catch(() => null);
		let shadows: ShadowGenerator | null = null;
		if (light && models) {
			shadows = await createShadows(light, models).catch(() => null);
		}

		setBabylonProjectStates(prevState => ({
			...prevState,
			scene: scene,
			camera: camera,
			light: light,
			models: models,
			shadows: shadows || prevState.shadows
		}));

		engine.runRenderLoop(() => {
			scene.render();
		});
		window.addEventListener('resize', () => {
			engine.resize();
		});
	}
	return () => {
		engine.dispose();
	};
};

function addActionManagerToMesh(
	model: AbstractMesh,
	actionManagerTypes: string[]
) {
	const scene = model.getScene();
	if (!scene) {
		return;
	}

	const groupArray = [model].concat(model.getChildMeshes());
	groupArray.forEach(mesh => {
		mesh.actionManager = new ActionManager(scene);
		actionManagerTypes.forEach(type => {
			if (type in ActionManager) {
				const actionType = ActionManager[type as keyof typeof ActionManager];
				mesh.actionManager!.registerAction(
					new ExecuteCodeAction(actionType, e => {
						triggerMouseMeshLogic(type, e);
					})
				);
			} else {
				console.warn(`Неизвестный тип триггера: ${type}`);
			}
		});
	});
}

function revialTooltip(tooltipName: string) {
	console.log(tooltipName);
}
function hideTooltip(tooltipName: string) {
	console.log(tooltipName);
}

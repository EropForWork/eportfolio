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
				mainMesh.rotation = new Vector3(0, 0, 0);

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
					mainMesh.rotation = new Vector3(0, Tools.ToRadians(180), 0);
					mainMesh.scaling = new Vector3(0.25, 0.25, -0.25);
				}

				return mainMesh;
			} catch (error) {
				console.error(`Ошибка при загрузке модели ${modelName}:`, error);
				return null;
			}
		})
	);

	return loadedModels.filter((model): model is AbstractMesh => model !== null);
};

interface animationOptionsI {
	amplitude?: number;
	speed?: number;
	axis?: 'x' | 'y' | 'z';
	type?: 'position' | 'rotation';
}

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

export function triggerMouseMeshLogic(e: ActionEvent) {
	console.log(123);

	console.log(e);
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
	const modelsNames = ['css3.gltf', 'html5.gltf', 'react.gltf', 'logos.gltf'];
	const modelsArray = await loadModels(modelsNames, scene);

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

	const animationModels: string[] = ['css3', 'html5', 'logos'];

	animationModels.forEach(modelName => {
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

	const visibleModels: string[] = ['css3', 'html5', 'react', 'JAVASCRIPT_5'];
	visibleModels.forEach(model => {
		const mesh = scene.getNodeByName(model);
		if (mesh) {
			changeMeshVisibility(mesh, 1);
		}
	});

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
						console.log(`Trigger: ${type}`, e);
					})
				);
			} else {
				console.warn(`Неизвестный тип триггера: ${type}`);
			}
		});
	});
}

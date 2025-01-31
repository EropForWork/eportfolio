import {
	AbstractMesh,
	ActionManager,
	Animatable,
	Animation,
	AnimationGroup,
	Color3,
	Color4,
	DirectionalLight,
	EasingFunction,
	Engine,
	ExecuteCodeAction,
	HDRCubeTexture,
	Mesh,
	Node,
	QuadraticEase,
	Scene,
	SceneLoader,
	// ShadowGenerator,
	TransformNode,
	Vector3
} from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { animateValue, randomNumber } from './common';
import {
	babylonProjectStatesI,
	GitGraphValuesType,
	GraphicsModelsT,
	LoadedNodesType,
	loadingModelProps,
	meshStartingProps,
	MeshTooltip
} from '../../components/SkillsContext';
import { CameraPropsI, createCamera } from './camera';
import { createGraphicModels } from './graphicsModel';
import { buildCommitTree } from './treeModel';

export interface MeshMetadataI {
	visibility: number;
	mainParent?: Node | AbstractMesh | Mesh;
	mainParentName?: string;
	cycleAnimation?: Animatable;
	realVisibility?: number;
	startingVisibility?: number;
	linkName?: string;
	linkGroupName?: string;
	currentTheme?: string;
}

interface SceneMetadataI {
	gui?: GUI.AdvancedDynamicTexture;
}

interface animationOptionsI {
	amplitude?: number;
	speed?: number;
	axis?: 'x' | 'y' | 'z';
	type?: 'position' | 'rotation';
}

export interface ModelGroupsI {
	[groupName: string]: {
		linkNames: string[];
		models: AbstractMesh[] | Mesh[] | Node[] | TransformNode[];
	};
}

/**
 * Изменяет видимость меша и его дочерних элементов.
 *
 * @param {Node} node - Меш, видимость которого нужно изменить.
 * @param {number} propVisibility - Желаемая видимость (от 0 до 1).
 * @param {boolean} [saveVisibility=true] - Сохранять ли текущую видимость в метаданных.
 * @param {number} [duration=300] - Длительность анимации в миллисекундах.
 * @param {boolean} [force=false] - Принудительно использовать заданную видимость.
 */
export const changeMeshVisibility = (
	node: Node,
	propVisibility: number,
	saveVisibility: boolean = true,
	duration: number = 300,
	force: boolean = false
): void => {
	const visibility = node.name.includes('redSphere_')
		? propVisibility === 1
			? 0.1
			: propVisibility
		: force
			? propVisibility
			: (node.metadata?.startingVisibility ?? 0);

	(node.metadata as MeshMetadataI) = {
		...node.metadata,
		realVisibility: saveVisibility ? undefined : node.metadata.visibility,
		visibility: visibility
	};

	if (node instanceof AbstractMesh || node instanceof Mesh) {
		if (duration === 0) {
			node.visibility = visibility;
			node.isPickable = visibility !== 0;
		} else {
			const easingFunction = new QuadraticEase();
			easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

			const animationGroup = new AnimationGroup('meshVisibilityAnimationGroup');
			const visibilityAnimation = new Animation(
				'visibilityAnimation',
				'visibility',
				60,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT
			);

			const keyFrames = [
				{ frame: 0, value: node.visibility },
				{ frame: (duration / 1000) * 60, value: visibility }
			];
			visibilityAnimation.setKeys(keyFrames);
			visibilityAnimation.setEasingFunction(easingFunction);

			animationGroup.addTargetedAnimation(visibilityAnimation, node);

			node.isPickable = visibility !== 0;
			animationGroup.onAnimationGroupEndObservable.add(() => {
				animationGroup.dispose();
			});

			animationGroup.start();
		}
	}

	node.getChildren().forEach(child => {
		changeMeshVisibility(child, visibility, saveVisibility, duration, force);
	});
};

/**
 * Загружает модели в сцену Babylon.js.
 *
 * @param {loadingModelProps[]} startingModels - Массив свойств для загрузки моделей.
 * @param {Scene} scene - Сцена Babylon.js, в которую будут загружены модели.
 * @param {ModelGroupsI} modelGroups - Объект групп моделей.
 * @returns {Promise<AbstractMesh[]>} - Промис, который разрешается массивом загруженных мешей.
 */
export const loadModels = async (
	startingModels: loadingModelProps[],
	scene: Scene,
	modelGroups: ModelGroupsI
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
				mainMesh.name = startingModel.linkName;
				mainMesh.rotation = new Vector3(0, 0, 0);

				model.meshes.forEach(mesh => {
					addMeshMetadata(
						mesh,
						modelGroups,
						startingModel.visibility ? startingModel.visibility : 1,
						mainMesh,
						mainMesh.name.toLocaleLowerCase(),
						startingModel.linkName
					);
					mesh.material
						?.getActiveTextures()
						?.forEach(texture => texture?.readPixels?.());
					mesh.overlayAlpha = 0;
				});

				if (startingModel.position) {
					mainMesh.position = startingModel.position;
				}
				if (startingModel.rotation) {
					mainMesh.rotation = startingModel.rotation;
				}
				if (startingModel.scaling) {
					mainMesh.scaling = startingModel.scaling;
				}

				if (startingModel.linkName === 'robot') {
					const tposeRobotAnimation = scene.getAnimationGroupByName('tpose');
					if (tposeRobotAnimation) {
						tposeRobotAnimation.dispose();
					}
					const walkRobotAnimation = scene.getAnimationGroupByName('walk');
					if (walkRobotAnimation) {
						walkRobotAnimation.stop();
						walkRobotAnimation.start(true, 1, 60, 120);
						walkRobotAnimation.weight = 1;
					}
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

const addCycleMeshAnimation = (
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

/**
 * Создает сцену Babylon.js.
 *
 * @param {Engine} engine - Движок Babylon.js, используемый для создания сцены.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 * @param {CameraPropsI} startingCameraProps - Свойства для создания камеры.
 */
export async function createScene(
	engine: Engine,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	startingCameraProps: CameraPropsI
) {
	const scene = new Scene(engine);
	scene.clearColor = new Color4(0, 0, 0, 0);
	scene.hoverCursor = 'pointer';
	const sceneMetadata: SceneMetadataI = {};
	scene.metadata = sceneMetadata;
	if (scene.isReady()) {
		scene.debugLayer.show({
			handleResize: false,
			overlay: true
		});
		setBabylonProjectStates(prevState => ({
			...prevState,
			scene: scene
		}));
		const camera = await createCamera(
			scene,
			engine.getRenderingCanvas()!,
			startingCameraProps
		);
		setBabylonProjectStates(prevState => ({
			...prevState,
			state: 'initialized',
			camera: camera
		}));
	}
}

/**
 * Создает источник света в сцене Babylon.js.
 *
 * @param {Scene} scene - Сцена Babylon.js, в которой будет создан источник света.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 */
export function createLight(
	scene: Scene,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
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
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'loading',
		light: light
	}));
}

/**
 * Загружает пользовательские модели в сцену Babylon.js.
 *
 * @param {loadingModelProps[]} startingLoadingModels - Массив свойств для загрузки моделей.
 * @param {Scene} scene - Сцена Babylon.js, в которой будут загружены модели.
 * @param {ModelGroupsI} modelGroups - Объект групп имен моделей.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 * @param {GraphicsModelsT} graphicModelsNames - Имена графических моделей для создания.
 * @param {GitGraphValuesType} gitGraphValues - Значения для построения графа коммитов.
 */
export async function loadUserModels(
	startingLoadingModels: loadingModelProps[],
	scene: Scene,
	modelGroups: ModelGroupsI,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	graphicModelsNames: GraphicsModelsT,
	gitGraphValues: GitGraphValuesType
) {
	const modelsArray = await loadModels(
		startingLoadingModels,
		scene,
		modelGroups
	);

	const graphicModels = await createGraphicModels(
		graphicModelsNames,
		scene,
		modelGroups
	);

	const gitGraphModel: AbstractMesh = await buildCommitTree(
		scene,
		gitGraphValues,
		modelGroups
	);

	const modifiedModelsArray = modelsArray.concat(graphicModels);
	modifiedModelsArray.push(gitGraphModel);

	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'loaded',
		models: modifiedModelsArray
	}));
}

/**
 * Обрабатывает пользовательские модели в сцене Babylon.js.
 *
 * @param {Scene} scene - Сцена Babylon.js, в которой находятся модели.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы.
 * @param {(Mesh | AbstractMesh)[]} modelsArray - Массив моделей, которые нужно обработать.
 * @param {MeshTooltip[]} startingTooltips - Массив объектов подсказок.
 * @param {string[]} loadingAnimationModelsNames - Массив имен моделей, для которых нужно добавить анимацию загрузки.
 * @param {{ [key: string]: meshStartingProps }} meshStartingPropsObject - Объект начальных свойств для моделей.
 * @param {(key: string, value: { node: Node | AbstractMesh | Mesh | TransformNode }) => void} addNode - Функция для добавления узла в loadedNodes.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 * @param {React.Dispatch<React.SetStateAction<AbstractMesh | null>>} setOveredMesh - Функция для обновления состояния меша, над которым находится указатель мыши.
 * @param {string[]} registerActionsModelsNames - Массив имен моделей, для которых нужно зарегистрировать действия.
 * @param {ModelGroupsI} modelGroups - Объект групп имен моделей.
 * @param {(key: string) => void} removeNode - Функция для удаления узла из loadedNodes.
 */
export async function processingUserModels(
	scene: Scene,
	loadedNodes: LoadedNodesType,
	modelsArray: (Mesh | AbstractMesh)[],
	startingTooltips: MeshTooltip[],
	loadingAnimationModelsNames: string[],
	meshStartingPropsObject: {
		[key: string]: meshStartingProps;
	},
	addNode: (
		key: string,
		value: {
			node: Node | AbstractMesh | Mesh | TransformNode;
		}
	) => void,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>,
	registerActionsModelsNames: string[],
	modelGroups: ModelGroupsI,
	removeNode: (key: string) => void
) {
	/**
	 * Направляет меш на камеру перед каждым рендерингом.
	 *
	 * @param {Node} mesh - Меш, который должен смотреть на камеру.
	 */
	const meshLookAtCamera = (mesh: Node): void => {
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

	createMeshTooltips(modelsArray, scene, startingTooltips, loadedNodes);

	registerActionsModelsNames.forEach(modelName => {
		const mesh = loadedNodes[modelName]?.node;
		if (mesh) {
			addActionManagerToMesh(
				mesh as AbstractMesh,
				[
					'OnPointerOverTrigger',
					'OnPointerOutTrigger',
					'OnPickDownTrigger',
					'OnPickUpTrigger'
				],
				startingTooltips,
				loadedNodes,
				setOveredMesh
			);
		}
	});

	modelsArray.forEach(model => {
		changeMeshVisibility(model, 0, true, 0, true);
	});

	loadingAnimationModelsNames.forEach(modelName => {
		const mesh = loadedNodes[modelName]?.node;
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
		const mesh = loadedNodes[modelName]?.node;
		if (mesh) {
			meshLookAtCamera(mesh);
		}
	});

	Object.entries(meshStartingPropsObject).forEach(([name, value]) => {
		const mesh = loadedNodes[name]?.node;
		if (!mesh) {
			return;
		}
		removeNode(name);
		mesh.name = value.linkName;
		addMeshMetadata(
			mesh as AbstractMesh,
			modelGroups,
			value.visibility ? value.visibility : 1,
			mesh as AbstractMesh,
			mesh.name.toLocaleLowerCase(),
			value.linkName
		);
		mesh.getChildMeshes().forEach(child => {
			addMeshMetadata(
				child as AbstractMesh,
				modelGroups,
				value.visibility ? value.visibility : 1,
				mesh as AbstractMesh,
				mesh.name.toLocaleLowerCase(),
				value.linkName
			);
		});
		addNode(mesh.name, { node: mesh });
	});

	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'processed',
		models: modelsArray
	}));
}

/**
 * Выполняет логику при взаимодействии мыши с мешом.
 *
 * @param {string} type - Тип триггера (например, 'OnPointerOverTrigger').
 * @param {AbstractMesh} mesh - Меш, с которым происходит взаимодействие.
 * @param {MeshTooltip[]} startingTooltips - Массив объектов подсказок.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы.
 * @param {React.Dispatch<React.SetStateAction<AbstractMesh | null>>} setOveredMesh - Функция для обновления состояния меша, над которым находится указатель мыши.
 */
export function triggerMouseMeshLogic(
	type: string,
	mesh: AbstractMesh,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>
) {
	const scene = mesh?.getScene();
	if (!mesh || !scene) {
		return;
	}
	if (type === 'OnPointerOverTrigger') {
		revialTooltip(scene, mesh.metadata.linkName, startingTooltips, loadedNodes);
		const rootStyles = getComputedStyle(document.documentElement);
		const color3 =
			toColor3(rootStyles.getPropertyValue('--button-hover-bg')) ||
			new Color3(255, 0, 0);
		changeMeshOverlayAlpha(mesh, 0.9, 0.3, color3);
		if (mesh.metadata.mainParentName) {
			stopCycleAnimation(scene, mesh.metadata.mainParentName, loadedNodes);
		}
		setOveredMesh(mesh);
	} else if (type === 'OnPointerOutTrigger') {
		hideTooltip(scene, mesh.metadata.linkName, startingTooltips, loadedNodes);
		const rootStyles = getComputedStyle(document.documentElement);
		const color3 =
			toColor3(rootStyles.getPropertyValue('--button-hover-bg')) ||
			new Color3(255, 0, 0);
		changeMeshOverlayAlpha(mesh, 0, 0.3, color3);
		if (mesh.metadata.mainParentName) {
			resumeCycleAnimation(mesh.metadata.mainParentName, loadedNodes);
		}
		setOveredMesh(null);
	} else if (type === 'OnPickUpTrigger') {
		bounceModelAnimation(mesh);
	} else {
		return;
	}

	function changeMeshOverlayAlpha(
		mesh: AbstractMesh,
		to: number | 1,
		duration: number | 1,
		color?: Color3
	) {
		mesh.renderOverlay = true;
		mesh.overlayColor = color || new Color3(255, 0, 0);
		const animationFn = animateValue(mesh.overlayAlpha, to, duration * 1000);
		const startTime = performance.now();

		const updateOverlay = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - startTime;
			mesh.overlayAlpha = animationFn(elapsed);

			if (elapsed < duration * 1000) {
				requestAnimationFrame(updateOverlay);
			} else {
				mesh.overlayAlpha = to;
			}
		};

		updateOverlay();
	}

	function bounceModelAnimation(mesh: AbstractMesh) {
		const animation = new Animation(
			'scaleAnimation',
			'scaling',
			30,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		animation.setKeys([
			{ frame: 0, value: mesh.scaling },
			{ frame: 30, value: mesh.scaling.scale(0.9) },
			{ frame: 60, value: mesh.scaling }
		]);

		const easing = new BABYLON.QuadraticEase();
		easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

		animation.setEasingFunction(easing);

		mesh.animations.push(animation);
		mesh.getScene().beginAnimation(mesh, 0, 60, false, 20);
	}
}

/**
 * Создает подсказки для массива мешей.
 *
 * @param {AbstractMesh[]} modelsArray - Массив мешей, для которых создаются подсказки.
 * @param {Scene} scene - Сцена Babylon.js, в которой будут отображаться подсказки.
 * @param {MeshTooltip[]} startingTooltips - Массив объектов подсказок.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы.
 */
function createMeshTooltips(
	modelsArray: AbstractMesh[],
	scene: Scene,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (modelsArray.length > 0 && startingTooltips.length > 0) {
		const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
		scene.metadata.gui = advancedTexture;

		startingTooltips.map(tooltipObject => {
			const model = loadedNodes[tooltipObject.positionMeshName]?.node;
			if (model) {
				createMeshTooltip(model as AbstractMesh, tooltipObject, advancedTexture);
			}
		});
	}
}

export function createShadows(
	light: DirectionalLight,
	models: (Mesh | AbstractMesh)[],
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	// const shadowGenerator = new ShadowGenerator(1024, light);
	// shadowGenerator.useBlurExponentialShadowMap = true;
	// shadowGenerator.blurKernel = 32;
	// models.forEach(model => {
	// 	shadowGenerator.addShadowCaster(model);
	// 	model.receiveShadows = true;
	// });
	// light.autoCalcShadowZBounds = true;
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'ready',
		// shadows: shadowGenerator
		shadows: null
	}));
}

/**
 * Создает экземпляр движка Babylon.js.
 *
 * @param {HTMLCanvasElement} canvas - Элемент canvas, на котором будет работать движок.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 */
export function createEngine(
	canvas: HTMLCanvasElement,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const engine = new Engine(canvas, true, {
		adaptToDeviceRatio: true,
		antialias: true
	});
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'initializing',
		engine: engine
	}));
}

/**
 * Запускает рендеринг сцены Babylon.js.
 * @param {babylonProjectStatesI} babylonProjectStates - Состояние проекта Babylon.js, включающее движок и сцену.
 * @param {React.Dispatch<React.SetStateAction<babylonProjectStatesI>>} setBabylonProjectStates - Функция для обновления состояния проекта Babylon.js.
 * @returns {void}
 */
export function startRenderScene(
	babylonProjectStates: babylonProjectStatesI,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const engine = babylonProjectStates.engine;
	const scene = babylonProjectStates.scene;
	if (!engine || !scene) {
		return;
	}
	engine.runRenderLoop(() => {
		scene.render();
	});
	window.addEventListener('resize', () => {
		engine.resize();
	});
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'running'
	}));
}

/**
 * Добавляет менеджер действий к мешу и её дочерним элементам.
 *
 * @param {AbstractMesh} model - Меш, к которой добавляется менеджер действий.
 * @param {string[]} actionManagerTypes - Массив строк, представляющих типы действий.
 * @param {MeshTooltip[]} startingTooltips - Массив подсказок для мешей.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы.
 * @param {React.Dispatch<React.SetStateAction<AbstractMesh | null>>} setOveredMesh - Функция для обновления состояния наведённого меша.
 */
function addActionManagerToMesh(
	model: AbstractMesh,
	actionManagerTypes: string[],
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>
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
						if (e.meshUnderPointer) {
							triggerMouseMeshLogic(
								type,
								e.meshUnderPointer,
								startingTooltips,
								loadedNodes,
								setOveredMesh
							);
						}
					})
				);
			} else {
				console.warn(`Неизвестный тип триггера: ${type}`);
			}
		});
	});
}

/**
 * Создает подсказку для меша.
 *
 * @param {AbstractMesh} mesh - Меш, для которого создается подсказка.
 * @param {MeshTooltip} tooltipObject - Объект подсказки.
 * @param {GUI.AdvancedDynamicTexture} advancedTexture - Главная динамическая текстура для отображения подсказки.
 */
function createMeshTooltip(
	mesh: AbstractMesh,
	tooltipObject: MeshTooltip,
	advancedTexture: GUI.AdvancedDynamicTexture
) {
	const scene = mesh.getScene();
	const camera = scene.activeCamera;
	const modelTooltip = new GUI.Container(tooltipObject.linkName + '_tooltip');
	advancedTexture.addControl(modelTooltip);
	modelTooltip.linkWithMesh(mesh);

	const rootStyles = getComputedStyle(document.documentElement);
	const fontFamily = rootStyles.getPropertyValue('--font-family') || 'Arial';

	const bg = new GUI.Rectangle('rect');
	bg.height = '40px';
	bg.cornerRadius = 20;
	bg.thickness = 3;
	bg.color = rootStyles.getPropertyValue('--button-text') || 'Green';
	bg.background = rootStyles.getPropertyValue('--button-hover-bg') || 'Orange';
	bg.isPointerBlocker = false;
	modelTooltip.addControl(bg);

	const label = new GUI.TextBlock('tb', `${tooltipObject.text}`);
	bg.addControl(label);
	label.fontSize = 20;
	label.fontFamily = rootStyles.getPropertyValue('--text-font');

	const textWidth = getTextWidth(tooltipObject.text, `20px ${fontFamily}`);
	bg.width = textWidth + 30 + 'px';
	tooltipObject.gui = modelTooltip;
	tooltipObject.name = modelTooltip.name;
	tooltipObject.targetMesh = mesh;
	tooltipObject.methods = tooltipObject.methods || {};
	tooltipObject.methods.hide = () => {
		setVisibleCurrentGUI(tooltipObject.linkName, 0, mesh.getScene(), 200);
	};
	tooltipObject.methods.revial = () => {
		setVisibleCurrentGUI(tooltipObject.linkName, 1, mesh.getScene(), 200);
	};

	setVisibleCurrentGUI(tooltipObject.linkName, 0, mesh.getScene(), 0);

	const constantDistance = 1;

	scene.onBeforeRenderObservable.add(() => {
		if (camera && mesh) {
			const distance = Vector3.Distance(camera.position, mesh.position);
			const pixelOffset =
				(constantDistance / distance) * scene.getEngine().getRenderHeight();

			modelTooltip.linkOffsetY = -pixelOffset;
		}
	});
}

/**
 * Устанавливает видимость текущего GUI-элемента (тултипа) с анимацией изменения прозрачности.
 *
 * @param {string} meshName - Имя меша, связанного с тултипом.
 * @param {number} visibility - Целевое значение прозрачности (0 - скрыто, 1 - полностью видно).
 * @param {Scene} scene - Сцена Babylon.js, содержащая GUI.
 * @param {number} [duration=300] - Длительность анимации изменения прозрачности в миллисекундах.
 */
export function setVisibleCurrentGUI(
	meshName: string,
	visibility: number,
	scene: Scene,
	duration: number = 300
) {
	const gui = scene.metadata?.gui as GUI.AdvancedDynamicTexture;
	if (!gui) {
		console.error('GUI not found on the scene metadata.');
		return;
	}

	const tooltip = gui.getControlByName(meshName + '_tooltip') as GUI.Container;
	if (tooltip) {
		tooltip.alpha = tooltip.alpha || 0;

		const animationFn = animateValue(tooltip.alpha, visibility, duration);
		const startTime = performance.now();

		const updateOverlay = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - startTime;
			tooltip.alpha = animationFn(elapsed);

			if (elapsed < duration) {
				requestAnimationFrame(updateOverlay);
			} else {
				tooltip.alpha = visibility;
			}
		};

		updateOverlay();

		const bg = tooltip.children[0] as GUI.Rectangle;
		if (bg) {
			const rootStyles = getComputedStyle(document.documentElement);
			bg.color = rootStyles.getPropertyValue('--button-text') || 'Green';
			bg.background = rootStyles.getPropertyValue('--button-hover-bg') || 'Orange';
		}
	} else {
		console.error(`No tooltip found for mesh: ${meshName}`);
	}
}

/**
 * Вычисляет ширину текста в пикселях на основе указанного шрифта.
 *
 * @param {string} text - Текст, ширину которого необходимо измерить.
 * @param {string} font - CSS-описание шрифта (например, "16px Arial").
 * @returns {number} - Ширина текста в пикселях.
 */
function getTextWidth(text: string, font: string) {
	const element = document.createElement('canvas');
	const context = element.getContext('2d');

	if (!context) {
		return 0;
	}

	context.font = font;
	const width = context.measureText(text).width;
	element.remove();

	return Math.ceil(width);
}

function stopCycleAnimation(
	scene: Scene,
	meshName: string,
	loadedNodes: LoadedNodesType
) {
	const mesh = loadedNodes[meshName]?.node;
	if (mesh && mesh.animations) {
		const activeAnimation = scene._activeAnimatables.find(anim =>
			anim._runtimeAnimations.some(
				runtimeAnim => runtimeAnim.animation === mesh.animations[0]
			)
		);

		if (activeAnimation) {
			mesh.metadata = {
				...mesh.metadata,
				cycleAnimation: activeAnimation
			};
			activeAnimation.pause();
		}
	}
}

function resumeCycleAnimation(meshName: string, loadedNodes: LoadedNodesType) {
	const mesh = loadedNodes[meshName]?.node;
	if (mesh && mesh.animations) {
		const { cycleAnimation } = mesh.metadata || {};
		if (cycleAnimation !== undefined) {
			(cycleAnimation as Animatable).restart();
		}
	}
}

/**
 * Восстанавливает (показывает) тултип и изменяет видимость связанного меша, если это необходимо.
 *
 * @param {Scene} scene - Сцена Babylon.js.
 * @param {string} linkName - Уникальное имя объекта, связанного с тултипом.
 * @param {MeshTooltip[]} startingTooltips - Массив начальных тултипов.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы сцены.
 */
export function revialTooltip(
	scene: Scene,
	linkName: string,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (scene && linkName) {
		const tooltip = startingTooltips.find(
			tooltip => tooltip.linkName === linkName
		);
		if (tooltip) {
			tooltip.methods?.revial?.();

			const model = loadedNodes[tooltip.linkName]?.node;
			if (!model) {
				return;
			}
			const visibility: number =
				(model as AbstractMesh).visibility ??
				(model.metadata as MeshMetadataI).visibility ??
				1;

			if (visibility < 0.3) {
				changeMeshVisibility(model, 0.3, false, 300, true);
			}
		}
	}
}

/**
 * Скрывает тултип и восстанавливает первоначальную видимость связанного меша, если это возможно.
 *
 * @param {Scene} scene - Сцена Babylon.js.
 * @param {string} linkName - Уникальное имя объекта, связанного с тултипом.
 * @param {MeshTooltip[]} startingTooltips - Массив начальных тултипов.
 * @param {LoadedNodesType} loadedNodes - Объект, содержащий загруженные узлы сцены.
 */
export function hideTooltip(
	scene: Scene,
	linkName: string,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (scene && linkName) {
		const tooltip = startingTooltips.find(
			tooltip => tooltip.linkName === linkName
		);
		if (tooltip) {
			tooltip.methods?.hide?.();
			const model = loadedNodes[tooltip.linkName]?.node;

			if (model && model.metadata.realVisibility !== undefined) {
				changeMeshVisibility(
					model,
					model.metadata.realVisibility,
					false,
					300,
					true
				);
			}
		}
	}
}

/**
 * Преобразует строку цвета в объект Color3.
 *
 * @param {string} colorString - Строка цвета в формате HEX или RGB(A).
 * @returns {Color3} - Объект Color3, представляющий цвет.
 * @throws {Error} - Если строка цвета неверного формата.
 */
export const toColor3 = (colorString: string): Color3 => {
	if (colorString.startsWith('#')) {
		const hex = colorString.slice(1);
		if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			return new Color3(r / 255, g / 255, b / 255);
		} else if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return new Color3(r / 255, g / 255, b / 255);
		} else {
			throw new Error(`Invalid HEX color string: "${colorString}"`);
		}
	} else if (colorString.startsWith('rgb')) {
		const match = colorString.match(
			/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d*\.?\d+)?\)/
		);
		if (!match) {
			throw new Error(`Invalid RGBA or RGB string: "${colorString}"`);
		}

		const [, r, g, b] = match.map(Number);
		return new Color3(r / 255, g / 255, b / 255);
	} else {
		throw new Error(`Проверьте цвет: "${colorString}"`);
	}
};

/**
 * Добавляет метаданные к мешу, включая видимость, родителя, принадлежность к группе и текущую тему.
 *
 * @param {AbstractMesh} mesh - Меш, к которому добавляются метаданные.
 * @param {ModelGroupsI} modelGroups - Объект, содержащий группы имён моделей.
 * @param {number} [visibility=1] - Начальная видимость меша (по умолчанию 1).
 * @param {AbstractMesh} [mainParent] - Родительский меш, если есть.
 * @param {string} [parentName] - Имя родительского меша (если не указано, берется из `mainParent` или `mesh`).
 * @param {string} [linkName] - Уникальное имя для привязки к группе (если не указано, берется из `mainParent` или `mesh`).
 */
export function addMeshMetadata(
	mesh: AbstractMesh,
	modelGroups: ModelGroupsI,
	visibility?: number,
	mainParent?: AbstractMesh,
	parentName?: string,
	linkName?: string
) {
	const meshMetadata: MeshMetadataI = {
		visibility: visibility ?? 1,
		startingVisibility: visibility ?? 1,
		mainParent: mainParent,
		mainParentName:
			parentName ||
			mainParent?.name.toLocaleLowerCase() ||
			mesh?.name.toLocaleLowerCase(),
		linkName: linkName || mainParent?.name || mesh.name,
		linkGroupName:
			Object.entries(modelGroups).find(([, group]) =>
				group.linkNames.includes(linkName || mainParent?.name || mesh.name)
			)?.[0] || 'common',
		currentTheme: localStorage.getItem('theme') || 'default'
	};
	mesh.metadata = meshMetadata;
}

/**
 * Анимирует свойство меша (position или rotation) по заданной оси.
 * Возвращает `Promise`, который выполняется после завершения анимации.
 *
 * @param mesh - Анимируемый меш.
 * @param property - Свойство ('position' или 'rotation').
 * @param axis - Ось ('x', 'y' или 'z').
 * @param targetValue - Конечное значение.
 * @param duration - Длительность анимации в секундах (по умолчанию 1 сек).
 * @returns `Promise<void>` - Разрешается после завершения анимации.
 */
export function animateMeshProperty(
	mesh: AbstractMesh | Mesh,
	property: 'position' | 'rotation',
	axis: 'x' | 'y' | 'z',
	targetValue: number,
	duration: number = 1
): Promise<void> {
	return new Promise(resolve => {
		const fps = 60;
		const totalFrames = fps * duration;

		const animation = new Animation(
			`animate_${property}_${axis}`,
			`${property}.${axis}`,
			fps,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const keys = [
			{ frame: 0, value: mesh[property][axis] },
			{ frame: totalFrames, value: targetValue }
		];

		animation.setKeys(keys);

		mesh.animations.push(animation);

		mesh.getScene().beginAnimation(mesh, 0, totalFrames, false, 1.0, () => {
			resolve();
		});
	});
}

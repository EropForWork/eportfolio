import {
	AbstractMesh,
	ArcRotateCamera,
	DirectionalLight,
	Engine,
	Mesh,
	Scene,
	ShadowGenerator,
	Tools,
	Vector3
} from 'babylonjs';
import React, {
	useEffect,
	createContext,
	useState,
	useContext,
	ReactNode
} from 'react';
import {
	FaHtml5,
	FaCss3Alt,
	FaJs,
	FaReact,
	FaGitAlt,
	FaLaptopCode,
	FaNetworkWired
} from 'react-icons/fa';
import {
	SiAdobeillustrator,
	SiCoreldraw,
	SiFigma,
	SiAsciidoctor,
	SiAdobephotoshop
} from 'react-icons/si';
import { MdBuild } from 'react-icons/md';
import * as GUI from 'babylonjs-gui';
import { changeMeshVisibility } from '../functions/babylon/models';

export interface loadingModelProps {
	modelName: string;
	linkName: string;
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
}

export interface meshStartingProps {
	linkName: string;
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
}

export interface babylonProjectStatesI {
	state:
		| 'idle' // Ничего не происходит
		| 'pending' // Ожидание старта
		| 'initializing' // Начало инициализации
		| 'initialized' // Сцена инициализирована
		| 'loading' // Загрузка ресурсов
		| 'loaded' // Ресурсы загружены
		| 'ready' // Готово к рендерингу
		| 'running' // Активный рендеринг
		| 'paused' // Сцена приостановлена
		| 'error' // Ошибка
		| 'disposing' // Уничтожение сцены
		| 'disposed'; // Сцена уничтожена
	engine: Engine | null;
	scene: Scene | null;
	camera: ArcRotateCamera | null;
	light: DirectionalLight | null;
	models: (Mesh | AbstractMesh)[] | null;
	shadows: ShadowGenerator | null;
}

interface SkillsProviderProps {
	children: ReactNode;
}
interface ActiveTooltip {
	name: string;
	tooltip?: AbstractMesh;
	targetMesh?: AbstractMesh;
}
export interface MeshTooltip {
	linkName: string;
	positionMeshName: string;
	linkTextProgramm?: string;
	text: string;
	name?: string;
	gui?: GUI.Container;
	targetMesh?: AbstractMesh;
	methods?: {
		hide?: () => void;
		revial?: () => void;
	};
}

interface SkillItemI {
	name: string;
	icon: ReactNode;
	level: number;
	linkName?: string;
}

interface HardSkillI {
	text: string;
	icon: ReactNode;
	items: SkillItemI[];
}

interface SkillsContextType {
	hardSkills: HardSkillI[];
	softSkills: string[];
	selectedSkill: string | null;
	setSelectedSkill: React.Dispatch<React.SetStateAction<string | null>>;
	babylonProjectStates: babylonProjectStatesI;
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>;
	activeTooltip: ActiveTooltip;
	setActiveTooltip: React.Dispatch<React.SetStateAction<ActiveTooltip>>;
	selectedProgramm: string | null;
	setSelectedProgramm: React.Dispatch<React.SetStateAction<string | null>>;
	loadingAnimationModelsNames: string[];
	meshStartingPropsObject: {
		[key: string]: meshStartingProps;
	};
	startingTooltips: MeshTooltip[];
	startingLoadingModels: loadingModelProps[];
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
	const [selectedProgramm, setSelectedProgramm] = useState<string | null>(null);
	const [babylonProjectStates, setBabylonProjectStates] =
		useState<babylonProjectStatesI>({
			state: 'idle',
			engine: null,
			scene: null,
			camera: null,
			light: null,
			models: null,
			shadows: null
		});
	const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip>({
		name: ''
	});

	const [loadingAnimationModelsNames] = useState<string[]>([
		'css',
		'html',
		'logos',
		'react'
	]);

	const [meshStartingPropsObject] = useState<{
		[key: string]: meshStartingProps;
	}>({
		JAVASCRIPT_5: {
			linkName: 'js',
			visibility: 1
		}
	});

	const [startingTooltips] = useState<MeshTooltip[]>([
		{
			linkName: 'css',
			linkTextProgramm: 'css',
			positionMeshName: 'Object_5',
			text: 'CSS3 Model Tooltip'
		},
		{
			linkName: 'react',
			linkTextProgramm: 'react',
			positionMeshName: 'react',
			text: 'React Model Tooltip'
		},
		{
			linkName: 'js',
			linkTextProgramm: 'javascript',
			positionMeshName: 'Object_22',
			text: 'JavaScript Model Tooltip'
		},
		{
			linkName: 'html',
			linkTextProgramm: 'html',
			positionMeshName: 'Plane.002_five_0',
			text: 'HTML5 Model Tooltip'
		}
	]);

	const [startingLoadingModels] = useState<loadingModelProps[]>([
		{
			modelName: 'css3.gltf',
			linkName: 'css',
			position: new Vector3(0, 0.6, -1.6),
			rotation: new Vector3(0, Tools.ToRadians(270), 0),
			scaling: new Vector3(-0.007, 0.007, 0.007),
			visibility: 1
		},
		{
			modelName: 'react.gltf',
			linkName: 'react',
			position: new Vector3(0, 2.1, 0),
			rotation: new Vector3(0, Tools.ToRadians(270), 0),
			scaling: new Vector3(0.3, 0.3, 0.3),
			visibility: 1
		},
		{
			modelName: 'logos.gltf',
			linkName: 'logos',
			position: new Vector3(0, 4.1, -1.1),
			rotation: new Vector3(0, Tools.ToRadians(270), 0),
			scaling: new Vector3(0.7, 0.7, -0.7),
			visibility: 0
		},
		{
			modelName: 'html5.gltf',
			linkName: 'html',
			position: new Vector3(0, 2, 1.6),
			rotation: new Vector3(0, Tools.ToRadians(180), 0),
			scaling: new Vector3(0.25, 0.25, -0.25),
			visibility: 1
		}
	]);

	const [hardSkills] = useState<HardSkillI[]>([
		{
			text: 'Фронтенд разработка',
			icon: <MdBuild />,
			items: [
				{ name: 'HTML', icon: <FaHtml5 />, level: 70, linkName: 'html' },
				{ name: 'CSS', icon: <FaCss3Alt />, level: 75, linkName: 'css' },
				{ name: 'JavaScript', icon: <FaJs />, level: 95, linkName: 'js' },
				{ name: 'React', icon: <FaReact />, level: 60, linkName: 'react' },
				{ name: 'AS3', icon: <SiAsciidoctor />, level: 95 }
			]
		},
		{
			text: 'Контроль версий',
			icon: <MdBuild />,
			items: [{ name: 'Git', icon: <FaGitAlt />, level: 70 }]
		},
		{
			text: 'Инструменты разработки',
			icon: <MdBuild />,
			items: [
				{ name: 'Visual Studio Code', icon: <FaLaptopCode />, level: 95 },
				{ name: 'Sublime Text', icon: <FaLaptopCode />, level: 95 }
			]
		},
		{
			text: 'Графический дизайн',
			icon: <MdBuild />,
			items: [
				{ name: 'Corel Draw', icon: <SiCoreldraw />, level: 80 },
				{ name: 'Photoshop', icon: <SiAdobephotoshop />, level: 60 },
				{ name: 'Illustrator', icon: <SiAdobeillustrator />, level: 60 },
				{ name: 'Figma', icon: <SiFigma />, level: 30 }
			]
		},
		{
			text: 'Нейросети',
			icon: <MdBuild />,
			items: [
				{
					name: 'Активный пользователь различных ИИ для генерации текста, рисунков',
					icon: <FaNetworkWired />,
					level: 70
				}
			]
		}
	]);

	const [softSkills] = useState<string[]>([
		'🗣️ Отличные навыки связи и командной работы',
		'⏳ Умение работать в условиях жестких сроков и высокого давления',
		'🎯 Самостоятельность, целеустремленность и ответственность',
		'📚 Высокий уровень обучаемости, адаптации к новым технологиям и инструментам'
	]);

	useEffect(() => {
		if (selectedSkill !== '') {
			const scene = babylonProjectStates.scene;
			if (!scene) {
				return;
			}
			startingLoadingModels.forEach(modelObject => {
				const mesh = scene.getNodeByName(modelObject.linkName);
				if (!mesh) {
					return;
				}
				if (modelObject.visibility) {
					changeMeshVisibility(mesh, modelObject.visibility);
				}
			});
			Object.entries(meshStartingPropsObject).forEach(([, value]) => {
				const mesh = scene.getNodeByName(value.linkName);
				if (!mesh) {
					return;
				}

				if (value.visibility) {
					changeMeshVisibility(mesh, value.visibility);
				}
			});

			setSelectedSkill('');
		}
		// if (babylonProjectStates.camera && selectedSkill !== '') {
		// 	switch (selectedSkill) {
		// 		case '0':
		// 			{
		// 				const mesh = babylonProjectStates.scene?.getMeshByName('JAVASCRIPT_5');
		// 				if (mesh) {
		// 					changeMeshVisibility(mesh, 0);
		// 				}
		// 				moveCamera(babylonProjectStates.camera, new Vector3(0, 0, 0), {
		// 					alpha: Tools.ToRadians(50),
		// 					beta: Tools.ToRadians(50),
		// 					radius: 10
		// 				});
		// 			}
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// 	setSelectedSkill('');
		// }
	}, [selectedSkill]);

	useEffect(() => {
		if (selectedProgramm !== '') {
			const meshName = hardSkills
				.flatMap(skill => skill.items)
				.find(item => item.name === selectedProgramm)?.linkName;

			if (!meshName) {
				return;
			}
			const scene = babylonProjectStates.scene;
			if (!scene) {
				return;
			}
			const mesh = scene.getNodeByName(meshName);
			if (!mesh) {
				return;
			}

			startingLoadingModels.map(modelObject => {
				const mesh = scene.getNodeByName(modelObject.linkName);
				if (!mesh) {
					return;
				}
				if (modelObject.visibility !== undefined) {
					changeMeshVisibility(mesh, mesh.name === meshName ? 1 : 0);
				}
			});
			Object.entries(meshStartingPropsObject).forEach(([, value]) => {
				const mesh = scene.getNodeByName(value.linkName);
				if (!mesh) {
					return;
				}

				if (value.visibility !== undefined) {
					changeMeshVisibility(mesh, mesh.name === meshName ? 1 : 0);
				}
			});
			setSelectedProgramm('');
		}
	}, [selectedProgramm]);

	return (
		<SkillsContext.Provider
			value={{
				hardSkills,
				softSkills,
				selectedSkill,
				setSelectedSkill,
				babylonProjectStates,
				setBabylonProjectStates,
				activeTooltip,
				setActiveTooltip,
				selectedProgramm,
				setSelectedProgramm,
				loadingAnimationModelsNames,
				meshStartingPropsObject,
				startingTooltips,
				startingLoadingModels
			}}
		>
			{children}
		</SkillsContext.Provider>
	);
};

export const useSkillsContext = (): SkillsContextType => {
	const context = useContext(SkillsContext);
	if (!context) {
		throw new Error('useSkillsContext must be used within a SkillsProvider');
	}
	return context;
};

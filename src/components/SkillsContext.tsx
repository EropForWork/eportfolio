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
import * as GUI from 'babylonjs-gui';
import { moveCamera } from '../functions/babylon/camera';
import { changeMeshVisibility } from '../functions/babylon/models';

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
interface SkillsContextType {
	selectedSkill: string | null;
	setSelectedSkill: (skill: string | null) => void;
	babylonProjectStates: babylonProjectStatesI;
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>;
	activeTooltip: ActiveTooltip;
	setActiveTooltip: React.Dispatch<React.SetStateAction<ActiveTooltip>>;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

interface SkillsProviderProps {
	children: ReactNode;
}

interface ActiveTooltip {
	name: string;
	tooltip?: AbstractMesh;
	targetMesh?: AbstractMesh;
}
export interface MeshTooltip {
	linkModelName: string;
	positionMeshName: string;
	text: string;
	name?: string;
	gui?: GUI.Container;
	targetMesh?: AbstractMesh;
	methods?: {
		hide?: () => void;
		revial?: () => void;
	};
}

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
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

	useEffect(() => {
		if (babylonProjectStates.camera && selectedSkill !== '') {
			switch (selectedSkill) {
				case '0':
					{
						const mesh = babylonProjectStates.scene?.getMeshByName('JAVASCRIPT_5');
						if (mesh) {
							changeMeshVisibility(mesh, 0);
						}
						moveCamera(babylonProjectStates.camera, new Vector3(0, 0, 0), {
							alpha: Tools.ToRadians(50),
							beta: Tools.ToRadians(50),
							radius: 10
						});
					}
					break;
				default:
					break;
			}

			setSelectedSkill('');
		}
	}, [selectedSkill]);

	return (
		<SkillsContext.Provider
			value={{
				selectedSkill,
				setSelectedSkill,
				babylonProjectStates,
				setBabylonProjectStates,
				activeTooltip,
				setActiveTooltip
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

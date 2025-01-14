import {
	AbstractMesh,
	ArcRotateCamera,
	DirectionalLight,
	Engine,
	Mesh,
	Scene,
	ShadowGenerator
} from 'babylonjs';
import React, {
	useEffect,
	createContext,
	useState,
	useContext,
	ReactNode
} from 'react';
import { moveCamera } from '../functions/babylon/camera';
import { changeMeshVisibility } from '../functions/babylon/models';

interface SkillsContextType {
	selectedSkill: string | null;
	setSelectedSkill: (skill: string | null) => void;
	babylonProjectStates: babylonProjectStatesI;
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

interface SkillsProviderProps {
	children: ReactNode;
}

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
	const [babylonProjectStates, setBabylonProjectStates] =
		useState<babylonProjectStatesI>({
			engine: null,
			scene: null,
			camera: null,
			light: null,
			models: null,
			shadows: null
		});

	useEffect(() => {
		if (babylonProjectStates.camera && selectedSkill !== '') {
			switch (selectedSkill) {
				case '0':
					changeMeshVisibility(
						babylonProjectStates.scene?.getTransformNodeByName('JAVASCRIPT_5'),
						0
					);
					// moveCamera(babylonProjectStates.camera, new Vector3(0, 0, 0), {
					// 	alpha: Tools.ToRadians(50),
					// 	beta: Tools.ToRadians(50),
					// 	radius: 10
					// });
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
				setBabylonProjectStates
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

export interface babylonProjectStatesI {
	engine: Engine | null;
	scene: Scene | null;
	camera: ArcRotateCamera | null;
	light: DirectionalLight | null;
	models: (Mesh | AbstractMesh)[] | null;
	shadows: ShadowGenerator | null;
}

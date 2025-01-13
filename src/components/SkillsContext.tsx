import {
	ArcRotateCamera,
	DirectionalLight,
	Engine,
	Mesh,
	Scene,
	ShadowGenerator
} from 'babylonjs';
import React, { createContext, useState, useContext, ReactNode } from 'react';

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
	models: Mesh[] | null;
	shadows: ShadowGenerator | null;
}

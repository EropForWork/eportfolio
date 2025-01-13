import React from 'react';
import SkillsAvatar from '../SkillsAvatar/SkillsAvatar';
import SkillsList from '../SkillsList/SkillsList';
import { SkillsProvider } from '../SkillsContext';
import './SkillsSection.css';

const SkillsSection: React.FC = () => {
	return (
		<SkillsProvider>
			<div className="skills-section">
				<SkillsAvatar />
				<div style={{ width: '49%' }}></div>
				<SkillsList />
			</div>
		</SkillsProvider>
	);
};

export default SkillsSection;

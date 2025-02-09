import ResumeButtons from '../ResumeButtons/ResumeButtons';
import SkillsSection from '../SkillsSection/SkillsSection';
import { SkillsProvider } from '../../app/SkillsContext';

import './MainPage.css';
const MainPage = () => {
	return (
		<div className="main-page">
			<SkillsProvider>
				<SkillsSection />
				<ResumeButtons />
			</SkillsProvider>
		</div>
	);
};

export default MainPage;

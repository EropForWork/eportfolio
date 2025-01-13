import ResumeButtons from '../ResumeButtons/ResumeButtons';
import SkillsSection from '../SkillsSection/SkillsSection';
import './MainPage.css';
const MainPage = () => {
	return (
		<div className="main-page">
			<SkillsSection />
			<ResumeButtons />
		</div>
	);
};

export default MainPage;

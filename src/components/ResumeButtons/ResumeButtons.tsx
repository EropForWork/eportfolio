import { changeVectorModelsColor } from '../../functions/babylon/graphicsModel';
import { changeGitGraphsColor } from '../../functions/babylon/treeModel';
import { useSkillsContext } from '../SkillsContext';
import './ResumeButtons.css';

const ResumeButtons = () => {
	const { graphicModelsNames, loadedNodes, gitGraphValues } = useSkillsContext();
	const currentTheme = localStorage.getItem('theme');
	if (currentTheme) {
		document.documentElement.setAttribute('data-theme', currentTheme);
	}

	const switchColorTheme = () => {
		const currentTheme =
			document.documentElement.getAttribute('data-theme') || 'default';
		let newTheme;

		if (currentTheme === 'default') {
			newTheme = 'orange';
		} else if (currentTheme === 'orange') {
			newTheme = 'cyberpunk';
		} else if (currentTheme === 'cyberpunk') {
			newTheme = 'white-black';
		} else {
			newTheme = 'default';
		}

		document.documentElement.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
		changeVectorModelsColor(graphicModelsNames, loadedNodes);
		changeGitGraphsColor(gitGraphValues, loadedNodes);
	};

	return (
		<div className="resume-buttons">
			<button className="resume-button">
				<a
					href="https://hh.ru/resume/894b9baaff01c069580039ed1f336767487378?print=true"
					target="_blank"
					rel="noopener noreferrer"
				>
					Скачать цветное резюме
				</a>
			</button>
			<button className="resume-button">
				<a
					href="https://hh.ru/resume/894b9baaff01c069580039ed1f336767487378"
					target="_blank"
					rel="noopener noreferrer"
				>
					Перейти на HH
				</a>
			</button>
			<button className="resume-button">
				<a
					href="https://github.com/EropForWork/eportfolio"
					target="_blank"
					rel="noopener noreferrer"
				>
					Перейти на GitHub
				</a>
			</button>
			<button
				className="resume-button"
				id="theme-switcher"
				onClick={switchColorTheme}
			>
				Сменить тему
			</button>
		</div>
	);
};

export default ResumeButtons;

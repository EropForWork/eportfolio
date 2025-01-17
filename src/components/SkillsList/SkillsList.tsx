import './SkillsList.css';
import { useSkillsContext } from '../SkillsContext';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const SkillsList = () => {
	const { setSelectedSkill, setSelectedProgramm, hardSkills, softSkills } =
		useSkillsContext();

	const handleSkillClick = (skill: string) => {
		setSelectedSkill(skill);
	};
	const handleProgrammClick = (programm: string) => {
		setSelectedProgramm(programm);
	};

	return (
		<div className="skills-container">
			<div className="skills-hard">
				<h2 className="skills-title">Хард скилы</h2>
				<ul className="skills-list">
					{hardSkills.map((skillGroup, index) => (
						<li
							key={index}
							className="skill-group"
							onClick={() => handleSkillClick(`${index}`)}
						>
							<div className="skill-group-container">
								<div className="skills-block">
									<p className="skill-group-title">{skillGroup.text}:</p>
									{skillGroup.items.map((item, idx) => (
										<div
											key={idx}
											className="skill-block"
											onClick={() => handleProgrammClick(`${item.name}`)}
										>
											<span className="skill-icon">{item.icon}</span>
											<span>{item.name}</span>
											<div className="skill-chart">
												<CircularProgressbar
													value={item.level}
													strokeWidth={50}
													className="custom-progressbar"
													styles={buildStyles({
														strokeLinecap: 'butt'
													})}
												/>
											</div>
										</div>
									))}
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>
			<div className="skills-soft">
				<h2 className="skills-title">Софт скилы</h2>
				<ul className="skills-list">
					{softSkills.map((skill, index) => (
						<li
							key={index}
							className="skill-group-container soft-skill"
							onClick={() => handleSkillClick(`${index}`)}
						>
							{skill}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default SkillsList;

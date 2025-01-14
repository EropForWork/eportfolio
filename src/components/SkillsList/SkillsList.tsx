import './SkillsList.css';
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
import { useSkillsContext } from '../SkillsContext';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const SkillsList = () => {
	const hardSkills = [
		{
			text: 'Фронтенд разработка',
			icon: <MdBuild />,
			items: [
				{ name: 'HTML', icon: <FaHtml5 />, level: 70 },
				{ name: 'CSS', icon: <FaCss3Alt />, level: 75 },
				{ name: 'JavaScript', icon: <FaJs />, level: 95 },
				{ name: 'React', icon: <FaReact />, level: 60 },
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
	];

	const softSkills = [
		'🗣️ Отличные навыки связи и командной работы',
		'⏳ Умение работать в условиях жестких сроков и высокого давления',
		'🎯 Самостоятельность, целеустремленность и ответственность',
		'📚 Высокий уровень обучаемости, адаптации к новым технологиям и инструментам'
	];

	const { setSelectedSkill } = useSkillsContext();

	const handleSkillClick = (skill: string) => {
		setSelectedSkill(skill);
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
										<div key={idx} className="skill-block">
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

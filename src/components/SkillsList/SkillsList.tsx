import "./SkillsList.css";
import {
  FaHtml5,
  FaCss3Alt,
  FaJs,
  FaReact,
  FaGitAlt,
  FaLaptopCode,
  FaNetworkWired,
} from "react-icons/fa";
import {
  SiAdobeillustrator,
  SiCoreldraw,
  SiFigma,
  SiAsciidoctor,
  SiAdobephotoshop,
} from "react-icons/si";
import { MdBuild } from "react-icons/md";

const SkillsList = () => {
  const hardSkills = [
    {
      text: "Фронтенд разработка",
      icon: <MdBuild />,
      items: [
        { name: "HTML", icon: <FaHtml5 /> },
        { name: "CSS", icon: <FaCss3Alt /> },
        { name: "JavaScript", icon: <FaJs /> },
        { name: "React", icon: <FaReact /> },
        { name: "AS3", icon: <SiAsciidoctor /> },
      ],
    },
    {
      text: "Контроль версий",
      icon: <MdBuild />,
      items: [{ name: "Git", icon: <FaGitAlt /> }],
    },
    {
      text: "Инструменты разработки",
      icon: <MdBuild />,
      items: [
        { name: "Visual Studio Code", icon: <FaLaptopCode /> },
        { name: "Sublime Text", icon: <FaLaptopCode /> },
      ],
    },
    {
      text: "Графический дизайн",
      icon: <MdBuild />,
      items: [
        { name: "Corel Draw", icon: <SiCoreldraw /> },
        { name: "Photoshop", icon: <SiAdobephotoshop /> },
        { name: "Illustrator", icon: <SiAdobeillustrator /> },
        { name: "Figma", icon: <SiFigma /> },
      ],
    },
    {
      text: "Нейросети",
      icon: <MdBuild />,
      items: [
        {
          name: "Активный пользователь различных ИИ для генерации текста, рисунков",
          icon: <FaNetworkWired />,
        },
      ],
    },
  ];

  const softSkills = [
    "🗣️ Отличные навыки связи и командной работы",
    "⏳ Умение работать в условиях жестких сроков и высокого давления",
    "🎯 Самостоятельность, целеустремленность и ответственность",
    "📚 Высокий уровень обучаемости, адаптации к новым технологиям и инструментам",
  ];

  return (
    <div className="skills-container">
      <div className="skills-hard">
        <h2 className="skills-title">Хард скилы</h2>
        <ul className="skills-list">
          {hardSkills.map((skillGroup, index) => (
            <li key={index} className="skill-group">
              <div className="skill-group-container">
                <div className="skills-block">
                  <p className="skill-group-title">{skillGroup.text}:</p>
                  {skillGroup.items.map((item, idx) => (
                    <div key={idx} className="skill-block">
                      <span className="skill-icon">{item.icon}</span>
                      <span>{item.name}</span>
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
            <li key={index} className="skill-group-container soft-skill">
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SkillsList;

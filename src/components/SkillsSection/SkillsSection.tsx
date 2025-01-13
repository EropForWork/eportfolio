import SkillsAvatar from "../SkillsAvatar/SkillsAvatar";
import SkillsList from "../SkillsList/SkillsList";
import "./SkillsSection.css";

const SkillsSection = () => {
  return (
    <div className="skills-section">
      <SkillsAvatar />
      <SkillsList />
    </div>
  );
};

export default SkillsSection;

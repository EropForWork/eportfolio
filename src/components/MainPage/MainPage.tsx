// src/components/MainPage.jsx
import ResumeButtons from "../ResumeButtons/ResumeButtons";
import SkillsSection from "../SkillsSection/SkillsSection";
import "./MainPage.css"; // Основные стили для страницы

const MainPage = () => {
  return (
    <div className="main-page">
      <SkillsSection />
      <ResumeButtons />
    </div>
  );
};

export default MainPage;

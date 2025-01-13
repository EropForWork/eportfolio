import "./ResumeButtons.css"; // Стили для кнопок

const ResumeButtons = () => {
  return (
    <div className="resume-buttons">
      <button className="resume-button">Скачать ЧБ резюме</button>
      <button className="resume-button">Скачать цветное резюме</button>
      <button className="resume-button">Перейти на HH</button>
      <button className="resume-button">Перейти на GitHub</button>
    </div>
  );
};

export default ResumeButtons;

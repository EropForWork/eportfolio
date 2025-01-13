import './ResumeButtons.css';

const ResumeButtons = () => {
	return (
		<div className="resume-buttons">
			{/* <button className="resume-button">
        <a
          href="https://hh.ru/resume/894b9baaff01c069580039ed1f336767487378?print=true"
          target="_blank"
          rel="noopener noreferrer"
        >
          Скачать ЧБ резюме
        </a>
      </button> */}
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
		</div>
	);
};

export default ResumeButtons;

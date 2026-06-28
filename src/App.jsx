import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Home,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  TriangleAlert,
} from 'lucide-react';
import { afternoonCases } from './data/afternoonQuestions.js';
import { categories, questions } from './data/questions.js';
import { guideSections } from './data/guide.js';

const STORAGE_KEY = 'tc-study-progress-v1';
const OPTION_LABELS = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク'];
const QUIZ_SIZE_OPTIONS = [
  { value: '5', label: '5問' },
  { value: '10', label: '10問' },
  { value: '20', label: '20問' },
  { value: '30', label: '30問' },
  { value: 'all', label: 'すべて' },
];

function shuffleItems(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function prepareQuizQuestion(question) {
  const shuffledOptions = shuffleItems(
    question.options.map((text, optionIndex) => ({
      text,
      isCorrect: optionIndex === question.answer,
    })),
  );

  return {
    ...question,
    options: shuffledOptions.map((option) => option.text),
    answer: shuffledOptions.findIndex((option) => option.isCorrect),
  };
}

const initialProgress = {
  sessions: [],
  answered: 0,
  correct: 0,
};

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialProgress, ...JSON.parse(saved) } : initialProgress;
  } catch {
    return initialProgress;
  }
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/');
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const navigate = (path) => {
    window.location.hash = path;
    setRoute(path);
  };

  const recordSession = (result) => {
    setProgress((current) => ({
      sessions: [
        ...current.sessions.slice(-9),
        {
          date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
          ...result,
        },
      ],
      answered: current.answered + result.total,
      correct: current.correct + result.correct,
    }));
  };

  const resetProgress = () => setProgress(initialProgress);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="メインナビゲーション">
        <button className="brand" onClick={() => navigate('/')} aria-label="ホームへ移動">
          <span className="brand-mark">TC</span>
          <span>
            <strong>TC検定3級</strong>
            <small>Study Desk</small>
          </span>
        </button>
        <nav className="nav-list">
          <NavButton icon={Home} label="ホーム" active={route === '/'} onClick={() => navigate('/')} />
          <NavButton
            icon={ClipboardList}
            label="クイズ"
            active={route === '/quiz'}
            onClick={() => navigate('/quiz')}
          />
          <NavButton
            icon={FileText}
            label="午後"
            active={route === '/afternoon'}
            onClick={() => navigate('/afternoon')}
          />
          <NavButton
            icon={BookOpenText}
            label="要点"
            active={route === '/guide'}
            onClick={() => navigate('/guide')}
          />
        </nav>
      </aside>

      <main className="main-panel">
        {route === '/quiz' ? (
          <QuizPage onFinish={recordSession} />
        ) : route === '/afternoon' ? (
          <AfternoonPage onFinish={recordSession} />
        ) : route === '/guide' ? (
          <GuidePage />
        ) : (
          <HomePage progress={progress} navigate={navigate} resetProgress={resetProgress} />
        )}
      </main>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`nav-button ${active ? 'is-active' : ''}`} onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function HomePage({ progress, navigate, resetProgress }) {
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const best = progress.sessions.length ? Math.max(...progress.sessions.map((session) => session.score)) : 0;
  const insights = useMemo(() => buildStudyInsights(progress.sessions), [progress.sessions]);

  return (
    <div className="page-stack">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={18} />
            TC検定3級 テクニカルライティング集中
          </div>
          <h1>今日の一問から、合格ラインへ。</h1>
          <p>
            過去問風の選択問題、スタイルガイド要点、学習記録をひとつの画面で管理。短い演習を積み重ねて、文書設計と表記ルールを定着させます。
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/quiz')}>
              <ClipboardList size={20} />
              問題を解く
            </button>
            <button className="secondary-button" onClick={() => navigate('/afternoon')}>
              <FileText size={20} />
              午後問題
            </button>
            <button className="secondary-button" onClick={() => navigate('/guide')}>
              <BookOpenText size={20} />
              要点を見る
            </button>
          </div>
        </div>
        <div className="focus-board" aria-label="学習状況の概要">
          <Metric icon={Target} label="総回答数" value={`${progress.answered}問`} />
          <Metric icon={CheckCircle2} label="正答率" value={`${accuracy}%`} />
          <Metric icon={Trophy} label="最高スコア" value={`${best}%`} />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Progress</p>
              <h2>学習記録</h2>
            </div>
            <button className="icon-button" onClick={resetProgress} title="学習記録をリセット" aria-label="学習記録をリセット">
              <RotateCcw size={18} />
            </button>
          </div>
          <ProgressChart sessions={progress.sessions} />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Today</p>
              <h2>学習メニュー</h2>
            </div>
          </div>
          <div className="menu-list">
            <MenuItem icon={CircleHelp} title="5分クイズ" text="カテゴリ別に弱点を確認" onClick={() => navigate('/quiz')} />
            <MenuItem icon={FileText} title="午後問題" text="長文ケースで総合演習" onClick={() => navigate('/afternoon')} />
            <MenuItem icon={BookOpenText} title="頻出要点" text="表記、構成、読者分析を復習" onClick={() => navigate('/guide')} />
          </div>
        </div>
      </section>

      <section className="insight-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Category</p>
              <h2>分野別成績</h2>
            </div>
            <TriangleAlert size={22} className="panel-icon" />
          </div>
          <WeaknessChart categories={insights.categories} />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Review</p>
              <h2>復習問題</h2>
            </div>
            <ListChecks size={22} className="panel-icon" />
          </div>
          <WrongQuestionList items={insights.wrongQuestions} />
        </div>
      </section>
    </div>
  );
}

function buildStudyInsights(sessions) {
  const categoryMap = new Map();
  const wrongMap = new Map();

  sessions.forEach((session) => {
    session.answers?.forEach((answer) => {
      const category = answer.category || '未分類';
      const currentCategory = categoryMap.get(category) || { category, total: 0, correct: 0, wrong: 0 };
      currentCategory.total += 1;
      currentCategory.correct += answer.correct ? 1 : 0;
      currentCategory.wrong += answer.correct ? 0 : 1;
      categoryMap.set(category, currentCategory);

      if (!answer.correct) {
        const currentWrong = wrongMap.get(answer.questionId) || {
          id: answer.questionId,
          category,
          prompt: answer.prompt,
          correctAnswer: answer.correctAnswer,
          explanation: answer.explanation,
          missed: 0,
        };
        currentWrong.missed += 1;
        wrongMap.set(answer.questionId, currentWrong);
      }
    });
  });

  const categoryInsights = Array.from(categoryMap.values())
    .map((item) => ({
      ...item,
      accuracy: Math.round((item.correct / item.total) * 100),
      weakness: Math.round((item.wrong / item.total) * 100),
    }))
    .sort((a, b) => b.weakness - a.weakness || b.wrong - a.wrong || a.category.localeCompare(b.category));

  const wrongQuestions = Array.from(wrongMap.values()).sort(
    (a, b) => b.missed - a.missed || String(a.id).localeCompare(String(b.id)),
  );

  return {
    categories: categoryInsights,
    wrongQuestions,
  };
}

function WeaknessChart({ categories }) {
  if (!categories.length) {
    return (
      <div className="empty-state compact-empty">
        <BarChart3 size={30} />
        <p>次回のクイズから、カテゴリ別の正答率が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="weakness-list" aria-label="カテゴリ別の正答率">
      {categories.slice(0, 8).map((item) => (
        <div className="weakness-row" key={item.category}>
          <div className="weakness-label">
            <strong>{item.category}</strong>
            <span>
              {item.correct}/{item.total}問正解
            </span>
          </div>
          <div className="weakness-meter" aria-label={`${item.category}の正答率 ${item.accuracy}%`}>
            <span
              className={item.accuracy >= 70 ? 'is-good' : 'is-risk'}
              style={{ width: `${Math.max(item.accuracy, item.total ? 8 : 0)}%` }}
            />
          </div>
          <strong className={item.weakness >= 50 ? 'risk-high' : 'risk-low'}>{item.accuracy}%</strong>
        </div>
      ))}
    </div>
  );
}

function WrongQuestionList({ items }) {
  if (!items.length) {
    return (
      <div className="empty-state compact-empty">
        <CheckCircle2 size={30} />
        <p>まだ復習問題はありません。間違えた問題はここに自動で残ります。</p>
      </div>
    );
  }

  return (
    <div className="wrong-list" aria-label="復習問題の一覧">
      {items.slice(0, 4).map((item) => (
        <article className="wrong-item" key={item.id}>
          <div className="wrong-item-meta">
            <span>{item.category}</span>
            <strong>{item.missed}回ミス</strong>
          </div>
          <h3>{item.prompt}</h3>
          <p>正解: {item.correctAnswer}</p>
          <small>{item.explanation}</small>
        </article>
      ))}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MenuItem({ icon: Icon, title, text, onClick }) {
  return (
    <button className="menu-item" onClick={onClick}>
      <Icon size={22} />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

function ProgressChart({ sessions }) {
  if (!sessions.length) {
    return (
      <div className="empty-state">
        <BarChart3 size={32} />
        <p>クイズを完了すると、ここに正答率の推移が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="chart" aria-label="直近のクイズ正答率">
      {sessions.map((session, index) => (
        <div className="chart-bar" key={`${session.date}-${index}`}>
          <span className="bar-value">{session.score}%</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ height: `${Math.max(session.score, 8)}%` }} />
          </span>
          <span className="bar-label">{session.date}</span>
        </div>
      ))}
    </div>
  );
}

function QuizPage({ onFinish }) {
  const [category, setCategory] = useState('すべて');
  const [questionCount, setQuestionCount] = useState('10');
  const [quizRun, setQuizRun] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [recorded, setRecorded] = useState(false);

  const quizQuestions = useMemo(() => {
    const pool = category === 'すべて' ? questions : questions.filter((q) => q.category === category);
    const limit = questionCount === 'all' ? pool.length : Math.min(Number(questionCount), pool.length);
    return shuffleItems(pool).slice(0, limit).map(prepareQuizQuestion);
  }, [category, questionCount, quizRun]);

  const current = quizQuestions[index];
  const complete = answers.length === quizQuestions.length;
  const correct = answers.filter((answer) => answer.correct).length;
  const score = complete ? Math.round((correct / quizQuestions.length) * 100) : 0;

  useEffect(() => {
    if (!complete || recorded) return;
    onFinish({ total: quizQuestions.length, correct, score, answers });
    setRecorded(true);
  }, [answers, complete, correct, onFinish, quizQuestions.length, recorded, score]);

  const choose = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswers((currentAnswers) => [
      ...currentAnswers,
      {
        questionId: current.id,
        category: current.category,
        prompt: current.prompt,
        selected: optionIndex,
        selectedAnswer: current.options[optionIndex],
        correctAnswer: current.options[current.answer],
        explanation: current.explanation,
        correct: optionIndex === current.answer,
      },
    ]);
  };

  const next = () => {
    setIndex((currentIndex) => currentIndex + 1);
    setSelected(null);
  };

  const restart = () => {
    setQuizRun((currentRun) => currentRun + 1);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setRecorded(false);
  };

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory);
    setQuizRun((currentRun) => currentRun + 1);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setRecorded(false);
  };

  const changeQuestionCount = (nextQuestionCount) => {
    setQuestionCount(nextQuestionCount);
    setQuizRun((currentRun) => currentRun + 1);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setRecorded(false);
  };

  return (
    <div className="page-stack quiz-layout">
      <section className="quiz-card">
        {!complete ? (
          <>
            <div className="quiz-toolbar">
              <label>
                <span>カテゴリ</span>
                <select value={category} onChange={(event) => changeCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>問題数</span>
                <select value={questionCount} onChange={(event) => changeQuestionCount(event.target.value)}>
                  {QUIZ_SIZE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="quiz-meta">
              <span>択一問題・{current.category}</span>
              <strong>
                問{index + 1} / {quizQuestions.length}
              </strong>
            </div>
            <div className="progress-rail">
              <span style={{ width: `${((index + 1) / quizQuestions.length) * 100}%` }} />
            </div>
            <h2 className="quiz-question-title">
              <span>問{index + 1}</span>
              {current.prompt}
            </h2>
            <div className="option-list">
              {current.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === current.answer;
                const isSelected = optionIndex === selected;
                const showResult = selected !== null;
                return (
                  <button
                    key={`${current.id}-${optionIndex}-${option}`}
                    className={[
                      'option-button',
                      showResult && isCorrect ? 'is-correct' : '',
                      showResult && isSelected && !isCorrect ? 'is-wrong' : '',
                    ].join(' ')}
                    onClick={() => choose(optionIndex)}
                    disabled={showResult}
                  >
                    <span>{OPTION_LABELS[optionIndex] || String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className="explanation">
                <strong>{selected === current.answer ? '正解です' : '見直しましょう'}</strong>
                <p>{current.explanation}</p>
                <button className="primary-button compact" onClick={next}>
                  {index + 1 >= quizQuestions.length ? '結果を見る' : '次の問題'}
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="result-panel">
            <Trophy size={44} />
            <p className="section-kicker">Result</p>
            <h2>{score}%</h2>
            <p>
              {quizQuestions.length}問中{correct}問正解。結果はホームの学習記録に保存されました。
            </p>
            <button className="primary-button" onClick={restart}>
              <RotateCcw size={20} />
              もう一度解く
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function AfternoonPage({ onFinish }) {
  const [caseId, setCaseId] = useState(afternoonCases[0].id);
  const [ratings, setRatings] = useState({});
  const [revealed, setRevealed] = useState({});
  const [recorded, setRecorded] = useState(false);

  const currentCase = afternoonCases.find((item) => item.id === caseId) || afternoonCases[0];
  const answeredCount = Object.keys(ratings).length;
  const complete = answeredCount === currentCase.questions.length;
  const correct = currentCase.questions.filter((question) => ratings[question.id] === true).length;
  const score = complete ? Math.round((correct / currentCase.questions.length) * 100) : 0;
  const answers = useMemo(
    () =>
      currentCase.questions
        .filter((question) => ratings[question.id] !== undefined)
        .map((question) => ({
          questionId: `${currentCase.id}-${question.id}`,
          category: question.category,
          prompt: question.prompt,
          selectedAnswer: ratings[question.id] ? '自己採点: できた' : '自己採点: 要復習',
          correctAnswer: question.sampleAnswer,
          explanation: question.explanation,
          correct: ratings[question.id] === true,
        })),
    [currentCase.id, currentCase.questions, ratings],
  );

  useEffect(() => {
    if (!complete || recorded) return;
    onFinish({
      total: currentCase.questions.length,
      correct,
      score,
      type: 'afternoon',
      label: currentCase.title,
      answers,
    });
    setRecorded(true);
  }, [answers, complete, correct, currentCase.questions.length, currentCase.title, onFinish, recorded, score]);

  const changeCase = (nextCaseId) => {
    setCaseId(nextCaseId);
    setRatings({});
    setRevealed({});
    setRecorded(false);
  };

  const restart = () => {
    setRatings({});
    setRevealed({});
    setRecorded(false);
  };

  const revealAnswer = (questionId) => {
    setRevealed((current) => ({ ...current, [questionId]: true }));
  };

  const markQuestion = (questionId, correctAnswer) => {
    setRatings((current) => ({ ...current, [questionId]: correctAnswer }));
    revealAnswer(questionId);
  };

  return (
    <div className="page-stack afternoon-layout">
      <section className="afternoon-card">
        <>
            <div className="quiz-toolbar">
              <label>
                <span>午後問題</span>
                <select value={caseId} onChange={(event) => changeCase(event.target.value)}>
                  {afternoonCases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="afternoon-passage">
              <div>
                <p className="section-kicker">Case</p>
                <h1>{currentCase.title}</h1>
                <span>{currentCase.category}</span>
              </div>
              <p>{currentCase.overview}</p>
            </div>

            <div className="quiz-meta">
              <span>{currentCase.sourceTitle}</span>
              <strong>
                {answeredCount} / {currentCase.questions.length}
              </strong>
            </div>
            <div className="progress-rail">
              <span style={{ width: `${Math.max((answeredCount / currentCase.questions.length) * 100, 6)}%` }} />
            </div>

            <div className="draft-table" aria-label={currentCase.sourceTitle}>
              {currentCase.rows.map((row) => (
                <div className="draft-row" key={row.number}>
                  <span className="draft-number">{row.number}</span>
                  <p>{row.content}</p>
                </div>
              ))}
            </div>

            <div className="afternoon-question-list">
              {currentCase.questions.map((question, questionIndex) => (
                <article className="afternoon-question" key={question.id}>
                  <div className="question-head">
                    <span>設問{questionIndex + 1}</span>
                    <strong>{question.category}</strong>
                  </div>
                  <h2>{question.prompt}</h2>
                  <label className="memo-box">
                    <span>{question.answerLabel}</span>
                    <textarea rows="4" placeholder="ここに自分の解答メモを書きます" />
                  </label>

                  {revealed[question.id] && (
                    <div className="answer-sample">
                      <strong>標準解答例</strong>
                      <p>{question.sampleAnswer}</p>
                      <small>{question.explanation}</small>
                    </div>
                  )}

                  <div className="self-check-actions">
                    <button className="secondary-button compact" onClick={() => revealAnswer(question.id)}>
                      標準解答を見る
                    </button>
                    <button
                      className={`self-check-button is-good ${ratings[question.id] === true ? 'is-active' : ''}`}
                      onClick={() => markQuestion(question.id, true)}
                    >
                      できた
                    </button>
                    <button
                      className={`self-check-button is-review ${ratings[question.id] === false ? 'is-active' : ''}`}
                      onClick={() => markQuestion(question.id, false)}
                    >
                      要復習
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {complete && (
              <div className="result-panel inline-result">
                <Trophy size={36} />
                <p className="section-kicker">Afternoon Result</p>
                <h2>{score}%</h2>
                <p>
                  {currentCase.questions.length}問中{correct}問を「できた」にしました。要復習の設問はホームに反映されます。
                </p>
                <button className="primary-button" onClick={restart}>
                  <RotateCcw size={20} />
                  もう一度解く
                </button>
              </div>
            )}
        </>
      </section>
    </div>
  );
}

function GuidePage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="section-kicker">Style Guide</p>
        <h1>『日本語スタイルガイド』要点まとめ</h1>
        <p>TC検定3級で問われやすい、読み手に伝わる文書を作るための基本観点を整理しています。</p>
      </section>

      <section className="guide-grid">
        {guideSections.map((section) => (
          <article className="guide-card" key={section.title}>
            <span className="guide-tag">{section.tag}</span>
            <h2>{section.title}</h2>
            <p>{section.summary}</p>
            <ul>
              {section.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>
                  <CheckCircle2 size={18} />
                  {checkpoint}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

export default App;

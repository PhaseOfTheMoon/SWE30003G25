"use client";

import { useEffect, useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Quiz = {
  quizID: string;
  questionBank: Question[];
  question: Question[];
  totalMark: number;
  score: number;
};

const questionBank: Question[] = [
  {
    question: "What is the first step when giving pet first aid?",
    options: ["Panic", "Check the surroundings for safety", "Give medicine immediately", "Ignore the pet"],
    answer: "Check the surroundings for safety",
  },
  {
    question: "What should you do if a pet is bleeding heavily?",
    options: ["Apply pressure to the wound", "Wash with hot water", "Let it bleed", "Feed the pet"],
    answer: "Apply pressure to the wound",
  },
  {
    question: "What should you do if a pet is choking?",
    options: ["Check the mouth carefully", "Give more food", "Leave it alone", "Make it run"],
    answer: "Check the mouth carefully",
  },
  {
    question: "What is a sign of heatstroke in pets?",
    options: ["Excessive panting", "Sleeping calmly", "Playing normally", "Eating slowly"],
    answer: "Excessive panting",
  },
  {
    question: "What should you do before touching an injured pet?",
    options: ["Approach carefully", "Shout loudly", "Run toward it", "Pull its tail"],
    answer: "Approach carefully",
  },
  {
    question: "What is the purpose of pet first aid?",
    options: ["Provide immediate basic care", "Replace veterinary treatment", "Train pets", "Punish pets"],
    answer: "Provide immediate basic care",
  },
  {
    question: "If a pet has a broken bone, what should you do?",
    options: ["Limit movement", "Force it to walk", "Massage strongly", "Ignore it"],
    answer: "Limit movement",
  },
  {
    question: "What should you do if a pet is unconscious?",
    options: ["Check breathing and call a vet", "Shake it aggressively", "Pour cold water", "Feed it"],
    answer: "Check breathing and call a vet",
  },
  {
    question: "Which item is useful in a pet first aid kit?",
    options: ["Bandage", "Perfume", "Chocolate", "Glue"],
    answer: "Bandage",
  },
  {
    question: "What food is dangerous for dogs?",
    options: ["Chocolate", "Plain rice", "Chicken breast", "Carrot"],
    answer: "Chocolate",
  },
  {
    question: "What should you do if a pet has a minor burn?",
    options: ["Cool the area with clean water", "Apply oil", "Rub the burn", "Use hot water"],
    answer: "Cool the area with clean water",
  },
  {
    question: "Why is it important to stay calm during pet emergencies?",
    options: ["To handle the situation safely", "To waste time", "To scare the pet", "To avoid helping"],
    answer: "To handle the situation safely",
  },
  {
    question: "What should you do if a pet is having a seizure?",
    options: ["Keep it away from danger", "Hold its mouth open", "Put food in its mouth", "Shake it"],
    answer: "Keep it away from danger",
  },
  {
    question: "What does MCQ stand for?",
    options: ["Multiple Choice Question", "Medical Care Quiz", "Main Content Question", "Manual Check Quiz"],
    answer: "Multiple Choice Question",
  },
  {
    question: "How many questions are shown in this quiz?",
    options: ["10", "20", "5", "15"],
    answer: "10",
  },
  {
    question: "What should users do after finishing the quiz?",
    options: ["Submit answers", "Close the website", "Refresh immediately", "Ignore the score"],
    answer: "Submit answers",
  },
  {
    question: "What is shown after submitting the quiz?",
    options: ["Score", "Password", "Payment page", "Chat room"],
    answer: "Score",
  },
  {
    question: "Why should pet owners learn first aid?",
    options: ["To respond during emergencies", "To avoid pets", "To train wild animals", "To replace veterinarians"],
    answer: "To respond during emergencies",
  },
  {
    question: "Which professional should be contacted during serious emergencies?",
    options: ["Veterinarian", "Chef", "Teacher", "Cashier"],
    answer: "Veterinarian",
  },
  {
    question: "What should you prepare before emergencies happen?",
    options: ["A first aid kit", "A gaming console", "A television", "A speaker"],
    answer: "A first aid kit",
  },
];

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz>({
    quizID: "QUIZ001",
    questionBank: questionBank,
    question: [],
    totalMark: 10,
    score: 0,
  });

  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const startQuiz = () => {
    const selectedQuestions = [...quiz.questionBank]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    setQuiz({
      ...quiz,
      question: selectedQuestions,
      totalMark: selectedQuestions.length,
      score: 0,
    });

    setSelectedAnswers({});
    setSubmitted(false);
    setShowPopup(false);
  };

  const getScore = () => {
    let totalScore = 0;

    quiz.question.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        totalScore++;
      }
    });

    return totalScore;
  };

  const submitQuiz = () => {
    const finalScore = getScore();

    setQuiz({
      ...quiz,
      score: finalScore,
    });

    setSubmitted(true);
    setShowPopup(true);
  };

  const handleSelect = (questionIndex: number, option: string) => {
    if (submitted) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  useEffect(() => {
    startQuiz();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "40px 20px" }}>
      {submitted && showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "420px",
              backgroundColor: "white",
              borderRadius: "18px",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>
              Quiz Completed
            </h2>

            <p style={{ fontSize: "18px", marginBottom: "8px" }}>Your score is</p>

            <p
              style={{
                fontSize: "46px",
                fontWeight: "bold",
                color: quiz.score >= 7 ? "#16a34a" : "#dc2626",
                marginBottom: "12px",
              }}
            >
              {quiz.score} / {quiz.totalMark}
            </p>

            <p
              style={{
                color: quiz.score >= 7 ? "#166534" : "#991b1b",
                fontWeight: "600",
                marginBottom: "24px",
              }}
            >
              {quiz.score >= 7
                ? "Great job! You passed the quiz."
                : "Keep practising and review the first-aid guide again."}
            </p>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "white",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              View Answers
            </button>

            <button
              onClick={startQuiz}
              style={{
                width: "100%",
                backgroundColor: "#16a34a",
                color: "white",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "10px", color: "#111827" }}>
          Pet First Aid Quiz
        </h1>

        <p style={{ marginBottom: "8px", color: "#6b7280", fontSize: "16px" }}>
          Quiz ID: {quiz.quizID}
        </p>

        <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "16px" }}>
          Answer all {quiz.totalMark} questions to test your knowledge.
        </p>

        {quiz.question.map((q, index) => (
          <div
            key={index}
            style={{
              marginBottom: "28px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "18px", color: "#111827" }}>
              {index + 1}. {q.question}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {q.options.map((option) => {
                const isSelected = selectedAnswers[index] === option;
                const isCorrect = option === q.answer;
                const isWrong = submitted && isSelected && !isCorrect;

                return (
                  <label
                    key={option}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px",
                      borderRadius: "10px",
                      border: submitted
                        ? isCorrect
                          ? "2px solid #16a34a"
                          : isWrong
                          ? "2px solid #dc2626"
                          : "1px solid #d1d5db"
                        : "1px solid #d1d5db",
                      backgroundColor: submitted
                        ? isCorrect
                          ? "#dcfce7"
                          : isWrong
                          ? "#fee2e2"
                          : "white"
                        : "white",
                      cursor: submitted ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => handleSelect(index, option)}
                    />

                    <span>{option}</span>

                    {submitted && isCorrect && (
                      <span style={{ marginLeft: "auto", color: "#166534", fontWeight: "600" }}>
                        Correct
                      </span>
                    )}

                    {submitted && isWrong && (
                      <span style={{ marginLeft: "auto", color: "#991b1b", fontWeight: "600" }}>
                        Your answer
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {!submitted ? (
          <button
            onClick={submitQuiz}
            style={{
              width: "100%",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={startQuiz}
            style={{
              width: "100%",
              backgroundColor: "#16a34a",
              color: "white",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Retake Quiz
          </button>
        )}
      </div>
    </div>
  );
}
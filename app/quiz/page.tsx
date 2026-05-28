"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supabase from "@/lib/supabase";

type QuizQuestion = {
  id: string;
  petType: string;
  emergencyCategory: string;
  question: string;
  options: string[];
  answer: string;
};

function getRandomQuestions(questionBank: QuizQuestion[]) {
  return [...questionBank].sort(() => Math.random() - 0.5).slice(0, 10);
}

function shuffleOptions(question: QuizQuestion) {
  return {
    ...question,
    options: [...question.options].sort(() => Math.random() - 0.5),
  };
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const score = questions.reduce((total, question) => {
    return answers[question.id] === question.answer ? total + 1 : total;
  }, 0);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  async function startQuiz() {
    setLoading(true);

    const { data, error } = await supabase
      .from("quiz_question")
      .select("id, petType, emergencyCategory, question, options, answer");

    if (error) {
      console.error("Fetch quiz questions error:", error.message);
      alert("Failed to load quiz questions.");
      setLoading(false);
      return;
    }

    const randomQuestions = getRandomQuestions(data || []).map(shuffleOptions);

    setQuestions(randomQuestions);
    setAnswers({});
    setSubmitted(false);
    setShowPopup(false);
    setLoading(false);
  }

  function handleAnswer(questionId: string, choice: string) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: choice,
    }));
  }

  function submitQuiz() {
    setSubmitted(true);
    setShowPopup(true);
  }

  function handleRetry() {
    startQuiz();
  }

  useEffect(() => {
    startQuiz();
  }, []);

  return (
    <main>
      <Navbar />

      <section
        style={{
          minHeight: "80vh",
          backgroundColor: "#f9fafb",
          padding: "48px 16px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {showPopup && (
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
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    marginBottom: "12px",
                  }}
                >
                  Quiz Completed
                </h2>

                <p style={{ fontSize: "18px", marginBottom: "8px" }}>
                  Your score is
                </p>

                <p
                  style={{
                    fontSize: "46px",
                    fontWeight: "bold",
                    color: score >= 7 ? "#16a34a" : "#dc2626",
                    marginBottom: "12px",
                  }}
                >
                  {score} / {questions.length}
                </p>

                <p
                  style={{
                    color: score >= 7 ? "#166534" : "#991b1b",
                    fontWeight: "600",
                    marginBottom: "24px",
                  }}
                >
                  {score >= 7
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
                  onClick={handleRetry}
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
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: "#dc2626",
                fontWeight: "bold",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              Pet First-Aid Quiz
            </p>

            <h1
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#111827",
              }}
            >
              Take a Quiz
            </h1>

            <p
              style={{
                color: "#6b7280",
                lineHeight: "1.6",
                marginBottom: "18px",
              }}
            >
              Answer 10 multiple-choice questions to test your pet first-aid
              knowledge.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontWeight: "600",
                }}
              >
                Questions: {questions.length}
              </span>

              <span
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#075985",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontWeight: "600",
                }}
              >
                Answered: {answeredCount}/{questions.length}
              </span>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              Loading quiz questions...
            </p>
          ) : (
            <>
              <div style={{ display: "grid", gap: "18px" }}>
                {questions.map((question, index) => {
                  const selectedAnswer = answers[question.id];
                  const isCorrect = selectedAnswer === question.answer;

                  return (
                    <div
                      key={question.id}
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "22px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                          marginBottom: "8px",
                        }}
                      >
                        {question.petType} • {question.emergencyCategory}
                      </p>

                      <h2
                        style={{
                          fontSize: "17px",
                          fontWeight: "bold",
                          color: "#111827",
                          marginBottom: "16px",
                        }}
                      >
                        {index + 1}. {question.question}
                      </h2>

                      <div style={{ display: "grid", gap: "10px" }}>
                        {question.options.map((choice) => {
                          const isSelected = selectedAnswer === choice;

                          const shouldShowCorrect =
                            submitted && choice === question.answer;

                          const shouldShowWrong =
                            submitted && isSelected && !isCorrect;

                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleAnswer(question.id, choice)}
                              style={{
                                textAlign: "left",
                                padding: "12px 14px",
                                borderRadius: "8px",
                                border: shouldShowCorrect
                                  ? "2px solid #16a34a"
                                  : shouldShowWrong
                                  ? "2px solid #dc2626"
                                  : isSelected
                                  ? "2px solid #0ea5e9"
                                  : "1px solid #e5e7eb",
                                backgroundColor: shouldShowCorrect
                                  ? "#dcfce7"
                                  : shouldShowWrong
                                  ? "#fee2e2"
                                  : isSelected
                                  ? "#e0f2fe"
                                  : "white",
                                color: "#111827",
                                cursor: submitted ? "default" : "pointer",
                                fontSize: "14px",
                              }}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "28px",
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                {submitted ? (
                  <button
                    type="button"
                    onClick={handleRetry}
                    style={{
                      padding: "12px 22px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Retake Quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    disabled={!allAnswered}
                    style={{
                      padding: "12px 22px",
                      backgroundColor: allAnswered ? "#dc2626" : "#d1d5db",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: allAnswered ? "pointer" : "not-allowed",
                    }}
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
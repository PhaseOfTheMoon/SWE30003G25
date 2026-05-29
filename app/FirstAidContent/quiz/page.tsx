"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabase";
import {
  getPetTypes,
  getEmergencyCategories,
  PET_EMOJI,
  CATEGORY_EMOJI,
} from "@/lib/content";

type Question = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

type Step = "pet" | "category" | "quiz";

export default function QuizPage() {
  const [step, setStep] = useState<Step>("pet");
  const [petTypes, setPetTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizID, setQuizID] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState(0);

  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load pet types with published content on mount
  useEffect(() => {
    async function loadPetTypes() {
      try {
        const pets = await getPetTypes();
        setPetTypes(pets);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingPets(false);
      }
    }
    loadPetTypes();
  }, []);

  async function handleSelectPet(pet: string) {
    setSelectedPet(pet);
    setSelectedCategory("");
    setError("");
    setStep("category");
    setLoadingCats(true);
    try {
      const cats = await getEmergencyCategories(pet);
      setCategories(cats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCats(false);
    }
  }

  async function fetchQuestions(pet: string, category: string) {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("quiz_question")
        .select("id, question, options, answer")
        .eq("petType", pet)
        .eq("emergencyCategory", category);

      if (err) throw new Error(err.message);
      if (!data || data.length === 0)
        throw new Error(`No questions found for ${pet} — ${category}.`);

      // Shuffle and take up to 5
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 5);
      setQuestions(shuffled);
      setQuizID(`QUIZ-${pet.slice(0, 3).toUpperCase()}-${category.slice(0, 3).toUpperCase()}`);
      setSelectedAnswers({});
      setSubmitted(false);
      setShowPopup(false);
      setScore(0);
      setStep("quiz");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCategory(cat: string) {
    setSelectedCategory(cat);
    fetchQuestions(selectedPet, cat);
  }

  function retakeQuiz() {
    fetchQuestions(selectedPet, selectedCategory);
  }

  function reset() {
    setStep("pet");
    setSelectedPet("");
    setSelectedCategory("");
    setCategories([]);
    setQuestions([]);
    setSelectedAnswers({});
    setSubmitted(false);
    setShowPopup(false);
    setScore(0);
    setError("");
  }

  function handleSelect(index: number, option: string) {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [index]: option }));
  }

  function submitQuiz() {
    let total = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) total++;
    });
    setScore(total);
    setSubmitted(true);
    setShowPopup(true);
  }

  const totalMark = questions.length;
  const passed = score >= Math.ceil(totalMark * 0.6);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "40px 20px" }}>
      {/* Score popup */}
      {submitted && showPopup && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "90%", maxWidth: "420px", backgroundColor: "white", borderRadius: "18px", padding: "32px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>Quiz Completed</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "6px" }}>
              {PET_EMOJI[selectedPet] ?? "🐾"} {selectedPet} — {CATEGORY_EMOJI[selectedCategory] ?? "🚨"} {selectedCategory}
            </p>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>Your score is</p>
            <p style={{ fontSize: "46px", fontWeight: "bold", color: passed ? "#16a34a" : "#dc2626", marginBottom: "12px" }}>
              {score} / {totalMark}
            </p>
            <p style={{ color: passed ? "#166534" : "#991b1b", fontWeight: "600", marginBottom: "24px" }}>
              {passed ? "Great job! You passed the quiz." : "Keep practising and review the first-aid guide again."}
            </p>
            <button onClick={() => setShowPopup(false)} style={{ width: "100%", backgroundColor: "#2563eb", color: "white", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
              View Answers
            </button>
            <button onClick={retakeQuiz} style={{ width: "100%", backgroundColor: "#16a34a", color: "white", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
              Retake Quiz
            </button>
            <button onClick={reset} style={{ width: "100%", backgroundColor: "#f3f4f6", color: "#374151", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer" }}>
              Try Another Category
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", backgroundColor: "white", borderRadius: "16px", padding: "40px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>

        {/* Back link */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "10px", color: "#111827" }}>
          Pet First Aid Quiz
        </h1>

        {/* Breadcrumb */}
        {(selectedPet || selectedCategory) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", marginBottom: "24px", flexWrap: "wrap" }}>
            <button onClick={reset} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, fontWeight: "500" }}>
              All Pets
            </button>
            {selectedPet && (
              <>
                <span>›</span>
                <button
                  onClick={() => { setStep("category"); setSelectedCategory(""); setError(""); }}
                  style={{ background: "none", border: "none", color: selectedCategory ? "#3b82f6" : "#111827", cursor: selectedCategory ? "pointer" : "default", padding: 0, fontWeight: "500" }}
                >
                  {PET_EMOJI[selectedPet] ?? "🐾"} {selectedPet}
                </button>
              </>
            )}
            {selectedCategory && (
              <>
                <span>›</span>
                <span style={{ color: "#111827", fontWeight: "500" }}>{CATEGORY_EMOJI[selectedCategory] ?? "🚨"} {selectedCategory}</span>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "20px" }}>
            ✗ {error}
          </div>
        )}

        {/* Step: Pet selection */}
        {step === "pet" && (
          <>
            <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "16px" }}>Select your pet to begin.</p>
            {loadingPets ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading…</p>
            ) : petTypes.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>No quizzes available yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {petTypes.map(pet => (
                  <button key={pet} onClick={() => handleSelectPet(pet)}
                    style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "24px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>{PET_EMOJI[pet] ?? "🐾"}</div>
                    <p style={{ fontWeight: "600", fontSize: "14px", color: "#111827", margin: 0 }}>{pet}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step: Category selection */}
        {step === "category" && (
          <>
            <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "16px" }}>
              Choose an emergency category for <strong>{selectedPet}</strong>.
            </p>
            {loadingCats ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading categories…</p>
            ) : categories.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>No quizzes available for {selectedPet} yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px" }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => handleSelectCategory(cat)}
                    style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px 16px", textAlign: "left", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                  >
                    <p style={{ fontSize: "22px", margin: "0 0 8px" }}>{CATEGORY_EMOJI[cat] ?? "🚨"}</p>
                    <p style={{ fontWeight: "600", fontSize: "14px", color: "#111827", margin: 0 }}>{cat}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step: Quiz */}
        {step === "quiz" && (
          <>
            {loading ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading questions…</p>
            ) : (
              <>
                <p style={{ marginBottom: "8px", color: "#6b7280", fontSize: "16px" }}>Quiz ID: {quizID}</p>
                <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "16px" }}>
                  Answer all {totalMark} questions to test your knowledge.
                </p>

                {questions.map((q, index) => (
                  <div key={q.id} style={{ marginBottom: "28px", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "18px", color: "#111827" }}>
                      {index + 1}. {q.question}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {q.options.map(option => {
                        const isSelected = selectedAnswers[index] === option;
                        const isCorrect = option === q.answer;
                        const isWrong = submitted && isSelected && !isCorrect;
                        return (
                          <label key={option} style={{
                            display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "10px",
                            border: submitted ? (isCorrect ? "2px solid #16a34a" : isWrong ? "2px solid #dc2626" : "1px solid #d1d5db") : "1px solid #d1d5db",
                            backgroundColor: submitted ? (isCorrect ? "#dcfce7" : isWrong ? "#fee2e2" : "white") : "white",
                            cursor: submitted ? "not-allowed" : "pointer",
                          }}>
                            <input type="radio" name={`question-${index}`} value={option} disabled={submitted} checked={isSelected} onChange={() => handleSelect(index, option)} />
                            <span>{option}</span>
                            {submitted && isCorrect && <span style={{ marginLeft: "auto", color: "#166534", fontWeight: "600" }}>Correct</span>}
                            {submitted && isWrong && <span style={{ marginLeft: "auto", color: "#991b1b", fontWeight: "600" }}>Your answer</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!submitted ? (
                  <button onClick={submitQuiz} style={{ width: "100%", backgroundColor: "#2563eb", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                    Submit Quiz
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={retakeQuiz} style={{ flex: 1, backgroundColor: "#16a34a", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                      Retake Quiz
                    </button>
                    <button onClick={reset} style={{ flex: 1, backgroundColor: "#f3f4f6", color: "#374151", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                      Try Another Category
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Toast from '../components/Toast';
import './Studio.css';

export default function Studio() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [generateVideo, setGenerateVideo] = useState(false);
    const navigate = useNavigate();

    // Check auth on enter
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || token.trim() === '') {
            navigate('/login');
        }
    }, [navigate]);

    // State machine
    const [step, setStep] = useState<'input' | 'drafting' | 'draft_review' | 'generating_media' | 'finished'>('input');
    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [lessonId, setLessonId] = useState<string | null>(null);
    const [draftScript, setDraftScript] = useState('');
    const [lessonData, setLessonData] = useState<any>(null);

    // Draft floating expand state
    const [isDraftExpanded, setIsDraftExpanded] = useState(false);
    const [showDraftTooltip, setShowDraftTooltip] = useState(false);

    // Media Viewer state
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [quizSelections, setQuizSelections] = useState<Record<number, string>>({});

    // Progress bar simulation
    useEffect(() => {
        let timer: any;

        const jobs = lessonData?.generationJobs || [];
        const activeJob = [...jobs]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isJobCompleted = activeJob && (activeJob.status === 'Completed' || activeJob.status === 2);

        if (isJobCompleted) {
            setProgress(100);
            return;
        }

        if (step === 'drafting' || step === 'generating_media') {
            setProgress(prev => (prev === 0 || prev === 100) ? 8 : prev);
            timer = setInterval(() => {
                setProgress(prev => {
                    const cap = step === 'generating_media' ? 92 : 94;
                    if (prev >= cap) return cap;
                    return Math.min(prev + Math.max(1, Math.floor((cap - prev) / 10)), cap);
                });
            }, 1200);
        } else if (step === 'draft_review' || step === 'finished') {
            setProgress(100);
            const t = setTimeout(() => setProgress(0), 500);
            return () => clearTimeout(t);
        }
        return () => clearInterval(timer);
    }, [step, lessonData]);

    useEffect(() => {
        if (step !== 'generating_media') {
            setElapsedSeconds(0);
            return;
        }

        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [step]);

    useEffect(() => {
        if (step === 'generating_media') {
            setShowDraftTooltip(true);
            const timer = setTimeout(() => {
                setShowDraftTooltip(false);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setShowDraftTooltip(false);
        }
    }, [step]);

    // Polling effect for background media generation status
    useEffect(() => {
        if (step !== 'generating_media' || !lessonId) {
            return;
        }

        let isMounted = true;
        let pollTimer: any;

        const pollStatus = async () => {
            try {
                const lesson = await api.getLesson(lessonId);
                if (!isMounted) return;

                setLessonData(lesson);

                const jobs = lesson.generationJobs || [];
                // Always pick the newest job (avoid getting stuck on old stale Running job)
                const activeJob = [...jobs]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                if (activeJob) {
                    const status = activeJob.status;
                    if (status === 'Completed' || status === 2) {
                        // Job completed! Set progress to 100% and wait 2 seconds before finishing
                        setProgress(100);
                        setTimeout(() => {
                            if (isMounted) {
                                setStep('finished');
                            }
                        }, 2000);
                    } else if (status === 'Failed' || status === 3) {
                        setError(activeJob.errorMessage || "Đã xảy ra lỗi khi tạo media từ server.");
                        setStep('draft_review');
                    } else {
                        pollTimer = setTimeout(pollStatus, 2000);
                    }
                } else {
                    pollTimer = setTimeout(pollStatus, 2000);
                }
            } catch (err: any) {
                console.error("Lỗi khi poll trạng thái bài học:", err);
                if (isMounted) {
                    pollTimer = setTimeout(pollStatus, 3000);
                }
            }
        };

        pollTimer = setTimeout(pollStatus, 1000);

        return () => {
            isMounted = false;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [step, lessonId]);

    const mediaLoadingStages = [
        {
            title: 'Phân tích kịch bản',
            detail: 'Tạo nội dung câu chuyện và câu hỏi học tập.'
        },
        {
            title: 'Tạo hình nhân vật',
            detail: 'Thiết kế tạo hình nhân vật chính xuyên suốt.'
        },
        {
            title: generateVideo ? 'Tạo video minh họa' : 'Vẽ tranh minh họa',
            detail: 'Tạo hình ảnh/video song song cho các chương.'
        },
        {
            title: 'Hoàn tất bài học',
            detail: 'Tối ưu hóa hình ảnh và chuẩn bị bài học.'
        }
    ];

    const getStepStatus = (index: number): 'pending' | 'active' | 'completed' => {
        if (step === 'finished') return 'completed';

        const jobs = lessonData?.generationJobs || [];
        // Always pick the newest job to avoid stale Running job blocking the UI
        const activeJob = [...jobs]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!activeJob) {
            if (index === 0) return 'active';
            return 'pending';
        }

        const currentStep = activeJob.currentStep || "";
        const isCompleted = activeJob.status === 'Completed' || activeJob.status === 2;

        if (isCompleted) return 'completed';

        const logs: any[] = activeJob.logs || [];
        const hasReachedAnchorImage = logs.some((l: any) => l.step === "GenerateAnchorImage");
        const hasReachedGenerate = currentStep === "GenerateChapters" || logs.some((l: any) => l.step === "GenerateChapters");

        const chapters = lessonData?.chapters || [];
        const generatedCount = chapters.filter((c: any) => 
            c.status === 'Generated' || 
            c.status === 2 || 
            c.mangaUrl || 
            c.videoUrl
        ).length;

        const allChaptersGenerated = chapters.length > 0 && generatedCount === chapters.length;

        if (index === 0) {
            if (currentStep === "CreateChapters" && !hasReachedAnchorImage) {
                return 'active';
            }
            return 'completed';
        }
        if (index === 1) {
            if (!hasReachedAnchorImage) return 'pending';
            if (currentStep === "GenerateAnchorImage" && !hasReachedGenerate) return 'active';
            return 'completed';
        }
        if (index === 2) {
            if (!hasReachedGenerate) return 'pending';
            if (!allChaptersGenerated) return 'active';
            return 'completed';
        }
        if (index === 3) {
            if (!allChaptersGenerated) return 'pending';
            if (!isCompleted) return 'active';
            return 'completed';
        }

        return 'pending';
    };

    const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

    const handleGenerateDraft = async () => {
        if (!title.trim() || !content.trim()) {
            setError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
            return;
        }

        setStep('drafting');
        setError(null);

        try {
            const result = await api.generateDraft({
                title: title.trim(),
                rawContent: content.trim(),
                generateVideo,
                creativeMode: 0,
                creativeBrief: null
            });

            setLessonId(result.id);
            setDraftScript(result.overallScript || "Không có kịch bản.");
            setStep('draft_review');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Không thể tạo kịch bản nháp. Vui lòng thử lại.");
            setStep('input');
        }
    };

    const handleApproveDraft = async () => {
        if (!lessonId) return;
        if (!draftScript.trim()) {
            setError("Kịch bản không được để trống.");
            return;
        }

        setStep('generating_media');
        setError(null);
        setIsDraftExpanded(false);

        try {
            const result = await api.approveDraft(lessonId, draftScript);
            const lesson = result.lesson || result;
            if (!lesson || !lesson.id) {
                throw new Error("API approve không trả về thông tin bài học hợp lệ.");
            }
            setLessonData(lesson);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Đã xảy ra lỗi khi tạo media.");
            setStep('draft_review');
        }
    };

    const handleQuizSelect = (optionKey: string) => {
        setQuizSelections(prev => ({
            ...prev,
            [currentChapterIndex]: optionKey
        }));
    };

    const renderQuiz = (chapter: any) => {
        const quiz = chapter.quiz;
        if (!quiz) {
            return <div className="quiz-panel empty">Chapter này chưa có quiz.</div>;
        }

        const options = [
            { key: 'A', text: quiz.optionA },
            { key: 'B', text: quiz.optionB },
            { key: 'C', text: quiz.optionC },
            { key: 'D', text: quiz.optionD },
        ];

        const selected = quizSelections[currentChapterIndex];
        const correct = (quiz.correctOption || '').trim().toUpperCase().charAt(0);
        const hasAnswer = !!selected;

        return (
            <div className="quiz-panel">
                <div className="quiz-title">Quiz tương tác</div>
                <p className="quiz-question">{quiz.question}</p>
                <div className="quiz-options">
                    {options.map(opt => {
                        const isSelected = selected === opt.key;
                        const isCorrect = hasAnswer && correct === opt.key;
                        const isWrong = hasAnswer && isSelected && selected !== correct;

                        let classes = "quiz-option";
                        if (isSelected) classes += " selected";
                        if (isCorrect) classes += " correct";
                        if (isWrong) classes += " wrong";

                        return (
                            <button
                                key={opt.key}
                                type="button"
                                className={classes}
                                onClick={() => !hasAnswer && handleQuizSelect(opt.key)}
                                disabled={hasAnswer}
                            >
                                <span className="quiz-option-key">{opt.key}</span>
                                <span>{opt.text}</span>
                            </button>
                        );
                    })}
                </div>
                {hasAnswer && (
                    <div className={`quiz-feedback ${selected === correct ? 'correct' : 'wrong'}`}>
                        <strong>
                            {selected === correct ? "Đúng rồi." : `Chưa đúng. Đáp án đúng là ${correct}.`}
                        </strong>
                        <p>{quiz.explanation}</p>
                    </div>
                )}
            </div>
        );
    };

    const chapters = lessonData?.chapters ? [...lessonData.chapters].sort((a, b) => a.order - b.order) : [];
    const currentChapter = chapters[currentChapterIndex];
    const isVideoMode = lessonData?.outputMode === 'Video' || lessonData?.outputMode === 1;

    // Helper to get review section CSS class
    const getReviewSectionClass = () => {
        let classes = "review-section";
        if (step === 'generating_media' || step === 'finished') {
            classes += " draft-floating";
            if (isDraftExpanded) {
                classes += " expanded";
            }
        }
        return classes;
    };

    return (
        <div className="studio-page-wrapper">
            <Toast message={error} type="error" onClose={() => setError(null)} />

            {/* Cosmic space background effects */}
            <div className="cyber-space-bg">
                <div className="stars-layer-1"></div>
                <div className="stars-layer-2"></div>
                <div className="nebula-glow"></div>
                <div className="scifi-objects">
                    <div className="spaceship-1">🛸</div>
                    <div className="spaceship-2">🚀</div>
                    <div className="satellite">🛰️</div>
                    <div className="planet-cyan"></div>
                    <div className="planet-purple"></div>
                </div>
            </div>
            <div className="background-blobs"></div>

            <main>
                {/* Hero Section */}
                {(step === 'input' || step === 'drafting') && (
                    <section className="studio-hero">
                        <h1>Biến bài học thành <span className="neon-text">Trải nghiệm</span></h1>
                        <p className="sub-title">Tự động tạo Manga hoặc Video từ nội dung bài học của bạn chỉ trong vài giây.</p>
                    </section>
                )}

                {/* STEP 1: INPUT PANEL */}
                {(step === 'input' || step === 'drafting') && (
                    <section id="generationInputPanel" className="input-container">
                        <div className="input-group">
                            <label htmlFor="title">Tiêu đề bài học</label>
                            <input
                                type="text"
                                id="title"
                                placeholder="Ví dụ: Vòng đời của một con bướm"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                disabled={step === 'drafting'}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="content">Nội dung bài học</label>
                            <textarea
                                id="content"
                                rows={6}
                                placeholder="Nhập nội dung chi tiết tại đây..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                disabled={step === 'drafting'}
                                required
                            ></textarea>
                        </div>

                        <div className="options">
                            <div className="toggle-group">
                                <span>Manga (Cơ bản)</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        id="generateVideo"
                                        checked={generateVideo}
                                        onChange={e => setGenerateVideo(e.target.checked)}
                                        disabled={step === 'drafting'}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>Video (Cao cấp)</span>
                            </div>

                            {step === 'input' ? (
                                <button 
                                    id="generateBtn" 
                                    className="btn-primary"
                                    onClick={handleGenerateDraft}
                                >
                                    Bắt đầu tạo
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: '600', fontSize: '0.9rem' }}>
                                        <div className="inline-spinner"></div>
                                        <span>Đang tạo kịch bản... {progress}%</span>
                                    </div>
                                     <div className="inline-progress-bg">
                                         <div className="inline-progress-bar" style={{ transform: `scaleX(${progress / 100})` }}></div>
                                     </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* STEP 2: LOADINGS & PROGRESS (FOR BOTH TRANSITIONS) */}
                {step === 'generating_media' && (
                    <section id="resultContainer" className="result-container">
                        <div id="loadingState" className="loading-state">
                            <div className="loader"></div>
                             <div className="generation-progress" aria-hidden="true">
                                 <div className="generation-progress-bar" style={{ transform: `scaleX(${progress / 100})` }}></div>
                             </div>
                            <div className="media-loading-copy">
                                <span className="media-loading-eyebrow">Đã chạy {elapsedLabel}</span>
                                <h2>Đang tạo series của bạn</h2>
                                <p id="statusText">
                                    Hệ thống đang chuẩn bị nội dung bài học và hình ảnh minh họa.
                                </p>
                                <p className="media-loading-note">
                                    Vui lòng giữ tab này mở, bài học của bạn sẽ tự động hiển thị sau khi hoàn tất.
                                </p>
                            </div>
                            <div className="media-loading-steps" aria-label="Các bước tạo media">
                                {mediaLoadingStages.map((stage, index) => {
                                    const status = getStepStatus(index);
                                    const placeholderHeight = index * 30;
                                    return (
                                        <div key={stage.title} className="media-loading-column">
                                            <div className={`media-loading-step ${status}`}>
                                                <div className="media-loading-header-row">
                                                    <span className="step-badge">
                                                        {status === 'completed' ? '✓' : index + 1}
                                                    </span>
                                                    {status === 'active' && <span className="active-dot"></span>}
                                                </div>
                                                <p className="step-title">{stage.title}</p>
                                                <small className="step-detail">{stage.detail}</small>
                                            </div>
                                            {placeholderHeight > 0 && (
                                                <div 
                                                    className={`media-loading-placeholder ${status}`}
                                                    style={{ height: `${placeholderHeight}px` }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* STEP 3: LESSON OUTPUT (DRAFT REVIEW & MEDIA VIEWER) */}
                {(step === 'draft_review' || step === 'generating_media' || step === 'finished') && (
                    <section id="resultContainer" className="result-container">
                        <div id="lessonOutput" className="lesson-output" style={{ width: '100%' }}>

                            {/* DRAFT REVIEW SECTION */}
                            <div id="reviewSection" className={getReviewSectionClass()}>
                                <button
                                    id="draftFloatToggle"
                                    className="draft-float-toggle"
                                    type="button"
                                    aria-label="Mở kịch bản nháp"
                                    onClick={() => setIsDraftExpanded(!isDraftExpanded)}
                                >
                                    ✎
                                </button>
                                <h2>Kịch bản bài học (Draft Script)</h2>
                                <div className="review-script-main">
                                    <textarea 
                                        className="script-editor"
                                        value={draftScript}
                                        onChange={e => setDraftScript(e.target.value)}
                                        disabled={step === 'generating_media'}
                                        spellCheck={false}
                                    ></textarea>
                                </div>

                                {step === 'draft_review' && (
                                    <div className="review-actions">
                                        <button
                                            className="btn-primary"
                                            style={{
                                                background: '#18181b',
                                                color: '#fafafa',
                                                border: '1px solid #27272a',
                                                boxShadow: 'none',
                                                padding: '10px 18px',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setStep('input')}
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            id="approveBtn"
                                            className="btn-success"
                                            onClick={handleApproveDraft}
                                        >
                                            Phê duyệt & Tạo Media
                                        </button>
                                    </div>
                                )}
                            </div>
                            {showDraftTooltip && (
                                <div className="draft-float-tooltip">
                                    Kịch bản của bạn được thu nhỏ tại đây!
                                </div>
                            )}

                            {/* CHAPTER MEDIA VIEWER */}
                            {step === 'finished' && (
                                <div id="mediaSection" className="media-section">
                                    <div className="chapter-reader">
                                        <div className="chapter-reader-header">
                                            <div></div>
                                            <div className="chapter-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button 
                                                    type="button" 
                                                    className="chapter-nav-btn"
                                                    onClick={() => {
                                                        setStep('input');
                                                        setTitle('');
                                                        setContent('');
                                                        setLessonData(null);
                                                    }}
                                                    style={{
                                                        background: 'var(--primary)',
                                                        color: '#fff',
                                                        borderColor: 'var(--primary-hover)',
                                                        marginRight: '12px',
                                                        padding: '0 14px',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    ✦ Tạo Series mới
                                                </button>
                                                <button
                                                    id="prevChapterBtn"
                                                    type="button"
                                                    className="chapter-nav-btn"
                                                    disabled={currentChapterIndex === 0}
                                                    onClick={() => setCurrentChapterIndex(prev => prev - 1)}
                                                >
                                                    Trước
                                                </button>
                                                <span id="chapterCounter" className="chapter-counter">
                                                    {currentChapterIndex + 1} / {chapters.length}
                                                </span>
                                                <button
                                                    id="nextChapterBtn"
                                                    type="button"
                                                    className="chapter-nav-btn"
                                                    disabled={currentChapterIndex === chapters.length - 1}
                                                    onClick={() => setCurrentChapterIndex(prev => prev + 1)}
                                                >
                                                    Tiếp
                                                </button>
                                            </div>
                                        </div>

                                        <div id="chapterStage" className="chapter-stage">
                                            {currentChapter ? (
                                                <article className="chapter-reader-card">
                                                    <div className="chapter-media-panel">
                                                        {isVideoMode && currentChapter.videoUrl ? (
                                                            <video
                                                                src={currentChapter.videoUrl}
                                                                className="chapter-media"
                                                                controls
                                                                autoPlay
                                                                loop
                                                                muted
                                                                playsInline
                                                            />
                                                        ) : !isVideoMode && currentChapter.mangaUrl ? (
                                                            <img
                                                                src={currentChapter.mangaUrl}
                                                                className="chapter-media"
                                                                alt={`Chapter ${currentChapter.order}`}
                                                            />
                                                        ) : (
                                                            <div className="chapter-media chapter-media-empty">
                                                                Chưa có {isVideoMode ? "video" : "ảnh manga"} cho chapter {currentChapter.order || currentChapterIndex + 1}.
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="chapter-detail-panel">
                                                        <div className="chapter-kicker">
                                                            Chapter {currentChapter.order || currentChapterIndex + 1}
                                                        </div>
                                                        <h3>
                                                            {currentChapter.title || `Chương ${currentChapter.order || currentChapterIndex + 1}`}
                                                        </h3>
                                                        <p className="chapter-summary">
                                                            {currentChapter.summary}
                                                        </p>
                                                        {renderQuiz(currentChapter)}

                                                        {/* Bottom Navigation and Return Flow */}
                                                        <div className="chapter-reader-bottom-nav">
                                                            <button
                                                                type="button"
                                                                className="chapter-bottom-nav-btn"
                                                                disabled={currentChapterIndex === 0}
                                                                onClick={() => {
                                                                    setCurrentChapterIndex(prev => prev - 1);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                ← Chương trước
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="chapter-bottom-nav-btn create-new"
                                                                onClick={() => {
                                                                    setStep('input');
                                                                    setTitle('');
                                                                    setContent('');
                                                                    setLessonData(null);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                ✦ Tạo Series mới
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="chapter-bottom-nav-btn"
                                                                disabled={currentChapterIndex === chapters.length - 1}
                                                                onClick={() => {
                                                                    setCurrentChapterIndex(prev => prev + 1);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                Chương tiếp →
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            ) : (
                                                <div className="empty-output-panel">
                                                    <h3>Chưa có chapter để hiển thị</h3>
                                                    <p>Vui lòng kiểm tra lại kết quả API.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

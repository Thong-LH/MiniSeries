import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, getHubUrl } from '../services/api';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import Toast from '../components/Toast';
import './Studio.css';

export default function Studio() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [generateVideo, setGenerateVideo] = useState(false);
    const [vibe, setVibe] = useState('manga');
    const [showGuide, setShowGuide] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check auth on enter
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || token.trim() === '') {
            navigate('/login');
        }
    }, [navigate]);

    // State machine
    const [step, setStep] = useState<'input' | 'opening_lesson' | 'drafting' | 'draft_review' | 'generating_media' | 'finished'>('input');
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

    useEffect(() => {
        const existingLessonId = searchParams.get('lessonId');
        if (!existingLessonId) {
            return;
        }

        let ignore = false;

        const loadExistingLesson = async () => {
            setStep('opening_lesson');
            setError(null);

            try {
                const lesson = await api.getLesson(existingLessonId);
                if (ignore) return;

                const jobs = lesson.generationJobs || [];
                const latestJob = [...jobs]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                const jobStatus = latestJob?.status;
                const chapters = lesson.chapters || [];
                const hasChapters = chapters.length > 0;
                const isRunning = jobStatus === 'Pending' || jobStatus === 'Running' || jobStatus === 0 || jobStatus === 1;

                setLessonId(lesson.id);
                setLessonData(lesson);
                setTitle(lesson.title || '');
                setContent(lesson.rawContent || '');
                setDraftScript(lesson.overallScript || '');
                setGenerateVideo(lesson.outputMode === 'Video' || lesson.outputMode === 1);
                setCurrentChapterIndex(0);

                try {
                    const attempts = await api.getMyQuizAttempts();
                    const selectionMap: Record<number, string> = {};
                    chapters.forEach((ch: any, idx: number) => {
                        const matched = attempts.find((a: any) => a.chapterId === ch.id);
                        if (matched) {
                            selectionMap[idx] = matched.selectedOption;
                        }
                    });
                    setQuizSelections(selectionMap);
                } catch (qErr) {
                    console.error("Lỗi tải kết quả quiz cũ:", qErr);
                    setQuizSelections({});
                }

                if (isRunning) {
                    setStep('generating_media');
                } else if (hasChapters) {
                    setStep('finished');
                } else {
                    setStep('draft_review');
                }
            } catch (err: any) {
                if (ignore) return;
                if (err?.status === 401 || err?.status === 403) {
                    localStorage.clear();
                    navigate('/login', { replace: true });
                    return;
                }
                setError(err.message || 'Không tải được bài học đã chọn.');
                setStep('input');
            }
        };

        void loadExistingLesson();

        return () => {
            ignore = true;
        };
    }, [searchParams, navigate]);

    // Progress bar simulation
    useEffect(() => {
        let timer: any;

        const jobs = lessonData?.generationJobs || [];
        const filteredJobs = jobs.filter((j: any) => {
            if (step === 'drafting') {
                return j.type === 0 || j.type === 'ScriptDraft' || j.type === 1 || j.type === 'ScriptRevision';
            }
            if (step === 'generating_media') {
                return j.type === 2 || j.type === 'MediaGeneration';
            }
            return true;
        });
        const activeJob = [...filteredJobs]
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

    // SignalR connection for background media generation status
    useEffect(() => {
        if (step !== 'generating_media' || !lessonId) {
            return;
        }

        let isMounted = true;
        const hubUrl = getHubUrl('/hubs/lessons');

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .build();

        const startConnection = async () => {
            try {
                await connection.start();
                if (!isMounted) {
                    await connection.stop();
                    return;
                }

                // Join group for this lesson
                await connection.invoke("JoinLessonGroup", lessonId);

                // Fetch status immediately in case it completed before connecting
                const currentLesson = await api.getLesson(lessonId);
                if (!isMounted) return;
                setLessonData(currentLesson);

                const jobs = currentLesson.generationJobs || [];
                const mediaJobs = jobs.filter((j: any) => j.type === 2 || j.type === 'MediaGeneration');
                const activeJob = [...mediaJobs]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                if (activeJob) {
                    const status = activeJob.status;
                    if (status === 'Completed' || status === 2) {
                        setProgress(100);
                        setTimeout(async () => {
                            if (isMounted) {
                                try {
                                    const finalLesson = await api.getLesson(lessonId);
                                    setLessonData(finalLesson);
                                } catch (err) {
                                    console.error("Lỗi khi tải lại dữ liệu hoàn tất của bài học:", err);
                                }
                                setStep('finished');
                            }
                        }, 2000);
                    } else if (status === 'Failed' || status === 3) {
                        setError(activeJob.errorMessage || "Đã xảy ra lỗi khi tạo media từ server.");
                        setStep('draft_review');
                    }
                }
            } catch (err) {
                console.error("Lỗi kết nối SignalR:", err);
            }
        };

        connection.on("StatusChanged", (data: { lessonId: string; status: string; errorMessage?: string }) => {
            if (!isMounted) return;
            if (data.lessonId !== lessonId) return;

            if (data.status === 'Completed') {
                setProgress(100);
                setTimeout(async () => {
                    if (isMounted) {
                        try {
                            const finalLesson = await api.getLesson(lessonId);
                            setLessonData(finalLesson);
                        } catch (err) {
                            console.error("Lỗi khi tải lại dữ liệu hoàn tất của bài học:", err);
                        }
                        setStep('finished');
                    }
                }, 2000);
            } else if (data.status === 'Failed') {
                setError(data.errorMessage || "Đã xảy ra lỗi khi tạo media từ server.");
                setStep('draft_review');
            }
        });

        connection.onreconnected(() => {
            if (isMounted) {
                connection.invoke("JoinLessonGroup", lessonId)
                    .catch(err => console.error("Error rejoining group after reconnect on web:", err));
            }
        });

        startConnection();

        return () => {
            isMounted = false;
            if (connection.state === HubConnectionState.Connected) {
                connection.invoke("LeaveLessonGroup", lessonId)
                    .catch(err => console.error("Lỗi rời nhóm SignalR:", err))
                    .finally(() => {
                        connection.stop().catch(err => console.error("Lỗi đóng kết nối SignalR:", err));
                    });
            } else {
                connection.stop().catch(err => console.error("Lỗi đóng kết nối SignalR:", err));
            }
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
        // Only pick the newest job of type MediaGeneration for the media generation steps
        const mediaJobs = jobs.filter((j: any) => j.type === 2 || j.type === 'MediaGeneration');
        const activeJob = [...mediaJobs]
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
                creativeBrief: `Vibe style: ${vibe}`
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

        if (currentChapter?.id && currentChapter?.quiz) {
            const correct = (currentChapter.quiz.correctOption || '').trim().toUpperCase().charAt(0);
            const isCorrect = optionKey === correct;
            api.logQuizAttempt(currentChapter.id, optionKey, isCorrect)
                .catch(err => console.error("Lỗi lưu kết quả quiz:", err));
        }
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

    useEffect(() => {
        if (step === 'finished' && lessonData?.id && chapters?.length > 0) {
            const currentChapterOrder = currentChapterIndex + 1;
            api.updateProgress(lessonData.id, currentChapterOrder, chapters.length)
                .catch(err => console.error("Lỗi cập nhật tiến trình:", err));
        }
    }, [currentChapterIndex, step, lessonData?.id, chapters?.length]);

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



            <main>
                {step === 'opening_lesson' && (
                    <section className="result-container">
                        <div
                            className="loading-state"
                            style={{
                                minHeight: '360px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                textAlign: 'center'
                            }}
                        >
                            <div className="loader"></div>
                            <div className="media-loading-copy">
                                <span className="media-loading-eyebrow">Đang mở bài học</span>
                                <h2>Đang tải lại series của bạn</h2>
                                <p>Hệ thống đang lấy kịch bản, chapter, media và quiz đã tạo.</p>
                            </div>
                        </div>
                    </section>
                )}

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
                        <div className="input-group title-group-with-suggestions">
                            <div className="label-row">
                                <label htmlFor="title" className="label-with-info">
                                    <span>Tiêu đề bài học</span>
                                    <button
                                        type="button"
                                        className="info-trigger-btn"
                                        onClick={() => setShowGuide(true)}
                                        title="Xem quy trình sáng tạo"
                                        disabled={step === 'drafting'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="info-icon-svg">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </button>
                                </label>

                                <div className="inline-suggestions">
                                    <span className="suggestion-label">💡 Gợi ý nhanh:</span>
                                    <div className="suggestion-pills">
                                        {[
                                            {
                                                name: 'Tương đối 🌌',
                                                title: 'Thuyết tương đối & Giãn nở thời gian',
                                                content: 'Theo thuyết tương đối của Einstein, thời gian trôi chậm hơn đối với vật thể di chuyển ở tốc độ cận ánh sáng. Hãy kể câu chuyện về phi hành gia Nam bay vào vũ trụ và khi trở về Trái Đất, anh vẫn trẻ trong khi người bạn Minh đã già đi.',
                                                vibe: 'scifi'
                                            },
                                            {
                                                name: 'Bảo toàn 🧪',
                                                title: 'Nguyên lý bảo toàn khối lượng',
                                                content: 'Trong hóa học, tổng khối lượng của các chất tham gia phản ứng luôn bằng tổng khối lượng của các sản phẩm tạo thành. Hãy biến định luật này thành một công thức pha chế tiên dược của một giả kim thuật sư cổ xưa.',
                                                vibe: 'medieval'
                                            },
                                            {
                                                name: 'Nam châm 🎨',
                                                title: 'Nguyên lý hoạt động của nam châm',
                                                content: 'Nam châm có hai cực: cực Bắc và cực Nam. Các cực cùng tên thì đẩy nhau, các cực khác tên thì hút nhau. Hãy minh họa định luật này thông qua cuộc chạm trán kịch tính giữa hai chiến binh mang năng lượng đối nghịch.',
                                                vibe: 'manga'
                                            }
                                        ].map((s, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="suggestion-pill"
                                                onClick={() => {
                                                    setTitle(s.title);
                                                    setContent(s.content);
                                                    setVibe(s.vibe);
                                                }}
                                                disabled={step === 'drafting'}
                                            >
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
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

                        <div className="input-group">
                            <label>Phong cách truyền tải (Vibe Style)</label>
                            <div className="vibe-selectors">
                                {[
                                    { id: 'manga', name: 'Manga', icon: '🎨', color: '#14b8a6', desc: 'Nhật Bản cổ điển' },
                                    { id: 'scifi', name: 'Cosmic', icon: '🌌', color: '#3b82f6', desc: 'Vũ trụ huyền ảo' },
                                    { id: 'retro', name: 'Retro', icon: '🕹️', color: '#ec4899', desc: 'Neon 8-bit hoài niệm' },
                                    { id: 'medieval', name: 'Alchemy', icon: '🧪', color: '#10b981', desc: 'Giả kim cổ xưa' }
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        className={`vibe-card ${vibe === v.id ? 'active' : ''} vibe-${v.id}`}
                                        onClick={() => setVibe(v.id)}
                                        disabled={step === 'drafting'}
                                    >
                                        <span className="vibe-icon">{v.icon}</span>
                                        <div className="vibe-info">
                                            <span className="vibe-name" style={{ color: vibe === v.id ? v.color : '' }}>{v.name}</span>
                                            <span className="vibe-desc">{v.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
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

                        {/* Glassmorphic Popover/Modal for Guide Steps */}
                        {showGuide && (
                            <div className="guide-modal-overlay" onClick={() => setShowGuide(false)}>
                                <div className="guide-modal-content" onClick={e => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className="guide-modal-close"
                                        onClick={() => setShowGuide(false)}
                                    >
                                        ✕
                                    </button>
                                    <h2 className="guide-modal-title">Quy trình sáng tạo bài học</h2>
                                    <div className="guide-steps-vertical">
                                        {[
                                            { step: '01', title: 'Ý tưởng', desc: 'Nhập tiêu đề & nội dung kiến thức muốn chuyển thể.' },
                                            { step: '02', title: 'Chọn Vibe', desc: 'Chọn phong cách thể hiện Manga/Cosmic/Retro/Alchemy.' },
                                            { step: '03', title: 'Kịch bản', desc: 'Duyệt phân cảnh do AI phác thảo trước khi vẽ.' },
                                            { step: '04', title: 'Học tập', desc: 'Thưởng thức bài giảng sinh động kèm Quiz tương tác.' }
                                        ].map(s => (
                                            <div key={s.step} className="guide-modal-step">
                                                <span className="guide-step-num">{s.step}</span>
                                                <div className="guide-step-text">
                                                    <h3 className="guide-step-title">{s.title}</h3>
                                                    <p className="guide-step-desc">{s.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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
                                            {lessonData?.chapters?.length > 0 ? "Thử lại các chương lỗi" : "Phê duyệt & Tạo Media"}
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

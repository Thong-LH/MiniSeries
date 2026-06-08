const API_BASE = "/api";

const state = {
    currentLessonId: null,
    currentMediaLesson: null,
    currentChapterIndex: 0,
    quizSelections: {}
};

function getAuthHeaders() {
    const token = (localStorage.getItem("token") || "").trim();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function readJsonResponse(response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message = data.detail || data.message || data.title || "Request failed.";
        const error = new Error(message);
        error.status = response.status;
        error.details = data;
        throw error;
    }

    return data;
}

function requireLogin() {
    if (window.SessionRouter && !window.SessionRouter.guard()) {
        return false;
    }

    if (!(localStorage.getItem("token") || "").trim()) {
        alert("Vui lòng đăng nhập trước khi dùng tính năng generate.");
        window.location.replace("login.html");
        return false;
    }

    return true;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeCorrectOption(value) {
    const raw = String(value || "").trim().toUpperCase();
    if (!raw) return "";
    if (["A", "B", "C", "D"].includes(raw)) return raw;
    if (raw.includes("OPTIONA")) return "A";
    if (raw.includes("OPTIONB")) return "B";
    if (raw.includes("OPTIONC")) return "C";
    if (raw.includes("OPTIOND")) return "D";
    return raw.charAt(0);
}

function renderScript(lesson) {
    const scriptContent = document.getElementById("scriptContent");
    if (!scriptContent) return;

    const script = lesson.overallScript || "Không có kịch bản.";
    scriptContent.innerHTML = `
        <div class="review-script-main">
            <div class="review-label">Kịch bản nháp</div>
            <pre>${escapeHtml(script)}</pre>
        </div>
    `;
}

function chapterMediaHtml(chapter, isVideo) {
    if (isVideo && chapter.videoUrl) {
        return `<video src="${escapeHtml(chapter.videoUrl)}" class="chapter-media" controls autoplay loop muted playsinline></video>`;
    }

    if (!isVideo && chapter.mangaUrl) {
        return `<img src="${escapeHtml(chapter.mangaUrl)}" class="chapter-media" alt="Chapter ${escapeHtml(chapter.order)}">`;
    }

    const mediaType = isVideo ? "video" : "ảnh manga";
    return `
        <div class="chapter-media chapter-media-empty">
            Chưa có ${mediaType} cho chapter ${escapeHtml(chapter.order || "")}.
        </div>
    `;
}

function renderQuiz(chapter, chapterIndex) {
    const quiz = chapter.quiz;
    if (!quiz) {
        return `<div class="quiz-panel empty">Chapter này chưa có quiz.</div>`;
    }

    const options = [
        ["A", quiz.optionA],
        ["B", quiz.optionB],
        ["C", quiz.optionC],
        ["D", quiz.optionD]
    ];
    const selected = state.quizSelections[chapterIndex] || "";
    const correct = normalizeCorrectOption(quiz.correctOption);
    const hasAnswer = Boolean(selected);

    const optionHtml = options.map(([key, label]) => {
        const isSelected = selected === key;
        const isCorrect = hasAnswer && correct === key;
        const isWrong = hasAnswer && isSelected && selected !== correct;
        const classes = [
            "quiz-option",
            isSelected ? "selected" : "",
            isCorrect ? "correct" : "",
            isWrong ? "wrong" : ""
        ].filter(Boolean).join(" ");

        return `
            <button type="button" class="${classes}" data-quiz-option="${key}">
                <span class="quiz-option-key">${key}</span>
                <span>${escapeHtml(label || "")}</span>
            </button>
        `;
    }).join("");

    const feedback = hasAnswer
        ? `<div class="quiz-feedback ${selected === correct ? "correct" : "wrong"}">
                <strong>${selected === correct ? "Đúng rồi." : `Chưa đúng. Đáp án đúng là ${escapeHtml(correct)}.`}</strong>
                <p>${escapeHtml(quiz.explanation || "")}</p>
           </div>`
        : "";

    return `
        <div class="quiz-panel">
            <div class="quiz-title">Quiz tương tác</div>
            <p class="quiz-question">${escapeHtml(quiz.question || "")}</p>
            <div class="quiz-options" data-chapter-index="${chapterIndex}">
                ${optionHtml}
            </div>
            ${feedback}
        </div>
    `;
}

function renderCurrentChapter() {
    const lesson = state.currentMediaLesson;
    const chapters = [...(lesson?.chapters || [])].sort((a, b) => a.order - b.order);
    const chapterStage = document.getElementById("chapterStage");
    const chapterCounter = document.getElementById("chapterCounter");
    const prevBtn = document.getElementById("prevChapterBtn");
    const nextBtn = document.getElementById("nextChapterBtn");

    if (!chapterStage) return;

    if (!lesson || chapters.length === 0) {
        if (chapterCounter) chapterCounter.innerText = "0 / 0";
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        chapterStage.innerHTML = `
            <div class="empty-output-panel">
                <h3>Chưa có chapter để hiển thị</h3>
                <p>Backend chưa trả về danh sách chapter cho lesson này. Nếu Cloudinary đã có file, cần kiểm tra bước lưu database hoặc response của API approve.</p>
            </div>
        `;
        return;
    }

    const maxIndex = chapters.length - 1;
    state.currentChapterIndex = Math.min(Math.max(0, state.currentChapterIndex), maxIndex);
    const chapter = chapters[state.currentChapterIndex];
    const isVideo = lesson.outputMode === "Video" || lesson.outputMode === 1;

    if (chapterCounter) {
        chapterCounter.innerText = `${state.currentChapterIndex + 1} / ${chapters.length}`;
    }
    if (prevBtn) prevBtn.disabled = state.currentChapterIndex === 0;
    if (nextBtn) nextBtn.disabled = state.currentChapterIndex === maxIndex;

    chapterStage.innerHTML = `
        <article class="chapter-reader-card">
            <div class="chapter-media-panel">
                ${chapterMediaHtml(chapter, isVideo)}
            </div>
            <div class="chapter-detail-panel">
                <div class="chapter-kicker">Chapter ${escapeHtml(chapter.order || state.currentChapterIndex + 1)}</div>
                <h3>${escapeHtml(chapter.title || `Chương ${chapter.order || state.currentChapterIndex + 1}`)}</h3>
                <p class="chapter-summary">${escapeHtml(chapter.summary || "")}</p>
                ${renderQuiz(chapter, state.currentChapterIndex)}
            </div>
        </article>
    `;
}

function renderMedia(lesson) {
    const mediaSection = document.getElementById("mediaSection");
    if (!mediaSection) return;

    state.currentMediaLesson = lesson;
    state.currentChapterIndex = 0;
    state.quizSelections = {};

    mediaSection.classList.remove("hidden");
    renderCurrentChapter();
}

async function refreshHeaderProfile() {
    if (typeof fetchAndRenderHeaderProfile === "function") {
        await fetchAndRenderHeaderProfile();
    }
}

document.getElementById("generateBtn")?.addEventListener("click", async () => {
    if (!requireLogin()) return;

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const generateVideo = document.getElementById("generateVideo").checked;

    if (!title || !content) {
        alert("Vui lòng nhập đầy đủ tiêu đề và nội dung bài học.");
        return;
    }

    const resultContainer = document.getElementById("resultContainer");
    const loadingState = document.getElementById("loadingState");
    const lessonOutput = document.getElementById("lessonOutput");
    const mediaSection = document.getElementById("mediaSection");
    const statusText = document.getElementById("statusText");

    resultContainer?.classList.remove("hidden");
    loadingState?.classList.remove("hidden");
    lessonOutput?.classList.add("hidden");
    document.getElementById("reviewSection")?.classList.remove("hidden");
    mediaSection?.classList.add("hidden");
    if (statusText) statusText.innerText = "Đang tạo draft script...";

    try {
        const response = await fetch(`${API_BASE}/lessons/drafts`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                rawContent: content,
                title,
                generateVideo,
                creativeMode: 0,
                creativeBrief: null
            })
        });

        const lesson = await readJsonResponse(response);
        state.currentLessonId = lesson.id;

        renderScript(lesson);
        if (statusText) statusText.innerText = "Draft script đã sẵn sàng để review.";
        loadingState?.classList.add("hidden");
        lessonOutput?.classList.remove("hidden");
    } catch (error) {
        console.error(error);
        if (statusText) statusText.innerText = `Lỗi: ${error.message}`;
        alert(error.message);
    }
});

document.getElementById("approveBtn")?.addEventListener("click", async (event) => {
    if (!requireLogin()) return;
    if (!state.currentLessonId) {
        alert("Chưa có lesson draft để approve.");
        return;
    }

    const btn = event.target;
    btn.disabled = true;

    const loadingState = document.getElementById("loadingState");
    const statusText = document.getElementById("statusText");
    const lessonOutput = document.getElementById("lessonOutput");

    lessonOutput?.classList.remove("hidden");
    loadingState?.classList.remove("hidden");
    if (statusText) statusText.innerText = "Đang approve và tạo media... Bước này có thể mất vài phút.";

    const startedAt = Date.now();
    const approveTimer = window.setInterval(() => {
        if (!statusText) return;
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        statusText.innerText = `Đang tạo media... đã chờ ${seconds}s. Vui lòng giữ trang này mở.`;
    }, 15000);

    try {
        const response = await fetch(`${API_BASE}/lessons/${state.currentLessonId}/approve`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        const payload = await readJsonResponse(response);
        const lesson = payload.lesson || payload;
        if (!lesson || !lesson.id) {
            throw new Error("API approve không trả về lesson hợp lệ.");
        }

        renderMedia(lesson);
        await refreshHeaderProfile();
        if (statusText) statusText.innerText = "Hoàn tất generate.";
        loadingState?.classList.add("hidden");
        document.getElementById("reviewSection")?.classList.add("hidden");
    } catch (error) {
        console.error(error);
        if (statusText) statusText.innerText = `Lỗi: ${error.message}`;

        if (error.status === 402 && error.details?.quota) {
            const quota = error.details.quota;
            alert(`${error.message}\nGói hiện tại: ${quota.planName}. Manga còn ${quota.remainingMangaCount ?? 0}, video còn ${quota.remainingVideoCount ?? 0}.`);
        } else {
            alert(error.message);
        }
        loadingState?.classList.add("hidden");
    } finally {
        window.clearInterval(approveTimer);
        btn.disabled = false;
    }
});

document.getElementById("prevChapterBtn")?.addEventListener("click", () => {
    state.currentChapterIndex -= 1;
    renderCurrentChapter();
});

document.getElementById("nextChapterBtn")?.addEventListener("click", () => {
    state.currentChapterIndex += 1;
    renderCurrentChapter();
});

document.getElementById("chapterStage")?.addEventListener("click", (event) => {
    const optionButton = event.target.closest("[data-quiz-option]");
    if (!optionButton) return;

    state.quizSelections[state.currentChapterIndex] = optionButton.dataset.quizOption;
    renderCurrentChapter();
});

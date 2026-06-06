const API_BASE = "/api";

const state = {
    currentLessonId: null
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
        const message = data.message || data.title || "Request failed.";
        const error = new Error(message);
        error.status = response.status;
        error.details = data;
        throw error;
    }

    return data;
}

function requireLogin() {
    if (!(localStorage.getItem("token") || "").trim()) {
        alert("Vui long dang nhap truoc khi dung tinh nang generate.");
        window.location.href = "index.html";
        return false;
    }

    return true;
}

function renderScript(lesson) {
    const scriptContent = document.getElementById("scriptContent");
    if (!scriptContent) return;

    scriptContent.innerText = lesson.overallScript || "Khong co kich ban.";
}

function renderMedia(lesson) {
    const mediaSection = document.getElementById("mediaSection");
    const chaptersList = document.getElementById("chaptersList");
    const anchorImage = document.getElementById("anchorImage");

    if (!mediaSection || !chaptersList || !anchorImage) return;

    anchorImage.src = lesson.anchorImageUrl || "";
    chaptersList.innerHTML = "";

    const chapters = [...(lesson.chapters || [])].sort((a, b) => a.order - b.order);
    for (const chapter of chapters) {
        const card = document.createElement("div");
        card.className = "chapter-card glass";

        const isVideo = lesson.outputMode === "Video" || lesson.outputMode === 1;
        const mediaHtml = isVideo && chapter.videoUrl
            ? `<video src="${chapter.videoUrl}" class="chapter-media" autoplay loop muted playsinline></video>`
            : `<img src="${chapter.mangaUrl || ""}" class="chapter-media" alt="Chapter ${chapter.order}">`;

        const quiz = chapter.quiz
            ? `<div class="prompt-preview">
                    <strong>Quiz:</strong>
                    <p>${chapter.quiz.question || ""}</p>
                    <p>A. ${chapter.quiz.optionA || ""}</p>
                    <p>B. ${chapter.quiz.optionB || ""}</p>
                    <p>C. ${chapter.quiz.optionC || ""}</p>
                    <p>D. ${chapter.quiz.optionD || ""}</p>
               </div>`
            : "";

        card.innerHTML = `
            ${mediaHtml}
            <div class="chapter-info">
                <h3>Chapter ${chapter.order}</h3>
                <p class="chapter-summary">${chapter.summary || ""}</p>
                ${quiz}
            </div>
        `;
        chaptersList.appendChild(card);
    }

    mediaSection.classList.remove("hidden");
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
        alert("Vui long nhap day du tieu de va noi dung bai hoc.");
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
    mediaSection?.classList.add("hidden");
    if (statusText) statusText.innerText = "Dang tao draft script...";

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
        if (statusText) statusText.innerText = "Draft script da san sang de review.";
        loadingState?.classList.add("hidden");
        lessonOutput?.classList.remove("hidden");
    } catch (error) {
        console.error(error);
        if (statusText) statusText.innerText = `Loi: ${error.message}`;
        alert(error.message);
    }
});

document.getElementById("approveBtn")?.addEventListener("click", async () => {
    if (!requireLogin()) return;
    if (!state.currentLessonId) {
        alert("Chua co lesson draft de approve.");
        return;
    }

    const loadingState = document.getElementById("loadingState");
    const statusText = document.getElementById("statusText");

    loadingState?.classList.remove("hidden");
    if (statusText) statusText.innerText = "Dang approve va tao media...";

    try {
        const response = await fetch(`${API_BASE}/lessons/${state.currentLessonId}/approve`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        const payload = await readJsonResponse(response);
        const lesson = payload.lesson || payload;
        renderMedia(lesson);
        await refreshHeaderProfile();
        if (statusText) statusText.innerText = "Hoan tat generate.";
        loadingState?.classList.add("hidden");
    } catch (error) {
        console.error(error);
        if (statusText) statusText.innerText = `Loi: ${error.message}`;
        if (error.status === 402 && error.details?.quota) {
            const quota = error.details.quota;
            alert(`${error.message}\nGoi hien tai: ${quota.planName}. Da dung ${quota.usedGenerationCount}/${quota.monthlyGenerationLimit} luot.`);
        } else {
            alert(error.message);
        }
        loadingState?.classList.add("hidden");
    }
});

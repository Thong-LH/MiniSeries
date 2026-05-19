document.getElementById('generateBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const generateVideo = document.getElementById('generateVideo').checked;

    if (!title || !content) {
        alert('Vui l?ng nh?p ??y ?? ti?u ?? v? n?i dung b?i h?c!');
        return;
    }

    const resultContainer = document.getElementById('resultContainer');
    const loadingState = document.querySelector('.loading-state');
    const lessonOutput = document.getElementById('lessonOutput');
    const statusText = document.getElementById('statusText');
    const chaptersList = document.getElementById('chaptersList');

    resultContainer.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    lessonOutput.classList.add('hidden');
    chaptersList.innerHTML = '';
    statusText.innerText = '?ang ph?n t?ch b?i h?c v? t?o nh?n v?t...';

    try {
        const response = await fetch('/api/lessons/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rawContent: content,
                title,
                generateVideo
            })
        });

        if (!response.ok) throw new Error('C? l?i x?y ra khi g?i API.');

        const lesson = await response.json();

        statusText.innerText = 'Ho?n t?t!';
        document.getElementById('anchorImage').src = lesson.anchorImageUrl;

        if (generateVideo) {
            lesson.chapters.sort((a, b) => a.order - b.order).forEach(chapter => {
                const card = document.createElement('div');
                card.className = 'chapter-card glass';
                card.innerHTML = `
                    <video src="${chapter.videoUrl}" class="chapter-media" autoplay loop muted playsinline></video>
                    <div class="chapter-info">
                        <h3>Ch??ng ${chapter.order}</h3>
                        <p class="chapter-dialogue">"${chapter.dialogue}"</p>
                        <p class="chapter-action">${chapter.actionDescription}</p>
                    </div>
                `;
                chaptersList.appendChild(card);
            });
        } else {
            lesson.chapters.sort((a, b) => a.order - b.order).forEach(chapter => {
                const pageContainer = document.createElement('div');
                pageContainer.className = 'manga-page glass';

                pageContainer.innerHTML = `
                    <img src="${chapter.mangaUrl}" class="page-media" alt="Manga Chapter ${chapter.order}">
                    <div class="page-dialogues">
                        <h3>Ch??ng ${chapter.order}</h3>
                        <p class="chapter-summary">${chapter.dialogue}</p>
                        <div class="prompt-preview">
                            <strong>Prompt s? d?ng:</strong>
                            <code>${chapter.actionDescription}</code>
                        </div>
                    </div>
                `;
                chaptersList.appendChild(pageContainer);
            });
        }

        loadingState.classList.add('hidden');
        lessonOutput.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        statusText.innerText = 'L?i: ' + error.message;
        alert('C? l?i x?y ra: ' + error.message);
    }
});

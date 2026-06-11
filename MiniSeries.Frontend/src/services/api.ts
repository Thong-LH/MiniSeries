const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5088/api";
export const PROFILE_CACHE_KEY = "profile_snapshot";
export const PROFILE_UPDATED_EVENT = "profile-snapshot-updated";

function buildAvatarUrl(fullName: string) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || "User")}`;
}

function getAuthHeaders() {
    const token = (localStorage.getItem("token") || "").trim();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function readJsonResponse(response: Response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message = data.detail || data.message || data.title || "Request failed.";
        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).details = data;
        throw error;
    }

    return data;
}

async function fetchCurrentProfile() {
    const response = await fetch(`${API_BASE}/profile/me`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return await readJsonResponse(response);
}

export function writeProfileSnapshot(data: any) {
    const fullName = data.fullName || localStorage.getItem("user_name") || "User";
    const snapshot = {
        userId: String(data.id || data.userId || localStorage.getItem("userId") || ""),
        fullName,
        email: data.email || localStorage.getItem("user_email") || "",
        mangaTokens: data.remainingMangaCount ?? null,
        mangaLimit: data.mangaMonthlyLimit ?? null,
        videoTokens: data.remainingVideoCount ?? null,
        videoLimit: data.videoMonthlyLimit ?? null,
        tier: data.planName || data.tier || "Free",
        avatarUrl: data.avatarUrl || buildAvatarUrl(fullName)
    };

    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    return snapshot;
}

export async function refreshProfileSnapshot() {
    const data = await fetchCurrentProfile();
    return writeProfileSnapshot(data);
}

export interface DraftRequest {
    rawContent: string;
    title: string;
    generateVideo: boolean;
    creativeMode: number;
    creativeBrief: string | null;
}

export const api = {
    async login(email: string, password: string) {
        const response = await fetch(`${API_BASE}/auth/login-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        const data = await readJsonResponse(response);
        const previousUserId = localStorage.getItem("userId");
        if (data.accessToken) {
            localStorage.setItem("token", data.accessToken);
        }
        if (data.userId) localStorage.setItem("userId", data.userId);
        if (previousUserId && data.userId && previousUserId !== data.userId) {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
        if (data.role) {
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("user_role", data.role);
        }
        if (data.fullName) localStorage.setItem("user_name", data.fullName);
        if (data.email) localStorage.setItem("user_email", data.email);
        return data;
    },

    async register(email: string, password: string, fullName: string, supabaseUserId: string) {
        const response = await fetch(`${API_BASE}/auth/register-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                fullName,
                supabaseUserId,
                role: "Customer"
            })
        });
        return await readJsonResponse(response);
    },

    async verifyOtp(email: string, otpCode: string, fullName: string, supabaseUserId: string) {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otpCode,
                fullName,
                supabaseUserId
            })
        });
        return await readJsonResponse(response);
    },

    async generateDraft(request: DraftRequest) {
        const response = await fetch(`${API_BASE}/lessons/drafts`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request)
        });
        return await readJsonResponse(response);
    },

    async approveDraft(lessonId: string, overallScript: string) {
        const response = await fetch(`${API_BASE}/lessons/${lessonId}/approve`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ overallScript })
        });
        const data = await readJsonResponse(response);
        await refreshProfileSnapshot();
        return data;
    },

    async getLesson(lessonId: string) {
        const response = await fetch(`${API_BASE}/lessons/${lessonId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async getCurrentProfile() {
        return await fetchCurrentProfile();
    },

    async refreshProfileCache() {
        return await refreshProfileSnapshot();
    },

    async getProfile(userId: string) {
        const response = await fetch(`${API_BASE}/profile/${userId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    }
};

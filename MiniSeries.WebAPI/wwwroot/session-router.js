const SessionRouter = (() => {
    const routeRules = {
        "login.html": { guestOnly: true },
        "home.html": { auth: true, roles: ["Customer"] },
        "pricing.html": { auth: true, roles: ["Customer"] },
        "checkout.html": { auth: true, roles: ["Customer"] },
        "profile.html": { auth: true, roles: ["Customer"] },
        "tu-van.html": { auth: true, roles: ["Customer"] },
        "dashboard.html": { auth: true, roles: ["Admin", "Staff"] }
    };

    function currentPage() {
        const page = window.location.pathname.split("/").pop();
        return page || "index.html";
    }

    function getSession() {
        const token = (localStorage.getItem("token") || "").trim();
        const userId = (localStorage.getItem("userId") || "").trim();
        const email = (localStorage.getItem("user_email") || localStorage.getItem("userEmail") || "").trim();
        let role = (localStorage.getItem("userRole") || localStorage.getItem("user_role") || "").trim();
        const isAuthenticated = Boolean(token && (userId || email));
        if (isAuthenticated && !role) {
            role = "Customer";
        }

        return {
            token,
            userId,
            email,
            role,
            isAuthenticated
        };
    }

    function pageForRole(role) {
        return role === "Admin" || role === "Staff" ? "dashboard.html" : "home.html";
    }

    function replaceTo(targetPage) {
        if (currentPage() === targetPage) return;
        document.documentElement.dataset.sessionRedirecting = "true";
        if (document.body) {
            document.body.style.visibility = "hidden";
        }
        window.location.replace(targetPage);
    }

    function clearSession() {
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("token");
        sessionStorage.clear();
    }

    function guard() {
        const page = currentPage();
        const rule = routeRules[page];
        if (!rule) return true;

        const session = getSession();

        if (rule.guestOnly && session.isAuthenticated) {
            replaceTo(pageForRole(session.role));
            return false;
        }

        if (rule.auth && !session.isAuthenticated) {
            replaceTo("login.html");
            return false;
        }

        if (rule.auth && rule.roles?.length && !rule.roles.includes(session.role)) {
            replaceTo(pageForRole(session.role));
            return false;
        }

        return true;
    }

    function redirectAfterLogin(role) {
        replaceTo(pageForRole(role || getSession().role));
    }

    function logout() {
        clearSession();
        window.location.replace("index.html");
    }

    function bindBackForwardGuard() {
        window.addEventListener("pageshow", () => {
            guard();
        });

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                guard();
            }
        });
    }

    guard();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", guard);
    } else {
        guard();
    }

    bindBackForwardGuard();

    return {
        clearSession,
        getSession,
        guard,
        logout,
        redirectAfterLogin
    };
})();

window.SessionRouter = SessionRouter;

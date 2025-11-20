// Mock Auth Service using LocalStorage
// This allows the app to work fully locally without Supabase keys

const STORAGE_KEY = "beacon_mock_users";
const SESSION_KEY = "beacon_mock_session";

export const mockAuth = {
    signUp: async ({ email, password, options }: any) => {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

        if (users.find((u: any) => u.email === email)) {
            return { error: { message: "User already exists" }, data: { user: null, session: null } };
        }

        const newUser = {
            id: Math.random().toString(36).substring(2) + Date.now().toString(36),
            email,
            password, // In a real app, never store plain passwords!
            user_metadata: options?.data || {},
            created_at: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

        // Auto login after signup
        const session = {
            access_token: "mock-jwt-token",
            user: newUser,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return { error: null, data: { user: newUser, session } };
    },

    signInWithPassword: async ({ email, password }: any) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (!user) {
            return { error: { message: "Invalid login credentials" }, data: { user: null, session: null } };
        }

        const session = {
            access_token: "mock-jwt-token",
            user: user,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return { error: null, data: { user, session } };
    },

    signOut: async () => {
        localStorage.removeItem(SESSION_KEY);
        return { error: null };
    },

    getSession: async () => {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return { data: { session }, error: null };
    },

    getUser: async () => {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return { data: { user: session?.user || null }, error: null };
    },

    get currentUser() {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return session?.user || null;
    },

    onAuthStateChange: (callback: any) => {
        return {
            data: {
                subscription: {
                    unsubscribe: () => { }
                }
            }
        };
    }
};

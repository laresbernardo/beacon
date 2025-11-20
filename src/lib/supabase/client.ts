import { createClient } from "@supabase/supabase-js";
import { mockAuth } from "@/lib/mock-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have valid Supabase keys
const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://example.supabase.co" &&
    !supabaseUrl.includes("your-project");

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: mockAuth,
        from: (table: string) => {
            const chainable = {
                select: (columns: string = '*') => chainable,
                insert: (data: any) => {
                    const tableData = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
                    const dataArray = Array.isArray(data) ? data : [data];

                    // Add IDs if not present
                    const newData = dataArray.map(item => ({
                        ...item,
                        id: item.id || Math.random().toString(36).substring(2) + Date.now().toString(36),
                        created_at: item.created_at || new Date().toISOString()
                    }));

                    tableData.push(...newData);
                    localStorage.setItem(`mock_${table}`, JSON.stringify(tableData));
                    return Promise.resolve({ data: newData, error: null });
                },
                update: (updates: any) => {
                    (chainable as any)._updates = updates;
                    return chainable;
                },
                delete: () => {
                    (chainable as any)._delete = true;
                    return chainable;
                },
                eq: (column: string, value: any) => {
                    (chainable as any)._filters = (chainable as any)._filters || {};
                    (chainable as any)._filters[column] = value;
                    return chainable;
                },
                in: (column: string, values: any[]) => {
                    (chainable as any)._inFilters = (chainable as any)._inFilters || {};
                    (chainable as any)._inFilters[column] = values;
                    return chainable;
                },
                order: (column: string, options?: any) => {
                    (chainable as any)._order = { column, ...options };
                    return chainable;
                },
                limit: (count: number) => {
                    (chainable as any)._limit = count;
                    return chainable;
                },
                single: async () => {
                    const filters = (chainable as any)._filters || {};

                    // Handle profiles table
                    if (table === 'profiles') {
                        const currentUser = mockAuth.currentUser;
                        const profiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');

                        // If filtering by ID
                        if (filters.id) {
                            // First try to find in mock_profiles
                            let profile = profiles.find((p: any) => p.id === filters.id);

                            // If not found, but matches current user, create/return current user profile
                            if (!profile && currentUser && filters.id === currentUser.id) {
                                profile = {
                                    id: currentUser.id,
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email,
                                    is_verified: true,
                                    karma_points: 0,
                                    role: currentUser.email === "laresbernardo@gmail.com" ? "admin" : "user",
                                    created_at: currentUser.email === "laresbernardo@gmail.com" ? "2025-11-19T12:00:00Z" : new Date().toISOString()
                                };
                                profiles.push(profile);
                                localStorage.setItem('mock_profiles', JSON.stringify(profiles));
                            }

                            return { data: profile || null, error: profile ? null : { message: "User not found", code: "404" } };
                        }

                        // If filtering by email
                        if (filters.email) {
                            let profile = profiles.find((p: any) => p.email === filters.email);
                            return { data: profile || null, error: profile ? null : { message: "User not found", code: "404" } };
                        }
                    }

                    // Handle items table
                    if (table === 'items') {
                        const tableData = JSON.parse(localStorage.getItem('mock_items') || '[]');

                        // Apply filters
                        let filtered = tableData;
                        Object.keys(filters).forEach(key => {
                            filtered = filtered.filter((item: any) => item[key] === filters[key]);
                        });

                        if (filtered.length > 0) {
                            // If querying with join (profiles:user_id), add mock profile data
                            const item = filtered[0];

                            // Try to find the profile for this item
                            const profiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
                            let profile = profiles.find((p: any) => p.id === item.user_id);

                            // Fallback to current user if no profile found but IDs match (e.g. local dev without full mock profiles)
                            const currentUser = mockAuth.currentUser;
                            if (!profile && currentUser && item.user_id === currentUser.id) {
                                profile = {
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email,
                                    karma_points: 0,
                                    is_verified: true
                                };
                            }

                            return {
                                data: {
                                    ...item,
                                    profiles: profile || {
                                        full_name: "Unknown User",
                                        email: "unknown@example.com",
                                        karma_points: 0,
                                        is_verified: false
                                    }
                                },
                                error: null
                            };
                        }
                    }

                    // Handle messages table
                    if (table === 'messages') {
                        const tableData = JSON.parse(localStorage.getItem('mock_messages') || '[]');
                        // Apply filters
                        let filtered = tableData;
                        Object.keys(filters).forEach(key => {
                            filtered = filtered.filter((item: any) => item[key] === filters[key]);
                        });
                        return { data: filtered.length > 0 ? filtered[0] : null, error: null };
                    }

                    // Handle notifications table
                    if (table === 'notifications') {
                        const tableData = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
                        // Apply filters
                        let filtered = tableData;
                        Object.keys(filters).forEach(key => {
                            filtered = filtered.filter((item: any) => item[key] === filters[key]);
                        });
                        return { data: filtered.length > 0 ? filtered[0] : null, error: null };
                    }

                    return { data: null, error: null };
                },
                or: () => chainable,
                then: async (resolve: any) => {
                    const isDelete = (chainable as any)._delete;
                    const updates = (chainable as any)._updates;
                    const filters = (chainable as any)._filters || {};
                    const inFilters = (chainable as any)._inFilters || {};
                    const order = (chainable as any)._order;

                    if (updates) {
                        // Handle update operations
                        let tableData = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');

                        // Update items that match filters
                        tableData = tableData.map((item: any) => {
                            let match = true;

                            // Check eq filters
                            Object.keys(filters).forEach(key => {
                                if (item[key] !== filters[key]) match = false;
                            });

                            // Check in filters
                            Object.keys(inFilters).forEach(key => {
                                if (!inFilters[key].includes(item[key])) match = false;
                            });

                            if (match) {
                                return { ...item, ...updates };
                            }
                            return item;
                        });

                        localStorage.setItem(`mock_${table}`, JSON.stringify(tableData));
                        return resolve({ data: null, error: null });
                    }

                    if (isDelete) {
                        // Handle delete operations
                        let tableData = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');

                        // Apply filters
                        Object.keys(filters).forEach(key => {
                            tableData = tableData.filter((item: any) => item[key] !== filters[key]);
                        });

                        localStorage.setItem(`mock_${table}`, JSON.stringify(tableData));
                        return resolve({ data: null, error: null });
                    }

                    // Handle select operations
                    let tableData = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');

                    // Apply eq filters
                    Object.keys(filters).forEach(key => {
                        tableData = tableData.filter((item: any) => item[key] === filters[key]);
                    });

                    // Apply in filters
                    Object.keys(inFilters).forEach(key => {
                        tableData = tableData.filter((item: any) => inFilters[key].includes(item[key]));
                    });

                    // Apply ordering
                    if (order) {
                        tableData.sort((a: any, b: any) => {
                            const aVal = a[order.column];
                            const bVal = b[order.column];
                            if (order.ascending === false) {
                                return bVal > aVal ? 1 : -1;
                            }
                            return aVal > bVal ? 1 : -1;
                        });
                    }

                    // Handle joins for items table
                    if (table === 'items') {
                        const profiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
                        const currentUser = mockAuth.currentUser;

                        tableData = tableData.map((item: any) => {
                            // Join profile (user_id)
                            let profile = profiles.find((p: any) => p.id === item.user_id);
                            if (!profile && currentUser && item.user_id === currentUser.id) {
                                profile = {
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email
                                };
                            }

                            return {
                                ...item,
                                profiles: profile || { full_name: "Unknown", email: "unknown@example.com" }
                            };
                        });
                    }

                    // Handle joins for messages table
                    if (table === 'messages') {
                        const profiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
                        const items = JSON.parse(localStorage.getItem('mock_items') || '[]');
                        const currentUser = mockAuth.currentUser;

                        tableData = tableData.map((msg: any) => {
                            // Join sender
                            let sender = profiles.find((p: any) => p.id === msg.sender_id);
                            if (!sender && currentUser && msg.sender_id === currentUser.id) {
                                sender = {
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email
                                };
                            }

                            // Join recipient
                            let recipient = profiles.find((p: any) => p.id === msg.recipient_id);
                            if (!recipient && currentUser && msg.recipient_id === currentUser.id) {
                                recipient = {
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email
                                };
                            }

                            // Join item
                            const item = items.find((i: any) => i.id === msg.item_id);

                            return {
                                ...msg,
                                sender: sender || { full_name: "User", email: "user@example.com" },
                                recipient: recipient || { full_name: "User", email: "user@example.com" },
                                item: item || { title: "Item" }
                            };
                        });
                    }



                    // Handle joins for notifications table
                    if (table === 'notifications') {
                        const profiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
                        const items = JSON.parse(localStorage.getItem('mock_items') || '[]');
                        const currentUser = mockAuth.currentUser;

                        tableData = tableData.map((n: any) => {
                            // Join sender (from_user_id)
                            let sender = profiles.find((p: any) => p.id === n.from_user_id);
                            if (!sender && currentUser && n.from_user_id === currentUser.id) {
                                sender = {
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
                                    email: currentUser.email
                                };
                            }

                            // Join item
                            const item = items.find((i: any) => i.id === n.item_id);

                            return {
                                ...n,
                                sender: sender || { full_name: "User", email: "user@example.com" },
                                item: item || { title: "Item" }
                            };
                        });
                    }

                    return resolve({ data: tableData, error: null });
                }
            };
            return chainable;
        },
        channel: () => ({
            on: () => ({
                subscribe: () => ({})
            })
        }),
        removeChannel: () => { },
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ data: { path: "mock-path" }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: "https://placehold.co/600x400" } })
            })
        }
    } as any;

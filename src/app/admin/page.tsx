"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [itemSearch, setItemSearch] = useState("");
    const [userSort, setUserSort] = useState("newest");
    const [itemSort, setItemSort] = useState("newest");
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== "laresbernardo@gmail.com") {
            alert("Access denied. Admin only.");
            router.push("/");
            return;
        }

        setIsAdmin(true);
        fetchData();
    };

    const fetchData = async () => {
        setLoading(true);

        // Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) console.error("Error fetching profiles:", profilesError);
        else setUsers(profiles || []);

        // Fetch all items
        const { data: allItems, error: itemsError } = await supabase
            .from('items')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false });

        if (itemsError) console.error("Error fetching items:", itemsError);
        else setItems(allItems || []);

        setLoading(false);
    };

    const [sampleDataVisible, setSampleDataVisible] = useState(false);

    useEffect(() => {
        checkSampleData();
    }, [items]);

    const checkSampleData = () => {
        const hasSampleData = items.some((item: any) => item.is_sample === true);
        setSampleDataVisible(hasSampleData);
    };

    const handleToggleSampleData = async () => {
        setLoading(true);
        try {
            if (sampleDataVisible) {
                // Remove sample data
                await supabase.from('items').delete().eq('is_sample', true);
                // Also remove sample users if needed, but for now we keep them or manually delete
                // Let's remove Maru if she exists as sample
                await supabase.from('profiles').delete().eq('email', 'maru.carbonell@gmail.com');

                alert("Sample data removed successfully!");
            } else {
                // Add sample data
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user found");

                // 1. Create Maru Carbonell Profile
                const maruId = "sample-maru-id";
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: maruId,
                    email: "maru.carbonell@gmail.com",
                    full_name: "Maru Carbonell",
                    is_verified: true,
                    karma_points: 150,
                    created_at: new Date().toISOString()
                });

                // 2. Create Items
                const sampleItems = [
                    // User's items
                    {
                        user_id: user.id,
                        title: "Llaves perdidas",
                        description: "Llavero con llaves de casa y coche, llavero rojo con logo de Real Madrid",
                        status: "lost",
                        latitude: 40.4168,
                        longitude: -3.7038,
                        location_name: "Parque del Retiro, Madrid",
                        reward_amount: 20,
                        is_free: false,
                        is_sample: true
                    },
                    {
                        user_id: user.id,
                        title: "iPhone 15 Pro encontrado",
                        description: "iPhone 15 Pro negro, 256GB, encontrado en un banco. Pantalla con funda azul.",
                        status: "found",
                        latitude: 40.4200,
                        longitude: -3.6900,
                        location_name: "Gran Vía, Madrid",
                        reward_amount: 0,
                        is_free: true,
                        return_method: "pickup",
                        pickup_address: "Starbucks Gran Vía, 30",
                        is_sample: true
                    },
                    {
                        user_id: user.id,
                        title: "Gorra azul perdida",
                        description: "Gorra de béisbol azul marino, marca Nike, con bordado de la bandera española",
                        status: "lost",
                        latitude: 40.4150,
                        longitude: -3.7050,
                        location_name: "Plaza de Sol, Madrid",
                        reward_amount: 10,
                        is_free: false,
                        is_sample: true
                    },
                    {
                        user_id: user.id,
                        title: "Cartera encontrada",
                        description: "Cartera de cuero marrón con DNI y tarjetas bancarias. Sin dinero en efectivo.",
                        status: "found",
                        latitude: 40.4100,
                        longitude: -3.7100,
                        location_name: "La Latina, Madrid",
                        reward_amount: 0,
                        is_free: true,
                        return_method: "chat",
                        is_sample: true
                    },
                    // Maru's items
                    {
                        user_id: maruId,
                        title: "Libros de texto antiguos",
                        description: "Colección de libros de historia del arte, edición 1990. En buen estado.",
                        status: "found",
                        latitude: 40.4250,
                        longitude: -3.6850,
                        location_name: "Barrio de Salamanca, Madrid",
                        reward_amount: 0,
                        is_free: true,
                        return_method: "chat",
                        is_sample: true
                    },
                    {
                        user_id: maruId,
                        title: "Mueble de entrada",
                        description: "Mueble recibidor de madera oscura. Tiene algunos arañazos pero es funcional.",
                        status: "found",
                        latitude: 40.4300,
                        longitude: -3.7000,
                        location_name: "Chamberí, Madrid",
                        reward_amount: 0,
                        is_free: true,
                        return_method: "pickup",
                        pickup_address: "Calle de Santa Engracia, 15",
                        is_sample: true
                    }
                ];

                const { error } = await supabase.from('items').insert(sampleItems);
                if (error) throw error;

                alert("Sample data added successfully!");
            }

            fetchData();
        } catch (error) {
            console.error("Error toggling sample data:", error);
            alert("Failed to toggle sample data.");
        } finally {
            setLoading(false);
        }
    };

    // Filtering and Sorting Logic
    const filteredUsers = users
        .filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
        .sort((a, b) => {
            if (userSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (userSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (userSort === "karma") return b.karma_points - a.karma_points;
            return 0;
        });

    const filteredItems = items
        .filter(i => i.title?.toLowerCase().includes(itemSearch.toLowerCase()) || i.description?.toLowerCase().includes(itemSearch.toLowerCase()))
        .sort((a, b) => {
            if (itemSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (itemSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (itemSort === "reward") return b.reward_amount - a.reward_amount;
            return 0;
        });
    const handleTestNotification = () => {
        // Trigger a test notification
        // We can't easily access the notification context here without wrapping or exporting it
        // But we can insert into a notifications table if we had one, or just use alert for now to say "Go to item X"
        // Actually, the NotificationProvider listens to 'notifications' channel. 
        // We can simulate a realtime event if we could, but for now let's just alert.
        alert("To test notifications, open a new window/tab as a different user and interact.");
    };

    const handleTestMessage = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Find Maru
            const { data: maru } = await supabase.from('profiles').select('*').eq('email', 'maru.carbonell@gmail.com').single();

            if (!maru) {
                alert("Maru user not found. Please toggle sample data first.");
                return;
            }

            // Find an item to chat about (e.g. one of Maru's items)
            const { data: item } = await supabase.from('items').select('*').eq('user_id', maru.id).limit(1).single();

            if (!item) {
                alert("Maru has no items. Please toggle sample data first.");
                return;
            }

            // Insert message from Maru to current user
            const { error } = await supabase.from('messages').insert({
                content: "Hola! Sigue disponible este artículo?",
                sender_id: maru.id,
                recipient_id: user.id,
                item_id: item.id,
                is_read: false,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            // Also insert a notification for the message
            await supabase.from('notifications').insert({
                user_id: user.id, // Recipient (current user)
                type: 'message',
                item_id: item.id,
                from_user_id: maru.id,
                message: `New message from ${maru.full_name || "Maru"}: "Hola! Sigue disponible este artículo?"`
            });

            alert("Test message sent from Maru! Check your chat.");
        } catch (error) {
            console.error("Error sending test message:", error);
            alert("Failed to send test message.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return <div className="p-10 text-center">Checking access...</div>;

    return (
        <div className="container py-10 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <div className="flex gap-2">
                    <Button onClick={handleTestMessage} variant="outline" size="sm">
                        Test Chat (from Maru)
                    </Button>
                    <Button
                        onClick={handleToggleSampleData}
                        variant={sampleDataVisible ? "destructive" : "outline"}
                    >
                        {sampleDataVisible ? "Hide Sample Data" : "Show Sample Data"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Users Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Users ({filteredUsers.length})</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="border rounded px-2 py-1 text-sm"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={userSort}
                                onChange={(e) => setUserSort(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="karma">Karma</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-muted text-left">
                                    <th className="p-3 border-b font-medium">Name</th>
                                    <th className="p-3 border-b font-medium">Email</th>
                                    <th className="p-3 border-b font-medium">Verified</th>
                                    <th className="p-3 border-b font-medium">Karma</th>
                                    <th className="p-3 border-b font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 border-b font-medium">
                                            <a href={`/profile/${user.id}`} className="text-primary hover:underline">
                                                {user.full_name || "Unknown"}
                                            </a>
                                        </td>
                                        <td className="p-3 border-b text-muted-foreground">{user.email || "-"}</td>
                                        <td className="p-3 border-b">
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.is_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                {user.is_verified ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        <td className="p-3 border-b">{user.karma_points}</td>
                                        <td className="p-3 border-b">{new Date(user.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Items Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Items ({filteredItems.length})</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="border rounded px-2 py-1 text-sm"
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                            />
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={itemSort}
                                onChange={(e) => setItemSort(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="reward">Highest Reward</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-muted text-left">
                                    <th className="p-3 border-b font-medium">Title</th>
                                    <th className="p-3 border-b font-medium">User</th>
                                    <th className="p-3 border-b font-medium">Type</th>
                                    <th className="p-3 border-b font-medium">Status</th>
                                    <th className="p-3 border-b font-medium">Reward</th>
                                    <th className="p-3 border-b font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 border-b font-medium">
                                            <a href={`/item/${item.id}`} className="text-primary hover:underline">
                                                {item.title}
                                            </a>
                                        </td>
                                        <td className="p-3 border-b font-medium">
                                            <a href={`/profile/${item.user_id}`} className="text-primary hover:underline">
                                                {item.profiles?.full_name || "Unknown"}
                                            </a>
                                        </td>
                                        <td className="p-3 border-b capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'lost' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-3 border-b">
                                            {item.resolved_by_reporter && item.resolved_by_claimer ? (
                                                <span className="text-green-600 font-medium">Resolved</span>
                                            ) : (
                                                <span className="text-yellow-600">Active</span>
                                            )}
                                        </td>
                                        <td className="p-3 border-b">
                                            {item.reward_amount > 0 ? `€${item.reward_amount}` : "Free"}
                                        </td>
                                        <td className="p-3 border-b">{new Date(item.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="gradient-text">Settings</span>
                </h1>
                <p className="text-gray-400 text-lg mb-8">
                    Customize your preferences and availability
                </p>

                {/* Profile Section */}
                <section className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                            <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500">
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Asia/Kolkata">India (IST)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Work Hours Per Day</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                defaultValue="4"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Calendar Integration */}
                <section className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Calendar Integration</h2>
                    <p className="text-gray-400 mb-4">
                        Connect your Google Calendar to automatically sync your schedules.
                    </p>
                    <button className="btn-primary">
                        Connect Google Calendar
                    </button>
                </section>

                {/* Availability */}
                <section className="card">
                    <h2 className="text-xl font-semibold mb-4">Availability</h2>
                    <p className="text-gray-400 mb-4">
                        Set your weekly availability for scheduling work sessions.
                    </p>
                    <div className="space-y-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                            <div key={day} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                                <span className="w-24 text-sm">{day}</span>
                                <input
                                    type="time"
                                    defaultValue="09:00"
                                    className="px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="time"
                                    defaultValue="17:00"
                                    className="px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm"
                                />
                                <label className="flex items-center gap-2 ml-auto">
                                    <input type="checkbox" defaultChecked={i < 5} className="rounded" />
                                    <span className="text-sm text-gray-400">Available</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary mt-4">
                        Save Availability
                    </button>
                </section>
            </div>
        </div>
    )
}

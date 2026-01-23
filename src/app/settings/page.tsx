export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <div className="p-4 border rounded bg-slate-50 text-muted-foreground">
                Configurations (API Keys, Templates) will go here.
                Currently using .env for secrets.
            </div>
        </div>
    );
}

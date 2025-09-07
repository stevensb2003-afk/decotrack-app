
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/services/settingsService';

export default function AutomationSettings() {
    const [cronHour, setCronHour] = useState(0);
    const [cronMinute, setCronMinute] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchCurrentSettings = async () => {
            const settings = await getSettings();
            setCronHour(settings.cronHour || 0);
            setCronMinute(settings.cronMinute || 0);
        };
        fetchCurrentSettings();
    }, []);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setJustSaved(false);
        await updateSettings({ cronHour, cronMinute });
        setIsSaving(false);
        setJustSaved(true);
        toast({ title: "Settings Saved", description: "The automatic update schedule has been updated." });
        setTimeout(() => setJustSaved(false), 2000); // Revert button state after 2 seconds
    };

    const getButtonContent = () => {
        if (isSaving) {
            return 'Saving...';
        }
        if (justSaved) {
            return <><Check className="mr-2 h-4 w-4" /> Saved!</>;
        }
        return <><Save className="mr-2 h-4 w-4"/> Save Schedule</>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Configure the schedule for automatic employee data updates using an external scheduler like Google Cloud Scheduler.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Set the time of day (in Costa Rica Time, UTC-6) that you will configure in your external scheduler. This service will verify this time before applying changes.</p>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                        <Label htmlFor="cron-hour">Hour (0-23)</Label>
                        <Input 
                            id="cron-hour" 
                            type="number" 
                            min="0" 
                            max="23" 
                            value={cronHour}
                            onChange={(e) => setCronHour(parseInt(e.target.value) || 0)}
                        />
                    </div>
                     <div className="flex-1">
                        <Label htmlFor="cron-minute">Minute (0-59)</Label>
                        <Input 
                            id="cron-minute" 
                            type="number" 
                            min="0" 
                            max="59" 
                            value={cronMinute}
                            onChange={(e) => setCronMinute(parseInt(e.target.value) || 0)}
                        />
                    </div>
                     <Button onClick={handleSaveSettings} className="self-end" disabled={isSaving || justSaved}>
                       {getButtonContent()}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

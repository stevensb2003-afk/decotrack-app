
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/services/settingsService';

export default function GeofencingSettings() {
    const [radius, setRadius] = useState(100);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchCurrentSettings = async () => {
            const settings = await getSettings();
            setRadius(settings.geofenceRadius || 100);
        };
        fetchCurrentSettings();
    }, []);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setJustSaved(false);
        await updateSettings({ geofenceRadius: radius });
        setIsSaving(false);
        setJustSaved(true);
        toast({ title: "Settings Saved", description: "The geofencing radius has been updated." });
        setTimeout(() => setJustSaved(false), 2000);
    };
    
    const getButtonContent = () => {
        if (isSaving) {
            return 'Saving...';
        }
        if (justSaved) {
            return <><Check className="mr-2 h-4 w-4" /> Saved!</>;
        }
        return <><Save className="mr-2 h-4 w-4"/> Save Radius</>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Geofencing Settings</CardTitle>
                <CardDescription>Define the maximum distance (in meters) an employee can be from their assigned location to clock in or out.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-end gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                        <Label htmlFor="geofence-radius">Radius (meters)</Label>
                        <Input 
                            id="geofence-radius" 
                            type="number" 
                            min="10"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={isSaving || justSaved}>
                        {getButtonContent()}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

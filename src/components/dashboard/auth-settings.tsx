
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/services/settingsService';
import { ExternalLink, Trash2, PlusCircle, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';

const FIREBASE_PROJECT_ID = "decotrack-l9y8l";

export default function AuthSettings() {
    const [domains, setDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchCurrentSettings = async () => {
            const settings = await getSettings();
            setDomains(settings.authorizedDomains || []);
        };
        fetchCurrentSettings();
    }, []);

    const handleAddDomain = async () => {
        if (!newDomain || domains.includes(newDomain)) {
            toast({ title: "Invalid Domain", description: "Domain is empty or already exists.", variant: "destructive" });
            return;
        }
        const updatedDomains = [...domains, newDomain];
        await updateSettings({ authorizedDomains: updatedDomains });
        setDomains(updatedDomains);
        setNewDomain('');
        toast({ title: "Domain Added", description: `"${newDomain}" has been added.` });
    };

    const handleRemoveDomain = async (domainToRemove: string) => {
        const updatedDomains = domains.filter(d => d !== domainToRemove);
        await updateSettings({ authorizedDomains: updatedDomains });
        setDomains(updatedDomains);
        toast({ title: "Domain Removed", description: `"${domainToRemove}" has been removed.` });
    };
    
    const emailTemplates = [
        { name: "Password Reset", type: "PASSWORD_RESET" },
        { name: "Email Verification", type: "VERIFY_EMAIL" },
        { name: "Email Address Change", type: "CHANGE_EMAIL" },
    ];


    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Settings</CardTitle>
                    <CardDescription>Manage authorized domains for sign-in and customize email templates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Authorized Domains</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            These domains are allowed for sign-in. In a production app, this would securely update Firebase settings via a backend function.
                        </p>
                        <div className="space-y-2">
                           {domains.map(domain => (
                                <div key={domain} className="flex items-center justify-between p-2 border rounded-md">
                                    <span className="font-mono text-sm">{domain}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveDomain(domain)} disabled={domain === 'localhost'}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Input 
                                placeholder="example.com" 
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                            />
                            <Button onClick={handleAddDomain}><PlusCircle className="mr-2 h-4 w-4"/> Add</Button>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Email Templates</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                           Customize the emails sent to users for verification, password resets, and more.
                        </p>
                        <div className="space-y-2">
                            {emailTemplates.map(template => (
                                <Link 
                                    key={template.type} 
                                    href={`https://console.firebase.google.com/u/0/project/${FIREBASE_PROJECT_ID}/authentication/emails/${template.type}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-4 w-4" />
                                            <span>{template.name}</span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

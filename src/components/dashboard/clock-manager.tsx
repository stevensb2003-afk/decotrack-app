
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ClockManager() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Clock Manager</CardTitle>
                <CardDescription>This feature is under development. Please check back later.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Future functionality will allow for manual clock-in/out adjustments, record viewing, and more.</p>
            </CardContent>
        </Card>
    );
}

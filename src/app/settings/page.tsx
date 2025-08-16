
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/context/session-provider";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const { user, loading: userLoading } = useSession();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [dob, setDob] = useState("");

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const fetchUserData = async () => {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                setFullName(user.displayName || data.fullName || "");
                setEmail(user.email || data.email || "");
                setAddress(data.address || "");
                setDob(data.dob || "");
            }
            setLoading(false);
        };

        fetchUserData();
    }, [user]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                fullName,
                address,
                dob,
            });

            if (user.displayName !== fullName) {
                await updateProfile(user, { displayName: fullName });
            }
            
            toast({ title: "Profile Updated", description: "Your information has been saved." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Failed", description: error.message });
        } finally {
            setSaving(false);
        }
    };


  if (userLoading || loading) {
      return (
          <AppLayout>
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin" />
              </div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-headline font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and notification preferences.
          </p>
        </div>

        <form onSubmit={handleProfileSave}>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information required for disputes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="123 Main St, Anytown, USA 12345" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                    </div>
                     <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </form>

        <Card>
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                 <Button disabled>Update Password</Button>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

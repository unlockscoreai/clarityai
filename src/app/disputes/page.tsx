import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function DisputesPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold">Dispute Letters</h1>
              <p className="text-muted-foreground">
                Generate and track your AI-powered dispute letters.
              </p>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Dispute
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>My Disputes</CardTitle>
                <CardDescription>A list of all generated dispute letters and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-10">You have not generated any dispute letters yet.</p>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

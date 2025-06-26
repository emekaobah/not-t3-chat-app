"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { ModelTypeSection } from "@/components/model-type-section";
import { ModelPreferencesHeader } from "@/components/model-preferences-header";
import { ModelConfig, GroupedModels } from "@/lib/models";
import { toast } from "sonner";

interface ModelWithPreference extends ModelConfig {
  isEnabled: boolean;
}

interface GroupedModelsWithPreferences {
  text: ModelWithPreference[];
  multimodal: ModelWithPreference[];
  reasoning: ModelWithPreference[];
  visual: ModelWithPreference[];
}

const SettingsPage = () => {
  const [groupedModels, setGroupedModels] =
    useState<GroupedModelsWithPreferences>({
      text: [],
      multimodal: [],
      reasoning: [],
      visual: [],
    });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's model preferences
  useEffect(() => {
    fetchUserModels();
  }, []);

  const fetchUserModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user-models?grouped=true");
      if (!response.ok) throw new Error("Failed to fetch models");

      const data: GroupedModelsWithPreferences = await response.json();
      setGroupedModels(data);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to load model preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelToggle = async (modelId: string, enabled: boolean) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/user-models", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelId, isEnabled: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update preference");

      // Update local state
      setGroupedModels((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((type) => {
          const typeKey = type as keyof GroupedModelsWithPreferences;
          updated[typeKey] = updated[typeKey].map((model) =>
            model.id === modelId ? { ...model, isEnabled: enabled } : model
          );
        });
        return updated;
      });

      toast.success(`Model ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating model preference:", error);
      toast.error("Failed to update model preference");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/user-models/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} models`);

      // Refresh data
      await fetchUserModels();

      const actionMap = {
        recommended: "Selected recommended models",
        reset: "Reset to default settings",
        disable: "Disabled all models",
      };

      toast.success(
        actionMap[action as keyof typeof actionMap] ||
          `Bulk ${action} completed`
      );
    } catch (error) {
      console.error(`Error with bulk ${action}:`, error);
      toast.error(`Failed to ${action} models`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilterByFeatures = () => {
    toast.info("Filter by features coming soon!");
  };

  const getTotalCounts = () => {
    const allModels = [
      ...groupedModels.text,
      ...groupedModels.multimodal,
      ...groupedModels.reasoning,
      ...groupedModels.visual,
    ];

    return {
      total: allModels.length,
      enabled: allModels.filter((m) => m.isEnabled).length,
    };
  };

  const { total, enabled } = getTotalCounts();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading model preferences...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="history">History & Sync</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Available Models</h2>
            <p className="text-muted-foreground">
              Choose which models appear in your model selector. This won't
              affect existing conversations.
            </p>
          </div>

          <ModelPreferencesHeader
            onFilterByFeatures={handleFilterByFeatures}
            onSelectRecommended={() => handleBulkAction("recommended")}
            onUnselectAll={() => handleBulkAction("disable")}
            enabledCount={enabled}
            totalCount={total}
            isLoading={isSaving}
          />

          <div className="space-y-8">
            {Object.entries(groupedModels).map(([type, models]) => (
              <ModelTypeSection
                key={type}
                modelType={type}
                models={models}
                onToggle={handleModelToggle}
                isLoading={isSaving}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customization" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Customization</h2>
            <p className="text-muted-foreground">
              Customize the appearance and behavior of the application.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme.
                </p>
              </div>
              <ModeToggle />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Account</h2>
            <p className="text-muted-foreground">
              Manage your account settings.
            </p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Account settings coming soon...
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">History & Sync</h2>
            <p className="text-muted-foreground">
              Manage your chat history and synchronization settings.
            </p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            History & sync settings coming soon...
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">API Keys</h2>
            <p className="text-muted-foreground">
              Manage your API keys and integrations.
            </p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            API key management coming soon...
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground">
              Get in touch with our support team.
            </p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Contact information coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

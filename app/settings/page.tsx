"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { ModelTypeSection } from "@/components/model-type-section";
import { ModelPreferencesHeader } from "@/components/model-preferences-header";
import {
  useGroupedUserModels,
  useBulkUpdateModels,
  useUpdateModelPreference,
} from "@/hooks/queries/useModelPreferences";
import { toast } from "sonner";

const SettingsPage = () => {
  // Use React Query for data fetching
  const {
    data: groupedModels,
    isLoading,
    error,
    refetch,
  } = useGroupedUserModels();
  const bulkUpdateMutation = useBulkUpdateModels();
  const updateModelMutation = useUpdateModelPreference();

  // Handle error state
  if (error) {
    toast.error("Failed to load model preferences");
  }

  // Handle individual model toggle
  const handleModelToggle = async (modelId: string, enabled: boolean) => {
    try {
      await updateModelMutation.mutateAsync({ modelId, isEnabled: enabled });
    } catch (error) {
      console.error("Error updating model preference:", error);
      // Error handling is done in the mutation
    }
  };

  // Bulk actions using React Query mutations
  const handleBulkAction = async (
    action: "recommended" | "reset" | "disable"
  ) => {
    try {
      if (action === "recommended") {
        // Use the API's built-in recommended logic
        const response = await fetch("/api/user-models/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "recommended" }),
        });
        if (!response.ok) throw new Error("Failed to set recommended models");
        // Refetch to get updated data
        refetch();
        return;
      }

      if (!groupedModels) return;

      // For disable and reset, we need to specify model IDs
      const allModelIds = [
        ...groupedModels.text.map((m) => m.id),
        ...groupedModels.multimodal.map((m) => m.id),
        ...groupedModels.reasoning.map((m) => m.id),
        ...groupedModels.visual.map((m) => m.id),
      ];

      const isEnabled = action === "reset"; // reset = enable all, disable = disable all
      await bulkUpdateMutation.mutateAsync({
        modelIds: allModelIds,
        isEnabled,
      });
    } catch (error) {
      console.error(`Error with bulk ${action}:`, error);
      // Error handling is done in the mutation
    }
  };

  const handleFilterByFeatures = () => {
    toast.info("Filter by features coming soon!");
  };

  const getTotalCounts = () => {
    if (!groupedModels) return { total: 0, enabled: 0 };

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
            isLoading={
              bulkUpdateMutation.isPending || updateModelMutation.isPending
            }
          />

          <div className="space-y-8">
            {groupedModels &&
              Object.entries(groupedModels).map(([type, models]) => (
                <ModelTypeSection
                  key={type}
                  modelType={type}
                  models={models}
                  onToggle={handleModelToggle}
                  isLoading={
                    bulkUpdateMutation.isPending ||
                    updateModelMutation.isPending
                  }
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

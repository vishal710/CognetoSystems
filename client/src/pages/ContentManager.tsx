import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, RefreshCw, Pencil, Trash } from "lucide-react";
import ContentPlanForm from "@/components/ContentPlanForm";
import { SelectContentPlan } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContentManager() {
  const [selectedPlan, setSelectedPlan] = useState<SelectContentPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input/textarea
      if (e.target instanceof HTMLElement && 
          (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      // Alt + N for new plan
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setSelectedPlan(null);
      }
      // Esc to reset form
      if (e.key === 'Escape' && selectedPlan) {
        setSelectedPlan(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlan]);

  const { data: contentPlans = [], isLoading } = useQuery<SelectContentPlan[]>({
    queryKey: ["/api/content-plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<SelectContentPlan, "id">) => {
      console.log("[DEBUG] Submitting content plan:", data);
      const res = await apiRequest("POST", "/api/content-plans", {
        ...data,
        medium: Array.isArray(data.medium) ? data.medium : [data.medium],
        actualPublishDate: null,
        metadata: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Success",
        description: "Content plan created successfully",
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      console.error("[ERROR] Failed to create content plan:", error);
      toast({
        title: "Error",
        description: "Failed to create content plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SelectContentPlan) => {
      const res = await apiRequest(
        "PATCH",
        `/api/content-plans/${data.id}`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Success",
        description: "Content plan updated successfully",
      });
      setSelectedPlan(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/content-plans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Success",
        description: "Content plan deleted successfully",
      });
      setSelectedPlan(null);
    },
  });

  const handleSubmit = async (data: Omit<SelectContentPlan, "id">) => {
    if (selectedPlan) {
      await updateMutation.mutateAsync({ ...data, id: selectedPlan.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    if (selectedPlan && selectedPlan.status === "pending") {
      await deleteMutation.mutateAsync(selectedPlan.id);
    }
  };

  return (
    <main role="main" className="container mx-auto px-4 py-8">
      <a href="#content-form" className="sr-only focus:not-sr-only focus:absolute focus:p-4">
        Skip to content form
      </a>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" tabIndex={0}>Content Manager</h1>
        <Button
          onClick={() => setSelectedPlan(null)}
          className="gap-2"
          variant={selectedPlan ? "outline" : "default"}
          aria-label={selectedPlan ? "Reset form" : "Create new plan"}
          title="Alt + N"
        >
          {selectedPlan ? (
            <>
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Reset Form
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" /> New Plan
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" id="form-title">
              {selectedPlan ? "Edit Content Plan" : "Create Content Plan"}
            </h2>
            <div id="content-form" tabIndex={-1}>
              <ContentPlanForm
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                defaultValues={selectedPlan}
                isSubmitting={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  deleteMutation.isPending
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" id="plans-title">Content Plans</h2>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4" aria-label="Content plan status">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Table aria-labelledby="plans-title">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentPlans
                      .filter((plan) => plan.status === "pending")
                      .map((plan) => (
                        <TableRow 
                          key={plan.id}
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              setSelectedPlan(plan);
                            }
                          }}
                        >
                          <TableCell>{plan.theme}</TableCell>
                          <TableCell>
                            {new Date(plan.targetPublishDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(plan.medium) ? plan.medium.join(", ") : plan.medium}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPlan(plan)}
                                aria-label={`Edit ${plan.theme}`}
                              >
                                <Pencil className="w-4 h-4" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(plan.id)}
                                aria-label={`Delete ${plan.theme}`}
                              >
                                <Trash className="w-4 h-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="published">
                <Table aria-labelledby="plans-title">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Published Date</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentPlans
                      .filter((plan) => plan.status === "published")
                      .map((plan) => (
                        <TableRow key={plan.id} tabIndex={0}>
                          <TableCell>{plan.theme}</TableCell>
                          <TableCell>
                            {new Date(plan.actualPublishDate!).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(plan.medium) ? plan.medium.join(", ") : plan.medium}
                          </TableCell>
                          <TableCell>
                            {plan.contentUrl && (
                              <a
                                href={plan.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                aria-label={`View content for ${plan.theme}`}
                              >
                                View Content
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
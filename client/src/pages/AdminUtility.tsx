import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash, Eye, EyeOff } from "lucide-react";
import { SelectApiKey, SelectPromptTemplate } from "@db/schema";

export default function AdminUtility() {
  const [showApiKey, setShowApiKey] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API Keys
  const { data: apiKeys = [] } = useQuery<SelectApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const { data: promptTemplates = [] } = useQuery<SelectPromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
  });

  const [newApiKey, setNewApiKey] = useState({
    provider: "",
    keyName: "",
    keyValue: "",
  });

  const [newPrompt, setNewPrompt] = useState({
    name: "",
    description: "",
    prompt: "",
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: Omit<SelectApiKey, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/api-keys", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "Success", description: "API key added successfully" });
      setNewApiKey({ provider: "", keyName: "", keyValue: "" });
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async (data: Omit<SelectPromptTemplate, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/prompt-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      toast({ title: "Success", description: "Prompt template added successfully" });
      setNewPrompt({ name: "", description: "", prompt: "" });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/api-keys/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "Success", description: "API key deleted successfully" });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/prompt-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      toast({ title: "Success", description: "Prompt template deleted successfully" });
    },
  });

  return (
    <main role="main" className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" tabIndex={0}>Admin Utility</h1>

      <Tabs defaultValue="api-keys">
        <TabsList className="mb-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4">
                <h2 className="text-xl font-semibold">Add New API Key</h2>
                <Input
                  placeholder="Provider (e.g., Anthropic, OpenAI)"
                  value={newApiKey.provider}
                  onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                />
                <Input
                  placeholder="Key Name"
                  value={newApiKey.keyName}
                  onChange={(e) => setNewApiKey({ ...newApiKey, keyName: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="API Key Value"
                  value={newApiKey.keyValue}
                  onChange={(e) => setNewApiKey({ ...newApiKey, keyValue: e.target.value })}
                />
                <Button
                  onClick={() => createApiKeyMutation.mutate(newApiKey)}
                  disabled={createApiKeyMutation.isPending}
                >
                  Add API Key
                </Button>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Existing API Keys</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Key Name</TableHead>
                      <TableHead>Key Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>{key.provider}</TableCell>
                        <TableCell>{key.keyName}</TableCell>
                        <TableCell>
                          {showApiKey === key.id ? key.keyValue : "••••••••"}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                            className="ml-2"
                          >
                            {showApiKey === key.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteApiKeyMutation.mutate(key.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4">
                <h2 className="text-xl font-semibold">Add New Prompt Template</h2>
                <Input
                  placeholder="Name (e.g., Document Analysis)"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                />
                <Textarea
                  placeholder="Prompt Template"
                  className="min-h-[200px]"
                  value={newPrompt.prompt}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                />
                <Button
                  onClick={() => createPromptMutation.mutate({ ...newPrompt, isActive: true })}
                  disabled={createPromptMutation.isPending}
                >
                  Add Prompt Template
                </Button>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Existing Prompt Templates</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promptTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.description}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {template.prompt}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePromptMutation.mutate(template.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

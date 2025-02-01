import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ApiKey = {
  id: number;
  provider: string;
  keyName: string;
  keyValue: string;
  isActive: boolean;
};

type PromptTemplate = {
  id: number;
  name: string;
  description: string;
  prompt: string;
  isActive: boolean;
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newApiKey, setNewApiKey] = useState<Partial<ApiKey>>({});
  const [newPrompt, setNewPrompt] = useState<Partial<PromptTemplate>>({});

  const { data: apiKeys } = useQuery<ApiKey[]>({ 
    queryKey: ['/api/admin/keys']
  });

  const { data: promptTemplates } = useQuery<PromptTemplate[]>({ 
    queryKey: ['/api/admin/prompts']
  });

  const createApiKey = useMutation({
    mutationFn: (key: Partial<ApiKey>) => 
      apiRequest('/api/admin/keys', { method: 'POST', body: key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/keys'] });
      setNewApiKey({});
      toast({
        title: "Success",
        description: "API key added successfully",
      });
    }
  });

  const createPrompt = useMutation({
    mutationFn: (prompt: Partial<PromptTemplate>) =>
      apiRequest('/api/admin/prompts', { method: 'POST', body: prompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setNewPrompt({});
      toast({
        title: "Success",
        description: "Prompt template added successfully",
      });
    }
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="apikeys">
        <TabsList>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={newApiKey.provider || ''}
                      onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                      placeholder="e.g., Anthropic, OpenAI"
                    />
                  </div>
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      value={newApiKey.keyName || ''}
                      onChange={(e) => setNewApiKey({ ...newApiKey, keyName: e.target.value })}
                      placeholder="e.g., Production API Key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="keyValue">Key Value</Label>
                    <Input
                      id="keyValue"
                      type="password"
                      value={newApiKey.keyValue || ''}
                      onChange={(e) => setNewApiKey({ ...newApiKey, keyValue: e.target.value })}
                      placeholder="Enter API key"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createApiKey.mutate(newApiKey)}
                  disabled={createApiKey.isPending}
                >
                  Add API Key
                </Button>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Existing API Keys</h3>
                  <div className="space-y-4">
                    {apiKeys?.map((key) => (
                      <Card key={key.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{key.provider}</p>
                              <p className="text-sm text-gray-500">{key.keyName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-sm ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {key.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Templates Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newPrompt.name || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      placeholder="e.g., Document Analysis"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newPrompt.description || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                      placeholder="Brief description of the prompt template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt">Prompt Template</Label>
                    <Textarea
                      id="prompt"
                      value={newPrompt.prompt || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                      placeholder="Enter the prompt template"
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createPrompt.mutate(newPrompt)}
                  disabled={createPrompt.isPending}
                >
                  Add Template
                </Button>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Existing Templates</h3>
                  <div className="space-y-4">
                    {promptTemplates?.map((template) => (
                      <Card key={template.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{template.name}</p>
                              <span className={`px-2 py-1 rounded text-sm ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{template.description}</p>
                            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                              {template.prompt}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

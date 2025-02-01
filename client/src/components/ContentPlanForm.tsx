import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectContentPlan } from "@db/schema";

const PUBLISHING_MEDIUMS = [
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" }
] as const;

// Update schema to handle channels per medium
const formSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  description: z.string().min(1, "Description is required"),
  prompt: z.string().optional(),
  mediumChannels: z.array(z.object({
    medium: z.string(),
    channel: z.string().min(1, "Channel name is required")
  })).min(1, "At least one medium and channel is required"),
  targetPublishDate: z.string().min(1, "Target publish date is required"),
  status: z.string().default("pending"),
});

interface ContentPlanFormProps {
  onSubmit: (data: Omit<SelectContentPlan, "id">) => Promise<void>;
  onDelete?: () => Promise<void>;
  defaultValues?: SelectContentPlan | null;
  isSubmitting?: boolean;
}

export default function ContentPlanForm({
  onSubmit,
  onDelete,
  defaultValues,
  isSubmitting,
}: ContentPlanFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      theme: "",
      description: "",
      prompt: "",
      mediumChannels: [],
      targetPublishDate: new Date().toISOString().split("T")[0],
      status: "pending",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Transform the data to match the API format
    const formattedData = {
      ...values,
      medium: values.mediumChannels.map(mc => mc.medium),
      channel: values.mediumChannels.map(mc => mc.channel).join(','),
    };
    await onSubmit(formattedData);
  };

  // Get selected mediums
  const selectedMediumChannels = form.watch('mediumChannels');
  const selectedMediums = selectedMediumChannels.map(mc => mc.medium);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <FormControl>
                <Input placeholder="Enter theme" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter content description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LLM Prompt (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter custom prompt for the AI"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Publishing Mediums and Channels</FormLabel>
          {PUBLISHING_MEDIUMS.map((medium) => (
            <div key={medium.id} className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMediums.includes(medium.id)}
                  onCheckedChange={(checked) => {
                    const currentValue = form.getValues('mediumChannels');
                    let newValue;

                    if (checked) {
                      newValue = [...currentValue, { medium: medium.id, channel: '' }];
                    } else {
                      newValue = currentValue.filter(mc => mc.medium !== medium.id);
                    }

                    form.setValue('mediumChannels', newValue);
                  }}
                />
                <span className="w-32">{medium.label}</span>
              </div>

              {selectedMediums.includes(medium.id) && (
                <div className="flex-1">
                  <Input
                    placeholder={`Enter ${medium.label} channel name/ID`}
                    value={selectedMediumChannels.find(mc => mc.medium === medium.id)?.channel || ''}
                    onChange={(e) => {
                      const currentValue = form.getValues('mediumChannels');
                      const index = currentValue.findIndex(mc => mc.medium === medium.id);
                      if (index >= 0) {
                        const newValue = [...currentValue];
                        newValue[index] = { ...newValue[index], channel: e.target.value };
                        form.setValue('mediumChannels', newValue);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          {form.formState.errors.mediumChannels && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.mediumChannels.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="targetPublishDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Publish Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : defaultValues ? "Update Plan" : "Create Plan"}
          </Button>

          {defaultValues && defaultValues.status === "pending" && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Delete Plan
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
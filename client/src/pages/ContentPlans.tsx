import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { SelectContentPlan } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ContentPlans() {
  const { data: plans, isLoading } = useQuery<SelectContentPlan[]>({
    queryKey: ["/api/content-plans"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Plans</h1>
        <Button asChild>
          <Link href="/content-plans/new">Create New Plan</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Theme</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actual Publish Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.theme}</TableCell>
                <TableCell>{plan.description}</TableCell>
                <TableCell>
                  {format(new Date(plan.targetPublishDate), 'PP')}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {plan.channels?.map((channel, idx) => (
                      <Badge key={idx} variant="secondary" className="mr-1">
                        {channel.medium}: {channel.channel}
                      </Badge>
                    )) || (
                      <Badge variant="secondary" className="mr-1">
                        {plan.medium}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={plan.status === 'published' ? 'default' : 'outline'}
                  >
                    {plan.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {plan.actualPublishDate && format(new Date(plan.actualPublishDate), 'PP')}
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/content-plans/${plan.id}`}>
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

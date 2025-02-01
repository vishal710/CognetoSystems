import { cn } from "@/lib/utils";

interface RiskRatingProps {
  rating: number;
  className?: string;
}

export default function RiskRating({ rating, className }: RiskRatingProps) {
  const ratingColors = [
    "bg-green-500",   // 1 - Lowest risk
    "bg-green-300",   // 2 - Low risk
    "bg-yellow-400",  // 3 - Medium risk
    "bg-orange-500",  // 4 - High risk
    "bg-red-500",     // 5 - Highest risk
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Risk Rating:</span>
        <span className="text-sm text-muted-foreground">{rating} / 5</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-0 flex">
          {ratingColors.map((color, index) => (
            <div
              key={index}
              className={cn("flex-1", color)}
            />
          ))}
        </div>
        <div
          className="absolute h-4 w-2 bg-white -mt-0.5 transform -translate-x-1/2 transition-all duration-300"
          style={{ left: `${(rating - 1) * 25}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Low Risk</span>
        <span>High Risk</span>
      </div>
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { getDetailedComparison, type ProfileAnswers, type CriteriaComparison } from "@/utils/compatibilityCalculator";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_photo_url?: string | null;
}

interface Question {
  id: string;
  question_text_en: string;
  question_type: string;
}

interface MatchDetailsModalProps {
  open: boolean;
  onClose: () => void;
  clientProfile: Profile;
  matchProfile: Profile;
  compatibilityScore: number;
  clientAnswers: ProfileAnswers;
  matchAnswers: ProfileAnswers;
  questions: Question[];
}

export default function MatchDetailsModal({
  open,
  onClose,
  clientProfile,
  matchProfile,
  compatibilityScore,
  clientAnswers,
  matchAnswers,
  questions,
}: MatchDetailsModalProps) {
  const clientName = `${clientProfile.first_name ?? ""} ${clientProfile.last_name ?? ""}`.trim() || "Client";
  const matchName = `${matchProfile.first_name ?? ""} ${matchProfile.last_name ?? ""}`.trim() || "Match";

  const clientInitials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const matchInitials = matchName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get detailed comparison
  const comparisons = getDetailedComparison(clientAnswers, matchAnswers, questions);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "Not specified";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Match Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Header with profiles and compatibility score */}
            <div className="grid grid-cols-2 gap-8">
              {/* Client Profile */}
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar className="h-16 w-16">
                  {clientProfile.primary_photo_url ? (
                    <AvatarImage src={clientProfile.primary_photo_url} alt={clientName} />
                  ) : (
                    <AvatarFallback>{clientInitials}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{clientName}</h3>
                  <p className="text-xs text-muted-foreground">Preferences</p>
                </div>
              </div>

              {/* Match Profile */}
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar className="h-16 w-16">
                  {matchProfile.primary_photo_url ? (
                    <AvatarImage src={matchProfile.primary_photo_url} alt={matchName} />
                  ) : (
                    <AvatarFallback>{matchInitials}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{matchName}</h3>
                  <p className="text-xs text-muted-foreground">Profile</p>
                </div>
              </div>
            </div>

            {/* Overall Compatibility Score */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{matchName} fits {clientName}'s Preferences</span>
                <span className="text-lg font-bold text-primary">{compatibilityScore}%</span>
              </div>
              <Progress value={compatibilityScore} className="h-3" />
            </div>

            {/* Detailed Comparison */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Detailed Comparison
              </h4>

              {comparisons.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No preference data available for comparison
                </div>
              ) : (
                <div className="space-y-2">
                  {comparisons.map((comparison, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        comparison.isMatch ? "border-green-200 bg-green-50/50" : "border-border bg-background"
                      }`}
                    >
                      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
                        {/* Client Preference */}
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Preferred {comparison.questionText}
                            </span>
                            {comparison.isMatch && <Check className="h-4 w-4 text-green-600" />}
                          </div>
                          <p className="text-sm">{formatValue(comparison.preferenceValue)}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {comparison.importance}
                          </Badge>
                        </div>

                        {/* Match Indicator */}
                        <div className="flex items-center justify-center pt-6">
                          {comparison.isMatch ? (
                            <div className="rounded-full bg-green-100 p-2">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-muted p-2">
                              <X className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Match Profile Value */}
                        <div>
                          <div className="mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {comparison.questionText}
                            </span>
                          </div>
                          <p className="text-sm">{formatValue(comparison.profileValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

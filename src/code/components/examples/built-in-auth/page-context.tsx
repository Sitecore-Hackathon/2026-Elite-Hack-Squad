import { useMarketplaceClient } from "@/components/providers/marketplace";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const PageContext = () => {
  const client = useMarketplaceClient();
  const [pageContext, setPageContext] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Make a query to retrieve the page context
    client
      .query("pages.context")
      .then((res) => {
        console.log("Success retrieving pages.context:", res.data);
        setPageContext(res.data);
      })
      .catch((error) => {
        console.error("Error retrieving pages.context:", error);
        setError(error.message || "Error retrieving page context");
      });
  }, [client]);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="border-[1px] rounded-lg"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50  p-6 rounded-t-lg transition-colors">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              Page Context
            </CardTitle>
            <Badge colorScheme="primary">Client-side</Badge>
            <Badge colorScheme={"success"}>SDK Built-in Auth</Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
            Error: {error}
          </div>
        ) : pageContext ? (
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(pageContext, null, 2)}
          </pre>
        ) : (
          <div className="p-4 text-muted-foreground">Loading page context...</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

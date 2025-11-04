import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string | null;
  documentName: string;
  mimeType: string;
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  documentUrl,
  documentName,
  mimeType
}: DocumentViewerDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open]);

  const handleDownload = () => {
    if (!documentUrl) return;
    
    const link = window.document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>{documentName}</DialogTitle>
              <DialogDescription>
                {isPdf ? 'Visualizador de PDF' : 'Visualizador de documento'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="space-y-4 w-full max-w-2xl px-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-[60vh] w-full" />
              </div>
            </div>
          )}

          {isPdf && documentUrl && (
            <iframe
              src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={documentName}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}

          {isImage && documentUrl && (
            <div className="w-full h-full flex items-center justify-center bg-muted p-6">
              <img
                src={documentUrl}
                alt={documentName}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-muted/50 text-xs text-muted-foreground">
          💡 Tip: Usa los controles del visor para navegar, hacer zoom y buscar en el documento
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string | null;
  documentName: string;
  mimeType: string;
  documents?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
  }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  documentUrl,
  documentName,
  mimeType,
  documents = [],
  currentIndex = 0,
  onNavigate
}: DocumentViewerDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, documentUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0 && onNavigate) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < documents.length - 1 && onNavigate) {
        onNavigate(currentIndex + 1);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, documents.length, onNavigate, zoom, rotation]);

  const handleDownload = async () => {
    if (!documentUrl) return;
    
    // Si es una URL firmada de Supabase (para PDFs), descargar directamente
    if (documentUrl.includes('supabase.co')) {
      const link = window.document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      // Para blobs (imágenes), usar el blob URL directamente
      const link = window.document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1 && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const hasMultipleDocuments = documents.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle>{documentName}</DialogTitle>
                {hasMultipleDocuments && (
                  <Badge variant="secondary">
                    {currentIndex + 1} de {documents.length}
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {isPdf ? 'Visualizador de PDF' : isImage ? 'Visualizador de imagen' : 'Visualizador de documento'}
              </DialogDescription>
            </div>
            
            {/* Image controls - only for images */}
            {isImage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                  disabled={zoom === 1 && rotation === 0 && position.x === 0 && position.y === 0}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
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
            <div 
              className="w-full h-full flex items-center justify-center bg-muted relative select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                ref={imageRef}
                src={documentUrl}
                alt={documentName}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transformOrigin: 'center center'
                }}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                draggable={false}
              />

              {/* Navigation arrows for multiple images */}
              {hasMultipleDocuments && (
                <>
                  {currentIndex > 0 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}
                  {currentIndex < documents.length - 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-muted/50 text-xs text-muted-foreground">
          {isImage ? (
            <span>💡 Tip: Usa +/- para zoom, R para rotar, 0 para resetear{hasMultipleDocuments && ', ← → para navegar'}</span>
          ) : (
            <span>💡 Tip: Usa los controles del visor para navegar, hacer zoom y buscar en el documento</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

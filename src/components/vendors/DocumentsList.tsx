
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  file_name: string;
  uploaded_at: string;
}

interface DocumentsListProps {
  documents: Document[];
}

const DocumentsList = ({ documents }: DocumentsListProps) => {
  return (
    <div className="space-y-3">
      {documents.length > 0 ? (
        documents.map((doc) => (
          <div 
            key={doc.id} 
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{doc.file_name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(doc.uploaded_at).toLocaleDateString()}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No documents uploaded for this vendor.</p>
          <Button variant="outline" className="mt-4">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;


import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Image } from "lucide-react";

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void;
  printType: string;
  maxFiles?: number;
}

const FileUploader = ({ onFilesUploaded, printType, maxFiles }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/vnd.adobe.photoshop', 'image/jpeg', 'image/png', 'image/gif'];
      return validTypes.some(type => file.type === type || file.name.toLowerCase().endsWith('.psd'));
    });
    
    if (maxFiles) {
      const filesToAdd = validFiles.slice(0, maxFiles - files.length);
      setFiles(prev => [...prev, ...filesToAdd].slice(0, maxFiles));
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (files.length > 0) {
      onFilesUploaded(files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.psd')) {
      return <Image className="w-6 h-6 text-blue-500" />;
    }
    return <File className="w-6 h-6 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {printType === "single" ? "Загрузите файл" : "Загрузите ваши файлы"}
        </CardTitle>
        <CardDescription className="text-center">
          {printType === "single" 
            ? "Один файл для печати отдельного изделия" 
            : "Несколько файлов для печати в рулоне"
          }
          <br />
          Поддерживаются форматы: PDF, PSD, JPG, PNG, GIF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-300 hover:border-orange-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Перетащите файлы сюда или нажмите для выбора
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {maxFiles && `Максимум ${maxFiles} файл${maxFiles > 1 ? 'ов' : ''} • `}
            Максимальный размер файла: 50MB
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="hover:bg-orange-50 hover:border-orange-300"
            disabled={maxFiles ? files.length >= maxFiles : false}
          >
            Выбрать файлы
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={!maxFiles || maxFiles > 1}
            accept=".pdf,.psd,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {maxFiles && files.length >= maxFiles && (
          <p className="text-sm text-orange-600 text-center mt-2">
            Достигнуто максимальное количество файлов
          </p>
        )}

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-3">Загруженные файлы:</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="font-medium text-gray-700">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                onClick={handleContinue}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                size="lg"
              >
                Продолжить к расчету стоимости
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploader;

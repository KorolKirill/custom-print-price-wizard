
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, FileImage, FileText, Image as ImageIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import * as pdfjsLib from 'pdfjs-dist';

// Настройка worker для PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PriceCalculatorProps {
  files: File[];
  printType: string;
  onPriceCalculated: (price: number) => void;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'pdf' | 'psd';
  pageCount?: number;
}

const PriceCalculator = ({ files, printType, onPriceCalculated }: PriceCalculatorProps) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);

  const generatePreview = async (file: File): Promise<FilePreview> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileSizeMB = file.size / 1024 / 1024;

    if (fileType.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      return { file, preview, type: 'image' };
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Проверяем размер файла - если больше 10MB, не генерируем предпросмотр
      if (fileSizeMB > 10) {
        return { file, preview: '', type: 'pdf', pageCount: 0 };
      }
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          const preview = canvas.toDataURL();
          return { file, preview, type: 'pdf', pageCount: pdf.numPages };
        }
      } catch (error) {
        console.error('Ошибка при обработке PDF:', error);
      }
    }

    if (fileName.endsWith('.psd')) {
      // Для PSD файлов показываем иконку, так как браузер не может их отобразить напрямую
      return { file, preview: '', type: 'psd' };
    }

    // Fallback для неподдерживаемых форматов
    return { file, preview: '', type: 'image' };
  };

  useEffect(() => {
    const loadPreviews = async () => {
      setIsLoading(true);
      const previewPromises = files.map(generatePreview);
      const loadedPreviews = await Promise.all(previewPromises);
      setPreviews(loadedPreviews);
      setIsLoading(false);
    };

    if (files.length > 0) {
      loadPreviews();
    }
  }, [files]);

  useEffect(() => {
    // Заглушка для расчета цены - в будущем будет API запрос
    const calculatePrice = () => {
      let basePrice = printType === "roll" ? 150 : 200; // базовая цена
      let price = basePrice * files.length;
      
      // Добавляем случайную вариацию для демонстрации
      price += Math.floor(Math.random() * 100);
      
      setTotalPrice(price);
    };

    if (files.length > 0) {
      // Имитируем задержку расчета
      setTimeout(calculatePrice, 1000);
    }
  }, [files, printType]);

  const handleCalculate = () => {
    onPriceCalculated(totalPrice);
  };

  const renderFilePreview = (filePreview: FilePreview) => {
    const { file, preview, type, pageCount } = filePreview;
    const fileSizeMB = file.size / 1024 / 1024;

    return (
      <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        {type === 'image' && preview && (
          <img 
            src={preview} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
        
        {type === 'pdf' && (
          <div className="relative w-full h-full">
            {preview ? (
              <>
                <img 
                  src={preview} 
                  alt={`${file.name} - страница 1`}
                  className="max-w-full max-h-full object-contain rounded-lg mx-auto"
                />
                {pageCount && pageCount > 1 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {pageCount} стр.
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                <FileText className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">PDF файл</span>
                {fileSizeMB > 10 && (
                  <span className="text-xs text-orange-600 mt-1">
                    Файл слишком большой для предпросмотра<br />
                    ({fileSizeMB.toFixed(1)} MB &gt; 10 MB)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {type === 'psd' && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <FileImage className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">PSD файл</span>
          </div>
        )}
        
        {!preview && type !== 'psd' && type !== 'pdf' && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <FileText className="w-12 h-12 mb-2" />
            <span className="text-sm">Не удалось загрузить</span>
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs max-w-32 truncate">
          {file.name}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Расчет стоимости печати
          </CardTitle>
          <CardDescription>
            {printType === "roll" ? "Печать в рулоне" : "Печать одного изделия"} • {files.length} файл{files.length > 1 ? (files.length < 5 ? 'а' : 'ов') : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Левая колонка - информация и расчет */}
            <div className="space-y-6">
              {/* Информация о файлах */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Загруженные файлы:</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-blue-500" />
                        ) : file.name.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : (
                          <FileImage className="w-5 h-5 text-purple-500" />
                        )}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Расчет стоимости */}
              <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-4">Расчет стоимости</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Тип печати:</span>
                    <span className="font-semibold">
                      {printType === "roll" ? "Печать в рулоне" : "Одно изделие"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Количество файлов:</span>
                    <span className="font-semibold">{files.length}</span>
                  </div>
                  {printType === "roll" && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      💰 Скидка 20% за печать в рулоне
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-bold">Итого:</span>
                      <span className="font-bold text-orange-600">
                        {totalPrice > 0 ? `${totalPrice} ₽` : 'Рассчитывается...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопка продолжения */}
              {totalPrice > 0 && (
                <Button 
                  onClick={handleCalculate}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  size="lg"
                >
                  Продолжить к оформлению заказа
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Правая колонка - предпросмотр файлов */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Предпросмотр файлов:</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Загрузка предпросмотра...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {previews.length === 1 ? (
                    renderFilePreview(previews[0])
                  ) : (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {previews.map((filePreview, index) => (
                          <CarouselItem key={index}>
                            {renderFilePreview(filePreview)}
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {previews.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  )}
                </div>
              )}

              {previews.length > 1 && (
                <div className="text-center text-sm text-gray-600">
                  Файлов: {previews.length} • Используйте стрелки для навигации
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceCalculator;

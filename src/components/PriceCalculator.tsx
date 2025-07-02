import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, ArrowRight, FileImage, FileText, Image as ImageIcon, Minus, Plus, Info } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import * as pdfjsLib from 'pdfjs-dist';
import DTFInkCalculator, { ColorAnalysis, InkUsage } from '@/utils/dtfInkCalculator';
import { FileAnalyzer, FileAnalysisResult } from '@/utils/fileAnalyzer';

// Настройка worker для PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('PDF.js worker настроен на:', pdfjsLib.GlobalWorkerOptions.workerSrc);
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

interface FileCopy {
  file: File;
  copies: number;
  length: number; // Фіксована довжина для кожного файлу
  width: number; // Ширина для одного виробу
  height: number; // Висота для одного виробу
  sizeType: 'standard' | 'file'; // Тип розміру: стандартний або з файлу
  standardSize: string; // Вибраний стандартний розмір
  inkConsumption: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
    white: number;
  };
  analysisResult?: FileAnalysisResult; // Результат анализа файла
}

// Стандартні розміри для друку одного виробу
const STANDARD_SIZES = [
  { label: '5×5 см', value: '5x5', width: 5, height: 5 },
  { label: '7×7 см', value: '7x7', width: 7, height: 7 },
  { label: '10×10 см', value: '10x10', width: 10, height: 10 },
  { label: '10×15 см', value: '10x15', width: 10, height: 15 },
  { label: 'A5 (14.8×21 см)', value: 'a5', width: 14.8, height: 21 },
  { label: 'A4 (21×29.7 см)', value: 'a4', width: 21, height: 29.7 },
  { label: 'A3 (29.7×42 см)', value: 'a3', width: 29.7, height: 42 },
  { label: 'Розмір файлу', value: 'file', width: 0, height: 0 },
];

const PriceCalculator = ({ files, printType, onPriceCalculated }: PriceCalculatorProps) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fileCopies, setFileCopies] = useState<FileCopy[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  const [dtfCalculator] = useState(new DTFInkCalculator());
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const generatePreview = async (file: File): Promise<FilePreview> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileSizeMB = file.size / 1024 / 1024;

    if (fileType.startsWith('image/')) {
      // Не показываем превью для файлов больше 10MB
      if (fileSizeMB > 10) {
        return { file, preview: '', type: 'image' };
      }
      const preview = URL.createObjectURL(file);
      return { file, preview, type: 'image' };
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Перевіряємо розмір файлу - якщо більше 10MB, не генеруємо попередній перегляд
      if (fileSizeMB > 10) {
        return { file, preview: '', type: 'pdf', pageCount: 0 };
      }
      
      try {
        console.log('Начинаем обработку PDF файла:', file.name, 'размер:', fileSizeMB.toFixed(2), 'MB');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer получен, размер:', arrayBuffer.byteLength);
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer
        });
        
        console.log('Загружаем PDF документ...');
        const pdf = await loadingTask.promise;
        console.log('PDF загружен успешно, страниц:', pdf.numPages);
        
        const page = await pdf.getPage(1);
        console.log('Первая страница получена');
        
        const scale = 1.2;
        const viewport = page.getViewport({ scale });
        console.log('Viewport создан:', viewport.width, 'x', viewport.height);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Не удалось получить контекст canvas');
          return { file, preview: '', type: 'pdf', pageCount: pdf.numPages };
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        console.log('Canvas настроен:', canvas.width, 'x', canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        console.log('Начинаем рендеринг страницы...');
        await page.render(renderContext).promise;
        console.log('Страница отрендерена успешно');
        
        const preview = canvas.toDataURL('image/jpeg', 0.8);
        console.log('DataURL создан, длина:', preview.length);
        
        return { file, preview, type: 'pdf', pageCount: pdf.numPages };
        
      } catch (error) {
        console.error('Ошибка при обработке PDF:', error);
        console.error('Детали ошибки:', error.message, error.stack);
        return { file, preview: '', type: 'pdf', pageCount: 0 };
      }
    }

    if (fileName.endsWith('.psd')) {
      // Для PSD файлів показуємо іконку, оскільки браузер не може їх відобразити безпосередньо
      return { file, preview: '', type: 'psd' };
    }

    // Fallback для непідтримуваних форматів
    return { file, preview: '', type: 'image' };
  };

  useEffect(() => {
    const loadPreviews = async () => {
      setIsLoading(true);
      setIsAnalyzing(true);
      
      const previewPromises = files.map(generatePreview);
      const loadedPreviews = await Promise.all(previewPromises);
      setPreviews(loadedPreviews);
      
      // Анализируем файлы для получения реальных размеров и расхода чернил
      const analyzePromises = files.map(async (file) => {
        try {
          const analysisResult = await FileAnalyzer.analyzeFile(file);
          
          let inkUsage: InkUsage;
          
          if (analysisResult.hasImageData && analysisResult.imageData) {
            // Используем реальный анализ изображения
            const colors = dtfCalculator.analyzeImageColors(
              analysisResult.imageData,
              analysisResult.dimensions.pixelWidth || 800,
              analysisResult.dimensions.pixelHeight || 600
            );
            
            const areaM2 = (analysisResult.dimensions.width * analysisResult.dimensions.height) / 10000;
            inkUsage = dtfCalculator.calculateInkUsageForArea(colors, areaM2);
          } else {
            // Используем средние значения
            inkUsage = dtfCalculator.calculateAverageInkUsage(
              analysisResult.dimensions.width,
              analysisResult.dimensions.height
            );
          }
          
          return {
            file,
            copies: 1,
            length: Math.random() * 22 + 8, // Для рулону
            width: analysisResult.dimensions.width,
            height: analysisResult.dimensions.height,
            sizeType: 'file' as const,
            standardSize: 'file',
            inkConsumption: {
              cyan: inkUsage.cyan,
              magenta: inkUsage.magenta,
              yellow: inkUsage.yellow,
              black: inkUsage.black,
              white: inkUsage.white,
            },
            analysisResult
          };
        } catch (error) {
          console.error('Ошибка анализа файла:', file.name, error);
          // Fallback при ошибке анализа
          const inkUsage = dtfCalculator.calculateAverageInkUsage(10, 10);
          return {
            file,
            copies: 1,
            length: Math.random() * 22 + 8,
            width: 10,
            height: 10,
            sizeType: 'file' as const,
            standardSize: 'file',
            inkConsumption: {
              cyan: inkUsage.cyan,
              magenta: inkUsage.magenta,
              yellow: inkUsage.yellow,
              black: inkUsage.black,
              white: inkUsage.white,
            }
          };
        }
      });
      
      const initialFileCopies = await Promise.all(analyzePromises);
      setFileCopies(initialFileCopies);
      setSelectedFileIndex(0);
      setPreviewFileIndex(0);
      setIsLoading(false);
      setIsAnalyzing(false);
    };

    if (files.length > 0) {
      loadPreviews();
    }
  }, [files, dtfCalculator]);

  // Функція для отримання розмірів файлу (заглушка)
  const getFileDimensions = (file: File) => {
    // Тут можна було б реально отримати розміри зображення
    // Поки що повертаємо випадкові розміри
    return {
      width: Math.random() * 15 + 8,
      height: Math.random() * 15 + 8
    };
  };

  useEffect(() => {
    // Розрахунок ціни з урахуванням скидок
    const calculatePrice = () => {
      let basePrice = printType === "roll" ? 150 : 200;
      
      if (printType === "roll") {
        // Для рулону рахуємо з урахуванням кількості копій та скидок за довжиною
        const totalCopies = fileCopies.reduce((sum, fc) => sum + fc.copies, 0);
        const totalLength = getTotalLength();
        
        let price = basePrice * totalCopies;
        
        // Застосовуємо скидки за довжиною
        const lengthInMeters = totalLength / 100; // конвертуємо см в метри
        if (lengthInMeters >= 10) {
          price *= 0.9; // 10% знижка
        } else if (lengthInMeters >= 5) {
          price *= 0.95; // 5% знижка
        }
        
        price += Math.floor(Math.random() * 100);
        setTotalPrice(Math.round(price));
      } else {
        // Для одного файлу теж враховуємо кількість копій
        const totalCopies = fileCopies.reduce((sum, fc) => sum + fc.copies, 0);
        let price = basePrice * totalCopies;
        price += Math.floor(Math.random() * 100);
        setTotalPrice(price);
      }
    };

    if (files.length > 0 && fileCopies.length > 0) {
      setTimeout(calculatePrice, 1000);
    }
  }, [files, printType, fileCopies]);

  const updateCopies = (fileIndex: number, newCopies: number) => {
    if (newCopies < 1) return;
    setFileCopies(prev => 
      prev.map((fc, index) => 
        index === fileIndex ? { ...fc, copies: newCopies } : fc
      )
    );
  };

  const updateFileSize = (fileIndex: number, sizeValue: string) => {
    const selectedSize = STANDARD_SIZES.find(size => size.value === sizeValue);
    if (!selectedSize) return;

    setFileCopies(prev => 
      prev.map((fc, index) => {
        if (index === fileIndex) {
          const newWidth = sizeValue === 'file' ? 
            (fc.analysisResult?.dimensions.width || 10) : selectedSize.width;
          const newHeight = sizeValue === 'file' ? 
            (fc.analysisResult?.dimensions.height || 10) : selectedSize.height;
          
          // Пересчитываем расход чернил для нового размера
          let newInkUsage: InkUsage;
          
          if (sizeValue === 'file' && fc.analysisResult?.hasImageData && fc.analysisResult.imageData) {
            // Используем реальный анализ изображения с новыми размерами
            const colors = dtfCalculator.analyzeImageColors(
              fc.analysisResult.imageData,
              fc.analysisResult.dimensions.pixelWidth || 800,
              fc.analysisResult.dimensions.pixelHeight || 600
            );
            const areaM2 = (newWidth * newHeight) / 10000;
            newInkUsage = dtfCalculator.calculateInkUsageForArea(colors, areaM2);
          } else {
            // Используем средние значения
            newInkUsage = dtfCalculator.calculateAverageInkUsage(newWidth, newHeight);
          }
          
          return { 
            ...fc, 
            standardSize: sizeValue,
            sizeType: sizeValue === 'file' ? 'file' : 'standard',
            width: newWidth,
            height: newHeight,
            inkConsumption: {
              cyan: newInkUsage.cyan,
              magenta: newInkUsage.magenta,
              yellow: newInkUsage.yellow,
              black: newInkUsage.black,
              white: newInkUsage.white,
            }
          };
        }
        return fc;
      })
    );
  };

  const getTotalInkConsumption = () => {
    return fileCopies.reduce((total, fc) => {
      const fileTotal = (fc.inkConsumption.cyan + fc.inkConsumption.magenta + fc.inkConsumption.yellow + fc.inkConsumption.black + fc.inkConsumption.white) * fc.copies;
      return total + fileTotal;
    }, 0);
  };

  const getTotalLength = () => {
    return fileCopies.reduce((total, fc) => {
      return total + (fc.length * fc.copies);
    }, 0);
  };

  const getDiscountPercentage = () => {
    const lengthInMeters = getTotalLength() / 100;
    if (lengthInMeters >= 10) return 10;
    if (lengthInMeters >= 5) return 5;
    return 0;
  };

  const getInkCost = () => {
    return fileCopies.reduce((total, fc) => {
      const inkUsage = {
        cyan: fc.inkConsumption.cyan * fc.copies,
        magenta: fc.inkConsumption.magenta * fc.copies,
        yellow: fc.inkConsumption.yellow * fc.copies,
        black: fc.inkConsumption.black * fc.copies,
        white: fc.inkConsumption.white * fc.copies,
      };
      return total + dtfCalculator.calculateInkCost(inkUsage);
    }, 0);
  };

  const getFilmCost = () => {
    if (printType === "roll") {
      const lengthInMeters = getTotalLength() / 100; // конвертуємо см в метри
      return lengthInMeters * 35; // 35 грн за 1 метр
    }
    return 0; // для одного виробу пленка не рахується
  };

  const getEquipmentCost = () => {
    return 99; // змінена вартість на 99 грн
  };

  const handleCalculate = () => {
    onPriceCalculated(totalPrice);
  };

  const renderFilePreview = (filePreview: FilePreview) => {
    const { file, preview, type, pageCount } = filePreview;
    const fileSizeMB = file.size / 1024 / 1024;

    return (
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        {type === 'image' && preview && (
          <img 
            src={preview} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
        
        {type === 'image' && !preview && (
          <div className="flex flex-col items-center justify-center text-gray-500 p-4 text-center">
            <ImageIcon className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">Зображення</span>
            {fileSizeMB > 10 && (
              <span className="text-xs text-orange-600 mt-1">
                Файл надто великий для попереднього перегляду<br />
                ({fileSizeMB.toFixed(1)} MB &gt; 10 MB)
              </span>
            )}
          </div>
        )}
        
        {type === 'pdf' && (
          <div className="relative w-full h-full">
            {preview ? (
              <>
                <img 
                  src={preview} 
                  alt={`${file.name} - сторінка 1`}
                  className="max-w-full max-h-full object-contain rounded-lg mx-auto"
                />
                {pageCount && pageCount > 1 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {pageCount} стор.
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                <FileText className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">PDF файл</span>
                {fileSizeMB > 10 && (
                  <span className="text-xs text-orange-600 mt-1">
                    Файл надто великий для попереднього перегляду<br />
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
        
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs max-w-32 truncate">
          {file.name}
        </div>
      </div>
    );
  };

  const handleFileSelect = (index: number) => {
    setPreviewFileIndex(index);
    setSelectedFileIndex(index);
  };

  return (
    <div className="w-full">
      <Card className="max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Розрахунок вартості друку
          </CardTitle>
          <CardDescription>
            {printType === "roll" ? "Друк у рулоні" : "Друк одного виробу"} • {files.length} файл{files.length > 1 ? (files.length < 5 ? 'и' : 'ів') : ''}
            {isAnalyzing && (
              <span className="ml-2 text-orange-600">
                • Аналізуємо файли...
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Ліва колонка - інформація про файли */}
            <div className="space-y-4 lg:space-y-6">
               {/* Інформація про файли */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Завантажені файли:</h3>
                 <div className="space-y-3">
                   {files.map((file, index) => (
                     <div 
                       key={index} 
                       className={`p-3 lg:p-4 rounded-lg cursor-pointer transition-colors ${
                         previewFileIndex === index 
                           ? "bg-blue-100 border-2 border-blue-300" 
                           : selectedFileIndex === index
                             ? "bg-orange-100 border-2 border-orange-300"
                             : "bg-gray-50 hover:bg-gray-100"
                       }`}
                       onClick={() => handleFileSelect(index)}
                     >
                       <div className="space-y-3">
                         <div className="flex items-start gap-3">
                           <div className="flex-shrink-0 mt-0.5">
                             {file.type.startsWith('image/') ? (
                               <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
                             ) : file.name.toLowerCase().endsWith('.pdf') ? (
                               <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" />
                             ) : (
                               <FileImage className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                             )}
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="font-medium text-sm lg:text-base break-words">{file.name}</p>
                             <div className="text-xs lg:text-sm text-gray-500 space-y-1">
                               <div>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                               {fileCopies[index] && (
                                 <div className="text-green-600">
                                   {fileCopies[index].width.toFixed(1)}×{fileCopies[index].height.toFixed(1)} см
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                         
                         {fileCopies[index] && (
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-200">
                             <div className="text-xs lg:text-sm text-gray-600">
                               Копій: {fileCopies[index].copies}
                             </div>
                             <div className="text-xs text-blue-600">
                               {((fileCopies[index].inkConsumption.cyan + fileCopies[index].inkConsumption.magenta + fileCopies[index].inkConsumption.yellow + fileCopies[index].inkConsumption.black + fileCopies[index].inkConsumption.white) * fileCopies[index].copies).toFixed(1)} мл
                             </div>
                           </div>
                         )}
                         
                         {previewFileIndex === index && (
                           <div className="text-xs lg:text-sm text-blue-600 flex items-center gap-2">
                             👁 Відображається у попередньому перегляді
                           </div>
                         )}
                         {selectedFileIndex === index && previewFileIndex !== index && (
                           <div className="text-xs lg:text-sm text-orange-600">
                             ← Обрано для налаштування
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            {/* Права колонка - попередній перегляд файлів */}
            <div className="space-y-4 order-first lg:order-last">
              <h3 className="text-lg font-semibold">Попередній перегляд файлу:</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center aspect-square bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Завантаження попереднього перегляду...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {previews[previewFileIndex] && renderFilePreview(previews[previewFileIndex])}
                </div>
              )}

              {previews.length > 1 && (
                <div className="text-center text-sm text-gray-600">
                  Файл {previewFileIndex + 1} з {previews.length} • Натисніть на файл ліворуч для перегляду
                </div>
              )}
            </div>
          </div>

          {/* Налаштування файлу */}
          {fileCopies.length > 0 && selectedFileIndex !== null && (
            <Card className="bg-gray-50 border-gray-200 mt-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800">
                  Налаштування файлу: {files[selectedFileIndex].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 gap-6">
                   {/* Кількість копій */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Кількість копій
                     </label>
                     <div className="flex items-center justify-center gap-3">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => updateCopies(selectedFileIndex, fileCopies[selectedFileIndex].copies - 1)}
                         disabled={fileCopies[selectedFileIndex].copies <= 1}
                         className="h-10 w-10"
                       >
                         <Minus className="w-4 h-4" />
                       </Button>
                       <Input
                         type="number"
                         min="1"
                         value={fileCopies[selectedFileIndex].copies}
                         onChange={(e) => updateCopies(selectedFileIndex, parseInt(e.target.value) || 1)}
                         className="w-20 text-center h-10"
                       />
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => updateCopies(selectedFileIndex, fileCopies[selectedFileIndex].copies + 1)}
                         className="h-10 w-10"
                       >
                         <Plus className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>

                  {/* Розмір файлу */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {printType === "roll" ? "Розмір файлу" : "Розмір друку"}
                    </label>
                    {printType === "roll" ? (
                      <div className="text-lg font-semibold text-gray-800">
                        {fileCopies[selectedFileIndex] && fileCopies[selectedFileIndex].length ? 
                          `${fileCopies[selectedFileIndex].width.toFixed(1)} × ${fileCopies[selectedFileIndex].length.toFixed(1)} см` : 
                          'Розраховується...'
                        }
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          value={fileCopies[selectedFileIndex].standardSize}
                          onValueChange={(value) => updateFileSize(selectedFileIndex, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть розмір" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_SIZES.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-sm text-gray-600">
                          Поточний розмір: {fileCopies[selectedFileIndex].width.toFixed(1)} × {fileCopies[selectedFileIndex].height.toFixed(1)} см
                          {fileCopies[selectedFileIndex].analysisResult?.dimensions.dpi && (
                            <span className="text-xs text-blue-600 ml-2">
                              ({fileCopies[selectedFileIndex].analysisResult?.dimensions.pixelWidth}×{fileCopies[selectedFileIndex].analysisResult?.dimensions.pixelHeight}px, {fileCopies[selectedFileIndex].analysisResult?.dimensions.dpi} DPI)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DTF витрати чорнил */}
          {fileCopies.length > 0 && selectedFileIndex !== null && (
            <Card className="bg-blue-50 border-blue-200 mt-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  🎨 Витрати чорнил DTF
                  {fileCopies[selectedFileIndex]?.analysisResult?.hasImageData && (
                    <span className="text-sm text-green-600">• Реальний аналіз</span>
                  )}
                </CardTitle>
              </CardHeader>
               <CardContent className="space-y-4 lg:space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                   <div>
                     <div className="text-sm text-gray-600 mb-1">Загальні витрати:</div>
                     <div className="text-xl lg:text-2xl font-bold text-blue-900">
                       {getTotalInkConsumption().toFixed(1)} мл
                     </div>
                   </div>
                  
                   <div>
                     <div className="text-sm text-gray-600 mb-3">Витрати за кольорами:</div>
                     <div className="flex flex-wrap items-end gap-2 lg:gap-3">
                       {/* Первая строка - первые 3 цвета */}
                       <div className="flex items-end gap-2 lg:gap-3 w-full justify-center sm:justify-start sm:w-auto">
                         {/* Cyan */}
                         <div className="flex flex-col items-center">
                           <div 
                             className="w-6 sm:w-7 lg:w-8 bg-cyan-400 rounded-t"
                             style={{ 
                               height: `${Math.max(6, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.cyan * fc.copies, 0) / getTotalInkConsumption()) * 40)}px` 
                             }}
                           ></div>
                           <div className="text-xs text-center mt-1 max-w-16">
                             <div className="font-medium text-xs leading-tight">Блакитний</div>
                             <div className="text-gray-600 text-xs">
                               {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.cyan * fc.copies, 0).toFixed(1)} мл
                             </div>
                           </div>
                         </div>
                         
                         {/* Magenta */}
                         <div className="flex flex-col items-center">
                           <div 
                             className="w-6 sm:w-7 lg:w-8 bg-pink-400 rounded-t"
                             style={{ 
                               height: `${Math.max(6, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.magenta * fc.copies, 0) / getTotalInkConsumption()) * 40)}px` 
                             }}
                           ></div>
                           <div className="text-xs text-center mt-1 max-w-16">
                             <div className="font-medium text-xs leading-tight">Пурпурний</div>
                             <div className="text-gray-600 text-xs">
                               {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.magenta * fc.copies, 0).toFixed(1)} мл
                             </div>
                           </div>
                         </div>
                         
                         {/* Yellow */}
                         <div className="flex flex-col items-center">
                           <div 
                             className="w-6 sm:w-7 lg:w-8 bg-yellow-400 rounded-t"
                             style={{ 
                               height: `${Math.max(6, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.yellow * fc.copies, 0) / getTotalInkConsumption()) * 40)}px` 
                             }}
                           ></div>
                           <div className="text-xs text-center mt-1 max-w-16">
                             <div className="font-medium text-xs leading-tight">Жовтий</div>
                             <div className="text-gray-600 text-xs">
                               {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.yellow * fc.copies, 0).toFixed(1)} мл
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Вторая строка на мобильных - последние 2 цвета */}
                       <div className="flex items-end gap-2 lg:gap-3 w-full justify-center sm:justify-start sm:w-auto">
                         {/* Black */}
                         <div className="flex flex-col items-center">
                           <div 
                             className="w-6 sm:w-7 lg:w-8 bg-gray-800 rounded-t"
                             style={{ 
                               height: `${Math.max(6, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.black * fc.copies, 0) / getTotalInkConsumption()) * 40)}px` 
                             }}
                           ></div>
                           <div className="text-xs text-center mt-1 max-w-16">
                             <div className="font-medium text-xs leading-tight">Чорний</div>
                             <div className="text-gray-600 text-xs">
                               {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.black * fc.copies, 0).toFixed(1)} мл
                             </div>
                           </div>
                         </div>

                         {/* White */}
                         <div className="flex flex-col items-center">
                           <div 
                             className="w-6 sm:w-7 lg:w-8 bg-gray-300 border border-gray-400 rounded-t"
                             style={{ 
                               height: `${Math.max(6, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.white * fc.copies, 0) / getTotalInkConsumption()) * 40)}px` 
                             }}
                           ></div>
                           <div className="text-xs text-center mt-1 max-w-16">
                             <div className="font-medium text-xs leading-tight">Білий</div>
                             <div className="text-gray-600 text-xs">
                               {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.white * fc.copies, 0).toFixed(1)} мл
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Розрахунок вартості */}
          <div className="p-4 lg:p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 mt-6 lg:mt-8">
            <h3 className="text-lg lg:text-xl font-bold text-orange-800 mb-4">Розрахунок вартості</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm lg:text-base">Тип друку:</span>
                <span className="font-semibold text-sm lg:text-base">
                  {printType === "roll" ? "Друк у рулоні" : "Один виріб"}
                </span>
              </div>
              {printType === "roll" ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    Загальна довжина:
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Знижки за довжиною:</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>До 5 метрів:</span>
                              <span className="text-gray-600">Базова ціна</span>
                            </div>
                            <div className="flex justify-between">
                              <span>5-10 метрів:</span>
                              <span className="text-green-600">-5%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Понад 10 метрів:</span>
                              <span className="text-green-600">-10%</span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </span>
                  <span className="font-semibold">
                    {getTotalLength().toFixed(1)} см ({(getTotalLength() / 100).toFixed(2)} м)
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Загальна кількість копій:</span>
                  <span className="font-semibold">{fileCopies.reduce((sum, fc) => sum + fc.copies, 0)}</span>
                </div>
              )}
              {printType === "roll" && getDiscountPercentage() > 0 && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  💰 Знижка {getDiscountPercentage()}% за довжину
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold flex items-center gap-2">
                    Підсумок:
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2 text-sm">
                          <h4 className="font-medium">Деталізація вартості:</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Чорнила ({getTotalInkConsumption().toFixed(1)} мл):</span>
                              <span>{getInkCost().toFixed(0)} ₴</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              Розраховано з використанням DTF калькулятора з реальним аналізом файлів
                            </div>
                            {printType === "roll" && (
                              <>
                                <div className="flex justify-between">
                                  <span>Плівка:</span>
                                  <span>{getFilmCost().toFixed(0)} ₴</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  {(getTotalLength() / 100).toFixed(2)} м × 35 ₴/м
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span>Робота обладнання:</span>
                              <span>{getEquipmentCost()} ₴</span>
                            </div>
                            <div className="border-t pt-1 mt-1">
                              <div className="flex justify-between font-medium">
                                <span>Всього:</span>
                                <span>{(getInkCost() + getFilmCost() + getEquipmentCost()).toFixed(0)} ₴</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </span>
                  <span className="font-bold text-orange-600">
                    {totalPrice > 0 ? `${totalPrice} ₴` : 'Розраховується...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

           {/* Кнопка продовження */}
           {totalPrice > 0 && (
             <Button 
               onClick={handleCalculate}
               className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 mt-4 lg:mt-6 text-sm lg:text-base"
               size="lg"
             >
               До оформлення замовлення
               <ArrowRight className="ml-2 w-4 h-4" />
             </Button>
           )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceCalculator;

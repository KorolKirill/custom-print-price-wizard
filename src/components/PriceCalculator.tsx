import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calculator, ArrowRight, FileImage, FileText, Image as ImageIcon, Minus, Plus, Info } from "lucide-react";
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

interface FileCopy {
  file: File;
  copies: number;
  length: number; // Фіксована довжина для кожного файлу
  inkConsumption: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  };
}

const PriceCalculator = ({ files, printType, onPriceCalculated }: PriceCalculatorProps) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [fileCopies, setFileCopies] = useState<FileCopy[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);

  const generatePreview = async (file: File): Promise<FilePreview> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileSizeMB = file.size / 1024 / 1024;

    if (fileType.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      return { file, preview, type: 'image' };
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Перевіряємо розмір файлу - якщо більше 10MB, не генеруємо попередній перегляд
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
        console.error('Помилка при обробці PDF:', error);
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
      const previewPromises = files.map(generatePreview);
      const loadedPreviews = await Promise.all(previewPromises);
      setPreviews(loadedPreviews);
      setIsLoading(false);
    };

    if (files.length > 0) {
      loadPreviews();
      // Ініціалізуємо кількість копій та витрати чорнила для кожного файлу
      const initialFileCopies = files.map(file => ({
        file,
        copies: 1,
        length: Math.random() * 22 + 8, // Генеруємо фіксовану довжину один раз
        inkConsumption: {
          cyan: Math.floor(Math.random() * 20) + 5,
          magenta: Math.floor(Math.random() * 20) + 5,
          yellow: Math.floor(Math.random() * 20) + 5,
          black: Math.floor(Math.random() * 20) + 5,
        }
      }));
      setFileCopies(initialFileCopies);
      // Вибираємо перший файл за замовчуванням для будь-якого режиму
      setSelectedFileIndex(0);
      // Встановлюємо перший файл для попереднього перегляду
      setPreviewFileIndex(0);
    }
  }, [files]);

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

  const updateInkConsumption = (fileIndex: number, color: keyof FileCopy['inkConsumption'], value: number) => {
    setFileCopies(prev => 
      prev.map((fc, index) => 
        index === fileIndex ? { 
          ...fc, 
          inkConsumption: { ...fc.inkConsumption, [color]: Math.max(0, value) }
        } : fc
      )
    );
  };

  const getTotalInkConsumption = () => {
    return fileCopies.reduce((total, fc) => {
      const fileTotal = (fc.inkConsumption.cyan + fc.inkConsumption.magenta + fc.inkConsumption.yellow + fc.inkConsumption.black) * fc.copies;
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
        
        {!preview && type !== 'psd' && type !== 'pdf' && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <FileText className="w-12 h-12 mb-2" />
            <span className="text-sm">Не вдалося завантажити</span>
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
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Розрахунок вартості друку
          </CardTitle>
          <CardDescription>
            {printType === "roll" ? "Друк у рулоні" : "Друк одного виробу"} • {files.length} файл{files.length > 1 ? (files.length < 5 ? 'и' : 'ів') : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ліва колонка - інформація про файли */}
            <div className="space-y-6">
              {/* Інформація про файли */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Завантажені файли:</h3>
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        previewFileIndex === index 
                          ? "bg-blue-100 border-2 border-blue-300" 
                          : selectedFileIndex === index
                            ? "bg-orange-100 border-2 border-orange-300"
                            : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => handleFileSelect(index)}
                    >
                      <div className="flex items-center justify-between">
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
                        {fileCopies[index] && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Копій: {fileCopies[index].copies}</p>
                            <p className="text-xs text-blue-600">
                              {((fileCopies[index].inkConsumption.cyan + fileCopies[index].inkConsumption.magenta + fileCopies[index].inkConsumption.yellow + fileCopies[index].inkConsumption.black) * fileCopies[index].copies).toFixed(1)} мл
                            </p>
                          </div>
                        )}
                      </div>
                      {previewFileIndex === index && (
                        <div className="mt-2 text-sm text-blue-600">
                          👁 Відображається у попередньому перегляді
                        </div>
                      )}
                      {selectedFileIndex === index && previewFileIndex !== index && (
                        <div className="mt-2 text-sm text-orange-600">
                          ← Обрано для налаштування
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Права колонка - попередній перегляд файлів */}
            <div className="space-y-4">
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

          {/* Налаштування файлу - окремий блок для будь-якого режиму */}
          {fileCopies.length > 0 && selectedFileIndex !== null && (
            <Card className="bg-gray-50 border-gray-200 mt-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800">
                  Налаштування файлу: {files[selectedFileIndex].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Кількість копій */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Кількість копій
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCopies(selectedFileIndex, fileCopies[selectedFileIndex].copies - 1)}
                        disabled={fileCopies[selectedFileIndex].copies <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={fileCopies[selectedFileIndex].copies}
                        onChange={(e) => updateCopies(selectedFileIndex, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCopies(selectedFileIndex, fileCopies[selectedFileIndex].copies + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Розмір файлу */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Розмір файлу
                    </label>
                    <div className="text-lg font-semibold text-gray-800">
                      {fileCopies[selectedFileIndex] && fileCopies[selectedFileIndex].length ? 
                        `${(Math.random() * 15 + 8).toFixed(1)} × ${fileCopies[selectedFileIndex].length.toFixed(1)} см` : 
                        'Розраховується...'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DTF витрати чорнил - окремий блок для будь-якого режиму */}
          {fileCopies.length > 0 && selectedFileIndex !== null && (
            <Card className="bg-blue-50 border-blue-200 mt-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  🎨 Витрати чорнил DTF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Загальні витрати:</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {getTotalInkConsumption().toFixed(1)} мл
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Вартість фарби:</div>
                    <div className="text-xl font-semibold text-blue-700">
                      {Math.round(getTotalInkConsumption() * 1.8)} ₴
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-3">Витрати за кольорами:</div>
                    <div className="flex items-end gap-3 h-16">
                      {/* Cyan */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-cyan-400 rounded-t"
                          style={{ 
                            height: `${Math.max(8, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.cyan * fc.copies, 0) / getTotalInkConsumption()) * 56)}px` 
                          }}
                        ></div>
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium">Блакитний</div>
                          <div className="text-gray-600">
                            {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.cyan * fc.copies, 0).toFixed(1)} мл
                          </div>
                        </div>
                      </div>
                      
                      {/* Magenta */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-pink-400 rounded-t"
                          style={{ 
                            height: `${Math.max(8, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.magenta * fc.copies, 0) / getTotalInkConsumption()) * 56)}px` 
                          }}
                        ></div>
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium">Пурпурний</div>
                          <div className="text-gray-600">
                            {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.magenta * fc.copies, 0).toFixed(1)} мл
                          </div>
                        </div>
                      </div>
                      
                      {/* Yellow */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-yellow-400 rounded-t"
                          style={{ 
                            height: `${Math.max(8, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.yellow * fc.copies, 0) / getTotalInkConsumption()) * 56)}px` 
                          }}
                        ></div>
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium">Жовтий</div>
                          <div className="text-gray-600">
                            {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.yellow * fc.copies, 0).toFixed(1)} мл
                          </div>
                        </div>
                      </div>
                      
                      {/* Black */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-gray-800 rounded-t"
                          style={{ 
                            height: `${Math.max(8, (fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.black * fc.copies, 0) / getTotalInkConsumption()) * 56)}px` 
                          }}
                        ></div>
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium">Чорний</div>
                          <div className="text-gray-600">
                            {fileCopies.reduce((sum, fc) => sum + fc.inkConsumption.black * fc.copies, 0).toFixed(1)} мл
                          </div>
                        </div>
                      </div>

                      {/* White */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-gray-300 border border-gray-400 rounded-t"
                          style={{ height: `${Math.max(8, 80 * 0.15)}px` }}
                        ></div>
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium">Білий</div>
                          <div className="text-gray-600">
                            {(getTotalInkConsumption() * 0.15).toFixed(1)} мл
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Розрахунок вартості - на всю ширину */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 mt-8">
            <h3 className="text-xl font-bold text-orange-800 mb-4">Розрахунок вартості</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Тип друку:</span>
                <span className="font-semibold">
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
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700 font-medium">Загальні витрати чорнил:</span>
                <span className="font-bold text-blue-600">
                  {getTotalInkConsumption().toFixed(1)} мл
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold">Підсумок:</span>
                  <span className="font-bold text-orange-600">
                    {totalPrice > 0 ? `${totalPrice} ₴` : 'Розраховується...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка продовження - на всю ширину */}
          {totalPrice > 0 && (
            <Button 
              onClick={handleCalculate}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 mt-6"
              size="lg"
            >
              Продовжити до оформлення замовлення
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceCalculator;

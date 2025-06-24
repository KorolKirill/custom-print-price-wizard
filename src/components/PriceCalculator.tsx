import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, ArrowRight, FileImage, FileText, Image as ImageIcon, Minus, Plus } from "lucide-react";
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
      // Инициализируем количество копий и расход краски для каждого файла
      const initialFileCopies = files.map(file => ({
        file,
        copies: 1,
        inkConsumption: {
          cyan: Math.floor(Math.random() * 20) + 5,
          magenta: Math.floor(Math.random() * 20) + 5,
          yellow: Math.floor(Math.random() * 20) + 5,
          black: Math.floor(Math.random() * 20) + 5,
        }
      }));
      setFileCopies(initialFileCopies);
      // Выбираем первый файл по умолчанию для режима рулона
      if (printType === "roll") {
        setSelectedFileIndex(0);
      }
    }
  }, [files]);

  useEffect(() => {
    // Заглушка для расчета цены
    const calculatePrice = () => {
      let basePrice = printType === "roll" ? 150 : 200;
      
      if (printType === "roll") {
        // Для рулона считаем с учетом количества копий
        const totalCopies = fileCopies.reduce((sum, fc) => sum + fc.copies, 0);
        let price = basePrice * totalCopies;
        price += Math.floor(Math.random() * 100);
        setTotalPrice(price);
      } else {
        let price = basePrice * files.length;
        price += Math.floor(Math.random() * 100);
        setTotalPrice(price);
      }
    };

    if (files.length > 0 && (printType !== "roll" || fileCopies.length > 0)) {
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
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        printType === "roll" 
                          ? (selectedFileIndex === index ? "bg-orange-100 border-2 border-orange-300" : "bg-gray-50 hover:bg-gray-100")
                          : "bg-gray-50"
                      }`}
                      onClick={() => printType === "roll" && setSelectedFileIndex(index)}
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
                        {printType === "roll" && fileCopies[index] && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Копий: {fileCopies[index].copies}</p>
                            <p className="text-xs text-blue-600">
                              {((fileCopies[index].inkConsumption.cyan + fileCopies[index].inkConsumption.magenta + fileCopies[index].inkConsumption.yellow + fileCopies[index].inkConsumption.black) * fileCopies[index].copies).toFixed(1)} мл
                            </p>
                          </div>
                        )}
                      </div>
                      {printType === "roll" && selectedFileIndex === index && (
                        <div className="mt-2 text-sm text-orange-600">
                          ← Выбран для настройки
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DTF Ink Consumption Display */}
              {printType === "roll" && fileCopies.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      🎨 Расход краски DTF
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Общий расход:</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {getTotalInkConsumption().toFixed(1)} мл
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Стоимость краски:</div>
                        <div className="text-xl font-semibold text-blue-700">
                          {Math.round(getTotalInkConsumption() * 1.8)} ₽
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 mb-3">Расход по цветам:</div>
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
                              <div className="font-medium">Cyan</div>
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
                              <div className="font-medium">Magenta</div>
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
                              <div className="font-medium">Yellow</div>
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
                              <div className="font-medium">Black</div>
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
                              <div className="font-medium">White</div>
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
                  {printType === "roll" ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Общее количество копий:</span>
                      <span className="font-semibold">
                        {fileCopies.reduce((sum, fc) => sum + fc.copies, 0)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Количество файлов:</span>
                      <span className="font-semibold">{files.length}</span>
                    </div>
                  )}
                  {printType === "roll" && (
                    <>
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        💰 Скидка 20% за печать в рулоне
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-700 font-medium">Общий расход краски:</span>
                        <span className="font-bold text-blue-600">
                          {getTotalInkConsumption().toFixed(1)} мл
                        </span>
                      </div>
                    </>
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

          {/* Настройки выбранного файла для рулонаной печати */}
          {printType === "roll" && selectedFileIndex !== null && fileCopies[selectedFileIndex] && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Настройки файла: {files[selectedFileIndex].name}
              </h3>
              
              {/* Количество копий */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество копий
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

              {/* Расход краски по цветам */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Расход краски (мл на одну копию)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Cyan */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Голубой (Cyan)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={fileCopies[selectedFileIndex].inkConsumption.cyan}
                        onChange={(e) => updateInkConsumption(selectedFileIndex, 'cyan', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                      <span className="text-xs text-gray-500">мл</span>
                    </div>
                  </div>

                  {/* Magenta */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Пурпурный (Magenta)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-pink-500 rounded"></div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={fileCopies[selectedFileIndex].inkConsumption.magenta}
                        onChange={(e) => updateInkConsumption(selectedFileIndex, 'magenta', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                      <span className="text-xs text-gray-500">мл</span>
                    </div>
                  </div>

                  {/* Yellow */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Желтый (Yellow)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={fileCopies[selectedFileIndex].inkConsumption.yellow}
                        onChange={(e) => updateInkConsumption(selectedFileIndex, 'yellow', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                      <span className="text-xs text-gray-500">мл</span>
                    </div>
                  </div>

                  {/* Black */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Черный (Black)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-black rounded"></div>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={fileCopies[selectedFileIndex].inkConsumption.black}
                        onChange={(e) => updateInkConsumption(selectedFileIndex, 'black', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                      <span className="text-xs text-gray-500">мл</span>
                    </div>
                  </div>
                </div>

                {/* Общий расход для выбранного файла */}
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">Общий расход на {fileCopies[selectedFileIndex].copies} копий:</span>
                    <span className="font-bold text-blue-800">
                      {((fileCopies[selectedFileIndex].inkConsumption.cyan + 
                        fileCopies[selectedFileIndex].inkConsumption.magenta + 
                        fileCopies[selectedFileIndex].inkConsumption.yellow + 
                        fileCopies[selectedFileIndex].inkConsumption.black) * 
                        fileCopies[selectedFileIndex].copies).toFixed(1)} мл
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceCalculator;

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, FileText, Palette, Ruler, Scroll, Image as ImageIcon } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

// Настройка worker для PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PriceCalculatorProps {
  files: File[];
  onPriceCalculated: (price: number) => void;
}

interface PriceOption {
  size: string;
  basePrice: number;
  description: string;
}

interface InkCalculation {
  totalInkUsage: number;
  colorBreakdown: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
    white: number;
  };
  estimatedCost: number;
}

interface FileDimensions {
  width: number;
  height: number;
  size: string;
}

const PriceCalculator = ({ files, onPriceCalculated }: PriceCalculatorProps) => {
  const [printType, setPrintType] = useState("single"); // "single" или "roll"
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [inkCalculation, setInkCalculation] = useState<InkCalculation | null>(null);
  const [fileDimensions, setFileDimensions] = useState<FileDimensions | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Мок-данные для расчета стоимости
  const priceOptions: PriceOption[] = [
    { size: "A6", basePrice: 150, description: "10.5 x 14.8 см" },
    { size: "A5", basePrice: 280, description: "14.8 x 21 см" },
    { size: "A4", basePrice: 450, description: "21 x 29.7 см" },
    { size: "A3", basePrice: 750, description: "29.7 x 42 см" },
    { size: "custom", basePrice: 300, description: "Индивидуальный размер" },
    { size: "auto", basePrice: 0, description: "Размер из файла" },
  ];

  // Создание превью для файлов
  useEffect(() => {
    const createPreviews = async () => {
      const urls: string[] = [];
      
      for (const file of files.slice(0, 3)) { // Показываем первые 3 файла
        if (file.type.startsWith('image/')) {
          urls.push(URL.createObjectURL(file));
        } else if (file.type === 'application/pdf') {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context!, viewport }).promise;
            urls.push(canvas.toDataURL());
          } catch (error) {
            console.error('Ошибка создания превью PDF:', error);
          }
        }
      }
      
      setPreviewUrls(urls);
    };

    if (files.length > 0) {
      createPreviews();
    }

    return () => {
      // Очистка URL объектов
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  // Компонент для отображения расхода краски в виде колбочек
  const InkTubes = ({ inkData }: { inkData: InkCalculation }) => {
    const maxInk = 100; // максимальное значение для визуализации
    const colors = [
      { name: 'Cyan', value: inkData.colorBreakdown.cyan, color: 'bg-cyan-400', bgColor: 'bg-cyan-100' },
      { name: 'Magenta', value: inkData.colorBreakdown.magenta, color: 'bg-pink-400', bgColor: 'bg-pink-100' },
      { name: 'Yellow', value: inkData.colorBreakdown.yellow, color: 'bg-yellow-400', bgColor: 'bg-yellow-100' },
      { name: 'Black', value: inkData.colorBreakdown.black, color: 'bg-gray-700', bgColor: 'bg-gray-100' },
      { name: 'White', value: inkData.colorBreakdown.white, color: 'bg-blue-400', bgColor: 'bg-blue-100' },
    ];

    return (
      <div className="grid grid-cols-5 gap-3">
        {colors.map((ink) => {
          const percentage = Math.min((ink.value / maxInk) * 100, 100);
          
          return (
            <div key={ink.name} className="flex flex-col items-center">
              <div className={`w-8 h-24 ${ink.bgColor} rounded-lg border-2 border-gray-300 relative overflow-hidden`}>
                <div 
                  className={`${ink.color} absolute bottom-0 w-full transition-all duration-300 rounded-b-md`}
                  style={{ height: `${percentage}%` }}
                />
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-400 rounded-sm" />
              </div>
              <p className="text-xs font-medium mt-2 text-center">{ink.name}</p>
              <p className="text-xs text-gray-600">{ink.value} мл</p>
            </div>
          );
        })}
      </div>
    );
  };

  const getFileDimensions = async (file: File): Promise<FileDimensions> => {
    return new Promise(async (resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const widthCm = Math.round((img.width / 300) * 2.54 * 10) / 10; // Предполагаем 300 DPI
          const heightCm = Math.round((img.height / 300) * 2.54 * 10) / 10;
          
          // Определяем ближайший стандартный размер
          let detectedSize = "custom";
          if (widthCm <= 11 && heightCm <= 15) detectedSize = "A6";
          else if (widthCm <= 15 && heightCm <= 22) detectedSize = "A5";
          else if (widthCm <= 22 && heightCm <= 30) detectedSize = "A4";
          else if (widthCm <= 30 && heightCm <= 43) detectedSize = "A3";
          
          resolve({
            width: widthCm,
            height: heightCm,
            size: detectedSize
          });
        };
        img.src = URL.createObjectURL(file);
      } else if (file.type === 'application/pdf') {
        try {
          // Читаем PDF файл
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1); // Берем первую страницу
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Конвертируем размеры из points в сантиметры (1 point = 1/72 inch, 1 inch = 2.54 cm)
          const widthCm = Math.round((viewport.width / 72) * 2.54 * 10) / 10;
          const heightCm = Math.round((viewport.height / 72) * 2.54 * 10) / 10;
          
          console.log(`PDF размеры: ${widthCm}x${heightCm} см`);
          
          // Определяем ближайший стандартный размер
          let detectedSize = "custom";
          if (widthCm <= 11 && heightCm <= 15) detectedSize = "A6";
          else if (widthCm <= 15 && heightCm <= 22) detectedSize = "A5";
          else if (widthCm <= 22 && heightCm <= 30) detectedSize = "A4";
          else if (widthCm <= 30 && heightCm <= 43) detectedSize = "A3";
          
          resolve({
            width: widthCm,
            height: heightCm,
            size: detectedSize
          });
        } catch (error) {
          console.error('Ошибка при чтении PDF:', error);
          // Fallback для PDF файлов при ошибке
          resolve({
            width: 21,
            height: 29.7,
            size: "A4"
          });
        }
      } else {
        // Для PSD файлов используем приблизительные размеры
        const fileSizeMB = file.size / (1024 * 1024);
        let estimatedSize = "A4";
        if (fileSizeMB < 1) estimatedSize = "A6";
        else if (fileSizeMB < 3) estimatedSize = "A5";
        else if (fileSizeMB < 10) estimatedSize = "A4";
        else estimatedSize = "A3";
        
        resolve({
          width: 21,
          height: 29.7,
          size: estimatedSize
        });
      }
    });
  };

  // Функция для анализа изображения и расчета краски (включая белую)
  const analyzeImageForInk = async (file: File): Promise<InkCalculation> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Получаем данные пикселей
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;
        
        if (!data) {
          resolve({
            totalInkUsage: 20,
            colorBreakdown: { cyan: 3, magenta: 4, yellow: 5, black: 3, white: 5 },
            estimatedCost: 35
          });
          return;
        }
        
        let totalPixels = 0;
        let nonTransparentPixels = 0;
        let colorTotals = { cyan: 0, magenta: 0, yellow: 0, black: 0 };
        
        // Анализируем каждый пикель
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          totalPixels++;
          
          // Если пиксель не прозрачный, считаем что нужна белая подложка
          if (a >= 128) {
            nonTransparentPixels++;
            
            // Простая конвертация RGB в CMYK
            const c = 1 - (r / 255);
            const m = 1 - (g / 255);
            const y = 1 - (b / 255);
            const k = Math.min(c, m, y);
            
            colorTotals.cyan += Math.max(0, c - k);
            colorTotals.magenta += Math.max(0, m - k);
            colorTotals.yellow += Math.max(0, y - k);
            colorTotals.black += k;
          }
        }
        
        if (totalPixels === 0) {
          resolve({
            totalInkUsage: 8,
            colorBreakdown: { cyan: 1, magenta: 1, yellow: 1, black: 2, white: 3 },
            estimatedCost: 15
          });
          return;
        }
        
        // Нормализуем значения и переводим в мл
        const normalizeAndScale = (value: number) => Math.round((value / totalPixels) * 100 * 100) / 100;
        
        const breakdown = {
          cyan: normalizeAndScale(colorTotals.cyan),
          magenta: normalizeAndScale(colorTotals.magenta),
          yellow: normalizeAndScale(colorTotals.yellow),
          black: normalizeAndScale(colorTotals.black),
          white: Math.round((nonTransparentPixels / totalPixels) * 80 * 100) / 100 // Белая подложка для всех непрозрачных пикселей
        };
        
        const totalInk = breakdown.cyan + breakdown.magenta + breakdown.yellow + breakdown.black + breakdown.white;
        const estimatedCost = Math.round(totalInk * 1.8); // 1.8 руб за мл с учетом белой краски
        
        resolve({
          totalInkUsage: Math.round(totalInk * 100) / 100,
          colorBreakdown: breakdown,
          estimatedCost
        });
      };
      
      // Если файл - изображение, загружаем его
      if (file.type.startsWith('image/')) {
        img.src = URL.createObjectURL(file);
      } else {
        // Для PDF и PSD файлов используем приблизительные данные
        const fileSize = file.size / (1024 * 1024); // размер в MB
        const estimatedInk = Math.max(8, Math.min(60, fileSize * 10));
        
        resolve({
          totalInkUsage: Math.round(estimatedInk * 100) / 100,
          colorBreakdown: {
            cyan: Math.round(estimatedInk * 0.2 * 100) / 100,
            magenta: Math.round(estimatedInk * 0.25 * 100) / 100,
            yellow: Math.round(estimatedInk * 0.2 * 100) / 100,
            black: Math.round(estimatedInk * 0.15 * 100) / 100,
            white: Math.round(estimatedInk * 0.2 * 100) / 100
          },
          estimatedCost: Math.round(estimatedInk * 1.8)
        });
      }
    });
  };

  const calculateInkForAllFiles = async () => {
    let totalInk = { cyan: 0, magenta: 0, yellow: 0, black: 0, white: 0 };
    let totalCost = 0;
    
    for (const file of files) {
      const inkData = await analyzeImageForInk(file);
      totalInk.cyan += inkData.colorBreakdown.cyan;
      totalInk.magenta += inkData.colorBreakdown.magenta;
      totalInk.yellow += inkData.colorBreakdown.yellow;
      totalInk.black += inkData.colorBreakdown.black;
      totalInk.white += inkData.colorBreakdown.white;
      totalCost += inkData.estimatedCost;
    }
    
    const totalUsage = totalInk.cyan + totalInk.magenta + totalInk.yellow + totalInk.black + totalInk.white;
    
    setInkCalculation({
      totalInkUsage: Math.round(totalUsage * 100) / 100,
      colorBreakdown: {
        cyan: Math.round(totalInk.cyan * 100) / 100,
        magenta: Math.round(totalInk.magenta * 100) / 100,
        yellow: Math.round(totalInk.yellow * 100) / 100,
        black: Math.round(totalInk.black * 100) / 100,
        white: Math.round(totalInk.white * 100) / 100
      },
      estimatedCost: totalCost
    });
  };

  // Определяем размеры файлов при загрузке
  useEffect(() => {
    if (files.length > 0) {
      getFileDimensions(files[0]).then(dimensions => {
        setFileDimensions(dimensions);
        setSelectedSize("auto");
      });
    }
  }, [files]);

  const calculatePrice = async () => {
    if (!selectedSize || quantity < 1) return;
    
    setIsCalculating(true);
    
    await calculateInkForAllFiles();
    
    setTimeout(() => {
      let basePrice = 0;
      
      if (selectedSize === "auto" && fileDimensions) {
        const area = fileDimensions.width * fileDimensions.height;
        basePrice = Math.round(area * 15);
      } else {
        const selectedOption = priceOptions.find(option => option.size === selectedSize);
        if (selectedOption) {
          basePrice = selectedOption.basePrice;
        }
      }
      
      // Корректировка цены в зависимости от типа печати
      if (printType === "roll") {
        basePrice = basePrice * 0.8; // Скидка 20% за печать в рулоне
      }
      
      const fileMultiplier = Math.min(files.length * 0.1 + 1, 2);
      
      let quantityDiscount = 1;
      if (quantity >= 10) quantityDiscount = 0.85;
      else if (quantity >= 5) quantityDiscount = 0.9;
      else if (quantity >= 3) quantityDiscount = 0.95;
      
      const finalPrice = Math.round(basePrice * fileMultiplier * quantity * quantityDiscount);
      setTotalPrice(finalPrice);
      setIsCalculating(false);
    }, 1500);
  };

  useEffect(() => {
    if (selectedSize && quantity >= 1) {
      calculatePrice();
    }
  }, [selectedSize, quantity, files, printType]);

  const handleContinue = () => {
    onPriceCalculated(totalPrice);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <Calculator className="w-6 h-6" />
          Расчет стоимости DTF печати
        </CardTitle>
        <CardDescription className="text-center">
          Выберите параметры для точного расчета стоимости
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Предпросмотр файлов */}
        {previewUrls.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Предпросмотр файлов
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`Превью ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {files[index]?.name.slice(0, 15)}...
                  </div>
                </div>
              ))}
            </div>
            {files.length > 3 && (
              <p className="text-sm text-gray-500 mt-2">
                ... и еще {files.length - 3} файлов
              </p>
            )}
          </div>
        )}

        {/* Выбор типа печати */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Тип печати</Label>
          <RadioGroup value={printType} onValueChange={setPrintType} className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="cursor-pointer flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium">Одно изделие</div>
                  <div className="text-sm text-gray-500">Отдельная печать каждого файла</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <RadioGroupItem value="roll" id="roll" />
              <Label htmlFor="roll" className="cursor-pointer flex items-center gap-2">
                <Scroll className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium">Печать в рулоне</div>
                  <div className="text-sm text-gray-500">Экономия 20%, все файлы в рулоне</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Информация о файлах */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Информация о файлах
          </h4>
          <p className="text-sm text-gray-600">
            Количество файлов: <span className="font-medium">{files.length}</span>
          </p>
          {fileDimensions && (
            <div className="mt-2 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-orange-600">
                Определенный размер: <span className="font-medium">
                  {fileDimensions.width} x {fileDimensions.height} см ({fileDimensions.size})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Расчет краски с колбочками */}
        {inkCalculation && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Расход краски DTF
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-600">Общий расход:</p>
                  <p className="text-xl font-bold text-blue-800">{inkCalculation.totalInkUsage} мл</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Стоимость краски:</p>
                  <p className="text-xl font-bold text-blue-800">{inkCalculation.estimatedCost} ₽</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-blue-600 mb-3">Расход по цветам:</p>
                <InkTubes inkData={inkCalculation} />
              </div>
            </div>
          </div>
        )}

        {/* Выбор размера */}
        <div className="space-y-2">
          <Label htmlFor="size">Размер печати</Label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите размер" />
            </SelectTrigger>
            <SelectContent>
              {priceOptions.map((option) => (
                <SelectItem key={option.size} value={option.size}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {option.size === "auto" ? "Авто" : option.size.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Количество */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Количество экземпляров</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            placeholder="Введите количество"
          />
          {quantity >= 3 && (
            <p className="text-sm text-green-600">
              🎉 Скидка за количество: {quantity >= 10 ? '15%' : quantity >= 5 ? '10%' : '5%'}
            </p>
          )}
        </div>

        {/* Результат расчета */}
        {selectedSize && (
          <div className="bg-gradient-to-r from-orange-50 to-gray-50 p-6 rounded-lg border border-orange-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Предварительная стоимость:</p>
                <p className="text-3xl font-bold text-orange-600">
                  {isCalculating ? (
                    <span className="animate-pulse">Расчет...</span>
                  ) : (
                    `${totalPrice.toLocaleString()} ₽`
                  )}
                </p>
                {inkCalculation && !isCalculating && (
                  <p className="text-sm text-gray-500 mt-1">
                    Включая краску: {inkCalculation.estimatedCost} ₽
                    {printType === "roll" && " • Скидка за рулон: 20%"}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>За {quantity} экз.</p>
                <p>Тип: {printType === "single" ? "Одно изделие" : "Рулон"}</p>
                <p>Размер: {selectedSize === "auto" && fileDimensions ? 
                  `${fileDimensions.width}x${fileDimensions.height}см` : 
                  selectedSize.toUpperCase()}</p>
                {inkCalculation && (
                  <p>Краски: {inkCalculation.totalInkUsage} мл</p>
                )}
              </div>
            </div>
            
            {totalPrice > 0 && (
              <div className="mt-4 pt-4 border-t border-orange-200">
                <p className="text-xs text-gray-600 mb-3">
                  * Цена может быть скорректирована после проверки файлов специалистом
                </p>
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  size="lg"
                  disabled={isCalculating}
                >
                  Оформить заказ
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceCalculator;

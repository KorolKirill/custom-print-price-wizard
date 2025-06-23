
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calculator, FileText, Palette } from "lucide-react";

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
  };
  estimatedCost: number;
}

const PriceCalculator = ({ files, onPriceCalculated }: PriceCalculatorProps) => {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [inkCalculation, setInkCalculation] = useState<InkCalculation | null>(null);

  // Мок-данные для расчета стоимости
  const priceOptions: PriceOption[] = [
    { size: "A6", basePrice: 150, description: "10.5 x 14.8 см" },
    { size: "A5", basePrice: 280, description: "14.8 x 21 см" },
    { size: "A4", basePrice: 450, description: "21 x 29.7 см" },
    { size: "A3", basePrice: 750, description: "29.7 x 42 см" },
    { size: "custom", basePrice: 300, description: "Индивидуальный размер" },
  ];

  // Функция для анализа изображения и расчета краски
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
            totalInkUsage: 15,
            colorBreakdown: { cyan: 3, magenta: 4, yellow: 5, black: 3 },
            estimatedCost: 25
          });
          return;
        }
        
        let totalPixels = 0;
        let colorTotals = { cyan: 0, magenta: 0, yellow: 0, black: 0 };
        
        // Анализируем каждый пикель
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Игнорируем прозрачные пиксели
          if (a < 128) continue;
          
          totalPixels++;
          
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
        
        if (totalPixels === 0) {
          resolve({
            totalInkUsage: 5,
            colorBreakdown: { cyan: 1, magenta: 1, yellow: 1, black: 2 },
            estimatedCost: 8
          });
          return;
        }
        
        // Нормализуем значения и переводим в мл
        const normalizeAndScale = (value: number) => Math.round((value / totalPixels) * 100 * 100) / 100;
        
        const breakdown = {
          cyan: normalizeAndScale(colorTotals.cyan),
          magenta: normalizeAndScale(colorTotals.magenta),
          yellow: normalizeAndScale(colorTotals.yellow),
          black: normalizeAndScale(colorTotals.black)
        };
        
        const totalInk = breakdown.cyan + breakdown.magenta + breakdown.yellow + breakdown.black;
        const estimatedCost = Math.round(totalInk * 1.5); // 1.5 руб за мл краски
        
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
        const estimatedInk = Math.max(5, Math.min(50, fileSize * 8));
        
        resolve({
          totalInkUsage: Math.round(estimatedInk * 100) / 100,
          colorBreakdown: {
            cyan: Math.round(estimatedInk * 0.25 * 100) / 100,
            magenta: Math.round(estimatedInk * 0.3 * 100) / 100,
            yellow: Math.round(estimatedInk * 0.25 * 100) / 100,
            black: Math.round(estimatedInk * 0.2 * 100) / 100
          },
          estimatedCost: Math.round(estimatedInk * 1.5)
        });
      }
    });
  };

  const calculateInkForAllFiles = async () => {
    let totalInk = { cyan: 0, magenta: 0, yellow: 0, black: 0 };
    let totalCost = 0;
    
    for (const file of files) {
      const inkData = await analyzeImageForInk(file);
      totalInk.cyan += inkData.colorBreakdown.cyan;
      totalInk.magenta += inkData.colorBreakdown.magenta;
      totalInk.yellow += inkData.colorBreakdown.yellow;
      totalInk.black += inkData.colorBreakdown.black;
      totalCost += inkData.estimatedCost;
    }
    
    const totalUsage = totalInk.cyan + totalInk.magenta + totalInk.yellow + totalInk.black;
    
    setInkCalculation({
      totalInkUsage: Math.round(totalUsage * 100) / 100,
      colorBreakdown: {
        cyan: Math.round(totalInk.cyan * 100) / 100,
        magenta: Math.round(totalInk.magenta * 100) / 100,
        yellow: Math.round(totalInk.yellow * 100) / 100,
        black: Math.round(totalInk.black * 100) / 100
      },
      estimatedCost: totalCost
    });
  };

  const calculatePrice = async () => {
    if (!selectedSize || quantity < 1) return;
    
    setIsCalculating(true);
    
    // Сначала рассчитываем краску
    await calculateInkForAllFiles();
    
    // Имитация сложного расчета
    setTimeout(() => {
      const selectedOption = priceOptions.find(option => option.size === selectedSize);
      if (!selectedOption) return;
      
      let basePrice = selectedOption.basePrice;
      
      // Добавляем наценку за количество файлов
      const fileMultiplier = Math.min(files.length * 0.1 + 1, 2);
      
      // Скидка за количество
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
  }, [selectedSize, quantity, files]);

  const handleContinue = () => {
    onPriceCalculated(totalPrice);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <Calculator className="w-6 h-6" />
          Расчет стоимости
        </CardTitle>
        <CardDescription className="text-center">
          Выберите параметры для точного расчета стоимости
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Информация о файлах */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Загруженные файлы
          </h4>
          <p className="text-sm text-gray-600">
            Количество файлов: <span className="font-medium">{files.length}</span>
          </p>
          <div className="mt-2">
            {files.slice(0, 3).map((file, index) => (
              <p key={index} className="text-xs text-gray-500">
                • {file.name}
              </p>
            ))}
            {files.length > 3 && (
              <p className="text-xs text-gray-500">
                ... и еще {files.length - 3} файлов
              </p>
            )}
          </div>
        </div>

        {/* Расчет краски */}
        {inkCalculation && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Расход краски
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600">Общий расход:</p>
                <p className="text-lg font-bold text-blue-800">{inkCalculation.totalInkUsage} мл</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Стоимость краски:</p>
                <p className="text-lg font-bold text-blue-800">{inkCalculation.estimatedCost} ₽</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
              <div className="bg-cyan-100 p-2 rounded text-center">
                <p className="text-cyan-700 font-medium">Cyan</p>
                <p className="text-cyan-800">{inkCalculation.colorBreakdown.cyan} мл</p>
              </div>
              <div className="bg-pink-100 p-2 rounded text-center">
                <p className="text-pink-700 font-medium">Magenta</p>
                <p className="text-pink-800">{inkCalculation.colorBreakdown.magenta} мл</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded text-center">
                <p className="text-yellow-700 font-medium">Yellow</p>
                <p className="text-yellow-800">{inkCalculation.colorBreakdown.yellow} мл</p>
              </div>
              <div className="bg-gray-100 p-2 rounded text-center">
                <p className="text-gray-700 font-medium">Black</p>
                <p className="text-gray-800">{inkCalculation.colorBreakdown.black} мл</p>
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
                    <span className="font-medium">{option.size.toUpperCase()}</span>
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
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Предварительная стоимость:</p>
                <p className="text-3xl font-bold text-purple-600">
                  {isCalculating ? (
                    <span className="animate-pulse">Расчет...</span>
                  ) : (
                    `${totalPrice.toLocaleString()} ₽`
                  )}
                </p>
                {inkCalculation && !isCalculating && (
                  <p className="text-sm text-gray-500 mt-1">
                    Включая краску: {inkCalculation.estimatedCost} ₽
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>За {quantity} экз.</p>
                <p>Размер: {selectedSize.toUpperCase()}</p>
                {inkCalculation && (
                  <p>Краски: {inkCalculation.totalInkUsage} мл</p>
                )}
              </div>
            </div>
            
            {totalPrice > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-xs text-gray-600 mb-3">
                  * Цена может быть скорректирована после проверки файлов специалистом
                </p>
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calculator, FileText } from "lucide-react";

interface PriceCalculatorProps {
  files: File[];
  onPriceCalculated: (price: number) => void;
}

interface PriceOption {
  size: string;
  basePrice: number;
  description: string;
}

const PriceCalculator = ({ files, onPriceCalculated }: PriceCalculatorProps) => {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Мок-данные для расчета стоимости
  const priceOptions: PriceOption[] = [
    { size: "A6", basePrice: 150, description: "10.5 x 14.8 см" },
    { size: "A5", basePrice: 280, description: "14.8 x 21 см" },
    { size: "A4", basePrice: 450, description: "21 x 29.7 см" },
    { size: "A3", basePrice: 750, description: "29.7 x 42 см" },
    { size: "custom", basePrice: 300, description: "Индивидуальный размер" },
  ];

  const calculatePrice = () => {
    if (!selectedSize || quantity < 1) return;
    
    setIsCalculating(true);
    
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
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>За {quantity} экз.</p>
                <p>Размер: {selectedSize.toUpperCase()}</p>
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

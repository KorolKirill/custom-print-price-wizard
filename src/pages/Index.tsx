
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Calculator, ShoppingCart, CheckCircle, Image as ImageIcon, Scroll } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import PriceCalculator from "@/components/PriceCalculator";
import OrderForm from "@/components/OrderForm";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [printType, setPrintType] = useState(""); // "single" или "roll"
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const handlePrintTypeSelected = (type: string) => {
    setPrintType(type);
    setCurrentStep(2);
  };

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    if (printType === "single") {
      setCurrentStep(3); // Сразу на расчет для одного изделия
    } else {
      setCurrentStep(3); // На расчет для рулона
    }
  };

  const handlePriceCalculated = (price: number) => {
    setCalculatedPrice(price);
    setCurrentStep(4);
  };

  const handleOrderCreated = () => {
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              PrintCraft Studio
            </h1>
            <div className="text-sm text-gray-600">
              Профессиональная DTF печать
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            DTF-печать нового поколения
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Выберите тип печати и загружайте ваши дизайны. 
            Мы предоставим точный расчет стоимости и выполним заказ с высочайшим качеством.
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-6 mb-12">
            {[
              { step: 1, icon: CheckCircle, label: "Тип печати", active: currentStep >= 1 },
              { step: 2, icon: Upload, label: "Загрузка файлов", active: currentStep >= 2 },
              { step: 3, icon: Calculator, label: "Расчет стоимости", active: currentStep >= 3 },
              { step: 4, icon: ShoppingCart, label: "Оформление заказа", active: currentStep >= 4 },
              { step: 5, icon: CheckCircle, label: "Готово", active: currentStep >= 5 },
            ].map(({ step, icon: Icon, label, active }) => (
              <div key={step} className={`flex flex-col items-center ${active ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  active ? 'bg-orange-600 text-white' : 'bg-gray-200'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Выберите тип печати</CardTitle>
                <CardDescription className="text-center">
                  Определите, как будет выполняться печать ваших дизайнов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={printType} onValueChange={setPrintType} className="grid grid-cols-1 gap-6">
                  <div className="flex items-center space-x-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="cursor-pointer flex items-center gap-4 flex-1">
                      <ImageIcon className="w-8 h-8 text-orange-500" />
                      <div>
                        <div className="text-lg font-medium">Одно изделие</div>
                        <div className="text-sm text-gray-500">Отдельная печать одного файла</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="roll" id="roll" />
                    <Label htmlFor="roll" className="cursor-pointer flex items-center gap-4 flex-1">
                      <Scroll className="w-8 h-8 text-orange-500" />
                      <div>
                        <div className="text-lg font-medium">Печать в рулоне</div>
                        <div className="text-sm text-gray-500">Экономия 20%, несколько файлов в рулоне</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {printType && (
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={() => handlePrintTypeSelected(printType)}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      size="lg"
                    >
                      Продолжить
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {currentStep === 2 && (
            <FileUploader 
              onFilesUploaded={handleFilesUploaded} 
              printType={printType}
              maxFiles={printType === "single" ? 1 : undefined}
            />
          )}
          
          {currentStep === 3 && (
            <PriceCalculator 
              files={uploadedFiles} 
              printType={printType}
              onPriceCalculated={handlePriceCalculated}
            />
          )}
          
          {currentStep === 4 && (
            <OrderForm 
              files={uploadedFiles}
              totalPrice={calculatedPrice}
              onOrderCreated={handleOrderCreated}
            />
          )}
          
          {currentStep === 5 && (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-green-600">Заказ успешно создан!</CardTitle>
                <CardDescription className="text-lg">
                  Вы будете перенаправлены на страницу оплаты
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => alert('Переход на оплату (пока заглушка)')}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  size="lg"
                >
                  Перейти к оплате
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      {currentStep === 1 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Почему выбирают PrintCraft Studio?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle>Простая загрузка</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Поддержка PDF, PSD файлов и отдельных изображений. 
                    Просто перетащите файлы в область загрузки.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-6 h-6 text-gray-600" />
                  </div>
                  <CardTitle>Точный расчет</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Автоматический расчет стоимости на основе размеров, 
                    количества и сложности дизайна.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle>Высокое качество</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Используем современное DTF оборудование для получения 
                    ярких и долговечных принтов.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

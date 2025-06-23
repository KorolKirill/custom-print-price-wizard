
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Calculator, ShoppingCart, CheckCircle } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import PriceCalculator from "@/components/PriceCalculator";
import OrderForm from "@/components/OrderForm";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setCurrentStep(2);
  };

  const handlePriceCalculated = (price: number) => {
    setCalculatedPrice(price);
    setCurrentStep(3);
  };

  const handleOrderCreated = () => {
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            Загружайте ваши дизайны в формате PDF, PSD или отдельными изображениями. 
            Мы предоставим точный расчет стоимости и выполним заказ с высочайшим качеством.
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-8 mb-12">
            {[
              { step: 1, icon: Upload, label: "Загрузка файлов", active: currentStep >= 1 },
              { step: 2, icon: Calculator, label: "Расчет стоимости", active: currentStep >= 2 },
              { step: 3, icon: ShoppingCart, label: "Оформление заказа", active: currentStep >= 3 },
              { step: 4, icon: CheckCircle, label: "Готово", active: currentStep >= 4 },
            ].map(({ step, icon: Icon, label, active }) => (
              <div key={step} className={`flex flex-col items-center ${active ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  active ? 'bg-purple-600 text-white' : 'bg-gray-200'
                }`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <FileUploader onFilesUploaded={handleFilesUploaded} />
          )}
          
          {currentStep === 2 && (
            <PriceCalculator 
              files={uploadedFiles} 
              onPriceCalculated={handlePriceCalculated}
            />
          )}
          
          {currentStep === 3 && (
            <OrderForm 
              files={uploadedFiles}
              totalPrice={calculatedPrice}
              onOrderCreated={handleOrderCreated}
            />
          )}
          
          {currentStep === 4 && (
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-purple-600" />
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
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-6 h-6 text-pink-600" />
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
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
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

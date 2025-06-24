import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Calculator, ShoppingCart, CheckCircle, Image as ImageIcon, Scroll, ArrowLeft } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import PriceCalculator from "@/components/PriceCalculator";
import OrderForm from "@/components/OrderForm";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [printType, setPrintType] = useState(""); // "single" або "roll"
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const handlePrintTypeSelected = (type: string) => {
    setPrintType(type);
    setCurrentStep(2);
  };

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    if (printType === "single") {
      setCurrentStep(3); // Одразу на розрахунок для одного виробу
    } else {
      setCurrentStep(3); // На розрахунок для рулону
    }
  };

  const handlePriceCalculated = (price: number) => {
    setCalculatedPrice(price);
    setCurrentStep(4);
  };

  const handleOrderCreated = () => {
    setCurrentStep(5);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setPrintType("");
        setUploadedFiles([]);
      }
      if (currentStep === 3) {
        setUploadedFiles([]);
      }
      if (currentStep === 4) {
        setCalculatedPrice(0);
      }
    }
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
              Професійний DTF друк
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            DTF-друк нового покоління
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Оберіть тип друку та завантажуйте ваші дизайни. 
            Ми надамо точний розрахунок вартості та виконаємо замовлення з найвищою якістю.
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-6 mb-6">
            {[
              { step: 1, icon: CheckCircle, label: "Тип друку", active: currentStep >= 1 },
              { step: 2, icon: Upload, label: "Завантаження файлів", active: currentStep >= 2 },
              { step: 3, icon: Calculator, label: "Розрахунок вартості", active: currentStep >= 3 },
              { step: 4, icon: ShoppingCart, label: "Оформлення замовлення", active: currentStep >= 4 },
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
          
          {/* Green text below progress steps */}
          <p className="text-green-600 font-medium mb-6">
            Встигніть замовити до 12.00, щоб отримати відправку сьогодні.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          {currentStep > 1 && (
            <div className="mb-6">
              <Button 
                onClick={goBack}
                variant="outline"
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Оберіть тип друку</CardTitle>
                <CardDescription className="text-center">
                  Визначте, як буде виконуватися друк ваших дизайнів
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={printType} onValueChange={setPrintType} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single" className="cursor-pointer flex items-center gap-4 flex-1">
                        <ImageIcon className="w-8 h-8 text-orange-500" />
                        <div>
                          <div className="text-lg font-medium">Один виріб</div>
                          <div className="text-sm text-gray-500">Окремий друк одного файлу</div>
                        </div>
                      </Label>
                    </div>
                    <div className="mt-4">
                      <img 
                        src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop&crop=center" 
                        alt="Один виріб" 
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value="roll" id="roll" />
                      <Label htmlFor="roll" className="cursor-pointer flex items-center gap-4 flex-1">
                        <Scroll className="w-8 h-8 text-orange-500" />
                        <div>
                          <div className="text-lg font-medium">Друк у рулоні</div>
                          <div className="text-sm text-gray-500">Кілька файлів у рулоні</div>
                        </div>
                      </Label>
                    </div>
                    <div className="mt-4">
                      <img 
                        src="https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=300&h=300&fit=crop&crop=center" 
                        alt="Друк у рулоні" 
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    </div>
                  </div>
                </RadioGroup>
                
                {printType && (
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={() => handlePrintTypeSelected(printType)}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      size="lg"
                    >
                      Продовжити
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
                <CardTitle className="text-2xl text-green-600">Замовлення успішно створено!</CardTitle>
                <CardDescription className="text-lg">
                  Вас буде перенаправлено на сторінку оплати
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => alert('Перехід на оплату (поки заглушка)')}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  size="lg"
                >
                  Перейти до оплати
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features - показуємо завжди */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Чому обирають PrintCraft Studio?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Просте завантаження</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Підтримка PDF, PSD файлів та окремих зображень. 
                  Просто перетягніть файли в область завантаження.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle>Точний розрахунок</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Автоматичний розрахунок вартості на основі розмірів, 
                  кількості та складності дизайну.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Висока якість</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Використовуємо сучасне DTF обладнання для отримання 
                  яскравих та довговічних принтів.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

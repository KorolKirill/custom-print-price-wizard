import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Calculator, ShoppingCart, CheckCircle, Image as ImageIcon, Scroll, ArrowLeft, Send, Instagram, Phone } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import FileUploader from "@/components/FileUploader";
import PriceCalculator from "@/components/PriceCalculator";
import OrderForm from "@/components/OrderForm";
import Footer from "@/components/Footer";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [printType, setPrintType] = useState(""); // "single" або "roll"
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true);

  // Check if it's past 12:00 in Ukraine timezone
  useEffect(() => {
    const checkTime = () => {
      const ukraineTime = formatInTimeZone(new Date(), 'Europe/Kiev', 'HH');
      const currentHour = parseInt(ukraineTime);
      setShowAnnouncementBanner(currentHour < 12);
    };

    checkTime();
    // Check every minute
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

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
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/edb4a1fa-34c4-40e2-b7e1-95d2736fce3c.png" 
                alt="FUTBOSS Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-gray-800">
                  +380971162542
                </div>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://t.me/managerUUA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Send className="w-6 h-6" />
                  </a>
                  <a 
                    href="https://www.instagram.com/futboss.ua/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                <div>Працюємо кожного дня.</div>
                <div>Пишіть, дзвоніть 9.00-18.00</div>
              </div>
            </div>
          </div>
          
          {/* Mobile Header */}
          <div className="md:hidden flex justify-center">
            <img 
              src="/lovable-uploads/edb4a1fa-34c4-40e2-b7e1-95d2736fce3c.png" 
              alt="FUTBOSS Logo" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </header>
      
      {/* Mobile Contact Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full h-16 w-16 shadow-lg"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 mr-4" side="top">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Контакти</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    +380971162542
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>Працюємо кожного дня.</div>
                    <div>Пишіть, дзвоніть 9.00-18.00</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <a 
                    href="https://t.me/managerUUA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-sm">Telegram</span>
                  </a>
                  <a 
                    href="https://www.instagram.com/futboss.ua/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-sm">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Announcement Banner */}
      {showAnnouncementBanner && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-center text-green-700 font-medium">
              Встигніть замовити до 12.00, щоб отримати відправку сьогодні.
            </p>
          </div>
        </div>
      )}

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
          
          {/* Progress Steps - скрыто на мобильных */}
          <div className="hidden md:flex justify-center items-center space-x-2 sm:space-x-4 lg:space-x-6 mb-6 overflow-x-auto px-4">
            {[
              { step: 1, icon: CheckCircle, label: "Тип друку", active: currentStep >= 1 },
              { step: 2, icon: Upload, label: "Завантаження файлів", active: currentStep >= 2 },
              { step: 3, icon: Calculator, label: "Розрахунок вартості", active: currentStep >= 3 },
              { step: 4, icon: ShoppingCart, label: "Оформлення замовлення", active: currentStep >= 4 },
              { step: 5, icon: CheckCircle, label: "Готово", active: currentStep >= 5 },
            ].map(({ step, icon: Icon, label, active }) => (
              <div key={step} className={`flex flex-col items-center min-w-0 flex-shrink-0 ${active ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 ${
                  active ? 'bg-orange-600 text-white' : 'bg-gray-200'
                }`}>
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs font-medium text-center leading-tight max-w-16 sm:max-w-20">{label}</span>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
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
                  <div 
                    className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setPrintType("single")}
                  >
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
                  <div 
                    className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setPrintType("roll")}
                  >
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

      {/* About Us Section */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Про нас
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ми — команда професіоналів, що спеціалізується на DTF-друку нового покоління
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* Block 1 - Image Left, Text Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="animate-fade-in">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop&crop=center" 
                  alt="Наша команда за роботою" 
                  className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg hover-scale"
                />
              </div>
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Досвід та професіоналізм
                </h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  За роки роботи ми накопичили величезний досвід у сфері DTF-друку. 
                  Наша команда постійно вдосконалює свої навички та слідкує за новітніми 
                  технологіями у галузі. Ми знаємо, як досягти найкращого результату для 
                  кожного проекту, незалежно від його складності.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Понад 5 років досвіду</span>
                </div>
              </div>
            </div>

            {/* Block 2 - Text Left, Image Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 animate-fade-in lg:order-1">
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Сучасне обладнання
                </h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Використовуємо найновіше обладнання для DTF-друку, що дозволяє нам 
                  гарантувати високу якість та швидкість виконання замовлень. Регулярно 
                  оновлюємо наш парк техніки, щоб завжди відповідати найвищим стандартам 
                  галузі та задовольняти потреби наших клієнтів.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Преміум обладнання</span>
                </div>
              </div>
              <div className="animate-fade-in lg:order-2">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop&crop=center" 
                  alt="Сучасне обладнання для друку" 
                  className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg hover-scale"
                />
              </div>
            </div>

            {/* Block 3 - Image Left, Text Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="animate-fade-in">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop&crop=center" 
                  alt="Індивідуальний підхід до кожного клієнта" 
                  className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg hover-scale"
                />
              </div>
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Індивідуальний підхід
                </h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Кожен клієнт для нас унікальний. Ми уважно вислухаємо ваші побажання 
                  та надамо професійні поради щодо оптимального рішення. Наша мета — 
                  не просто виконати замовлення, а створити довгострокове партнерство, 
                  засноване на довірі та взаємній повазі.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Персональний сервіс</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* Features - показуємо завжди */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-8 lg:mb-12">
            Чому обирають FUTBOSS?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg lg:text-xl">Просте завантаження</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm lg:text-base">
                  Підтримка PDF, PSD файлів та окремих зображень. 
                  Просто перетягніть файли в область завантаження.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle className="text-lg lg:text-xl">Точний розрахунок</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm lg:text-base">
                  Автоматичний розрахунок вартості на основі розмірів, 
                  кількості та складності дизайну.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg lg:text-xl">Висока якість</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm lg:text-base">
                  Використовуємо сучасне DTF обладнання для отримання 
                  яскравих та довговічних принтів.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;

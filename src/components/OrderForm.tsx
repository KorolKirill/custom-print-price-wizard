
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, User, Phone, Mail, MessageSquare } from "lucide-react";

interface OrderFormProps {
  files: File[];
  totalPrice: number;
  onOrderCreated: () => void;
}

const OrderForm = ({ files, totalPrice, onOrderCreated }: OrderFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
    agreeToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      alert("Необхідно погодитися з умовами надання послуг");
      return;
    }

    setIsSubmitting(true);
    
    // Імітація створення замовлення
    setTimeout(() => {
      console.log("Створено замовлення:", {
        files: files.map(f => f.name),
        totalPrice,
        customerData: formData
      });
      
      setIsSubmitting(false);
      onOrderCreated();
    }, 2000);
  };

  const isFormValid = formData.name && formData.phone && formData.email && formData.agreeToTerms;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Оформлення замовлення
        </CardTitle>
        <CardDescription className="text-center">
          Заповніть контактні дані для завершення замовлення
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Зведення замовлення */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Зведення замовлення</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Кількість файлів:</span>
              <span className="font-medium">{files.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Загальна вартість:</span>
              <span className="font-bold text-lg text-purple-600">
                {totalPrice.toLocaleString()} ₴
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Контактна інформація */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Контактна інформація
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ім'я *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ваше ім'я"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+38 (000) 000-00-00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Коментар */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Коментар до замовлення
            </Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder="Додаткові побажання або вимоги до замовлення..."
              rows={3}
            />
          </div>

          {/* Згода */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              Я погоджуюся з{" "}
              <button type="button" className="text-purple-600 hover:underline">
                умовами надання послуг
              </button>{" "}
              та{" "}
              <button type="button" className="text-purple-600 hover:underline">
                політикою обробки персональних даних
              </button>
            </Label>
          </div>

          {/* Кнопка відправки */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Створення замовлення...
                </>
              ) : (
                `Створити замовлення на ${totalPrice.toLocaleString()} ₴`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;

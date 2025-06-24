
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, MessageSquare, CreditCard, Send } from "lucide-react";

interface OrderFormProps {
  files: File[];
  totalPrice: number;
  onOrderCreated: () => void;
}

const OrderForm = ({ files, totalPrice, onOrderCreated }: OrderFormProps) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnlineOrder = () => {
    setIsSubmitting(true);
    
    // Імітація переходу на чекаут
    setTimeout(() => {
      console.log("Перехід на онлайн чекаут:", {
        files: files.map(f => f.name),
        totalPrice,
        comment
      });
      
      alert('Перехід на онлайн чекаут (поки заглушка)');
      setIsSubmitting(false);
      onOrderCreated();
    }, 1000);
  };

  const handleTelegramOrder = () => {
    const orderInfo = `Замовлення DTF друку:\n- Кількість файлів: ${files.length}\n- Загальна вартість: ${totalPrice.toLocaleString()} ₴${comment ? `\n- Коментар: ${comment}` : ''}`;
    const telegramUrl = `https://t.me/your_telegram_username?text=${encodeURIComponent(orderInfo)}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Оформлення замовлення
        </CardTitle>
        <CardDescription className="text-center">
          Оберіть спосіб оформлення замовлення
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

        <div className="space-y-6">
          {/* Коментар */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Коментар до замовлення
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Додаткові побажання або вимоги до замовлення..."
              rows={3}
            />
          </div>

          {/* Кнопки оформлення */}
          <div className="space-y-4 pt-4">
            <Button
              onClick={handleOnlineOrder}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Оформлення...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Оформити онлайн - {totalPrice.toLocaleString()} ₴
                </>
              )}
            </Button>

            <Button
              onClick={handleTelegramOrder}
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Оформити через Telegram
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderForm;

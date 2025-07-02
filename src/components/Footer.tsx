import { Send, Instagram, Phone, MapPin, Building2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Информация о компании */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/lovable-uploads/edb4a1fa-34c4-40e2-b7e1-95d2736fce3c.png" 
                alt="FUTBOSS Logo" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">ФОП Кравченко Роман Вадимович</span>
              </div>
              <div className="flex items-start gap-2 text-gray-300">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div>Київ, вул. Пост-волинська 5</div>
                  <div className="text-xs text-gray-400 mt-1">
                    DTF-друк нового покоління
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Контакти</h3>
            <div className="space-y-3">
              <a 
                href="tel:+380971162542"
                className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+380971162542</span>
              </a>
              <div className="text-sm text-gray-400">
                <div>Працюємо кожного дня</div>
                <div>Пишіть, дзвоніть 9.00-18.00</div>
              </div>
            </div>
          </div>

          {/* Социальные сети */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Соціальні мережі</h3>
            <div className="flex gap-4">
              <a 
                href="https://t.me/managerUUA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm">Telegram</span>
              </a>
              <a 
                href="https://www.instagram.com/futboss.ua/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              © 2024 FUTBOSS. Всі права захищені.
            </div>
            <div className="mt-2 md:mt-0">
              DTF-друк нового покоління
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

/**
 * DTF Ink Calculator - TypeScript Library
 * Библиотека для расчета количества краски для DTF (Direct to Film) печати
 */

export interface InkCoverage {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
  white: number;
}

export interface MaterialPrices {
  white_ink: number;    // грн/л
  color_ink: number;    // грн/л
  film: number;         // грн/м
  glue: number;         // грн/кг
}

export interface PricingModel {
  fixed_price_per_meter: number;   // Цена конкурентов (грн/м)
  base_price_per_meter: number;    // Базовая цена (грн/м)
  ink_markup_white: number;        // Наценка на белую краску (грн/л)
  ink_markup_color: number;        // Наценка на цветную краску (грн/л)
}

export interface PageDimensions {
  page: number;
  width_cm: number;
  height_cm: number;
  area_cm2: number;
}

export interface ColorAnalysis {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
  white: number;
}

export interface InkUsage {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
  white: number;
}

export interface CostCalculation {
  // Себестоимость
  white_ink_cost_self: number;
  color_ink_cost_self: number;
  film_cost_self: number;
  glue_cost_self: number;
  total_cost_self: number;
  
  // Ваша модель
  base_price: number;
  ink_surcharge_white: number;
  ink_surcharge_color: number;
  your_total_price: number;
  your_profit: number;
  your_margin: number;
  
  // Конкуренты
  competitor_price: number;
  competitor_profit: number;
  competitor_margin: number;
  
  // Сравнение
  profit_difference: number;
  price_difference: number;
  
  // Технические данные
  glue_grams: number;
  film_meters: number;
  white_ink_liters: number;
  color_ink_liters: number;
}

export interface AnalysisResult {
  pages: number;
  total_area: number;
  dimensions: PageDimensions[];
  colors: ColorAnalysis;
  ink_usage: InkUsage;
  material_cost: CostCalculation;
}

export class DTFInkCalculator {
  private inkCoverage: InkCoverage;
  private materialPrices: MaterialPrices;
  private pricingModel: PricingModel;
  private glueCoverage: number; // г/м²

  constructor() {
    // Реальные параметры DTF печати для принтеров 2 головы 3200 dpi (в мл на квадратный метр)
    this.inkCoverage = {
      cyan: 15.0,      // Голубая краска - мл/м²
      magenta: 15.0,   // Пурпурная краска - мл/м²
      yellow: 15.0,    // Желтая краска - мл/м²
      black: 15.0,     // Черная краска - мл/м²
      white: 45.0,     // Белая краска (подложка) - мл/м²
    };

    // Себестоимость материалов (в грн)
    this.materialPrices = {
      white_ink: 1890,    // 1890 грн за 1л белой краски
      color_ink: 1680,    // 1680 грн за 1л цветной краски
      film: 33,           // 33 грн за 1м пленки (себестоимость)
      glue: 588,          // 588 грн за 1 кг клея
    };

    // НОВАЯ МОДЕЛЬ: Цена зависит от расхода краски
    this.pricingModel = {
      fixed_price_per_meter: 350,     // Конкуренты берут 350 грн/м за всё
      base_price_per_meter: 250,      // Ваша базовая цена за пленку+клей+работу
      ink_markup_white: 3000,         // Наценка на белую краску (грн/л)
      ink_markup_color: 2500,         // Наценка на цветную краску (грн/л)
    };

    // Расход клея (г/м²)
    this.glueCoverage = 20.0;
  }

  /**
   * Анализирует изображение RGB и возвращает покрытие цветами
   */
  public analyzeImageColors(imageData: Uint8Array, width: number, height: number): ColorAnalysis {
    // Счетчики для разных типов пикселей
    let cyanPixels = 0;
    let magentaPixels = 0;
    let yellowPixels = 0;
    let blackPixels = 0;
    let whitePixels = 0;
    let transparentPixels = 0;
    let totalSampled = 0;

    // Анализируем каждый 10-й пиксель для скорости
    for (let x = 0; x < width; x += 10) {
      for (let y = 0; y < height; y += 10) {
        const index = (y * width + x) * 4; // RGBA
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];
        const a = imageData[index + 3];
        
        totalSampled++;
        
        // Пропускаем полностью прозрачные пиксели
        if (a < 10) {
          transparentPixels++;
          continue;
        }
        
        // В DTF печати:
        // - Белый цвет (RGB=255,255,255) = белая краска
        // - Цветные пиксели = соответствующие цветные краски + белая подложка
        // - Черный цвет = черная краска + белая подложка
        
        if (r >= 240 && g >= 240 && b >= 240) {  // Белый пиксель
          whitePixels++;
        } else {  // Цветной или черный пиксель - нужна белая подложка
          whitePixels++;  // Белая подложка под всеми цветными пикселями
          
          // Анализируем цветные составляющие
          if (r < 200) {  // Есть голубой компонент
            cyanPixels++;
          }
          if (g < 200) {  // Есть пурпурный компонент  
            magentaPixels++;
          }
          if (b < 200) {  // Есть желтый компонент
            yellowPixels++;
          }
          if (r < 100 && g < 100 && b < 100) {  // Темный пиксель - черная краска
            blackPixels++;
          }
        }
      }
    }

    // Вычисляем покрытие как долю от общей площади
    if (totalSampled === 0) {
      return { cyan: 0, magenta: 0, yellow: 0, black: 0, white: 0 };
    }

    return {
      cyan: cyanPixels / totalSampled,
      magenta: magentaPixels / totalSampled,
      yellow: yellowPixels / totalSampled,
      black: blackPixels / totalSampled,
      white: whitePixels / totalSampled  // Включает и чисто белые пиксели, и подложку под цветными
    };
  }

  /**
   * Рассчитывает количество краски в мл для заданной площади
   */
  public calculateInkUsageForArea(colors: ColorAnalysis, areaM2: number): InkUsage {
    return {
      cyan: Math.round(colors.cyan * areaM2 * this.inkCoverage.cyan * 100) / 100,
      magenta: Math.round(colors.magenta * areaM2 * this.inkCoverage.magenta * 100) / 100,
      yellow: Math.round(colors.yellow * areaM2 * this.inkCoverage.yellow * 100) / 100,
      black: Math.round(colors.black * areaM2 * this.inkCoverage.black * 100) / 100,
      white: Math.round(colors.white * areaM2 * this.inkCoverage.white * 100) / 100,
    };
  }

  /**
   * Простой расчет для файлов без анализа изображения (средние значения)
   */
  public calculateAverageInkUsage(widthCm: number, heightCm: number): InkUsage {
    const areaM2 = (widthCm * heightCm) / 10000;
    
    // Средние значения покрытия для типичного дизайна
    const averageCoverage = {
      cyan: 0.3,     // 30% покрытие
      magenta: 0.3,  // 30% покрытие
      yellow: 0.3,   // 30% покрытие
      black: 0.2,    // 20% покрытие
      white: 0.8,    // 80% покрытие (подложка)
    };

    return this.calculateInkUsageForArea(averageCoverage, areaM2);
  }

  /**
   * Рассчитывает стоимость краски
   */
  public calculateInkCost(inkUsage: InkUsage): number {
    const whiteInkCost = (inkUsage.white / 1000) * this.materialPrices.white_ink;
    const colorInkCost = ((inkUsage.cyan + inkUsage.magenta + inkUsage.yellow + inkUsage.black) / 1000) * this.materialPrices.color_ink;
    return whiteInkCost + colorInkCost;
  }

  // Геттеры для настроек
  public getInkCoverage(): InkCoverage {
    return { ...this.inkCoverage };
  }

  public getMaterialPrices(): MaterialPrices {
    return { ...this.materialPrices };
  }
}

// Экспорт по умолчанию
export default DTFInkCalculator;

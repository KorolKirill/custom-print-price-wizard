import * as pdfjsLib from 'pdfjs-dist';

// Настройка worker (обязательно!)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';

export interface FileDimensions {
  width: number;  // в см
  height: number; // в см
  pixelWidth?: number;
  pixelHeight?: number;
  dpi?: number;
}

export interface FileAnalysisResult {
  dimensions: FileDimensions;
  imageData?: Uint8Array;
  hasImageData: boolean;
  fileSize: number; // размер файла в байтах
}

/**
 * Анализирует файл и извлекает размеры и данные изображения
 */
export class FileAnalyzer {
  private static readonly MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5 МБ
  
  /**
   * Получает размеры и данные изображения из файла
   */
  public static async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileSize = file.size;

    console.log(`Анализируем файл: ${file.name}, тип: ${fileType}, размер: ${(fileSize / 1024 / 1024).toFixed(1)} МБ`);

    if (fileType.startsWith('image/')) {
      return this.analyzeImageFile(file);
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.analyzePDFFile(file);
    }

    if (fileName.endsWith('.psd')) {
      return this.analyzePSDFile(file);
    }

    // Fallback для неизвестных форматов
    return {
      dimensions: { width: 10, height: 10 },
      hasImageData: false,
      fileSize
    };
  }

  /**
   * Анализ обычных изображений
   */
  private static async analyzeImageFile(file: File): Promise<FileAnalysisResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          // Предполагаем 300 DPI для расчета размеров в см
          const dpi = 300;
          const widthCm = (img.width / dpi) * 2.54;
          const heightCm = (img.height / dpi) * 2.54;

          resolve({
            dimensions: {
              width: Math.round(widthCm * 10) / 10,
              height: Math.round(heightCm * 10) / 10,
              pixelWidth: img.width,
              pixelHeight: img.height,
              dpi: dpi
            },
            imageData: new Uint8Array(imageData.data),
            hasImageData: true,
            fileSize: file.size
          });
        } else {
          reject(new Error('Не удалось создать контекст canvas'));
        }
      };

      img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Анализ PDF файлов
   */
  private static async analyzePDFFile(file: File): Promise<FileAnalysisResult> {
    const shouldExtractImage = file.size <= this.MAX_PREVIEW_SIZE;
    
    console.log(`Анализируем PDF файл: ${file.name}, размер: ${(file.size / 1024 / 1024).toFixed(1)} МБ`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('PDF ArrayBuffer создан, размер:', arrayBuffer.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      }).promise;
      
      
      console.log(`PDF загружен, количество страниц: ${pdf.numPages}`);
      
      const page = await pdf.getPage(1);
      console.log('Первая страница загружена');
      
      const viewport = page.getViewport({ scale: 1 });
      console.log(`PDF размеры viewport: ${viewport.width}x${viewport.height} точек`);
      
      // PDF размеры в пунктах (points), конвертируем в см
      // 1 point = 1/72 inch, 1 inch = 2.54 cm
      const widthCm = (viewport.width / 72) * 2.54;
      const heightCm = (viewport.height / 72) * 2.54;

      console.log(`PDF размеры в см: ${widthCm.toFixed(1)}x${heightCm.toFixed(1)}`);

      // Извлекаем изображение только для файлов меньше 5 МБ
      let imageData: Uint8Array | undefined;
      let hasImageData = false;

      if (shouldExtractImage) {
        console.log('Извлекаем изображение из PDF для анализа чернил...');
        try {
          const scale = 1.5;
          const scaledViewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderTask = page.render({
              canvasContext: context,
              viewport: scaledViewport,
            });
            
            await renderTask.promise;
            console.log('PDF страница отрендерена в canvas');
            
            const canvasImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            imageData = new Uint8Array(canvasImageData.data);
            hasImageData = true;
            console.log(`Извлечено ${imageData.length} байт данных изображения`);
          }
        } catch (renderError) {
          console.warn('Не удалось отрендерить PDF для анализа цветов:', renderError);
        }
      } else {
        console.log(`PDF файл ${file.name} слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ), извлечение изображения отключено`);
      }

      const result = {
        dimensions: {
          width: Math.round(widthCm * 10) / 10,
          height: Math.round(heightCm * 10) / 10,
          pixelWidth: viewport.width,
          pixelHeight: viewport.height
        },
        imageData,
        hasImageData,
        fileSize: file.size
      };

      console.log('PDF анализ завершен успешно:', result.dimensions);
      return result;
      
    } catch (error) {
      console.error('Ошибка при анализе PDF:', error);
      console.error('Детали ошибки:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Fallback с размерами A4
      return {
        dimensions: { width: 21, height: 29.7 },
        hasImageData: false,
        fileSize: file.size
      };
    }
  }

  /**
   * Анализ PSD файлов (базовая реализация)
   */
  private static async analyzePSDFile(file: File): Promise<FileAnalysisResult> {
    const shouldExtractImage = file.size <= this.MAX_PREVIEW_SIZE;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      
      // Простое чтение заголовка PSD
      // PSD формат: signature(4) + version(2) + reserved(6) + channels(2) + height(4) + width(4) + depth(2) + color_mode(2)
      const signature = new TextDecoder().decode(arrayBuffer.slice(0, 4));
      
      if (signature === '8BPS') {
        const height = dataView.getUint32(14); // offset 14
        const width = dataView.getUint32(18);  // offset 18
        
        // Предполагаем 300 DPI для PSD файлов
        const dpi = 300;
        const widthCm = (width / dpi) * 2.54;
        const heightCm = (height / dpi) * 2.54;

        if (!shouldExtractImage) {
          console.log(`PSD файл ${file.name} слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ), предпросмотр отключен`);
        }

        return {
          dimensions: {
            width: Math.round(widthCm * 10) / 10,
            height: Math.round(heightCm * 10) / 10,
            pixelWidth: width,
            pixelHeight: height,
            dpi: dpi
          },
          hasImageData: false, // PSD слишком сложен для полного анализа в браузере
          fileSize: file.size
        };
      }
    } catch (error) {
      console.error('Ошибка при анализе PSD:', error);
    }

    // Fallback для PSD
    return {
      dimensions: { width: 15, height: 15 },
      hasImageData: false,
      fileSize: file.size
    };
  }

  /**
   * Проверяет, нужно ли показывать предпросмотр для файла
   */
  public static shouldShowPreview(file: File): boolean {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Для обычных изображений всегда показываем предпросмотр
    if (fileType.startsWith('image/')) {
      return true;
    }
    
    // Для PDF и PSD - только если файл меньше 5 МБ
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf') || fileName.endsWith('.psd')) {
      return file.size <= this.MAX_PREVIEW_SIZE;
    }
    
    return false;
  }
}

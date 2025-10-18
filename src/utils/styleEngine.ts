import {
  StyleConfig,
  ParagraphStyle,
  HeadingStyle,
  TextStyle,
  StyleValidationResult,
  StyleContext,
  StyleMergeOptions
} from '../types/style.js';
import { presetTemplateLoader } from '../template/presetLoader.js';

/**
 * 样式引擎类 - 负责样式验证、合并和应用
 */
export class StyleEngine {
  private defaultConfig: StyleConfig;
  private styleCache: Map<string, any> = new Map();

  constructor() {
    this.defaultConfig = this.createDefaultStyleConfig();
  }

  /**
   * 创建默认样式配置
   */
  private createDefaultStyleConfig(): StyleConfig {
    // 使用客户分析模板作为默认配置
    return {
      document: {
        defaultFont: '宋体',
        defaultSize: 24,
        defaultColor: '000000',
        page: {
          size: 'A4',
          orientation: 'portrait',
          margins: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      paragraphStyles: {
        normal: {
          name: '正文',
          font: '宋体',
          size: 24,
          color: '000000',
          spacing: {
            line: 400,
            lineRule: 'auto',
            after: 120
          },
          alignment: 'justify',
          indent: {
            firstLine: 480 // 正文首行缩进2个字符（基于24号字体）
          }
        }
      },
      headingStyles: {
        h1: {
          name: '一级标题',
          level: 1,
          font: '黑体',
          size: 32,
          color: '000000',
          bold: true,
          spacing: {
            before: 480,
            after: 240,
            line: 400
          },
          alignment: 'center'
        },
        h2: {
          name: '二级标题',
          level: 2,
          font: '黑体',
          size: 28,
          color: '000000',
          bold: true,
          spacing: {
            before: 360,
            after: 180,
            line: 380
          }
        },
        h3: {
          name: '三级标题',
          level: 3,
          font: '宋体',
          size: 26,
          color: '000000',
          bold: true,
          spacing: {
            before: 240,
            after: 120,
            line: 360
          }
        },
        h4: {
          name: '四级标题',
          level: 4,
          font: '宋体',
          size: 24,
          color: '000000',
          bold: true,
          spacing: {
            before: 180,
            after: 90,
            line: 340
          }
        },
        h5: {
          name: '五级标题',
          level: 5,
          font: '宋体',
          size: 22,
          color: '000000',
          bold: true,
          spacing: {
            before: 120,
            after: 60,
            line: 320
          }
        },
        h6: {
          name: '六级标题',
          level: 6,
          font: '宋体',
          size: 20,
          color: '000000',
          bold: true,
          spacing: {
            before: 120,
            after: 60,
            line: 320
          }
        }
      },
      listStyles: {
        bullet: {
          name: '项目符号列表',
          type: 'bullet',
          font: '宋体',
          size: 24,
          color: '000000',
          spacing: {
            line: 400,
            after: 60
          },
          indent: {
            left: 480
          }
        },
        ordered: {
          name: '编号列表',
          type: 'number',
          font: '宋体',
          size: 24,
          color: '000000',
          spacing: {
            line: 400,
            after: 60
          },
          indent: {
            left: 480
          }
        }
      },
      tableStyles: {
        default: {
          name: '默认表格',
          width: {
            size: 100,
            type: 'pct'
          },
          borders: {
            top: { size: 8, color: '000000', style: 'single' },
            bottom: { size: 8, color: '000000', style: 'single' },
            left: { size: 4, color: '000000', style: 'single' },
            right: { size: 4, color: '000000', style: 'single' },
            insideHorizontal: { size: 4, color: '000000', style: 'single' },
            insideVertical: { size: 4, color: '000000', style: 'single' }
          },
          cellMargin: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          },
          headerStyle: {
            shading: 'F0F0F0',
            textStyle: {
              font: '宋体',
              bold: true,
              color: '000000',
              size: 24
            }
          }
        }
      },
      codeBlockStyle: {
        name: '代码块',
        font: 'Courier New',
        size: 20,
        color: '000000',
        backgroundColor: 'F8F9FA',
        spacing: {
          before: 240,
          after: 240,
          line: 240
        },
        indent: {
          left: 240
        },
        border: {
          left: { size: 4, color: 'CCCCCC', style: 'single' }
        }
      },
      blockquoteStyle: {
        name: '引用',
        font: '宋体',
        size: 24,
        color: '000000',
        italic: true,
        indent: {
          left: 720
        },
        border: {
          left: { size: 4, color: 'CCCCCC', style: 'single' }
        },
        spacing: {
          before: 240,
          after: 240,
          line: 400
        },
        shading: {
          fill: 'F8F9FA',
          type: 'solid'
        }
      },
      inlineCodeStyle: {
        font: 'Courier New',
        size: 22,
        color: '000000'
      },
      emphasisStyles: {
        strong: {
          bold: true
        },
        emphasis: {
          italic: true
        },
        strikethrough: {
          strike: true
        }
      }
    };
  }

  /**
   * 验证样式配置
   */
  validateStyleConfig(config: StyleConfig): StyleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证文档样式
    if (config.document) {
      if (config.document.defaultSize && (config.document.defaultSize < 8 || config.document.defaultSize > 144)) {
        warnings.push('文档默认字号建议在8-144之间');
      }
      
      if (config.document.defaultColor && !/^[0-9A-Fa-f]{6}$/.test(config.document.defaultColor)) {
        errors.push('文档默认颜色格式无效，应为6位十六进制');
      }
    }

    // 验证标题样式
    if (config.headingStyles) {
      Object.entries(config.headingStyles).forEach(([key, style]) => {
        if (style && style.size && (style.size < 8 || style.size > 144)) {
          warnings.push(`标题${key}字号建议在8-144之间`);
        }
        
        if (style && style.color && !/^[0-9A-Fa-f]{6}$/.test(style.color)) {
          errors.push(`标题${key}颜色格式无效`);
        }
      });
    }

    // 验证段落样式
    if (config.paragraphStyles) {
      Object.entries(config.paragraphStyles).forEach(([key, style]) => {
        if (style && style.size && (style.size < 8 || style.size > 144)) {
          warnings.push(`段落样式${key}字号建议在8-144之间`);
        }
        
        if (style && style.color && !/^[0-9A-Fa-f]{6}$/.test(style.color)) {
          errors.push(`段落样式${key}颜色格式无效`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 合并样式配置
   */
  mergeStyleConfigs(base: StyleConfig, override: StyleConfig, options: StyleMergeOptions = {}): StyleConfig {
    const { deep = true, override: overrideExisting = true } = options;
    
    if (!deep) {
      return overrideExisting ? { ...base, ...override } : { ...override, ...base };
    }

    const result: StyleConfig = JSON.parse(JSON.stringify(base));

    // 深度合并文档样式
    if (override.document) {
      result.document = this.deepMerge(result.document || {}, override.document, overrideExisting);
    }

    // 深度合并段落样式
    if (override.paragraphStyles) {
      result.paragraphStyles = this.deepMerge(result.paragraphStyles || {}, override.paragraphStyles, overrideExisting);
    }

    // 深度合并标题样式
    if (override.headingStyles) {
      result.headingStyles = this.deepMerge(result.headingStyles || {}, override.headingStyles, overrideExisting);
    }

    // 深度合并列表样式
    if (override.listStyles) {
      result.listStyles = this.deepMerge(result.listStyles || {}, override.listStyles, overrideExisting);
    }

    // 深度合并表格样式
    if (override.tableStyles) {
      result.tableStyles = this.deepMerge(result.tableStyles || {}, override.tableStyles, overrideExisting);
    }

    // 合并其他样式
    if (override.codeBlockStyle) {
      result.codeBlockStyle = this.deepMerge(result.codeBlockStyle || {}, override.codeBlockStyle, overrideExisting);
    }

    if (override.blockquoteStyle) {
      result.blockquoteStyle = this.deepMerge(result.blockquoteStyle || {}, override.blockquoteStyle, overrideExisting);
    }

    if (override.inlineCodeStyle) {
      result.inlineCodeStyle = this.deepMerge(result.inlineCodeStyle || {}, override.inlineCodeStyle, overrideExisting);
    }

    if (override.emphasisStyles) {
      result.emphasisStyles = this.deepMerge(result.emphasisStyles || {}, override.emphasisStyles, overrideExisting);
    }

    return result;
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any, override: boolean): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key], override);
        } else {
          if (override || result[key] === undefined) {
            result[key] = source[key];
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 获取合并后的样式配置
   */
  getEffectiveStyleConfig(userConfig?: StyleConfig): StyleConfig {
    // 如果没有提供用户配置，尝试使用客户分析模板作为默认配置
    if (!userConfig) {
      const defaultTemplateConfig = presetTemplateLoader.getDefaultStyleConfig();
      if (defaultTemplateConfig) {
        console.log('使用客户分析模板作为默认样式配置');
        return this.cleanInvalidValues(defaultTemplateConfig);
      }
      // 如果客户分析模板不可用，使用内置默认配置
      console.log('使用内置默认样式配置');
      return this.defaultConfig;
    }

    const cacheKey = JSON.stringify(userConfig);
    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey);
    }

    // 获取基础配置（优先使用客户分析模板，否则使用内置默认配置）
    const baseConfig = presetTemplateLoader.getDefaultStyleConfig() || this.defaultConfig;
    const merged = this.mergeStyleConfigs(baseConfig, userConfig);
    const cleaned = this.cleanInvalidValues(merged);
    this.styleCache.set(cacheKey, cleaned);
    
    return cleaned;
  }

  /**
   * 清理无效的样式值
   */
  private cleanInvalidValues(config: StyleConfig): StyleConfig {
    const cleaned = JSON.parse(JSON.stringify(config));

    // 清理文档样式
    if (cleaned.document) {
      if (cleaned.document.defaultColor && !/^[0-9A-Fa-f]{6}$/.test(cleaned.document.defaultColor)) {
        console.warn(`清理无效的文档默认颜色: ${cleaned.document.defaultColor}, 使用默认值`);
        cleaned.document.defaultColor = this.defaultConfig.document?.defaultColor || '000000';
      }
      if (cleaned.document.defaultSize && (cleaned.document.defaultSize < 8 || cleaned.document.defaultSize > 144)) {
        console.warn(`清理无效的文档默认字号: ${cleaned.document.defaultSize}, 使用默认值`);
        cleaned.document.defaultSize = this.defaultConfig.document?.defaultSize || 24;
      }
    }

    // 清理标题样式
    if (cleaned.headingStyles) {
      Object.entries(cleaned.headingStyles).forEach(([key, style]) => {
        if (style && typeof style === 'object') {
          const headingStyle = style as any;
          if (headingStyle.color && !/^[0-9A-Fa-f]{6}$/.test(headingStyle.color)) {
            console.warn(`清理无效的标题${key}颜色: ${headingStyle.color}, 使用默认值`);
            headingStyle.color = this.defaultConfig.headingStyles?.[key as keyof typeof this.defaultConfig.headingStyles]?.color || '000000';
          }
          if (headingStyle.size && (headingStyle.size < 8 || headingStyle.size > 144)) {
            console.warn(`清理无效的标题${key}字号: ${headingStyle.size}, 使用默认值`);
            headingStyle.size = this.defaultConfig.headingStyles?.[key as keyof typeof this.defaultConfig.headingStyles]?.size || 24;
          }
        }
      });
    }

    // 清理段落样式
    if (cleaned.paragraphStyles) {
      Object.entries(cleaned.paragraphStyles).forEach(([key, style]) => {
        if (style && typeof style === 'object') {
          const paragraphStyle = style as any;
          if (paragraphStyle.color && !/^[0-9A-Fa-f]{6}$/.test(paragraphStyle.color)) {
            console.warn(`清理无效的段落样式${key}颜色: ${paragraphStyle.color}, 使用默认值`);
            paragraphStyle.color = this.defaultConfig.paragraphStyles?.[key as keyof typeof this.defaultConfig.paragraphStyles]?.color || '000000';
          }
          if (paragraphStyle.size && (paragraphStyle.size < 8 || paragraphStyle.size > 144)) {
            console.warn(`清理无效的段落样式${key}字号: ${paragraphStyle.size}, 使用默认值`);
            paragraphStyle.size = this.defaultConfig.paragraphStyles?.[key as keyof typeof this.defaultConfig.paragraphStyles]?.size || 24;
          }
        }
      });
    }

    return cleaned;
  }

  /**
   * 根据上下文获取样式
   */
  getStyleForContext(context: StyleContext, config: StyleConfig): any {
    switch (context.elementType) {
      case 'heading':
        const headingKey = `h${context.level || 1}` as keyof typeof config.headingStyles;
        return config.headingStyles?.[headingKey] || config.headingStyles?.h1;
        
      case 'paragraph':
        return config.paragraphStyles?.normal;
        
      case 'list':
        return context.inList ? 
          (config.listStyles?.bullet || config.listStyles?.ordered) : 
          config.paragraphStyles?.normal;
          
      case 'table':
        return config.tableStyles?.default;
        
      case 'code':
        return config.codeBlockStyle;
        
      case 'blockquote':
        return config.blockquoteStyle;
        
      case 'inline':
        return config.inlineCodeStyle;
        
      default:
        return config.paragraphStyles?.normal;
    }
  }

  /**
   * 清除样式缓存
   */
  clearCache(): void {
    this.styleCache.clear();
  }

  /**
   * 获取默认样式配置
   */
  getDefaultConfig(): StyleConfig {
    return JSON.parse(JSON.stringify(this.defaultConfig));
  }
}

/**
 * 全局样式引擎实例
 */
export const styleEngine = new StyleEngine();
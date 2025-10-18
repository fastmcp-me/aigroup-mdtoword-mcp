import MarkdownIt from 'markdown-it';
import { MarkdownConverter } from '../types/index.js';
import { StyleConfig, StyleContext, TextStyle, ParagraphStyle, HeadingStyle } from '../types/style.js';
import { styleEngine } from '../utils/styleEngine.js';

// 使用新版docx API
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  ImageRun
} from 'docx';
import fs from 'fs';
import fetch from 'node-fetch';

export class DocxMarkdownConverter implements MarkdownConverter {
  private md: MarkdownIt;
  private effectiveStyleConfig: StyleConfig;

  constructor(styleConfig?: StyleConfig) {
    const constructorStartTime = Date.now();
    console.log(`🚀 [转换器] 开始初始化 - ${new Date().toISOString()}`);
    
    const mdInitStartTime = Date.now();
    this.md = new MarkdownIt({
      html: true,  // 启用HTML标签处理
      xhtmlOut: true,
      breaks: true,
      typographer: true
    });
    console.log(`⏱️ [转换器] MarkdownIt初始化耗时: ${Date.now() - mdInitStartTime}ms`);
    
    // 使用样式引擎获取有效的样式配置
    const styleEngineStartTime = Date.now();
    this.effectiveStyleConfig = styleEngine.getEffectiveStyleConfig(styleConfig);
    console.log(`⏱️ [转换器] 样式引擎处理耗时: ${Date.now() - styleEngineStartTime}ms`);
    
    // 验证样式配置
    const validationStartTime = Date.now();
    const validation = styleEngine.validateStyleConfig(this.effectiveStyleConfig);
    console.log(`⏱️ [转换器] 样式配置验证耗时: ${Date.now() - validationStartTime}ms`);
    
    if (!validation.valid && validation.errors) {
      console.warn('样式配置验证失败:', validation.errors);
    }
    if (validation.warnings) {
      console.warn('样式配置警告:', validation.warnings);
    }
    
    const constructorTime = Date.now() - constructorStartTime;
    console.log(`🏁 [转换器] 初始化完成，总耗时: ${constructorTime}ms`);
  }

  async convert(markdown: string): Promise<Buffer> {
    const convertStartTime = Date.now();
    console.log(`🚀 [转换器] 开始转换，Markdown长度: ${markdown.length} 字符`);
    
    const parseStartTime = Date.now();
    const tokens = this.md.parse(markdown, {});
    const parseTime = Date.now() - parseStartTime;
    console.log(`⏱️ [转换器] Markdown解析耗时: ${parseTime}ms，生成 ${tokens.length} 个token`);
    
    const docCreateStartTime = Date.now();
    const doc = await this.createDocument(tokens);
    const docCreateTime = Date.now() - docCreateStartTime;
    console.log(`⏱️ [转换器] 文档创建耗时: ${docCreateTime}ms`);
    
    const packStartTime = Date.now();
    const buffer = await Packer.toBuffer(doc);
    const packTime = Date.now() - packStartTime;
    console.log(`⏱️ [转换器] 文档打包耗时: ${packTime}ms，生成文件大小: ${buffer.length} 字节`);
    
    const totalConvertTime = Date.now() - convertStartTime;
    console.log(`🏁 [转换器] 转换完成，总耗时: ${totalConvertTime}ms`);
    
    return buffer;
  }

  private async createDocument(tokens: any[]): Promise<Document> {
    const children = await this.processTokens(tokens);
    const docStyle = this.effectiveStyleConfig.document;
    
    return new Document({
      styles: {
        default: {
          document: {
            run: {
              font: docStyle?.defaultFont || "宋体",
              size: docStyle?.defaultSize || 24,
              color: docStyle?.defaultColor || "000000"
            }
          },
          heading1: this.createDocxHeadingStyle(1),
          heading2: this.createDocxHeadingStyle(2),
          heading3: this.createDocxHeadingStyle(3),
          heading4: this.createDocxHeadingStyle(4),
          heading5: this.createDocxHeadingStyle(5),
          heading6: this.createDocxHeadingStyle(6)
        }
      },
      sections: [{
        properties: {
          page: {
            size: this.getPageSize(),
            margin: this.getPageMargins()
          }
        },
        children: children
      }]
    });
  }

  /**
   * 创建 DOCX 标题样式
   */
  private createDocxHeadingStyle(level: 1|2|3|4|5|6): any {
    const headingKey = `h${level}` as keyof typeof this.effectiveStyleConfig.headingStyles;
    const headingStyles = this.effectiveStyleConfig.headingStyles;
    const headingStyle = headingStyles?.[headingKey] as HeadingStyle | undefined;
    
    if (!headingStyle) {
      return {};
    }

    return {
      run: {
        font: headingStyle.font,
        size: headingStyle.size,
        bold: headingStyle.bold,
        italic: headingStyle.italic,
        color: headingStyle.color
      },
      paragraph: {
        spacing: {
          before: headingStyle.spacing?.before,
          after: headingStyle.spacing?.after,
          line: headingStyle.spacing?.line
        },
        alignment: headingStyle.alignment,
        indent: {
          left: headingStyle.indent?.left,
          right: headingStyle.indent?.right,
          firstLine: headingStyle.indent?.firstLine,
          hanging: headingStyle.indent?.hanging
        }
      }
    };
  }

  /**
   * 获取页面大小
   */
  private getPageSize(): any {
    const pageSize = this.effectiveStyleConfig.document?.page?.size || 'A4';
    const orientation = this.getPageOrientation();
    const sizeMap = {
      'A4': { width: 11906, height: 16838 },
      'A3': { width: 16838, height: 23811 },
      'Letter': { width: 12240, height: 15840 },
      'Legal': { width: 12240, height: 20160 }
    };
    const size = sizeMap[pageSize] || sizeMap['A4'];
    return orientation === 'landscape'
      ? { width: size.height, height: size.width }
      : size;
  }

  /**
   * 获取页面方向
   */
  private getPageOrientation(): string {
    return this.effectiveStyleConfig.document?.page?.orientation || 'portrait';
  }

  /**
   * 获取页边距
   */
  private getPageMargins(): any {
    const margins = this.effectiveStyleConfig.document?.page?.margins;
    return {
      top: margins?.top || 1440,
      bottom: margins?.bottom || 1440,
      left: margins?.left || 1440,
      right: margins?.right || 1440
    };
  }

  private async processTokens(tokens: any[]): Promise<any[]> {
    const children: any[] = [];
    let currentListItems: Paragraph[] = [];
    let inList = false;
    let listLevel = 0;
    let orderedList = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      switch (token.type) {
        case 'heading_open':
          const level = parseInt(token.tag.slice(1)) as 1|2|3|4|5|6;
          const headingContent = await this.processInlineContentAsync(tokens[i + 1], level);
          children.push(this.createHeading(headingContent as TextRun[], level));
          i++; // Skip the next token
          break;

        case 'paragraph_open':
          const paragraphContent = await this.processInlineContentAsync(tokens[i + 1]);
          // 如果段落包含图片，需要特殊处理
          if (paragraphContent.some(item => item instanceof ImageRun)) {
            children.push(this.createParagraphWithImages(paragraphContent));
          } else {
            children.push(this.createParagraph(paragraphContent as TextRun[]));
          }
          i++; // Skip the next token
          break;

        case 'bullet_list_open':
          inList = true;
          orderedList = false;
          break;

        case 'ordered_list_open':
          inList = true;
          orderedList = true;
          break;

        case 'bullet_list_close':
        case 'ordered_list_close':
          if (currentListItems.length > 0) {
            children.push(...currentListItems);
            currentListItems = [];
          }
          inList = false;
          listLevel = 0;
          break;

        case 'list_item_open':
          listLevel = (token.attrs && token.attrs.find((attr: any[]) => attr[0] === 'level')?.[1]) || 0;
          const itemContent = await this.processInlineContentAsync(tokens[i + 2]);
          const listItem = this.createListItem(itemContent as TextRun[], orderedList, listLevel);
          if (inList) {
            currentListItems.push(listItem);
          }
          i += 2; // Skip content tokens
          break;

        case 'table_open':
          const tableData = await this.extractTableData(tokens, i);
          children.push(this.createTable(tableData.rows));
          i = tableData.endIndex;
          break;

        case 'blockquote_open':
          const quoteTokens = [];
          i++;
          while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
            quoteTokens.push(tokens[i]);
            i++;
          }
          const blockquoteContent = await this.processInlineContentAsync(tokens.find(t => t.type === 'inline') || { content: '' });
          children.push(this.createBlockquote(blockquoteContent as TextRun[]));
          break;

        case 'fence':
          children.push(this.createCodeBlock(token.content, token.info));
          break;
          
        case 'image':
          console.log(`\n📸 [Token处理] 发现图片token`);
          const imageParagraph = await this.createImageParagraph(token);
          if (imageParagraph) {
            children.push(imageParagraph);
            console.log(`   ✅ 图片已添加到文档`);
          } else {
            console.error(`   ❌ 图片处理失败，跳过该图片`);
          }
          break;
          
        case 'html_block':
          console.log(`\n📄 [Token处理] 发现HTML块`);
          // 提取HTML中的img标签
          const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
          let match;
          while ((match = imgRegex.exec(token.content)) !== null) {
            const imgSrc = match[1];
            console.log(`   🖼️ 发现HTML中的图片: ${imgSrc}`);
            // 创建一个模拟的图片token
            const imgToken = {
              type: 'image',
              tag: 'img',
              attrs: [['src', imgSrc], ['alt', ''], ['title', '']],
              content: '',
              children: null,
              // 添加attrGet方法以兼容createImageParagraph
              attrGet: function(name: string) {
                const attr = this.attrs.find((a: any[]) => a[0] === name);
                return attr ? attr[1] : null;
              }
            };
            const htmlImageParagraph = await this.createImageParagraph(imgToken);
            if (htmlImageParagraph) {
              children.push(htmlImageParagraph);
              console.log(`   ✅ HTML图片已添加到文档`);
            }
          }
          // 忽略style标签和其他HTML内容
          break;
      }
    }

    return children;
  }


  private async processInlineContentAsync(token: any, headingLevel?: number): Promise<(TextRun | ImageRun)[]> {
    const runs: (TextRun | ImageRun)[] = [];
    
    for (const child of token.children) {
      const baseStyle = this.getTextStyle(headingLevel);
      
      switch (child.type) {
        case 'text':
          // 处理文本中的转义换行符
          const textParts = child.content.split(/\\n/);
          textParts.forEach((part: string, index: number) => {
            if (part) {
              runs.push(new TextRun({
                text: part,
                ...this.convertTextStyleToDocx(baseStyle)
              }));
            }
            // 在文本片段之间添加换行
            if (index < textParts.length - 1) {
              runs.push(new TextRun({
                text: '',
                break: 1,
                ...this.convertTextStyleToDocx(baseStyle)
              }));
            }
          });
          break;
        case 'strong':
          const strongStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.emphasisStyles?.strong || { bold: true });
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(strongStyle)
          }));
          break;
        case 'em':
          const emStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.emphasisStyles?.emphasis || { italic: true });
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(emStyle)
          }));
          break;
        case 'code_inline':
          const codeStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.inlineCodeStyle || {});
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(codeStyle)
          }));
          break;
        case 'image':
          console.log(`\n📸 [Inline处理] 发现内联图片`);
          const imageRun = await this.createImageRun(child);
          if (imageRun) {
            runs.push(imageRun);
          }
          break;
          
        case 'html_inline':
          console.log(`\n📄 [Inline处理] 发现内联HTML`);
          // 提取HTML中的img标签
          const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
          let match;
          while ((match = imgRegex.exec(child.content)) !== null) {
            const imgSrc = match[1];
            console.log(`   🖼️ 发现HTML中的图片: ${imgSrc}`);
            // 创建一个模拟的图片token
            const imgToken = {
              type: 'image',
              tag: 'img',
              attrs: [['src', imgSrc], ['alt', ''], ['title', '']],
              content: '',
              children: null,
              // 添加attrGet方法以兼容createImageParagraph
              attrGet: function(name: string) {
                const attr = this.attrs.find((a: any[]) => a[0] === name);
                return attr ? attr[1] : null;
              }
            };
            const htmlImageRun = await this.createImageRun(imgToken);
            if (htmlImageRun) {
              runs.push(htmlImageRun);
              console.log(`   ✅ HTML内联图片已处理`);
            }
          }
          // 对于非图片的HTML内容，暂时忽略
          break;
      }
    }

    return runs;
  }

  /**
   * 获取文本样式
   */
  private getTextStyle(headingLevel?: number): TextStyle {
    if (headingLevel) {
      const headingKey = `h${headingLevel}` as keyof typeof this.effectiveStyleConfig.headingStyles;
      const headingStyle = this.effectiveStyleConfig.headingStyles?.[headingKey] as HeadingStyle | undefined;
      if (headingStyle) {
        return {
          font: headingStyle.font,
          size: headingStyle.size,
          color: headingStyle.color,
          bold: headingStyle.bold,
          italic: headingStyle.italic,
          underline: headingStyle.underline,
          strike: headingStyle.strike
        };
      }
    }
    
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    return {
      font: normalStyle?.font || this.effectiveStyleConfig.document?.defaultFont,
      size: normalStyle?.size || this.effectiveStyleConfig.document?.defaultSize,
      color: normalStyle?.color || this.effectiveStyleConfig.document?.defaultColor,
      bold: normalStyle?.bold,
      italic: normalStyle?.italic,
      underline: normalStyle?.underline,
      strike: normalStyle?.strike
    };
  }

  /**
   * 合并文本样式
   */
  private mergeTextStyles(base: TextStyle, override: TextStyle): TextStyle {
    return {
      font: override.font || base.font,
      size: override.size || base.size,
      color: override.color || base.color,
      bold: override.bold !== undefined ? override.bold : base.bold,
      italic: override.italic !== undefined ? override.italic : base.italic,
      underline: override.underline !== undefined ? override.underline : base.underline,
      strike: override.strike !== undefined ? override.strike : base.strike
    };
  }

  /**
   * 将文本样式转换为 DOCX 格式
   */
  private convertTextStyleToDocx(style: TextStyle): any {
    return {
      font: style.font,
      size: style.size,
      color: style.color,
      bold: style.bold,
      italics: style.italic,
      underline: style.underline ? {} : undefined,
      strike: style.strike
    };
  }

  private createHeading(content: TextRun[], level: 1|2|3|4|5|6): Paragraph {
    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };

    const headingKey = `h${level}` as keyof typeof this.effectiveStyleConfig.headingStyles;
    const headingStyle = this.effectiveStyleConfig.headingStyles?.[headingKey] as HeadingStyle | undefined;

    return new Paragraph({
      heading: headingLevels[level],
      children: content,
      spacing: {
        before: headingStyle?.spacing?.before || 240,
        after: headingStyle?.spacing?.after || 120,
        line: headingStyle?.spacing?.line || 360
      },
      alignment: headingStyle?.alignment === "justify" ? "both" : headingStyle?.alignment,
      indent: {
        left: headingStyle?.indent?.left,
        right: headingStyle?.indent?.right,
        firstLine: headingStyle?.indent?.firstLine,
        hanging: headingStyle?.indent?.hanging
      }
    });
  }

  private createParagraph(content: TextRun[]): Paragraph {
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    
    return new Paragraph({
      children: content,
      spacing: {
        before: normalStyle?.spacing?.before,
        after: normalStyle?.spacing?.after,
        line: normalStyle?.spacing?.line || 360
      },
      alignment: normalStyle?.alignment === "justify" ? "both" : normalStyle?.alignment,
      indent: {
        left: normalStyle?.indent?.left,
        right: normalStyle?.indent?.right,
        firstLine: normalStyle?.indent?.firstLine,
        hanging: normalStyle?.indent?.hanging
      },
      border: normalStyle?.border ? {
        top: normalStyle.border.top ? {
          style: normalStyle.border.top.style === "dash" ? "dashed" : normalStyle.border.top.style,
          size: normalStyle.border.top.size,
          color: normalStyle.border.top.color
        } : undefined,
        bottom: normalStyle.border.bottom ? {
          style: normalStyle.border.bottom.style === "dash" ? "dashed" : normalStyle.border.bottom.style,
          size: normalStyle.border.bottom.size,
          color: normalStyle.border.bottom.color
        } : undefined,
        left: normalStyle.border.left ? {
          style: normalStyle.border.left.style === "dash" ? "dashed" : normalStyle.border.left.style,
          size: normalStyle.border.left.size,
          color: normalStyle.border.left.color
        } : undefined,
        right: normalStyle.border.right ? {
          style: normalStyle.border.right.style === "dash" ? "dashed" : normalStyle.border.right.style,
          size: normalStyle.border.right.size,
          color: normalStyle.border.right.color
        } : undefined
      } : undefined,
      shading: normalStyle?.shading ? {
        fill: normalStyle.shading.fill,
        type: normalStyle.shading.type,
        color: normalStyle.shading.color
      } : undefined
    });
  }

  private createListItem(content: TextRun[], ordered: boolean, level: number): Paragraph {
    const listStyle = ordered ?
      this.effectiveStyleConfig.listStyles?.ordered :
      this.effectiveStyleConfig.listStyles?.bullet;

    return new Paragraph({
      bullet: ordered ? undefined : {
        level: level,
      },
      numbering: ordered ? {
        reference: 'default-numbering',
        level: level,
      } : undefined,
      children: content,
      spacing: {
        before: listStyle?.spacing?.before,
        after: listStyle?.spacing?.after,
        line: listStyle?.spacing?.line || 360
      },
      alignment: listStyle?.alignment === "justify" ? "both" : listStyle?.alignment,
      indent: {
        left: listStyle?.indent?.left || 360,
        right: listStyle?.indent?.right,
        firstLine: listStyle?.indent?.firstLine,
        hanging: listStyle?.indent?.hanging
      }
    });
  }

  private createBlockquote(content: TextRun[]): Paragraph {
    const blockquoteStyle = this.effectiveStyleConfig.blockquoteStyle;

    return new Paragraph({
      children: content,
      indent: {
        left: blockquoteStyle?.indent?.left || 720,
        right: blockquoteStyle?.indent?.right,
        firstLine: blockquoteStyle?.indent?.firstLine,
        hanging: blockquoteStyle?.indent?.hanging
      },
      border: blockquoteStyle?.border ? {
        left: blockquoteStyle.border.left ? {
          style: blockquoteStyle.border.left.style === "dash" ? "dashed" : blockquoteStyle.border.left.style,
          size: blockquoteStyle.border.left.size,
          color: blockquoteStyle.border.left.color
        } : undefined
      } : {
        left: {
          style: "single",
          size: 4,
          color: "#CCCCCC"
        }
      },
      spacing: {
        before: blockquoteStyle?.spacing?.before,
        after: blockquoteStyle?.spacing?.after,
        line: blockquoteStyle?.spacing?.line || 360
      },
      alignment: blockquoteStyle?.alignment === "justify" ? "both" : blockquoteStyle?.alignment,
      shading: blockquoteStyle?.shading ? {
        fill: blockquoteStyle.shading.fill,
        type: blockquoteStyle.shading.type,
        color: blockquoteStyle.shading.color
      } : undefined
    });
  }

  private createCodeBlock(code: string, language: string): Paragraph {
    const codeBlockStyle = this.effectiveStyleConfig.codeBlockStyle;
    const codeTextStyle = {
      font: codeBlockStyle?.codeFont || codeBlockStyle?.font || 'Courier New',
      size: codeBlockStyle?.size || 20,
      color: codeBlockStyle?.color || '000000',
      bold: codeBlockStyle?.bold,
      italic: codeBlockStyle?.italic
    };

    return new Paragraph({
      children: [
        new TextRun({
          text: code,
          ...this.convertTextStyleToDocx(codeTextStyle)
        }),
      ],
      spacing: {
        before: codeBlockStyle?.spacing?.before,
        after: codeBlockStyle?.spacing?.after,
        line: codeBlockStyle?.spacing?.line || 240
      },
      alignment: codeBlockStyle?.alignment === "justify" ? "both" : codeBlockStyle?.alignment,
      indent: {
        left: codeBlockStyle?.indent?.left,
        right: codeBlockStyle?.indent?.right,
        firstLine: codeBlockStyle?.indent?.firstLine,
        hanging: codeBlockStyle?.indent?.hanging
      },
      shading: {
        type: 'solid',
        color: codeBlockStyle?.backgroundColor || 'F5F5F5',
      }
    });
  }

  private createTable(rows: TextRun[][][]): Table {
    if (rows.length === 0) return new Table({rows: []});

    const isHeaderRow = (index: number) => index === 0; // 第一行作为表头
    const tableStyle = this.effectiveStyleConfig.tableStyles?.default;
    
    return new Table({
      width: tableStyle?.width || {
        size: 100,
        type: 'pct'
      },
      borders: tableStyle?.borders ? {
        top: tableStyle.borders.top ? {
          style: tableStyle.borders.top.style === "dash" ? "dashed" : tableStyle.borders.top.style,
          size: tableStyle.borders.top.size,
          color: tableStyle.borders.top.color
        } : undefined,
        bottom: tableStyle.borders.bottom ? {
          style: tableStyle.borders.bottom.style === "dash" ? "dashed" : tableStyle.borders.bottom.style,
          size: tableStyle.borders.bottom.size,
          color: tableStyle.borders.bottom.color
        } : undefined,
        left: tableStyle.borders.left ? {
          style: tableStyle.borders.left.style === "dash" ? "dashed" : tableStyle.borders.left.style,
          size: tableStyle.borders.left.size,
          color: tableStyle.borders.left.color
        } : undefined,
        right: tableStyle.borders.right ? {
          style: tableStyle.borders.right.style === "dash" ? "dashed" : tableStyle.borders.right.style,
          size: tableStyle.borders.right.size,
          color: tableStyle.borders.right.color
        } : undefined,
        insideHorizontal: tableStyle.borders.insideHorizontal ? {
          style: tableStyle.borders.insideHorizontal.style === "dash" ? "dashed" : tableStyle.borders.insideHorizontal.style,
          size: tableStyle.borders.insideHorizontal.size,
          color: tableStyle.borders.insideHorizontal.color
        } : undefined,
        insideVertical: tableStyle.borders.insideVertical ? {
          style: tableStyle.borders.insideVertical.style === "dash" ? "dashed" : tableStyle.borders.insideVertical.style,
          size: tableStyle.borders.insideVertical.size,
          color: tableStyle.borders.insideVertical.color
        } : undefined
      } : {
        top: { style: 'single', size: 4, color: '000000' },
        bottom: { style: 'single', size: 4, color: '000000' },
        left: { style: 'single', size: 4, color: '000000' },
        right: { style: 'single', size: 4, color: '000000' },
        insideHorizontal: { style: 'single', size: 2, color: 'DDDDDD' },
        insideVertical: { style: 'single', size: 2, color: 'DDDDDD' }
      },
      rows: rows.map((row, rowIndex) => new TableRow({
        children: row.map(cellContent => new TableCell({
          children: [new Paragraph({
            children: cellContent,
            spacing: {
              line: 360 // 1.5倍行距
            },
            alignment: tableStyle?.alignment || 'center'
          })],
          shading: isHeaderRow(rowIndex) ? {
            fill: tableStyle?.headerStyle?.shading || 'E0E0E0',
            type: 'solid',
            color: tableStyle?.headerStyle?.shading || 'E0E0E0'
          } : undefined,
          borders: isHeaderRow(rowIndex) ? (tableStyle?.borders ? {
            top: tableStyle.borders.top ? {
              style: tableStyle.borders.top.style === "dash" ? "dashed" : tableStyle.borders.top.style,
              size: tableStyle.borders.top.size,
              color: tableStyle.borders.top.color
            } : undefined,
            bottom: tableStyle.borders.bottom ? {
              style: tableStyle.borders.bottom.style === "dash" ? "dashed" : tableStyle.borders.bottom.style,
              size: tableStyle.borders.bottom.size,
              color: tableStyle.borders.bottom.color
            } : undefined,
            left: tableStyle.borders.left ? {
              style: tableStyle.borders.left.style === "dash" ? "dashed" : tableStyle.borders.left.style,
              size: tableStyle.borders.left.size,
              color: tableStyle.borders.left.color
            } : undefined,
            right: tableStyle.borders.right ? {
              style: tableStyle.borders.right.style === "dash" ? "dashed" : tableStyle.borders.right.style,
              size: tableStyle.borders.right.size,
              color: tableStyle.borders.right.color
            } : undefined
          } : {
            top: { style: 'single', size: 4, color: '000000' },
            bottom: { style: 'single', size: 4, color: '000000' },
            left: { style: 'single', size: 4, color: '000000' },
            right: { style: 'single', size: 4, color: '000000' }
          }) : undefined,
          margins: tableStyle?.cellMargin || {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          }
        })),
        tableHeader: isHeaderRow(rowIndex) // 标记表头行
      }))
    });
  }

  private createParagraphWithImages(content: (TextRun | ImageRun)[]): Paragraph {
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    
    return new Paragraph({
      children: content,
      spacing: {
        before: normalStyle?.spacing?.before,
        after: normalStyle?.spacing?.after,
        line: normalStyle?.spacing?.line || 360
      },
      alignment: normalStyle?.alignment === "justify" ? "both" : normalStyle?.alignment,
      indent: {
        left: normalStyle?.indent?.left,
        right: normalStyle?.indent?.right,
        firstLine: normalStyle?.indent?.firstLine,
        hanging: normalStyle?.indent?.hanging
      }
    });
  }

  private async createImageRun(token: any): Promise<ImageRun | null> {
    const imageStartTime = Date.now();
    try {
      const imageStyle = this.effectiveStyleConfig.imageStyles?.default;
      const src = token.attrGet('src');
      const alt = token.attrGet('alt') || 'Image';
      const title = token.attrGet('title') || '';
      
      console.log(`🖼️ [图片处理] 开始处理图片: ${src}`);
      console.log(`   - Alt文本: ${alt}`);
      console.log(`   - 标题: ${title}`);
      console.log(`   - 样式配置:`, imageStyle);
      
      // 处理不同类型的图片源
      let imageData: Buffer | string;
      let loadError: string | null = null;
      
      if (src.startsWith('data:')) {
        // Base64图片
        console.log(`   - 图片类型: Base64编码`);
        const base64Parts = src.split('base64,');
        if (base64Parts.length < 2) {
          console.error(`   ❌ Base64格式错误: 缺少base64标记`);
          loadError = 'Base64格式错误';
        } else {
          imageData = base64Parts[1];
          console.log(`   - Base64数据长度: ${imageData.length} 字符`);
        }
      } else if (src.startsWith('http')) {
        // 网络图片
        console.log(`   - 图片类型: 网络图片`);
        console.log(`   - 开始下载图片...`);
        const downloadStartTime = Date.now();
        try {
          const response = await fetch(src);
          if (!response.ok) {
            console.error(`   ❌ 图片下载失败: HTTP ${response.status} ${response.statusText}`);
            loadError = `HTTP ${response.status}`;
          } else {
            const arrayBuffer = await response.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
            const downloadTime = Date.now() - downloadStartTime;
            console.log(`   ✅ 图片下载成功，耗时: ${downloadTime}ms，大小: ${imageData.length} 字节`);
          }
        } catch (fetchError) {
          console.error(`   ❌ 图片下载异常:`, fetchError);
          loadError = '网络连接失败';
        }
      } else {
        // 本地图片
        console.log(`   - 图片类型: 本地文件`);
        if (!fs.existsSync(src)) {
          console.error(`   ❌ 本地图片文件不存在: ${src}`);
          loadError = '文件不存在';
        } else {
          try {
            imageData = fs.readFileSync(src);
            console.log(`   ✅ 本地图片读取成功，大小: ${imageData.length} 字节`);
          } catch (readError) {
            console.error(`   ❌ 本地图片读取失败:`, readError);
            loadError = '文件读取失败';
          }
        }
      }

      // 如果图片加载失败，创建占位符
      if (loadError || !imageData!) {
        console.log(`   ⚠️ 创建图片占位符...`);
        return this.createPlaceholderImageRun(src, alt, title, loadError || '图片加载失败', imageStyle);
      }

      const imageType = this.getImageType(src);
      console.log(`   - 识别的图片格式: ${imageType || '未知'}`);
      if (!imageType) {
        console.error(`   ❌ 无法识别图片格式: ${src}`);
        loadError = '无法识别图片格式';
      }

      // 如果图片加载失败，创建占位符
      if (loadError || !imageData! || !imageType) {
        console.log(`   ⚠️ 创建图片占位符...`);
        return this.createPlaceholderImageRun(src, alt, title, loadError || '图片加载失败', imageStyle);
      }

      // 创建图片运行对象
      console.log(`   - 创建ImageRun对象...`);
      const imageRunConfig = imageType === 'svg' ? {
        type: 'svg' as const,
        data: imageData,
        transformation: {
          width: imageStyle?.width || 400,
          height: imageStyle?.height || (imageStyle?.width || 400) * 0.667, // 默认3:2比例（适合大多数照片）
        },
        altText: {
          title: title,
          description: token.content || '',
          name: alt
        },
        fallback: {
          type: 'png' as const,
          data: Buffer.from('') // 空缓冲区作为占位符
        }
      } : {
        type: imageType as 'jpg' | 'png' | 'gif' | 'bmp',
        data: imageData,
        transformation: {
          width: imageStyle?.width || 400,
          height: imageStyle?.height || (imageStyle?.width || 400) * 0.667, // 默认3:2比例（适合大多数照片）
        },
        altText: {
          title: title,
          description: token.content || '',
          name: alt
        },
        floating: imageStyle?.floating ? {
          zIndex: imageStyle.floating.zIndex,
          horizontalPosition: {
            relative: imageStyle.floating.horizontalPosition?.relative || 'page',
            align: imageStyle.floating.horizontalPosition?.align || 'center',
            offset: imageStyle.floating.horizontalPosition?.offset
          },
          verticalPosition: {
            relative: imageStyle.floating.verticalPosition?.relative || 'paragraph',
            align: imageStyle.floating.verticalPosition?.align || 'top',
            offset: imageStyle.floating.verticalPosition?.offset
          }
        } : undefined,
        outline: imageStyle?.border ? {
          type: 'solidFill' as const,
          solidFillType: 'rgb' as const,
          value: imageStyle.border.color || '000000',
          width: this.convertMillimetersToTwip(imageStyle.border.width || 1)
        } : undefined
      };

      console.log(`   - ImageRun配置:`, JSON.stringify({
        type: imageRunConfig.type,
        dataLength: typeof imageRunConfig.data === 'string' ? imageRunConfig.data.length : imageRunConfig.data.length,
        transformation: imageRunConfig.transformation,
        hasFloating: !!imageRunConfig.floating,
        hasOutline: !!imageRunConfig.outline
      }, null, 2));

      let imageRun: ImageRun;
      try {
        imageRun = new ImageRun(imageRunConfig as any);
        console.log(`   ✅ ImageRun创建成功`);
      } catch (imageRunError) {
        console.error(`   ❌ ImageRun创建失败:`, imageRunError);
        // 如果创建失败（比如无效的Base64），返回占位符
        console.log(`   ⚠️ 由于ImageRun创建失败，创建占位符...`);
        return this.createPlaceholderImageRun(src, alt, title, 'ImageRun创建失败', imageStyle);
      }

      const processTime = Date.now() - imageStartTime;
      console.log(`   ✅ 图片处理完成，总耗时: ${processTime}ms`);
      return imageRun;
    } catch (error) {
      const processTime = Date.now() - imageStartTime;
      console.error(`❌ [图片处理] 图片处理失败，耗时: ${processTime}ms`, error);
      if (error instanceof Error) {
        console.error(`   - 错误类型: ${error.constructor.name}`);
        console.error(`   - 错误消息: ${error.message}`);
        console.error(`   - 错误堆栈:`, error.stack);
      } else {
        console.error(`   - 未知错误类型:`, error);
      }
      return null;
    }
  }

  private async createImageParagraph(token: any): Promise<Paragraph | null> {
    const imageStartTime = Date.now();
    try {
      const imageStyle = this.effectiveStyleConfig.imageStyles?.default;
      const src = token.attrGet('src');
      const alt = token.attrGet('alt') || 'Image';
      const title = token.attrGet('title') || '';
      
      console.log(`🖼️ [图片处理] 开始处理图片: ${src}`);
      console.log(`   - Alt文本: ${alt}`);
      console.log(`   - 标题: ${title}`);
      console.log(`   - 样式配置:`, imageStyle);
      
      // 处理不同类型的图片源
      let imageData: Buffer | string;
      if (src.startsWith('data:')) {
        // Base64图片
        console.log(`   - 图片类型: Base64编码`);
        const base64Parts = src.split('base64,');
        if (base64Parts.length < 2) {
          console.error(`   ❌ Base64格式错误: 缺少base64标记`);
          return null;
        }
        imageData = base64Parts[1];
        console.log(`   - Base64数据长度: ${imageData.length} 字符`);
      } else if (src.startsWith('http')) {
        // 网络图片
        console.log(`   - 图片类型: 网络图片`);
        console.log(`   - 开始下载图片...`);
        const downloadStartTime = Date.now();
        try {
          const response = await fetch(src);
          if (!response.ok) {
            console.error(`   ❌ 图片下载失败: HTTP ${response.status} ${response.statusText}`);
            return null;
          }
          const arrayBuffer = await response.arrayBuffer();
          imageData = Buffer.from(arrayBuffer);
          const downloadTime = Date.now() - downloadStartTime;
          console.log(`   ✅ 图片下载成功，耗时: ${downloadTime}ms，大小: ${imageData.length} 字节`);
        } catch (fetchError) {
          console.error(`   ❌ 图片下载异常:`, fetchError);
          return null;
        }
      } else {
        // 本地图片
        console.log(`   - 图片类型: 本地文件`);
        if (!fs.existsSync(src)) {
          console.error(`   ❌ 本地图片文件不存在: ${src}`);
          return null;
        }
        try {
          imageData = fs.readFileSync(src);
          console.log(`   ✅ 本地图片读取成功，大小: ${imageData.length} 字节`);
        } catch (readError) {
          console.error(`   ❌ 本地图片读取失败:`, readError);
          return null;
        }
      }

      const imageType = this.getImageType(src);
      console.log(`   - 识别的图片格式: ${imageType || '未知'}`);
      if (!imageType) {
        console.error(`   ❌ 无法识别图片格式: ${src}`);
        return null;
      }

      // 创建图片运行对象
      console.log(`   - 创建ImageRun对象...`);
      const imageRunConfig = imageType === 'svg' ? {
        type: 'svg' as const,
        data: imageData,
        transformation: {
          width: imageStyle?.width || 400,
          height: imageStyle?.height || (imageStyle?.width || 400) * 0.667, // 默认3:2比例（适合大多数照片）
        },
        altText: {
          title: title,
          description: token.content || '',
          name: alt
        },
        fallback: {
          type: 'png' as const,
          data: Buffer.from('') // 空缓冲区作为占位符
        }
      } : {
        type: imageType as 'jpg' | 'png' | 'gif' | 'bmp',
        data: imageData,
        transformation: {
          width: imageStyle?.width || 400,
          height: imageStyle?.height || (imageStyle?.width || 400) * 0.667, // 默认3:2比例（适合大多数照片）
        },
        altText: {
          title: title,
          description: token.content || '',
          name: alt
        },
        floating: imageStyle?.floating ? {
          zIndex: imageStyle.floating.zIndex,
          horizontalPosition: {
            relative: imageStyle.floating.horizontalPosition?.relative || 'page',
            align: imageStyle.floating.horizontalPosition?.align || 'center',
            offset: imageStyle.floating.horizontalPosition?.offset
          },
          verticalPosition: {
            relative: imageStyle.floating.verticalPosition?.relative || 'paragraph',
            align: imageStyle.floating.verticalPosition?.align || 'top',
            offset: imageStyle.floating.verticalPosition?.offset
          }
        } : undefined,
        outline: imageStyle?.border ? {
          type: 'solidFill' as const,
          solidFillType: 'rgb' as const,
          value: imageStyle.border.color || '000000',
          width: this.convertMillimetersToTwip(imageStyle.border.width || 1)
        } : undefined
      };

      console.log(`   - ImageRun配置:`, JSON.stringify({
        type: imageRunConfig.type,
        dataLength: typeof imageRunConfig.data === 'string' ? imageRunConfig.data.length : imageRunConfig.data.length,
        transformation: imageRunConfig.transformation,
        hasFloating: !!imageRunConfig.floating,
        hasOutline: !!imageRunConfig.outline
      }, null, 2));

      let imageRun: ImageRun;
      try {
        imageRun = new ImageRun(imageRunConfig as any);
        console.log(`   ✅ ImageRun创建成功`);
      } catch (imageRunError) {
        console.error(`   ❌ ImageRun创建失败:`, imageRunError);
        return null;
      }

      const paragraph = new Paragraph({
        children: [imageRun],
        alignment: imageStyle?.alignment || 'center',
        spacing: {
          before: imageStyle?.spacing?.before || 100,
          after: imageStyle?.spacing?.after || 100
        }
      });
      console.log(`   ✅ 图片段落创建成功`);

      // 处理图片标题
      if (title) {
        console.log(`   - 添加图片标题: ${title}`);
        // 注意：这里返回的应该是一个包含图片和标题的数组，而不是嵌套的Paragraph
        // 这可能是个bug，应该返回两个独立的段落
        const captionParagraph = new Paragraph({
          text: title,
          alignment: 'center',
          style: 'ImageCaption'
        });
        console.log(`   ⚠️ 警告：图片标题处理可能有问题，需要返回段落数组而不是嵌套段落`);
      }

      const processTime = Date.now() - imageStartTime;
      console.log(`   ✅ 图片处理完成，总耗时: ${processTime}ms`);
      return paragraph;
    } catch (error) {
      const processTime = Date.now() - imageStartTime;
      console.error(`❌ [图片处理] 图片处理失败，耗时: ${processTime}ms`, error);
      if (error instanceof Error) {
        console.error(`   - 错误类型: ${error.constructor.name}`);
        console.error(`   - 错误消息: ${error.message}`);
        console.error(`   - 错误堆栈:`, error.stack);
      } else {
        console.error(`   - 未知错误类型:`, error);
      }
      return null;
    }
  }

  private convertMillimetersToTwip(mm: number): number {
    return Math.round(mm * 56.692);
  }

  /**
   * 创建占位符图片
   */
  private createPlaceholderImageRun(src: string, alt: string, title: string, errorMessage: string, imageStyle: any): ImageRun {
    // 创建一个简单的SVG占位符
    const width = imageStyle?.width || 400;
    const height = imageStyle?.height || (imageStyle?.width || 400) * 0.667; // 默认3:2比例（适合大多数照片）
    
    const placeholderSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f0f0f0" stroke="#cccccc" stroke-width="2"/>
        <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666666">
          图片无法加载
        </text>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999999">
          ${errorMessage}
        </text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999999">
          ${alt}
        </text>
        <text x="50%" y="70%" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#bbbbbb">
          ${src.length > 50 ? src.substring(0, 47) + '...' : src}
        </text>
      </svg>
    `;

    const svgBuffer = Buffer.from(placeholderSvg, 'utf-8');
    
    console.log(`   ✅ 占位符SVG创建成功，大小: ${svgBuffer.length} 字节`);
    
    return new ImageRun({
      type: 'svg',
      data: svgBuffer,
      transformation: {
        width: width,
        height: height,
      },
      altText: {
        title: title || '图片加载失败',
        description: `${alt} - ${errorMessage}`,
        name: alt
      },
      fallback: {
        type: 'png',
        data: Buffer.from('') // 空缓冲区作为占位符
      }
    });
  }

  private getImageType(src: string): 'jpg' | 'png' | 'gif' | 'bmp' | 'svg' | null {
    // 先检查data URL
    if (src.startsWith('data:')) {
      if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return 'jpg';
      if (src.startsWith('data:image/png')) return 'png';
      if (src.startsWith('data:image/gif')) return 'gif';
      if (src.startsWith('data:image/bmp')) return 'bmp';
      if (src.startsWith('data:image/svg+xml')) return 'svg';
      console.warn(`   ⚠️ 未知的data URL图片类型: ${src.substring(0, 50)}...`);
      return null;
    }
    
    // 先检查特殊的URL模式
    // 处理支付宝图片URL
    if (src.includes('mdn.alipayobjects.com')) {
      const alipayImageRegex = /mdn\.alipayobjects\.com\/one_clip\/afts\/img\/[^\/]+\/original$/i;
      console.log(`   ℹ️ 检测到支付宝域名，进行匹配测试: 
         URL: ${src}
         正则: ${alipayImageRegex}
         匹配结果: ${alipayImageRegex.test(src)}`);
      if (alipayImageRegex.test(src)) {
        console.log(`   ℹ️ 支付宝图片URL，作为PNG处理`);
        return 'png';
      }
    }
    
    // 检查文件扩展名
    const ext = src.split('.').pop()?.toLowerCase();
    const urlWithoutQuery = src.split('?')[0]; // 移除查询参数
    const cleanExt = urlWithoutQuery.split('.').pop()?.toLowerCase();
    
    switch (cleanExt || ext) {
      case 'jpg':
      case 'jpeg': return 'jpg';
      case 'png': return 'png';
      case 'gif': return 'gif';
      case 'bmp': return 'bmp';
      case 'svg': return 'svg';
      default:
        // 对于没有扩展名的URL（如Unsplash），默认尝试作为JPEG处理
        if (src.includes('unsplash.com') || src.includes('placeholder.com')) {
          console.log(`   ℹ️ 无扩展名的图片URL，尝试作为JPEG处理`);
          return 'jpg';
        }
        console.warn(`   ⚠️ 未知的图片扩展名: ${cleanExt || ext}`);
        return null;
    }
  }

  private async extractTableData(tokens: any[], startIndex: number): Promise<{ rows: any[][][]; endIndex: number }> {
    const rows: any[][][] = [];
    let currentRow: any[][] = [];
    let i = startIndex + 1;

    while (i < tokens.length && tokens[i].type !== 'table_close') {
      if (tokens[i].type === 'tr_open') {
        currentRow = [];
      } else if (tokens[i].type === 'tr_close') {
        rows.push(currentRow);
      } else if (tokens[i].type === 'td_open' || tokens[i].type === 'th_open') {
        const content = await this.processInlineContentAsync(tokens[i + 1]);
        currentRow.push(content as TextRun[]);
        i++; // Skip content token
      }
      i++;
    }

    return {
      rows,
      endIndex: i
    };
  }
}
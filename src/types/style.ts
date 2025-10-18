type HorizontalPositionRelativeFrom = 'margin' | 'page' | 'column' | 'leftMargin' | 'rightMargin' | 'insideMargin' | 'outsideMargin';
type HorizontalPositionAlign = 'left' | 'center' | 'right' | 'inside' | 'outside';
type VerticalPositionRelativeFrom = 'margin' | 'page' | 'topMargin' | 'bottomMargin' | 'insideMargin' | 'outsideMargin';
type VerticalPositionAlign = 'top' | 'center' | 'bottom' | 'inside' | 'outside';

/**
 * 文本样式配置接口
 */
export interface TextStyle {
  /** 字体名称 */
  font?: string;
  /** 字体大小（半点为单位，如32表示16pt） */
  size?: number;
  /** 文字颜色（十六进制，不含#） */
  color?: string;
  /** 是否加粗 */
  bold?: boolean;
  /** 是否斜体 */
  italic?: boolean;
  /** 是否下划线 */
  underline?: boolean;
  /** 是否删除线 */
  strike?: boolean;
}

/**
 * 段落样式配置接口
 */
export interface ParagraphStyle extends TextStyle {
  /** 样式名称 */
  name?: string;
  /** 对齐方式 */
  alignment?: 'left' | 'center' | 'right' | 'justify';
  /** 间距设置 */
  spacing?: {
    /** 段前间距（缇为单位） */
    before?: number;
    /** 段后间距（缇为单位） */
    after?: number;
    /** 行距（缇为单位） */
    line?: number;
    /** 行距规则 */
    lineRule?: 'auto' | 'exact' | 'atLeast';
  };
  /** 缩进设置 */
  indent?: {
    /** 左缩进（缇为单位） */
    left?: number;
    /** 右缩进（缇为单位） */
    right?: number;
    /** 首行缩进（缇为单位） */
    firstLine?: number;
    /** 悬挂缩进（缇为单位） */
    hanging?: number;
  };
  /** 边框设置 */
  border?: {
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
  };
  /** 底纹设置 */
  shading?: {
    /** 填充颜色 */
    fill?: string;
    /** 底纹类型 */
    type?: 'clear' | 'solid' | 'pct5' | 'pct10' | 'pct20' | 'pct25' | 'pct30' | 'pct40' | 'pct50' | 'pct60' | 'pct70' | 'pct75' | 'pct80' | 'pct90';
    /** 底纹颜色 */
    color?: string;
  };
}

/**
 * 标题样式配置接口
 */
export interface HeadingStyle extends ParagraphStyle {
  /** 标题级别 */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** 是否显示编号 */
  numbering?: boolean;
  /** 编号格式 */
  numberingFormat?: string;
}

/**
 * 列表样式配置接口
 */
export interface ListStyle extends ParagraphStyle {
  /** 列表类型 */
  type: 'bullet' | 'number';
  /** 列表级别 */
  level?: number;
  /** 项目符号或编号格式 */
  format?: string;
  /** 起始编号（仅数字列表） */
  start?: number;
}

/**
 * 表格样式配置接口
 */
export interface TableStyle {
  /** 样式名称 */
  name?: string;
  /** 表格宽度 */
  width?: {
    /** 宽度值 */
    size: number;
    /** 宽度类型 */
    type: 'auto' | 'pct' | 'dxa';
  };
  /** 表格边框 */
  borders?: {
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
    insideHorizontal?: BorderStyle;
    insideVertical?: BorderStyle;
  };
  /** 单元格边距 */
  cellMargin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** 表格对齐 */
  alignment?: 'left' | 'center' | 'right';
  /** 表头样式 */
  headerStyle?: {
    /** 表头背景色 */
    shading?: string;
    /** 表头文字样式 */
    textStyle?: TextStyle;
  };
}

/**
 * 边框样式接口
 */
export interface BorderStyle {
  /** 边框宽度（八分之一点为单位） */
  size: number;
  /** 边框颜色（十六进制，不含#） */
  color: string;
  /** 边框样式 */
  style: 'single' | 'double' | 'dash' | 'dotted' | 'none';
}

/**
 * 代码块样式配置接口
 */
export interface CodeBlockStyle extends ParagraphStyle {
  /** 代码字体（通常为等宽字体） */
  codeFont?: string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
}

/**
 * 引用块样式配置接口
 */
export interface BlockquoteStyle extends ParagraphStyle {
  /** 引用标记样式 */
  quoteMarkStyle?: {
    /** 标记字符 */
    character?: string;
    /** 标记颜色 */
    color?: string;
    /** 标记大小 */
    size?: number;
  };
}

/**
 * 图片样式配置接口
 */
export interface ImageStyle {
    width?: number;
    height?: number;
    alignment?: 'left' | 'center' | 'right';
    spacing?: {
        before?: number;
        after?: number;
    };
    border?: {
        color?: string;
        width?: number;
    };
    floating?: {
        zIndex?: number;
        horizontalPosition?: {
            relative?: HorizontalPositionRelativeFrom;
            align?: HorizontalPositionAlign;
            offset?: number;
        };
        verticalPosition?: {
            relative?: VerticalPositionRelativeFrom;
            align?: VerticalPositionAlign;
            offset?: number;
        };
    };
}

/**
 * 完整的样式配置接口
 */
export interface StyleConfig {
  /** 文档默认样式 */
  document?: {
    /** 默认字体 */
    defaultFont?: string;
    /** 默认字号 */
    defaultSize?: number;
    /** 默认颜色 */
    defaultColor?: string;
    /** 页面设置 */
    page?: {
      /** 页面大小 */
      size?: 'A4' | 'A3' | 'Letter' | 'Legal';
      /** 页面方向 */
      orientation?: 'portrait' | 'landscape';
      /** 页边距 */
      margins?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
      };
    };
  };
  
  /** 段落样式映射 */
  paragraphStyles?: {
    /** 普通段落样式 */
    normal?: ParagraphStyle;
    /** 自定义段落样式 */
    [key: string]: ParagraphStyle | undefined;
  };
  
  /** 标题样式映射 */
  headingStyles?: {
    h1?: HeadingStyle;
    h2?: HeadingStyle;
    h3?: HeadingStyle;
    h4?: HeadingStyle;
    h5?: HeadingStyle;
    h6?: HeadingStyle;
  };
  
  /** 列表样式映射 */
  listStyles?: {
    /** 无序列表样式 */
    bullet?: ListStyle;
    /** 有序列表样式 */
    ordered?: ListStyle;
    /** 自定义列表样式 */
    [key: string]: ListStyle | undefined;
  };
  
  /** 表格样式映射 */
  tableStyles?: {
    /** 默认表格样式 */
    default?: TableStyle;
    /** 自定义表格样式 */
    [key: string]: TableStyle | undefined;
  };
  
  /** 代码块样式 */
  codeBlockStyle?: CodeBlockStyle;
  
  /** 引用块样式 */
  blockquoteStyle?: BlockquoteStyle;
  
  /** 行内代码样式 */
  inlineCodeStyle?: TextStyle;
  
  /** 强调文本样式 */
  emphasisStyles?: {
    /** 加粗样式 */
    strong?: TextStyle;
    /** 斜体样式 */
    emphasis?: TextStyle;
    /** 删除线样式 */
    strikethrough?: TextStyle;
  };
  
  /** 图片样式配置 */
  imageStyles?: {
    /** 默认图片样式 */
    default?: ImageStyle;
    /** 自定义图片样式 */
    [key: string]: ImageStyle | undefined;
  };
}

/**
 * 样式合并选项
 */
export interface StyleMergeOptions {
  /** 是否深度合并 */
  deep?: boolean;
  /** 是否覆盖已存在的属性 */
  override?: boolean;
}

/**
 * 样式验证结果
 */
export interface StyleValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors?: string[];
  /** 警告信息 */
  warnings?: string[];
}

/**
 * 样式应用上下文
 */
export interface StyleContext {
    /** 当前元素类型 */
    elementType: 'paragraph' | 'heading' | 'list' | 'table' | 'code' | 'blockquote' | 'inline' | 'image';
    /** 当前层级（用于标题、列表等） */
    level?: number;
    /** 父级样式 */
    parentStyle?: ParagraphStyle;
    /** 是否在列表中 */
    inList?: boolean;
    /** 是否在表格中 */
    inTable?: boolean;
}
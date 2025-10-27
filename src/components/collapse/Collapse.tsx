import React from 'react';


export type CollapseTheme = {
  collapse?: string;
  content?: string;
};

export type CollapseRenderState = {
  isFullyOpened: boolean;
  isFullyClosed: boolean;
  isOpened: boolean;
  containerHeight: number;
  contentHeight: number;
};

export interface CollapseProps {
  theme?: CollapseTheme;
  isOpened: boolean;
  initialStyle?: React.CSSProperties;
  onRest?: (state: CollapseRenderState) => void;
  onWork?: (state: CollapseRenderState) => void;
  checkTimeout?: number;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tag?: 'div' | 'li' | 'details'
}

export class Collapse extends React.Component<CollapseProps> {
  static defaultProps: Partial<CollapseProps> = {
    theme: {
      collapse: 'ReactCollapse--collapse',
      content: 'ReactCollapse--content'
    },
    initialStyle: undefined,
    onRest: undefined,
    onWork: undefined,
    checkTimeout: 50,
    tag: 'div'
  };

  initialStyle: React.CSSProperties;

  timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  container: HTMLElement | null = null;

  content: HTMLDivElement | null = null;


  constructor(props: CollapseProps) {
    super(props);
    if (props.initialStyle) {
      this.initialStyle = props.initialStyle;
    } else {
      this.initialStyle = props.isOpened
        ? { height: 'auto', overflow: 'initial' }
        : { height: '0px', overflow: 'hidden' };
    }
  }


  componentDidMount() {
    this.onResize();
  }


  shouldComponentUpdate(nextProps: Readonly<CollapseProps>): boolean {
    const { theme = {}, isOpened, children } = this.props;

    return (
      children !== nextProps.children ||
      isOpened !== nextProps.isOpened ||
      Object.keys(theme).some(key => (theme as Record<string, string | undefined>)[key] !== (nextProps.theme as Record<string, string | undefined> | undefined)?.[key])
    );
  }


  getSnapshotBeforeUpdate() {
    if (!this.container || !this.content) {
      return null;
    }
    if (this.container.style.height === 'auto') {
      const { clientHeight: contentHeight } = this.content;
      this.container.style.height = `${contentHeight}px`;
    }
    return null;
  }


  componentDidUpdate() {
    this.onResize();
  }


  componentWillUnmount() {
    clearTimeout(this.timeout);
  }


  onResize = () => {
    clearTimeout(this.timeout);

    if (!this.container || !this.content) {
      return;
    }

    const { isOpened, checkTimeout = 50 } = this.props;
    const containerHeight = Math.floor(this.container.clientHeight);
    const contentHeight = Math.floor(this.content.clientHeight);

    const isFullyOpened = isOpened && Math.abs(contentHeight - containerHeight) <= 1;
    const isFullyClosed = !isOpened && Math.abs(containerHeight) <= 1;

    if (isFullyOpened || isFullyClosed) {
      this.onRest({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight });
    } else {
      this.onWork({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight });
      this.timeout = setTimeout(() => this.onResize(), checkTimeout);
    }
  };


  onRest = ({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight }: CollapseRenderState) => {
    if (!this.container || !this.content) {
      return;
    }

    const hasOpened = isOpened && this.container.style.height === `${contentHeight}px`;
    const hasClosed = !isOpened && this.container.style.height === '0px';

    if (hasOpened || hasClosed) {
      this.container.style.overflow = isOpened ? 'initial' : 'hidden';
      this.container.style.height = isOpened ? 'auto' : '0px';

      const { onRest } = this.props;
      if (onRest) {
        onRest({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight });
      }
    }
  };


  onWork = ({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight }: CollapseRenderState) => {
    if (!this.container || !this.content) {
      return;
    }

    const isOpenining = isOpened && this.container.style.height === `${contentHeight}px`;
    const isClosing = !isOpened && this.container.style.height === '0px';

    if (isOpenining || isClosing) {
      return;
    }

    this.container.style.overflow = 'hidden';
    this.container.style.height = isOpened ? `${contentHeight}px` : '0px';

    const { onWork } = this.props;
    if (onWork) {
      onWork({ isFullyOpened, isFullyClosed, isOpened, containerHeight, contentHeight });
    }
  };


  onRefContainer = (container: HTMLElement | null) => {
    this.container = container;
  };


  onRefContent = (content: HTMLDivElement | null) => {
    this.content = content;
  };


  render() {
    const { theme, children, isOpened, className, contentClassName, tag = 'div' } = this.props;
    const containerClassName = `${theme?.collapse ?? 'ReactCollapse--collapse'}${className ? ` ${className}` : ''}`;
    const contentCls = `${theme?.content ?? 'ReactCollapse--content'}${contentClassName ? ` ${contentClassName}` : ''}`;

    return React.createElement(
      tag,
      {
        ref: this.onRefContainer as any,
        className: containerClassName,
        style: this.initialStyle,
        'aria-hidden': !isOpened
      } as any,
      React.createElement(
        'div',
        { ref: this.onRefContent, className: contentCls },
        children
      )
    );
  }
}
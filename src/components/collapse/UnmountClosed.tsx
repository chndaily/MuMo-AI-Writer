import React from 'react';
import { Collapse, CollapseProps, CollapseRenderState } from './Collapse';


export interface UnmountClosedProps extends Omit<CollapseProps, 'initialStyle' | 'onWork' | 'onRest'> {
  isOpened: boolean;
  onWork?: (state: CollapseRenderState) => void;
  onRest?: (state: CollapseRenderState) => void;
}

type UnmountClosedState = {
  isResting: boolean;
  isOpened: boolean;
  isInitialRender: boolean;
};

export class UnmountClosed extends React.PureComponent<UnmountClosedProps, UnmountClosedState> {
  static defaultProps: Partial<UnmountClosedProps> = {
    onWork: undefined,
    onRest: undefined
  };

  constructor(props: UnmountClosedProps) {
    super(props);
    this.state = { isResting: true, isOpened: props.isOpened, isInitialRender: true };
  }

  componentDidUpdate(prevProps: Readonly<UnmountClosedProps>): void {
    const { isOpened } = this.props;
    if (prevProps.isOpened !== isOpened) {
      this.setState({ isResting: false, isOpened, isInitialRender: false });
    }
  }

  onWork = ({ isOpened, ...rest }: CollapseRenderState) => {
    this.setState({ isResting: false, isOpened });

    const { onWork } = this.props;
    if (onWork) {
      onWork({ isOpened, ...rest });
    }
  };

  onRest = ({ isOpened, ...rest }: CollapseRenderState) => {
    this.setState({ isResting: true, isOpened, isInitialRender: false });

    const { onRest } = this.props;
    if (onRest) {
      onRest({ isOpened, ...rest });
    }
  };

  getInitialStyle = (): React.CSSProperties => {
    const { isOpened, isInitialRender } = this.state;
    if (isInitialRender) {
      return isOpened
        ? { height: 'auto', overflow: 'initial' }
        : { height: '0px', overflow: 'hidden' };
    }

    return { height: '0px', overflow: 'hidden' };
  };

  render() {
    const { isResting, isOpened } = this.state;

    return isResting && !isOpened ? null : (
      <Collapse
        {...this.props}
        initialStyle={this.getInitialStyle()}
        onWork={this.onWork}
        onRest={this.onRest}
      />
    );
  }
}
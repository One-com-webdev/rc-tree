import React from 'react';
import PropTypes from 'prop-types';
import assign from 'object-assign';
import classNames from 'classnames';
import Animate from 'rc-animate';
import { browser } from './util';

const browserUa = typeof window !== 'undefined' ? browser(window.navigator) : '';
const ieOrEdge = /.*(IE|Edge).+/.test(browserUa);
// const uaArray = browserUa.split(' ');
// const gtIE8 = uaArray.length !== 2 || uaArray[0].indexOf('IE') === -1 || Number(uaArray[1]) > 8;

const defaultTitle = '---';

class TreeNode extends React.Component {
  constructor(props) {
    super(props);
    [
      'onExpand',
      'onCheck',
      'onContextMenu',
      'onMouseEnter',
      'onMouseLeave',
      'onDragStart',
      'onDragEnter',
      'onDragOver',
      'onDragLeave',
      'onDrop',
      'onDragEnd',
    ].forEach((m) => {
      this[m] = this[m].bind(this);
    });
    this.state = {
      dataLoading: false,
      dragNodeHighlight: false,
    };
  }

  _getLeftShiftStyle() {
    const {leftShift: shift, level, leftShiftProp = 'margin'} = this.props;
    let shiftValue = 0;

    if (shift) {
      if (!Array.isArray(shift)) shiftValue = shift * level;
      else {
        const defaultShift = shift[0];
        for (let i = 1; i <= level; i++)
          shiftValue += (shift[i] || defaultShift);
      }
    }

    return { [leftShiftProp + 'Left']: shiftValue };
  }

  componentDidMount() {
    if (!this.props.root._treeNodeInstances) {
      this.props.root._treeNodeInstances = [];
    }
    this.props.root._treeNodeInstances.push(this);
  }
  // shouldComponentUpdate(nextProps) {
  //   if (!nextProps.expanded) {
  //     return false;
  //   }
  //   return true;
  // }

  onCheck() {
    this.props.root.onCheck(this);
  }

  onSelect() {
    this.props.root.onSelect(this);
  }

  onMouseEnter(e) {
    e.preventDefault();
    this.props.root.onMouseEnter(e, this);
  }

  onMouseLeave(e) {
    e.preventDefault();
    this.props.root.onMouseLeave(e, this);
  }

  onContextMenu(e) {
    e.preventDefault();
    this.props.root.onContextMenu(e, this);
  }

  onDragStart(e) {
    // console.log('dragstart', this.props.eventKey, e);
    // e.preventDefault();
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: true,
    });
    this.props.root.onDragStart(e, this);
    try {
      // ie throw error
      // firefox-need-it
      e.dataTransfer.setData('text/plain', '');
    } finally {
      // empty
    }
  }

  onDragEnter(e) {
    // console.log('onDragEnter', this.props.eventKey);
    e.preventDefault();
    e.stopPropagation();
    this.props.root.onDragEnter(e, this);
  }

  onDragOver(e) {
    // console.log('onDragOver', this.props.eventKey);
    // todo disabled
    e.preventDefault();
    e.stopPropagation();
    this.props.root.onDragOver(e, this);
    return false;
  }

  onDragLeave(e) {
    // console.log('onDragLeave', this.props.eventKey);
    e.stopPropagation();
    this.props.root.onDragLeave(e, this);
  }

  onDrop(e) {
    // console.log('onDrop', this.props.eventKey);
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: false,
    });
    this.props.root.onDrop(e, this);
  }

  onDragEnd(e) {
    // console.log('onDragEnd', this.props.eventKey);
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: false,
    });
    this.props.root.onDragEnd(e, this);
  }

  onExpand() {
    const callbackPromise = this.props.root.onExpand(this);
    if (callbackPromise && typeof callbackPromise === 'object') {
      const setLoading = (dataLoading) => {
        this.setState({ dataLoading });
      };
      setLoading(true);
      callbackPromise.then(() => {
        setLoading(false);
      }, () => {
        setLoading(false);
      });
    }
  }

  // keyboard event support
  onKeyDown(e) {
    e.preventDefault();
  }

  renderSwitcher(props, expandedState) {
    const prefixCls = props.prefixCls;
    const switcherCls = {
      [`${prefixCls}-switcher`]: true,
    };
    if (!props.showLine) {
      switcherCls[`${prefixCls}-noline_${expandedState}`] = true;
    } else if (props.pos === '0-0') {
      switcherCls[`${prefixCls}-roots_${expandedState}`] = true;
    } else {
      switcherCls[`${prefixCls}-center_${expandedState}`] = !props.last;
      switcherCls[`${prefixCls}-bottom_${expandedState}`] = props.last;
    }
    if (props.disabled) {
      switcherCls[`${prefixCls}-switcher-disabled`] = true;
      return <span className={classNames(switcherCls)}></span>;
    }
    return <span className={classNames(switcherCls)} onClick={this.onExpand}></span>;
  }

  renderCheckbox(props) {
    const prefixCls = props.prefixCls;
    const checkboxCls = {
      [`${prefixCls}-checkbox`]: true,
    };
    if (props.checked) {
      checkboxCls[`${prefixCls}-checkbox-checked`] = true;
    } else if (props.halfChecked) {
      checkboxCls[`${prefixCls}-checkbox-indeterminate`] = true;
    }
    let customEle = null;
    if (typeof props.checkable !== 'boolean') {
      customEle = props.checkable;
    }
    if (props.disabled || props.disableCheckbox) {
      checkboxCls[`${prefixCls}-checkbox-disabled`] = true;
      return <span ref="checkbox" className={classNames(checkboxCls)}>{customEle}</span>;
    }
    return (
      <span ref="checkbox"
        className={classNames(checkboxCls) }
        onClick={this.onCheck}
      >{customEle}</span>);
  }

  renderChildren(props) {
    const renderFirst = this.renderFirst;
    this.renderFirst = 1;
    let transitionAppear = true;
    if (!renderFirst && props.expanded) {
      transitionAppear = false;
    }
    const children = props.children;
    let newChildren = children;
    if (children &&
      (children.type === TreeNode ||
      Array.isArray(children) &&
      children.every((item) => {
        return item.type === TreeNode;
      }))) {
      const cls = {
        [`${props.prefixCls}-child-tree`]: true,
        [`${props.prefixCls}-child-tree-open`]: props.expanded,
      };
      if (props.showLine) {
        cls[`${props.prefixCls}-line`] = !props.last;
      }
      const animProps = {};
      if (props.openTransitionName) {
        animProps.transitionName = props.openTransitionName;
      } else if (typeof props.openAnimation === 'object') {
        animProps.animation = assign({}, props.openAnimation);
        if (!transitionAppear) {
          delete animProps.animation.appear;
        }
      }
      newChildren = (
        <Animate {...animProps}
          showProp="data-expanded"
          transitionAppear={transitionAppear}
          component=""
        >
          {!props.expanded ? null : <ul className={classNames(cls)} data-expanded={props.expanded}>
            {React.Children.map(children, (item, index) => {
              return props.root.renderTreeNode(item, index, props.pos);
            }, props.root)}
          </ul>}
        </Animate>
      );
    }
    return newChildren;
  }

  render() {
    const props = this.props;
    const prefixCls = props.prefixCls;
    const expandedState = props.expanded ? 'open' : 'close';

    const iconEleCls = {
      [`${prefixCls}-iconEle`]: true,
      [`${prefixCls}-icon_loading`]: this.state.dataLoading,
      [`${prefixCls}-icon__${expandedState}`]: true,
    };

    let canRenderSwitcher = true;
    const content = props.title;
    let newChildren = this.renderChildren(props);
    if (!newChildren || newChildren === props.children) {
      // content = newChildren;
      newChildren = null;
      if (!props.loadData || props.isLeaf) {
        canRenderSwitcher = false;
      }
    }
    // For performance, does't render children into dom when `!props.expanded` (move to Animate)
    // if (!props.expanded) {
    //   newChildren = null;
    // }

    const selectHandle = () => {
      const icon = (props.showIcon || props.loadData && this.state.dataLoading) ?
        <span className={classNames(iconEleCls)}></span> : null;
      const title = <span className={`${prefixCls}-title`}>{content}</span>;
      const domProps = {
        className: `${prefixCls}-node-content-wrapper`,
      };
      if (!props.disabled) {
        if (props.selected || !props._dropTrigger && this.state.dragNodeHighlight) {
          domProps.className += ` ${prefixCls}-node-selected`;
        }
        domProps.onClick = (e) => {
          e.preventDefault();
          if (props.selectable) {
            this.onSelect();
          }
          // not fire check event
          // if (props.checkable) {
          //   this.onCheck();
          // }
        };
        if (props.onRightClick) {
          domProps.onContextMenu = this.onContextMenu;
        }
        if (props.onMouseEnter) {
          domProps.onMouseEnter = this.onMouseEnter;
        }
        if (props.onMouseLeave) {
          domProps.onMouseLeave = this.onMouseLeave;
        }
        if (props.draggable) {
          domProps.className += ' draggable';
          if (ieOrEdge) {
            // ie bug!
            domProps.href = '#';
          }
          domProps.draggable = true;
          domProps['aria-grabbed'] = true;
          domProps.onDragStart = this.onDragStart;
        }
      }
      return (
        <a ref="selectHandle" title={typeof content === 'string' ? content : ''} {...domProps}>
          {icon}{title}
        </a>
      );
    };

    const liProps = {};
    if (props.draggable) {
      // liProps.onDragEnter = this.onDragEnter;
      liProps.onDragOver = this.onDragOver;
      liProps.onDragLeave = this.onDragLeave;
      liProps.onDrop = this.onDrop;
      liProps.onDragEnd = this.onDragEnd;
    }

    let disabledCls = '';
    let dragOverCls = '';
    if (props.disabled) {
      disabledCls = `${prefixCls}-treenode-disabled`;
    } else if (!props.disableDragHovers && props.dragOver) {
      dragOverCls = 'drag-over';
    } else if (!props.disableDragHovers && props.dragOverGapTop) {
      dragOverCls = 'drag-over-gap-top';
    } else if (!props.disableDragHovers && props.dragOverGapBottom) {
      dragOverCls = 'drag-over-gap-bottom';
    }

    const filterCls = props.filterTreeNode(this) ? 'filter-node' : '';

    const noopSwitcher = () => {
      const cls = {
        [`${prefixCls}-switcher`]: true,
        [`${prefixCls}-switcher-noop`]: true,
      };
      if (props.showLine) {
        cls[`${prefixCls}-center_docu`] = !props.last;
        cls[`${prefixCls}-bottom_docu`] = props.last;
      } else {
        cls[`${prefixCls}-noline_docu`] = true;
      }
      return <span className={classNames(cls)}></span>;
    };

    // attach onDragEnter to item wrap to eliminate incorrect hover over parent <li>
    const itemWrapProps = {};
    if (props.draggable) {
      itemWrapProps.onDragEnter = this.onDragEnter;
    }

    return (
      <li {...liProps} ref="li"
        className={classNames(props.className, disabledCls, dragOverCls, filterCls) }
      >
        <div
            className={classNames('rc-tree-item-wrap', {['rc-tree-item-wrap-selected']: props.selected})}
            style={this._getLeftShiftStyle()}
            {...itemWrapProps}
        >
          {props.selectionTag ? <props.selectionTag /> : null}
          {props.separator ? <props.separator /> : null}
          {canRenderSwitcher ? this.renderSwitcher(props, expandedState) : noopSwitcher()}
          {props.checkable ? this.renderCheckbox(props) : null}
          {selectHandle()}
        </div>
        {newChildren}
      </li>
    );
  }
}

TreeNode.isTreeNode = 1;

TreeNode.propTypes = {
  prefixCls: PropTypes.string,
  disabled: PropTypes.bool,
  disableCheckbox: PropTypes.bool,
  expanded: PropTypes.bool,
  isLeaf: PropTypes.bool,
  root: PropTypes.object,
  onSelect: PropTypes.func,
  leftShift: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  level: PropTypes.number,
  leftShiftProp: PropTypes.string,
  separator: PropTypes.func,
  disableDragHovers: PropTypes.bool,
};

TreeNode.defaultProps = {
  title: defaultTitle,
};

export default TreeNode;

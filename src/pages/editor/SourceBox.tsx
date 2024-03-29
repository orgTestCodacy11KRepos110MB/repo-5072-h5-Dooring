import React, {
  FC,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  createRef,
  useDebugValue,
} from 'react';
import { useDrop } from 'react-dnd';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import GridLayout, { ItemCallback } from 'react-grid-layout';
import { Popover, Button, Tooltip } from 'antd';
import { connect } from 'dva';
import DynamicEngine from 'components/DynamicEngine';
import styles from './index.less';
import { uuid } from '@/utils/tool';
import { Dispatch } from 'umi';
import { StateWithHistory } from 'redux-undo';
import { dooringContext } from '@/layouts';
interface SourceBoxProps {
  pstate: {
    pointData: { id: string; item: any; point: any; isMenu?: any }[];
    curPoint: any;
    status: string;
  };
  cstate: { pointData: { id: string; item: any; point: any }[]; curPoint: any };
  scaleNum: number;
  canvasId: string;
  allType: string[];
  dispatch: Dispatch;
  dragState: { x: number; y: number };
  setDragState: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >;
  pointData: { id: string; item: any; point: any; isMenu?: any }[];
  setPointData: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        item: any;
        point: any;
        isMenu?: any;
      }[]
    >
  >;
}

const SourceBox = memo((props: SourceBoxProps) => {
  const { pstate, scaleNum, canvasId, allType, dispatch, dragState, setDragState, cstate } = props;
  const context = useContext(dooringContext);

  const dataState = pstate ? pstate.pointData : [];
  const cpointData = cstate ? cstate.pointData : [];
  const [canvasRect, setCanvasRect] = useState<number[]>([]);
  const [isShowTip, setIsShowTip] = useState(true);

  const [pointData, setPointData] = useState(dataState);
  // const [isCurrentCard, setCurrentCard] = useState(false);
  const [{ isOver }, drop] = useDrop({
    accept: allType,
    drop: (item: { h: number; type: string; x: number }, monitor) => {
      let parentDiv = document.getElementById(canvasId),
        pointRect = parentDiv!.getBoundingClientRect(),
        top = pointRect.top,
        pointEnd = monitor.getSourceClientOffset(),
        y = pointEnd!.y < top ? 0 : pointEnd!.y - top,
        col = 24, // 网格列数
        cellHeight = 2,
        w = item.type === 'Icon' ? 3 : col;
      // 转换成网格规则的坐标和大小
      let gridY = Math.ceil(y / cellHeight);
      if (context.theme === 'h5') {
        dispatch({
          type: 'editorModal/addPointData',
          payload: {
            id: uuid(6, 10),
            item,
            point: { i: `x-${pointData.length}`, x: 0, y: gridY, w, h: item.h, isBounded: true },
            status: 'inToCanvas',
          },
        });
      } else {
        dispatch({
          type: 'editorPcModal/addPointData',
          payload: {
            id: uuid(6, 10),
            item,
            point: {
              i: `x-${cpointData.length}`,
              x: item.x || 0,
              y: gridY,
              w,
              h: item.h,
              isBounded: true,
            },
            status: 'inToCanvas',
          },
        });
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      item: monitor.getItem(),
    }),
  });

  const dragStop: ItemCallback = useMemo(() => {
    return (layout, oldItem, newItem, placeholder, e, element) => {
      if (context.theme === 'h5') {
        const curPointData = pointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorModal/modPointData',
          payload: { ...curPointData, point: newItem },
        });
      } else {
        const curPointData = cpointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorPcModal/modPointData',
          payload: { ...curPointData, point: newItem },
        });
      }
    };
  }, [context.theme, cpointData, dispatch, pointData]);

  const onDragStart: ItemCallback = useMemo(() => {
    return (layout, oldItem, newItem, placeholder, e, element) => {
      if (context.theme === 'h5') {
        const curPointData = pointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorModal/modPointData',
          payload: { ...curPointData },
        });
      } else {
        const curPointData = cpointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorPcModal/modPointData',
          payload: { ...curPointData },
        });
      }
    };
  }, [context.theme, cpointData, dispatch, pointData]);

  const onResizeStop: ItemCallback = useMemo(() => {
    return (layout, oldItem, newItem, placeholder, e, element) => {
      if (context.theme === 'h5') {
        const curPointData = pointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorModal/modPointData',
          payload: { ...curPointData, point: newItem },
        });
      } else {
        const curPointData = cpointData.filter(item => item.id === newItem.i)[0];
        dispatch({
          type: 'editorPcModal/modPointData',
          payload: { ...curPointData, point: newItem },
        });
      }
    };
  }, [context.theme, cpointData, dispatch, pointData]);

  useEffect(() => {
    let { width, height } = document.getElementById(canvasId)!.getBoundingClientRect();
    console.log(width, height);
    setCanvasRect([width, height]);
  }, [canvasId, context.theme]);

  useEffect(() => {
    let timer = window.setTimeout(() => {
      setIsShowTip(false);
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // let isCuurentPoint = pointData.some(item => +item.id === (pstate.curPoint && +pstate.curPoint.id))
    // if(isCuurentPoint && pstate.curPoint.status === 'inToCanvas') {
    //   setPointData(dataState)
    // }
    if (pointData.some(item => item.isMenu)) {
      //.
    } else {
      setPointData(dataState);
    }
  }, [dataState]);

  const handleDelete: Function = useMemo(() => {
    return (id: any) => {
      dispatch({
        type: 'editorModal/delPointData',
        payload: { id },
      });
    };
  }, [dispatch]);

  const opacity = isOver ? 0.7 : 1;

  const initSelect: any = (data: any = []) => {
    return (
      data &&
      data.map((itemData: any) => ({
        ...itemData,
        isMenu: false,
      }))
    );
  };

  const handleCurrentCard: Function = useCallback(
    (e: Event, status: boolean, index: number) => {
      e.preventDefault();
      let pointDataOnMenu: any;
      (pointDataOnMenu = initSelect(dataState)) &&
        Object.keys(pointDataOnMenu).map(keyId => {
          (+pointDataOnMenu[+keyId].id === +index && (pointDataOnMenu[+keyId].isMenu = status)) ||
            (pointDataOnMenu[+keyId].isMenu = false);
        });
      setPointData(pointDataOnMenu);
      // setCurrentCard(true)
    },
    [status],
  );

  const render = useMemo(() => {
    if (context.theme === 'h5') {
      return (
        <Draggable
          position={dragState}
          handle=".js_box"
          onStop={(e: DraggableEvent, data: DraggableData) => {
            setDragState({ x: data.x, y: data.y });
          }}
        >
          <div className={styles.canvasBox}>
            <div
              style={{
                transform: `scale(${scaleNum})`,
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                id={canvasId}
                className={styles.canvas}
                style={{
                  opacity,
                }}
                ref={drop}
              >
                <Tooltip placement="right" title="鼠标按住此处拖拽画布" visible={isShowTip}>
                  <div
                    className="js_box"
                    style={{
                      width: '10px',
                      height: '100%',
                      position: 'absolute',
                      borderRadius: '0 6px 6px 0',
                      backgroundColor: '#2f54eb',
                      right: '-10px',
                      top: '0',
                      color: '#fff',
                      cursor: 'move',
                    }}
                  />
                </Tooltip>

                {pointData.length > 0 ? (
                  <GridLayout
                    className={styles.layout}
                    cols={24}
                    rowHeight={2}
                    width={canvasRect[0] || 0}
                    margin={[0, 0]}
                    onDragStop={dragStop}
                    onDragStart={onDragStart}
                    onResizeStop={onResizeStop}
                  >
                    {pointData.map(value => (
                      <div
                        className={value.isMenu ? styles.selected : styles.dragItem}
                        key={value.id}
                        data-grid={value.point}
                        onMouseDownCapture={e => handleCurrentCard(e, true, value.id)}
                        onDragLeave={e => handleCurrentCard(e, false, value.id)}
                      >
                        <DynamicEngine {...value.item} isTpl={false} />
                        <div
                          className={styles.tooltip}
                          style={{ display: value.isMenu ? 'block' : 'none' }}
                        >
                          <div className={styles.tooltipRow1}>
                            <a>恢复</a>
                          </div>
                          <div className={styles.tooltipRow2}>
                            <Button onClick={handleDelete.bind(this, value.id)}>删除</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </GridLayout>
                ) : null}
              </div>
            </div>
          </div>
        </Draggable>
      );
    } else {
      //pc可能要传递宽度
      return (
        <Draggable
          position={dragState}
          handle=".js_box"
          onStop={(e: DraggableEvent, data: DraggableData) => {
            setDragState({ x: data.x, y: data.y });
          }}
        >
          <div className={styles.canvasBox2}>
            <div
              style={{
                transform: `scale(${scaleNum - 0.35})`,
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                id={canvasId}
                className={styles.canvas2}
                style={{
                  opacity,
                }}
                ref={drop}
              >
                <div
                  className="js_box"
                  style={{
                    width: '100%',
                    height: '10px',
                    position: 'absolute',
                    borderRadius: '6px 6px 0 0',
                    backgroundColor: '#f0f0f0',
                    boxShadow: '3px 0 6px rgba(0,0,0,.1)',
                    top: '-10px',
                    color: '#fff',
                    cursor: 'move',
                  }}
                />
                <div
                  className="js_box"
                  style={{
                    width: '100%',
                    height: '10px',
                    position: 'absolute',
                    borderRadius: '0 0 6px 6px',
                    backgroundColor: '#f0f0f0',
                    boxShadow: '3px 0 6px rgba(0,0,0,.1)',
                    bottom: '-10px',
                    color: '#fff',
                    cursor: 'move',
                  }}
                />
                <div
                  className="js_box"
                  style={{
                    width: '10px',
                    height: '100%',
                    position: 'absolute',
                    borderRadius: '0 6px 6px 0',
                    backgroundColor: '#f0f0f0',
                    boxShadow: '3px 0 6px rgba(0,0,0,.1)',
                    right: '-10px',
                    color: '#fff',
                    cursor: 'move',
                  }}
                />
                <div
                  className="js_box"
                  style={{
                    width: '10px',
                    height: '100%',
                    position: 'absolute',
                    borderRadius: '6px 0 0 6px',
                    backgroundColor: '#f0f0f0',
                    boxShadow: '0 0 6px rgba(0,0,0,.1)',
                    left: '-10px',
                    color: '#fff',
                    cursor: 'move',
                  }}
                />

                {cpointData.length > 0 ? (
                  <GridLayout
                    className={styles.layout}
                    cols={24}
                    rowHeight={2}
                    width={canvasRect[0] || 0}
                    margin={[0, 0]}
                    onDragStop={dragStop}
                    onDragStart={onDragStart}
                    onResizeStop={onResizeStop}
                  >
                    {cpointData.map(value => (
                      <div className={styles.dragItem} key={value.id} data-grid={value.point}>
                        <DynamicEngine {...value.item} isTpl={false} />
                      </div>
                    ))}
                  </GridLayout>
                ) : null}
              </div>
            </div>
          </div>
        </Draggable>
      );
    }
  }, [
    canvasId,
    canvasRect,
    context.theme,
    cpointData,
    dragState,
    dragStop,
    drop,
    isShowTip,
    onDragStart,
    onResizeStop,
    opacity,
    pointData,
    scaleNum,
    setDragState,
  ]);

  return <>{render}</>;
});

export default connect((state: StateWithHistory<any>) => ({
  pstate: state.present.editorModal,
  cstate: state.present.editorPcModal,
}))(SourceBox);

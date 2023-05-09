import { PlaitBoard, createG } from '@plait/core';
import { MindElement, BaseData, ExtendUnderlineCoordinateType, ExtendLayoutType } from '../interfaces';
import { AfterDraw, BaseDrawer } from './base/base';
import { getRectangleByNode } from '../utils/graph';
import { getNodeShapeByElement } from '../utils/shape';
import {
    EXTEND_RADIUS,
    QUICK_INSERT_CIRCLE_COLOR,
    QUICK_INSERT_CIRCLE_OFFSET,
    QUICK_INSERT_INNER_CROSS_COLOR,
    STROKE_WIDTH
} from '../constants/default';
import { MindmapNodeShape } from '../constants/node';
import { AbstractNode, MindmapLayoutType, OriginNode, isStandardLayout } from '@plait/layouts';
import { getLinkLineColorByMindmapElement, getRootLinkLineColorByMindmapElement } from '../utils/colors';
import { MindmapQueries } from '../queries';
import { fromEvent } from 'rxjs';
import { insertMindElement } from '../utils/mindmap';
import { take } from 'rxjs/operators';

export class QuickInsertDrawer extends BaseDrawer implements AfterDraw {
    canDraw(element: MindElement<BaseData>): boolean {
        if (PlaitBoard.isReadonly(this.board)) {
            return false;
        }
        return true;
    }
    draw(element: MindElement<BaseData>): SVGGElement {
        let offset = element.children.length > 0 && !element.isRoot ? EXTEND_RADIUS : 0;
        const quickInsertG = createG();
        this.g = quickInsertG;
        quickInsertG.classList.add('quick-insert');
        const node = MindElement.getNode(element);
        const { x, y, width, height } = getRectangleByNode(node);

        /**
         * 方位：
         *    1. 左、左上、左下
         *    2. 右、右上、右下
         *    3. 上、上左、上右
         *    4. 下、下左、下右
         */
        const shape = getNodeShapeByElement(element);
        // 形状是矩形要偏移边框的线宽
        const strokeWidth = element.linkLineWidth ? element.linkLineWidth : STROKE_WIDTH;
        let offsetBorderLineWidth = 0;
        if (shape === MindmapNodeShape.roundRectangle && offset === 0) {
            offsetBorderLineWidth = strokeWidth;
        }
        let offsetRootBorderLineWidth = 0;
        if (element.isRoot) {
            offsetRootBorderLineWidth = strokeWidth;
        }
        // 当没有子节点时，需要缩小的偏移量
        const extraOffset = 3;
        const underlineCoordinates: ExtendUnderlineCoordinateType = {
            // 画线方向：右向左 <--
            [MindmapLayoutType.left]: {
                // EXTEND_RADIUS * 0.5 是 左方向，折叠/收起的偏移量
                startX: x - (offset > 0 ? offset + EXTEND_RADIUS * 0.5 : 0) - offsetRootBorderLineWidth,
                startY: y + height,
                endX:
                    x -
                    offsetBorderLineWidth -
                    offsetRootBorderLineWidth -
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) -
                    EXTEND_RADIUS,
                endY: y + height
            },
            // 画线方向：左向右 -->
            [MindmapLayoutType.right]: {
                startX: x + width + (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) + offsetRootBorderLineWidth,
                startY: y + height,
                endX:
                    x +
                    width +
                    offsetBorderLineWidth +
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) +
                    EXTEND_RADIUS +
                    offsetRootBorderLineWidth,
                endY: y + height
            },
            // 画线方向：下向上 -->
            [MindmapLayoutType.upward]: {
                startX: x + width * 0.5,
                startY: y - offsetBorderLineWidth - (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) - offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y -
                    offsetBorderLineWidth -
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) -
                    EXTEND_RADIUS -
                    offsetRootBorderLineWidth
            },
            // 画线方向：上向下 -->
            [MindmapLayoutType.downward]: {
                startX: x + width * 0.5,
                startY:
                    y + height + offsetBorderLineWidth + (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) + offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y +
                    height +
                    offsetBorderLineWidth +
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) +
                    EXTEND_RADIUS +
                    offsetRootBorderLineWidth
            },
            [MindmapLayoutType.leftBottomIndented]: {
                startX: x + width * 0.5,
                startY:
                    y + height + offsetBorderLineWidth + (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) + offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y +
                    height +
                    offsetBorderLineWidth +
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) +
                    EXTEND_RADIUS +
                    offsetRootBorderLineWidth
            },
            [MindmapLayoutType.leftTopIndented]: {
                startX: x + width * 0.5,
                startY: y - offsetBorderLineWidth - (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) - offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y -
                    offsetBorderLineWidth -
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) -
                    EXTEND_RADIUS -
                    offsetRootBorderLineWidth
            },
            [MindmapLayoutType.rightBottomIndented]: {
                startX: x + width * 0.5,
                startY:
                    y + height + offsetBorderLineWidth + (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) + offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y +
                    height +
                    offsetBorderLineWidth +
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET - extraOffset : 0) +
                    EXTEND_RADIUS +
                    offsetRootBorderLineWidth
            },
            [MindmapLayoutType.rightTopIndented]: {
                startX: x + width * 0.5,
                startY: y - offsetBorderLineWidth - (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) - offsetRootBorderLineWidth,
                endX: x + width * 0.5,
                endY:
                    y -
                    offsetBorderLineWidth -
                    (offset > 0 ? offset + QUICK_INSERT_CIRCLE_OFFSET : 0) -
                    EXTEND_RADIUS -
                    offsetRootBorderLineWidth
            }
        };
        if (shape === MindmapNodeShape.roundRectangle || element.isRoot) {
            underlineCoordinates[MindmapLayoutType.left].startY -= height * 0.5;
            underlineCoordinates[MindmapLayoutType.left].endY -= height * 0.5;
            underlineCoordinates[MindmapLayoutType.right].startY -= height * 0.5;
            underlineCoordinates[MindmapLayoutType.right].endY -= height * 0.5;
        }
        const stroke = element.isRoot ? getRootLinkLineColorByMindmapElement(element) : getLinkLineColorByMindmapElement(element);
        let nodeLayout = MindmapQueries.getCorrectLayoutByElement(element) as ExtendLayoutType;
        if (element.isRoot && isStandardLayout(nodeLayout)) {
            const root = element as OriginNode;
            nodeLayout = root.children.length >= root.rightNodeCount ? MindmapLayoutType.left : MindmapLayoutType.right;
        }
        const underlineCoordinate = underlineCoordinates[nodeLayout];
        if (underlineCoordinate) {
            const underline = PlaitBoard.getRoughSVG(this.board).line(
                underlineCoordinate.startX,
                underlineCoordinate.startY,
                underlineCoordinate.endX,
                underlineCoordinate.endY,
                { stroke, strokeWidth }
            );
            const circleCoordinates = {
                startX: underlineCoordinate.endX,
                startY: underlineCoordinate.endY
            };
            const circle = PlaitBoard.getRoughSVG(this.board).circle(circleCoordinates.startX, circleCoordinates.startY, EXTEND_RADIUS, {
                fill: QUICK_INSERT_CIRCLE_COLOR,
                stroke: QUICK_INSERT_CIRCLE_COLOR,
                fillStyle: 'solid'
            });
            const innerCrossCoordinates = {
                horizontal: {
                    startX: circleCoordinates.startX - EXTEND_RADIUS * 0.5 + 3,
                    startY: circleCoordinates.startY,
                    endX: circleCoordinates.startX + EXTEND_RADIUS * 0.5 - 3,
                    endY: circleCoordinates.startY
                },
                vertical: {
                    startX: circleCoordinates.startX,
                    startY: circleCoordinates.startY - EXTEND_RADIUS * 0.5 + 3,
                    endX: circleCoordinates.startX,
                    endY: circleCoordinates.startY + EXTEND_RADIUS * 0.5 - 3
                }
            };
            const innerCrossHLine = PlaitBoard.getRoughSVG(this.board).line(
                innerCrossCoordinates.horizontal.startX,
                innerCrossCoordinates.horizontal.startY,
                innerCrossCoordinates.horizontal.endX,
                innerCrossCoordinates.horizontal.endY,
                {
                    stroke: QUICK_INSERT_INNER_CROSS_COLOR,
                    strokeWidth: 2
                }
            );
            const innerRingVLine = PlaitBoard.getRoughSVG(this.board).line(
                innerCrossCoordinates.vertical.startX,
                innerCrossCoordinates.vertical.startY,
                innerCrossCoordinates.vertical.endX,
                innerCrossCoordinates.vertical.endY,
                {
                    stroke: QUICK_INSERT_INNER_CROSS_COLOR,
                    strokeWidth: 2
                }
            );
            quickInsertG.appendChild(underline);
            quickInsertG.appendChild(circle);
            quickInsertG.appendChild(innerCrossHLine);
            quickInsertG.appendChild(innerRingVLine);
        }
        return quickInsertG;
    }
    afterDraw(element: MindElement): void {
        if (!this.g) {
            throw new Error(`can not find quick insert g`);
        }
        fromEvent<MouseEvent>(this.g, 'mousedown')
            .pipe(take(1))
            .subscribe(e => {
                e.stopPropagation();
            });
        fromEvent(this.g, 'mouseup')
            .pipe(take(1))
            .subscribe(() => {
                const path = PlaitBoard.findPath(this.board, element).concat(
                    element.children.filter(child => !AbstractNode.isAbstract(child)).length
                );
                insertMindElement(this.board, element, path);
            });
    }
}
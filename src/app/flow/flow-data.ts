import { FlowElement, FlowElementType, FlowPosition } from '@plait/flow';
import { Element } from 'slate';

export const mockFlowData: FlowElement<Element>[] = [
    {
        id: '1',
        data: {
            text: { children: [{ text: '开始' }] }
        },
        type: FlowElementType.node,
        width: 120,
        height: 38,
        points: [[248, 153]]
    },
    {
        id: '1001',
        data: {
            text: { children: [{ text: '要做' }] }
        },
        type: FlowElementType.node,
        points: [[400, 268.5]],
        width: 120,
        height: 38,
        styles: {
            stroke: '#5dcfff',
            fill: '#5dcfff'
        }
    },
    {
        id: '1002',
        data: {
            text: { children: [{ text: '进行中' }] }
        },
        type: FlowElementType.node,
        points: [[600, 268.5]],
        width: 120,
        height: 38,
        styles: {
            stroke: '#ffcd5d',
            fill: '#ffcd5d'
        }
    },
    {
        id: '1003',
        data: {
            text: { children: [{ text: '已完成' }] }
        },
        type: FlowElementType.node,
        points: [[800, 268.5]],
        width: 120,
        height: 38,
        styles: {
            stroke: '#73d897',
            fill: '#73d897'
        }
    },
    {
        id: '001',
        data: {
            text: { children: [{ text: '连线1' }] }
        },
        type: FlowElementType.edge,
        source: {
            id: '1001',
            position: FlowPosition.top
        },
        target: {
            id: '1002',
            position: FlowPosition.top
        },
        points: []
    },
    {
        id: '002',
        data: {
            text: { children: [{ text: '连线2' }] }
        },
        type: FlowElementType.edge,
        source: {
            id: '1',
            position: FlowPosition.bottom
        },
        target: {
            id: '1001',
            position: FlowPosition.left
        },
        points: []
    },
    {
        id: '003',
        data: {
            text: { children: [{ text: '连线3' }] }
        },
        type: FlowElementType.edge,
        source: {
            id: '1002',
            position: FlowPosition.right
        },
        target: {
            id: '1003',
            position: FlowPosition.left
        },
        points: []
    }
];
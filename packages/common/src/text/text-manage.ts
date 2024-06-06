import {
    ComponentRef,
    IS_TEXT_EDITABLE,
    MERGING,
    PlaitBoard,
    Point,
    RectangleClient,
    createForeignObject,
    createG,
    setAngleForG,
    toHostPoint,
    toViewBoxPoint,
    updateForeignObject,
    updateForeignObjectWidth
} from '@plait/core';
import { fromEvent, timer } from 'rxjs';
import { Editor, Element, NodeEntry, Range, Text, Node } from 'slate';
import { TextProps } from '../core/text-props';
import { PlaitTextBoard } from './with-text';
import { measureElement } from './text-measure';
import { getLineHeightByFontSize } from './utils';

export interface TextManageRef {
    newText?: Element;
    width: number;
    height: number;
}

export class TextManage {
    isEditing = false;

    editor!: Editor;

    g!: SVGGElement;

    foreignObject!: SVGForeignObjectElement;

    componentRef!: ComponentRef<TextProps>;

    exitCallback?: (() => void) | null;

    constructor(
        private board: PlaitBoard,
        private options: {
            getRectangle: () => RectangleClient;
            onChange?: (textChangeRef: TextManageRef) => void;
            getRenderRectangle?: () => RectangleClient;
            getMaxWidth?: () => number;
        }
    ) {
        if (!this.options.getMaxWidth) {
            this.options.getMaxWidth = () => 999;
        }
    }

    draw(text: Element) {
        const _rectangle = this.options.getRectangle();
        this.g = createG();
        this.foreignObject = createForeignObject(_rectangle.x, _rectangle.y, _rectangle.width, _rectangle.height);
        this.g.append(this.foreignObject);
        this.g.classList.add('text');
        const props = {
            board: this.board,
            text,
            onChange: (data: { newText: Element }) => {
                const { width, height } = this.getSize();
                this.options.onChange && this.options.onChange({ ...data, width, height });
                MERGING.set(this.board, true);
            },
            afterInit: (editor: Editor) => {
                this.editor = editor;
            },
            onComposition: (event: CompositionEvent) => {
                const fakeRoot = buildCompositionData(this.editor, event.data);
                if (fakeRoot) {
                    const sizeData = this.getSize(fakeRoot.children[0]);
                    this.options.onChange && this.options.onChange(sizeData);
                    MERGING.set(this.board, true);
                }
            },
            onExitEdit: () => {
                this.exitCallback && this.exitCallback();
            }
        };
        this.componentRef = ((this.board as unknown) as PlaitTextBoard).renderText(this.foreignObject, props);
    }

    updateRectangleWidth(width: number) {
        updateForeignObjectWidth(this.g, width);
    }

    updateAngle(centerPoint: Point, angle: number = 0) {
        setAngleForG(this.g, centerPoint, angle);
    }

    updateRectangle(rectangle?: RectangleClient) {
        const { x, y, width, height } = rectangle || this.options.getRectangle();
        updateForeignObject(this.g, width, height, x, y);
    }

    updateText(newText: Element) {
        const props = {
            text: newText
        };
        this.componentRef.update(props);
    }

    edit(callback?: () => void) {
        this.isEditing = true;
        IS_TEXT_EDITABLE.set(this.board, true);
        const props: Partial<TextProps> = {
            readonly: false
        };
        // TODO: autofocus
        this.componentRef.update(props);
        const mousedown$ = fromEvent<MouseEvent>(document, 'mousedown').subscribe((event: MouseEvent) => {
            const point = toViewBoxPoint(this.board, toHostPoint(this.board, event.x, event.y));
            const textRec = this.options.getRenderRectangle ? this.options.getRenderRectangle() : this.options.getRectangle();
            const clickInText = RectangleClient.isHit(RectangleClient.getRectangleByPoints([point, point]), textRec);
            const isAttached = (event.target as HTMLElement).closest('.plait-board-attached');

            if (!clickInText && !isAttached) {
                // handle composition input state, like: Chinese IME Composition Input
                timer(0).subscribe(() => {
                    exitCallback();
                });
            }
        });
        const exitCallback = () => {
            this.updateRectangle();
            mousedown$.unsubscribe();
            IS_TEXT_EDITABLE.set(this.board, false);
            MERGING.set(this.board, false);
            callback && callback();
            const props = {
                readonly: true
            };
            this.componentRef.update(props);
            this.exitCallback = null;
            this.isEditing = false;
        };
        this.exitCallback = exitCallback;
        return exitCallback;
    }

    getSize = (element?: Element) => {
        const computedStyle = window.getComputedStyle(this.foreignObject.children[0]);
        const fontFamily = computedStyle.fontFamily;
        const fontSize = parseFloat(computedStyle.fontSize);
        const target = element || (this.editor.children[0] as Element);
        return measureElement(
            target,
            {
                fontSize: fontSize,
                fontFamily,
                lineHeight: getLineHeightByFontSize(fontSize)
            },
            this.options.getMaxWidth!()
        );
    };

    getText = () => {
        return this.editor.children[0];
    };

    destroy() {
        this.g?.remove();
        this.componentRef?.destroy();
    }
}

export const buildCompositionData = (editor: Editor, data: string) => {
    if (editor.selection && Range.isCollapsed(editor.selection)) {
        const [textNode, textPath] = Editor.node(editor, editor.selection) as NodeEntry<Text>;
        const offset = editor.selection.anchor.offset;
        const clonedElement = JSON.parse(JSON.stringify(editor.children[0]));
        const root = { children: [clonedElement] };
        const newTextString = textNode.text.slice(0, offset + 1) + data + textNode.text.slice(offset + 1);
        const clonedTextNode = Node.get(root, textPath) as Text;
        clonedTextNode.text = newTextString;
        return root;
    }
    return null;
};

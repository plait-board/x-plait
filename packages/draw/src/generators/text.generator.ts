import { ELEMENT_TO_TEXT_MANAGES, TextManage, TextManageRef, WithTextOptions, WithTextPluginKey } from '@plait/common';
import { PlaitBoard, PlaitElement, PlaitOptionsBoard, RectangleClient } from '@plait/core';
import { Element } from 'slate';
import { getEngine } from '../engines';
import { DrawShapes, EngineExtraData, PlaitCommonGeometry, PlaitGeometry } from '../interfaces';
import { getTextRectangle, isMultipleTextGeometry } from '../utils';
import { ViewContainerRef } from '@angular/core';

export interface PlaitDrawShapeText extends EngineExtraData {
    key: string;
    text: Element;
    textHeight: number;
    board?: PlaitBoard;
}

export interface TextGeneratorOptions<T> {
    onValueChangeHandle: (element: T, textChangeRef: TextManageRef, text: PlaitDrawShapeText) => void;
    getRenderRectangle?: (element: T, text: PlaitDrawShapeText) => RectangleClient;
    getMaxWidth?: () => number;
}

export const KEY_TO_TEXT_MANAGE: Map<string, TextManage> = new Map();

export const setTextManage = (key: string, textManage: TextManage) => {
    return KEY_TO_TEXT_MANAGE.set(key, textManage);
};

export const getTextManage = (key: string) => {
    return KEY_TO_TEXT_MANAGE.get(key);
};

export const deleteTextManage = (key: string) => {
    return KEY_TO_TEXT_MANAGE.delete(key);
};

export class TextGenerator<T extends PlaitElement = PlaitGeometry> {
    protected board: PlaitBoard;

    protected element: T;

    protected texts: PlaitDrawShapeText[];

    protected viewContainerRef: ViewContainerRef;

    protected options: TextGeneratorOptions<T>;

    public textManages!: TextManage[];

    get shape(): DrawShapes {
        return this.element.shape || this.element.type;
    }

    constructor(
        board: PlaitBoard,
        element: T,
        texts: PlaitDrawShapeText[],
        viewContainerRef: ViewContainerRef,
        options: TextGeneratorOptions<T>
    ) {
        this.board = board;
        this.texts = texts;
        this.element = element;
        this.viewContainerRef = viewContainerRef;
        this.options = options;
    }

    initialize() {
        this.textManages = this.texts.map(text => {
            const textManage = this.createTextManage(text);
            setTextManage(this.getTextKey(text), textManage);
            return textManage;
        });
        ELEMENT_TO_TEXT_MANAGES.set(this.element, this.textManages);
    }

    getTextKey(text: PlaitDrawShapeText) {
        if (isMultipleTextGeometry((this.element as unknown) as PlaitCommonGeometry)) {
            return `${this.element.id}-${text.key}`;
        } else {
            return text.key;
        }
    }

    draw(elementG: SVGElement) {
        const centerPoint = RectangleClient.getCenterPoint(this.board.getRectangle(this.element)!);
        this.texts.forEach(drawShapeText => {
            const textManage = getTextManage(this.getTextKey(drawShapeText));
            if (drawShapeText.text && textManage) {
                textManage.draw(drawShapeText.text);
                elementG.append(textManage.g);
                (this.element.angle || this.element.angle === 0) && textManage.updateAngle(centerPoint, this.element.angle);
            }
        });
    }

    update(element: T, previousDrawShapeTexts: PlaitDrawShapeText[], currentDrawShapeTexts: PlaitDrawShapeText[], elementG: SVGElement) {
        this.element = element;
        ELEMENT_TO_TEXT_MANAGES.set(this.element, this.textManages);
        const centerPoint = RectangleClient.getCenterPoint(this.board.getRectangle(this.element)!);
        const textPlugins = ((this.board as PlaitOptionsBoard).getPluginOptions<WithTextOptions>(WithTextPluginKey) || {}).textPlugins;
        const removedTexts = previousDrawShapeTexts.filter(value => {
            return !currentDrawShapeTexts.find(item => item.key === value.key);
        });
        if (removedTexts.length) {
            removedTexts.forEach(item => {
                const textManage = getTextManage(item.key);
                const index = this.textManages.findIndex(value => value === textManage);
                if (index > -1 && item.text && item.textHeight) {
                    this.textManages.splice(index, 1);
                }
                textManage?.destroy();
                deleteTextManage(item.key);
            });
        }
        currentDrawShapeTexts.forEach(drawShapeText => {
            if (drawShapeText.text) {
                let textManage = getTextManage(this.getTextKey(drawShapeText));
                if (!textManage) {
                    textManage = this.createTextManage(drawShapeText);
                    setTextManage(drawShapeText.key, textManage);
                    textManage.draw(drawShapeText.text);
                    elementG.append(textManage.g);
                    this.textManages.push(textManage);
                } else {
                    textManage.updateText(drawShapeText.text);
                    textManage.updateRectangle();
                }
                (this.element.angle || this.element.angle === 0) && textManage.updateAngle(centerPoint, this.element.angle);
            }
        });
    }

    private createTextManage(text: PlaitDrawShapeText) {
        const textManage = new TextManage(this.board, {
            getRectangle: () => {
                return this.getRectangle(text);
            },
            onChange: (textManageRef: TextManageRef) => {
                return this.onValueChangeHandle(textManageRef, text);
            },
            getMaxWidth: () => {
                return this.getMaxWidth(text);
            },
            getRenderRectangle: () => {
                return this.options.getRenderRectangle ? this.options.getRenderRectangle(this.element, text) : this.getRectangle(text);
            }
        });
        return textManage;
    }

    getRectangle(text: PlaitDrawShapeText) {
        const getRectangle = getEngine<T>(this.shape).getTextRectangle;
        if (getRectangle) {
            return getRectangle(this.element, text);
        }
        return getTextRectangle(this.element);
    }

    onValueChangeHandle(textManageRef: TextManageRef, text: PlaitDrawShapeText) {
        return this.options.onValueChangeHandle(this.element, textManageRef, text);
    }

    getMaxWidth(text: PlaitDrawShapeText) {
        return this.options.getMaxWidth ? this.options.getMaxWidth() : this.getRectangle(text).width;
    }

    destroy() {
        this.textManages.forEach(manage => {
            manage.destroy();
        });
        this.textManages = [];
        ELEMENT_TO_TEXT_MANAGES.delete(this.element);
        this.texts.forEach(item => {
            deleteTextManage(item.key);
        });
    }
}

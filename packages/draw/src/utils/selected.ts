import { PlaitBoard, PlaitElement, getSelectedElements } from '@plait/core';
import { PlaitDrawElement, PlaitGeometry, PlaitLine } from '../interfaces';
import { PlaitImage } from '../interfaces/image';
import { PlaitTable, PlaitTableElement } from '../interfaces/table';

export const getSelectedDrawElements = (board: PlaitBoard, elements?: PlaitElement[]) => {
    const selectedElements = elements?.length ? elements : getSelectedElements(board);
    return selectedElements.filter(value => PlaitDrawElement.isDrawElement(value)) as PlaitDrawElement[];
};

export const getSelectedGeometryElements = (board: PlaitBoard) => {
    const selectedElements = getSelectedElements(board).filter(value => PlaitDrawElement.isGeometry(value)) as PlaitGeometry[];
    return selectedElements;
};

export const getSelectedLineElements = (board: PlaitBoard) => {
    const selectedElements = getSelectedElements(board).filter(value => PlaitDrawElement.isLine(value)) as PlaitLine[];
    return selectedElements;
};

export const getSelectedImageElements = (board: PlaitBoard) => {
    const selectedElements = getSelectedElements(board).filter(value => PlaitDrawElement.isImage(value)) as PlaitImage[];
    return selectedElements;
};

export const isSingleSelectSwimlane = (board: PlaitBoard) => {
    const selectedElements = getSelectedElements(board);
    return selectedElements && selectedElements.length === 1 && PlaitDrawElement.isSwimlane(selectedElements[0]);
};

export const isSingleSelectTable = (board: PlaitBoard) => {
    const selectedElements = getSelectedElements(board);
    return selectedElements && selectedElements.length === 1 && PlaitTableElement.isTable(selectedElements[0]);
};

export const getSelectedTableElements = (board: PlaitBoard, elements?: PlaitElement[]) => {
    const selectedElements = elements?.length ? elements : getSelectedElements(board);
    return selectedElements.filter(value => PlaitTableElement.isTable(value)) as PlaitTable[];
};

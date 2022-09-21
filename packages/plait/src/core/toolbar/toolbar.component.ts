import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { BaseCursorStatus, CursorStatus } from '../../interfaces';

@Component({
    selector: 'plait-toolbar',
    templateUrl: './toolbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaitToolbarComponent {
    @HostBinding('class') hostClass = `plait-board-toolbar`;

    @Input() cursorStatus!: CursorStatus;

    @Input() viewZoom!: number;

    @Output() dragMoveHandle: EventEmitter<BaseCursorStatus> = new EventEmitter();

    @Output() adaptHandle = new EventEmitter();

    @Output() zoomInHandle = new EventEmitter();

    @Output() zoomOutHandle = new EventEmitter();

    @Output() resetZoomHandel = new EventEmitter();

    dragMove() {
        if (this.cursorStatus !== BaseCursorStatus.drag) {
            this.dragMoveHandle.emit(BaseCursorStatus.drag);
        } else {
            this.dragMoveHandle.emit(BaseCursorStatus.select);
        }
    }

    // 适应画布
    adapt() {
        this.adaptHandle.emit();
    }

    // 放大
    zoomIn() {
        this.zoomInHandle.emit();
    }

    // 缩小
    zoomOut() {
        this.zoomOutHandle.emit();
    }

    resetZoom() {
        this.resetZoomHandel.emit();
    }
}
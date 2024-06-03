import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Cell, Column, Row } from './models/cell.model';
import { SpreadTable } from './models/spread-table.models';
import { Change, UndoRedoService } from './services/undo-redo.service';
import { ContextMenuModel } from './models/context-menu.model';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { RendererComponent } from './components/renderer/renderer.component';
import { EditorComponent } from './components/editor/editor.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';

@Component({
  selector: 'spread-table',
  templateUrl: './spread-table.component.html',
  styleUrls: ['./spread-table.component.scss'],
  standalone: true,
  imports: [RendererComponent, EditorComponent, ContextMenuComponent, ScrollingModule, ReactiveFormsModule, CommonModule]
})
export class SpreadTableComponent implements OnChanges, SpreadTable {
  table = document.getElementById('spreadTable');

  @Input() minColumnWidth = 100;
  @Input() rowHeight = 24;
  @Input() indexWidth = 60;
  @Input() undoRedoStackSize = 10;
  @Input() rawData: any = null;
  @Input() headerBgColor = '#634be3';
  @Input() headerColor = '#efefef';
  @Input() columns: Column[] = [];
  @Input() extraContextMenuItems: ContextMenuModel[] = [];
  @Input() extraColumnMenuItems: ContextMenuModel[] = [];

  @Output() cellValueChange = new EventEmitter<Change[]>();
  @Output() contextMenuEvent = new EventEmitter<ContextMenuModel>();
  @Output() columnMenuEvent = new EventEmitter<ContextMenuModel>();

  data: Row[] = [];
  firstLoad = true;

  focus = true;
  form = new FormGroup<any>({});
  formControl = new FormControl();
  selectedRowIndex = -1;

  menuIconSize = '0.8rem';
  isMouseDown = false;
  startRowIndex = 0;
  startCellIndex = 0;
  endRowIndex = 0;
  endCellIndex = 0;
  // selectedCellCoordinates?: { rowIndex: number, columnIndex: number } = undefined;
  selectedCellCoordinates?: { rowIndex: number, columnName: string } = undefined;
  isEditMode = false;
  columnBeingResized: Column | null = null;
  htmlColumnBeingResized?: HTMLElement;
  originalColumnsWidth: any = {};

  isDisplayContextMenu: boolean = false;
  isDisplayColumnMenu: boolean = false;

  contextMenuActions = {
    copy: 'copy',
    cut: 'cut',
    paste: 'paste',
    undo: 'undo',
    redo: 'redo',
  };

  columnMenuActions = {
    resetColumn: 'resetColumn',
    resetAllColumns: 'resetAllColumns'
  };

  editableContextMenu = false;

  contextMenuItems: ContextMenuModel[] = [];
  columnMenuItems: ContextMenuModel[] = [];

  createContextMenuItems(column: Column) {
    let items: ContextMenuModel[] = [{
      iconHtml: `<svg
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 1024 1024"><path fill="#b3b3b3" d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64h64z"/><path fill="#b3b3b3" d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64H384zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64z"/></svg>`,
      menuText: 'Copy',
      disabled: true,
      menuEvent: this.contextMenuActions.copy,
      shortcut: 'Ctrl+C',
      column: column
    },
    {
      iconHtml: `<svg xmlns="http://www.w3.org/2000/svg" 
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 24   24" fill="none">
      <path d="M9 18.5L17 3M9 18.5C9 19.8807 7.88071 21 6.5 21C5.11929 21 4 19.8807 4 18.5C4 17.1193 5.11929 16 6.5 16C7.88071 16 9 17.1193 9 18.5ZM15 18.5L7 3M15 18.5C15 19.8807 16.1193 21 17.5 21C18.8807 21 20 19.8807 20 18.5C20 17.1193 18.8807 16 17.5 16C16.1193 16 15 17.1193 15 18.5Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      menuText: 'Cut',
      menuEvent: this.contextMenuActions.cut,
      shortcut: 'Ctrl+X',
      disabled: !this.editableContextMenu,
      column: column
    },
    {
      iconHtml: `<svg xmlns="http://www.w3.org/2000/svg" 
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 24 24" fill="none">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C11.2347 0 10.6293 0.125708 10.1567 0.359214C9.9845 0.44429 9.82065 0.544674 9.68861 0.62717L9.59036 0.688808C9.49144 0.751003 9.4082 0.803334 9.32081 0.853848C9.09464 0.984584 9.00895 0.998492 9.00053 0.999859C8.99983 0.999973 9.00019 0.999859 9.00053 0.999859C7.89596 0.999859 7 1.89543 7 3H6C4.34315 3 3 4.34315 3 6V20C3 21.6569 4.34315 23 6 23H18C19.6569 23 21 21.6569 21 20V6C21 4.34315 19.6569 3 18 3H17C17 1.89543 16.1046 1 15 1C15.0003 1 15.0007 1.00011 15 1C14.9916 0.998633 14.9054 0.984584 14.6792 0.853848C14.5918 0.80333 14.5086 0.751004 14.4096 0.688804L14.3114 0.62717C14.1793 0.544674 14.0155 0.44429 13.8433 0.359214C13.3707 0.125708 12.7653 0 12 0ZM16.7324 5C16.3866 5.5978 15.7403 6 15 6H9C8.25972 6 7.61337 5.5978 7.26756 5H6C5.44772 5 5 5.44772 5 6V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V6C19 5.44772 18.5523 5 18 5H16.7324ZM11.0426 2.15229C11.1626 2.09301 11.4425 2 12 2C12.5575 2 12.8374 2.09301 12.9574 2.15229C13.0328 2.18953 13.1236 2.24334 13.2516 2.32333L13.3261 2.37008C13.43 2.43542 13.5553 2.51428 13.6783 2.58539C13.9712 2.75469 14.4433 3 15 3V4H9V3C9.55666 3 10.0288 2.75469 10.3217 2.58539C10.4447 2.51428 10.57 2.43543 10.6739 2.37008L10.7484 2.32333C10.8764 2.24334 10.9672 2.18953 11.0426 2.15229Z" fill="#0F0F0F"/>
</svg>`,
      menuText: 'Paste',
      menuEvent: this.contextMenuActions.paste,
      shortcut: 'Ctrl+V',
      disabled: !this.editableContextMenu,
      column: column
    }, {
      iconHtml: `<svg xmlns="http://www.w3.org/2000/svg" 
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 24 24" fill="none">
<g id="Edit / Undo">
<path id="Vector" d="M10 8H5V3M5.29102 16.3569C6.22284 17.7918 7.59014 18.8902 9.19218 19.4907C10.7942 20.0913 12.547 20.1624 14.1925 19.6937C15.8379 19.225 17.2893 18.2413 18.3344 16.8867C19.3795 15.5321 19.963 13.878 19.9989 12.1675C20.0347 10.4569 19.5211 8.78001 18.5337 7.38281C17.5462 5.98561 16.1366 4.942 14.5122 4.40479C12.8878 3.86757 11.1341 3.86499 9.5083 4.39795C7.88252 4.93091 6.47059 5.97095 5.47949 7.36556" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>`,
      menuText: 'Undo',
      menuEvent: this.contextMenuActions.undo,
      shortcut: 'Ctrl+Z',
      disabled: !this.editableContextMenu,
      column: column
    }, {
      iconHtml: `<svg xmlns="http://www.w3.org/2000/svg"
       width=${this.menuIconSize}
      height=${this.menuIconSize}
       viewBox="0 0 24 24" fill="none">
<g id="Edit / Redo">
<path id="Vector" d="M13.9998 8H18.9998V3M18.7091 16.3569C17.7772 17.7918 16.4099 18.8902 14.8079 19.4907C13.2059 20.0913 11.4534 20.1624 9.80791 19.6937C8.16246 19.225 6.71091 18.2413 5.66582 16.8867C4.62073 15.5321 4.03759 13.878 4.00176 12.1675C3.96593 10.4569 4.47903 8.78001 5.46648 7.38281C6.45392 5.98561 7.86334 4.942 9.48772 4.40479C11.1121 3.86757 12.8661 3.86499 14.4919 4.39795C16.1177 4.93091 17.5298 5.97095 18.5209 7.36556" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>`,
      menuText: 'Redo',
      menuEvent: this.contextMenuActions.redo,
      shortcut: 'Ctrl+Y',
      disabled: !this.editableContextMenu,
      column: column
    }];

    if (this.extraContextMenuItems?.length) {
      items.push(...this.extraContextMenuItems.map(extraContextMenuItem => {
        extraContextMenuItem.column = column;
        return extraContextMenuItem;
      }));
    }

    this.contextMenuItems = items;
  }

  createColumnMenuItems(column: Column) {
    let items: ContextMenuModel[] = [{
      iconHtml: `<svg fill="#000000" 
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="icon">
  <path d="M180 176h-60c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8zm724 0h-60c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8zM785.3 504.3L657.7 403.6a7.23 7.23 0 0 0-11.7 5.7V476H378v-62.8c0-6-7-9.4-11.7-5.7L238.7 508.3a7.14 7.14 0 0 0 0 11.3l127.5 100.8c4.7 3.7 11.7.4 11.7-5.7V548h268v62.8c0 6 7 9.4 11.7 5.7l127.5-100.8c3.8-2.9 3.8-8.5.2-11.4z"/>
</svg>`,
      menuText: 'Reset Column',
      menuEvent: this.columnMenuActions.resetColumn,
      column: column
    },
    {
      iconHtml: `<svg fill="#000000" 
      width=${this.menuIconSize}
      height=${this.menuIconSize}
      viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="icon">
  <path d="M180 176h-60c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8zm724 0h-60c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8zM785.3 504.3L657.7 403.6a7.23 7.23 0 0 0-11.7 5.7V476H378v-62.8c0-6-7-9.4-11.7-5.7L238.7 508.3a7.14 7.14 0 0 0 0 11.3l127.5 100.8c4.7 3.7 11.7.4 11.7-5.7V548h268v62.8c0 6 7 9.4 11.7 5.7l127.5-100.8c3.8-2.9 3.8-8.5.2-11.4z"/>
</svg>`,
      menuText: 'Reset All Columns',
      menuEvent: this.columnMenuActions.resetAllColumns,
      column: column
    }];

    if (this.extraColumnMenuItems?.length) {
      items.push(...this.extraColumnMenuItems.map(extraColumnMenuItem => {
        extraColumnMenuItem.column = column;
        return extraColumnMenuItem;
      }));
    }

    this.columnMenuItems = items;
  }

  contextMenuPosition: { x: number, y: number } | any;

  @ViewChild('contextMenu', { read: ElementRef }) set contextMenu(element: ElementRef) {
    if (element) {
      const wrapper = this.table?.parentElement?.parentElement?.parentElement;
      element.nativeElement.setAttribute('style', `position: fixed;left: 0px;top: 0px;z-index:100;`);
      let wrapperWidth = 9999999;
      let wrapperHeight = 9999999;

      if (wrapper) {
        wrapperWidth = wrapper.clientWidth + wrapper.offsetLeft;
        wrapperHeight = wrapper.clientHeight + wrapper.offsetTop;
      }
      const contextMenuWidth = element?.nativeElement.clientWidth;
      const contextMenuHeight = element?.nativeElement.clientHeight;

      this.contextMenuPosition.x = this.contextMenuPosition.x + contextMenuWidth > wrapperWidth ? this.contextMenuPosition.x - contextMenuWidth : this.contextMenuPosition.x;
      this.contextMenuPosition.y = this.contextMenuPosition.y + contextMenuHeight > wrapperHeight ? this.contextMenuPosition.y - contextMenuHeight : this.contextMenuPosition.y;

      element.nativeElement.setAttribute('style', `position: fixed;left: ${this.contextMenuPosition.x}px;top: ${this.contextMenuPosition.y}px;z-index:100;`);
    } else {
      this.contextMenuPosition = {};
    }
  }

  columnMenuPosition: { x: number, y: number } | any;
  @ViewChild('columnMenu', { read: ElementRef }) set columnMenu(element: ElementRef) {
    if (element) {
      const wrapper = this.table?.parentElement?.parentElement?.parentElement;
      element.nativeElement.setAttribute('style', `position: fixed;left: 0px;top: 0px;z-index:100;`);
      let wrapperWidth = 9999999;
      let wrapperHeight = 9999999;

      if (wrapper) {
        wrapperWidth = wrapper.clientWidth + wrapper.offsetLeft;
        wrapperHeight = wrapper.clientHeight + wrapper.offsetTop;
      }
      const columnMenuWidth = element?.nativeElement.clientWidth;
      const columnMenuHeight = element?.nativeElement.clientHeight;

      this.columnMenuPosition.x = this.columnMenuPosition.x + columnMenuWidth > wrapperWidth ? this.columnMenuPosition.x - columnMenuWidth : this.columnMenuPosition.x;
      this.columnMenuPosition.y = this.columnMenuPosition.y + columnMenuHeight > wrapperHeight ? this.columnMenuPosition.y - columnMenuHeight : this.columnMenuPosition.y;

      element.nativeElement.setAttribute('style', `position: fixed;left: ${this.columnMenuPosition.x}px;top: ${this.columnMenuPosition.y}px;z-index:100;`);
    } else {
      this.columnMenuPosition = {};
    }
  }

  constructor(public undoRedoService: UndoRedoService) { }

  public getSelectedCells(): Cell[] {
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));
    return selectedCells;
  }

  public getData() {
    return this.data.map(row => {
      let dataRow: any = {};
      row.cells.map(cell => {
        dataRow[cell.columnName] = cell.value
      });
      return dataRow;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.['undoRedoStackSize']?.currentValue) {
      this.undoRedoService.setStackSize(this.undoRedoStackSize);
    }
    let data: Row[] = [];
    if (this.firstLoad && this.rawData?.length && this.columns?.length) {
      this.firstLoad = false;
      for (let i = 0; i < this.rawData.length; i++) {
        let row = new Row({ rowIndex: i, cells: [] });

        for (let j = 0; j < this.columns.length; j++) {
          row.cells.push({ columnName: this.columns[j].name, value: this.rawData[i][this.columns[j].name], originalValue: this.rawData[i][this.columns[j].name], rowIndex: i });
        }
        data.push(row);
      }

      this.data = [...data];

      setTimeout(() => {
        (document.querySelector('#widthReference') as any)!['style']['min-width'] = (this.indexWidth + this.columns.map(c => c.minWidth || this.minColumnWidth).reduce((a, b) => a + b, 0) + 10) + 'px';
        this.setupTableEvents();
      }, 0);
    }

    if (this.columns?.length > 0) {
      this.columns.map(c => {
        c.minWidth = c.minWidth || this.minColumnWidth;
        this.originalColumnsWidth[c.name] = c.minWidth;
      });
    }
  }

  addColumn(column: Column) {
    this.data.forEach(row => {
      row.cells.splice(this.columns.indexOf(column), 0, new Cell({ columnName: column.name, value: '', originalValue: '', rowIndex: row.rowIndex }));
    });
    this.setColumnsWidth();
  }

  getCellValue(row: Row, columnName: string) {
    return row.cells.find(c => c.columnName === columnName)?.value;
  }

  setupTableEvents() {
    this.table = document.getElementById('spreadTable');

    this.setColumnsWidth();

    if ((this.table as any)!["eventListeners"]()!.length) {
      return;
    }

    document.addEventListener('scroll', (e) => { this.isDisplayContextMenu = false; this.isDisplayColumnMenu = false; }, true);

    this.table?.addEventListener("selectstart", () => {
      return false;
    });

    this.table?.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });

    this.table?.addEventListener("keydown", (e) => { this.keyDownCall(e) });

    window.addEventListener('resize', this.setColumnsWidth);

    const target = document.getElementById('spreadTable');

    target!.addEventListener('paste', (event) => {
      let paste = (event['clipboardData'] || (window as any)['clipboardData']).getData('text');

      this.handlePaste(paste);

      if (!this.isEditMode) {
        event.preventDefault();
      }
    });
  }

  setColumnsWidth = () => {
    const headerWidth = document.querySelector('#widthReference')!.clientWidth - 0.1;
    const columnsWidthSum = this.columns.map(c => { return c.minWidth || this.minColumnWidth }).reduce((a, b) => a + b, 0) + this.indexWidth + 10;
    (document.querySelector('cdk-virtual-scroll-viewport') as any)!['style'].width = Math.max(columnsWidthSum, headerWidth) + 'px';
    document.getElementById('spread-table-header')!['style'].width = Math.max(columnsWidthSum, headerWidth) + 'px';
    if (headerWidth > columnsWidthSum) {
      this.columns.map(c => {
        const percentage = (c.minWidth ?? this.minColumnWidth) * 100 / (columnsWidthSum - this.indexWidth - 10);
        c.minWidth = c.minWidth ?? this.minColumnWidth + ((headerWidth - columnsWidthSum) * percentage / 100);
      });
    }
  }

  mouseUp() {
    this.isMouseDown = false;
  }

  mouseOverCall(cell: Cell) {
    if (!this.isMouseDown || this.isInEditMode(cell)) return;

    this.clearSelection();

    this.selectTo(cell.rowIndex, cell.columnName);
  }

  getDataCell(rowIndex: number, columnName: string): Cell {
    return this.data.find(d => d.rowIndex === rowIndex)?.cells.find(c => c.columnName === columnName) || new Cell;
  }

  doubleClick(cell: Cell) {
    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex && this.selectedCellCoordinates.columnName === cell.columnName && this.isEditMode) return;
    this.clearSelection();
    this.isDisplayColumnMenu = false;
    this.isDisplayContextMenu = false;
    this.isMouseDown = false;
    this.isEditMode = true;
    this.focus = true;
    this.selectedCellCoordinates = { rowIndex: cell.rowIndex, columnName: cell.columnName };

    this.form = new FormGroup({});

    this.columns.forEach((column) => {
      this.form.addControl(column.name, new FormControl(this.getCellValue(this.data[cell.rowIndex], column.name), column.validators));
    });

    this.startCellIndex = this.columns.indexOf(this.columns.find(c => c.name === cell.columnName)!);
    this.startRowIndex = cell.rowIndex;

    if (this.focus) {
      this.focus = false;
      setTimeout(() => { // this will make the execution after the above boolean has changed
        const cell = document.getElementsByClassName('cell-in-edit')[0] as any;
        if (cell) {
          cell.focus();
        }
      }, 0);
    }
  }

  isInEditMode(cell: Cell) {
    if (!this.selectedCellCoordinates) return false;
    const cellColumnName = this.selectedCellCoordinates.columnName;
    const rowIndex2 = this.selectedCellCoordinates.rowIndex;

    return cell.rowIndex === rowIndex2 && cell.columnName === cellColumnName && this.isEditMode;
  }


  keyDownCall(e: Event) {

    let event = e as KeyboardEvent;

    if (event.ctrlKey && event.key === 'x') {
      this.cutSelectedCellsValues();
      e.stopPropagation();
      e.preventDefault();
    }

    if (!this.isEditMode) {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          this.isEditMode = true;
          this.focus = true;

          this.form = new FormGroup({});

          this.columns.forEach((column) => {
            this.form.addControl(column.name, new FormControl(this.getCellValue(this.data[this.selectedCellCoordinates?.rowIndex || 0], column.name), column.validators));
          });

          this.deleteSelectedCellsValues();

          this.isEditMode = false;

          e.stopPropagation();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnName);
            let nextCell: Cell | null = null;
            const columnIndex = this.columns.indexOf(this.columns.find(c => c.name === this.selectedCellCoordinates!.columnName)!);
            if (columnIndex - 1 >= 0) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.columns[columnIndex - 1].name);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnName: nextCell.columnName };
            }
          }
          break;
        case 'ArrowRight':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnName);
            let nextCell: Cell | null = null;
            const columnIndex = this.columns.indexOf(this.columns.find(c => c.name === this.selectedCellCoordinates!.columnName)!);
            if (columnIndex + 1 < this.columns.length) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.columns[columnIndex + 1].name);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnName: nextCell.columnName };
            }
          }
          break;
        case 'ArrowUp':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnName);
            let nextCell: Cell | null = null;
            const columnIndex = this.columns.indexOf(this.columns.find(c => c.name === this.selectedCellCoordinates!.columnName)!);
            if (this.selectedCellCoordinates.rowIndex > 0) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex - 1, this.columns[columnIndex].name);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnName: nextCell.columnName };
            }
          }
          break;
        case 'ArrowDown':
          if (this.selectedCellCoordinates) {
            let currentCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnName);
            let nextCell: Cell | null = null;
            if (this.selectedCellCoordinates.rowIndex + 1 < this.data.length) {
              if (currentCell) currentCell.selected = false;
              nextCell = this.getDataCell(this.selectedCellCoordinates.rowIndex + 1, this.selectedCellCoordinates.columnName);
            }
            if (nextCell) {
              nextCell.selected = true;
              this.selectedCellCoordinates = { rowIndex: nextCell.rowIndex, columnName: nextCell.columnName };
            }
          }
          break;
        case 'Escape':
        case 'Shift':
          break;
        case 'Enter':
          if (this.selectedCellCoordinates) {
            let selectedCell = this.getDataCell(this.selectedCellCoordinates.rowIndex, this.selectedCellCoordinates.columnName);
            this.doubleClick(selectedCell);
            event.stopPropagation();
          }
          break;
        default:
          if (event.ctrlKey) {

            switch (event.key) {
              case 'v':
                if (navigator.clipboard && navigator.clipboard.readText!) {
                  this.handlePaste();
                }
                break;
              case 'c':
                this.handleCopy();
                break;
              case 'z':
                this.undo();
                break;
              case 'y':
                this.redo();
                break;
              default:
                break;
            }
          }
          break;
      }
    } else {

      if (event.key === 'Enter' || event.key === 'Escape') {
        this.table?.focus();
        event.stopPropagation();
      }
    }
  }

  undo() {
    const lastChange = this.undoRedoService.undo();
    let changes: Change[] = [];
    if (lastChange) {
      this.clearSelection();
      lastChange.forEach(change => {
        let cellData = this.getDataCell(change.coordinates.rowIndex, change.coordinates.columnName);
        if (cellData) {
          this.setCellValueAndValidate(cellData, change.beforeValue);
          cellData.selected = true;
        }

        changes.push({
          coordinates:
            { rowIndex: change.coordinates.rowIndex, columnName: change.coordinates.columnName },
          beforeValue: change.afterValue,
          afterValue: change.beforeValue
        });
      });
      this.cellValueChange.emit(changes);
    }
  }

  redo() {
    const lastChange = this.undoRedoService.redo();
    let changes: Change[] = [];
    if (lastChange) {
      this.clearSelection();
      lastChange.forEach(change => {
        let cellData = this.getDataCell(change.coordinates.rowIndex, change.coordinates.columnName);
        if (cellData) {
          this.setCellValueAndValidate(cellData, change.beforeValue);
          cellData.selected = true;
        }

        changes.push({
          coordinates:
            { rowIndex: change.coordinates.rowIndex, columnName: change.coordinates.columnName },
          beforeValue: change.afterValue,
          afterValue: change.beforeValue
        });
      });
      this.cellValueChange.emit(changes);
    }
  }

  deleteSelectedCellsValues() {
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    let changes: Change[] = [];

    selectedCells.forEach(cell => {
      changes.push({
        coordinates:
          { rowIndex: cell.rowIndex, columnName: cell.columnName },
        beforeValue: cell.value,
        afterValue: ''
      });
      this.setCellValueAndValidate(cell, '');
    });

    if (changes.length > 0) {
      this.undoRedoService.setChange(changes);
      this.cellValueChange.emit(changes);
    }
  }

  async cutSelectedCellsValues() {
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    let changes: Change[] = [];
    this.handleCopy();

    selectedCells.forEach(cell => {
      changes.push({
        coordinates:
          { rowIndex: cell.rowIndex, columnName: cell.columnName },
        beforeValue: cell.value,
        afterValue: ''
      });
      this.setCellValueAndValidate(cell, '');
    });

    if (changes.length > 0) {
      this.undoRedoService.setChange(changes);
      this.cellValueChange.emit(changes);
    }

  }

  handleCopy = async () => {
    if (this.isEditMode) return;
    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));
    this.clearSelection();
    const data = this.groupBy<Cell, number>(selectedCells, c => c.rowIndex);
    let copyString = '';

    data.forEach(valuesRow => {
      valuesRow.map((c: Cell) => {
        copyString += `${c.value}\t`;
        setTimeout(() => {
          c.selected = true;
        }, 200);
      });
      if (copyString.trim().length > 0) {
        copyString = copyString.trimEnd();
      } else {
        copyString = copyString.slice(0, -1);
      }
      if (valuesRow !== data.get([...data][data.size - 1][0])) {
        copyString += '\n';
      }
    });

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(copyString);
    }
  }

  handlePaste = async (pasteText = '') => {
    if (this.isEditMode) return;
    let pastedData;

    if (navigator?.clipboard?.readText) {

      pastedData = await navigator.clipboard.readText();

    } else {
      pastedData = pasteText;
    }

    if (!pastedData && pastedData !== '') return;

    let dataRows = pastedData.split('\n');

    let copyData: any[] = [];

    dataRows.forEach(dataRow => {
      if (dataRow || dataRow === '') {
        let columns = dataRow.split('\t');
        copyData.push(columns);
      }
    });

    let selectedCells: Cell[] = [];
    this.data.forEach(r => selectedCells = selectedCells.concat(r.cells.filter(d => d.selected)));

    if (selectedCells.length === 0) return;

    const rowIndexDifference = selectedCells[0].rowIndex;
    const columnIndexDifference = this.columns.indexOf(this.columns.find(c => c.name === selectedCells[0].columnName)!);
    this.clearSelection();
    let changes: Change[] = [];

    for (let i = 0; i < copyData.length; i++) {
      const selectedRow = this.data.find(r => r.rowIndex == i + rowIndexDifference);
      if (selectedCells.length > 1) {
        if ((selectedRow?.rowIndex || 0) - rowIndexDifference > copyData.length - 1) break;

      }
      for (let j = 0; j < copyData[i].length; j++) {
        const selectedCell = selectedCells.find(c => c.rowIndex === i + rowIndexDifference && this.columns.indexOf(this.columns.find(col => col.name === c.columnName)!) === j + columnIndexDifference);

        const cell = selectedRow?.cells.find(c => this.columns.indexOf(this.columns.find(col => col.name === c.columnName)!) === j + columnIndexDifference);
        if (!cell || !this.columns.find(col => col.name === cell.columnName)!.editable) continue;
        cell.selected = false;

        const cellRowIndex = cell.rowIndex;
        const cellColumnIndex = this.columns.indexOf(this.columns.find(col => col.name === cell.columnName)!);

        if (selectedCells.length > 1) {
          if (!selectedCell) continue;
          if (cellColumnIndex - columnIndexDifference > copyData[cellRowIndex - rowIndexDifference].length - 1) continue;
        }

        const value = copyData ? copyData[cellRowIndex - rowIndexDifference][cellColumnIndex - columnIndexDifference] || '' : '';

        changes.push({
          coordinates:
            { rowIndex: cell.rowIndex, columnName: cell.columnName },
          beforeValue: cell.value,
          afterValue: value
        });

        this.setCellValueAndValidate(cell, value);

        cell.selected = true;
      }
    }

    if (changes.length > 0) {
      this.undoRedoService.setChange(changes);
      this.cellValueChange.emit(changes);
    }
  }

  setCellValue(row: Row, column: Column, value = null) {
    if (value !== null) {
      this.form.get(column.name)?.setValue(value);
    }

    const cell = row.cells.find(c => c.columnName === column.name)!;

    if (cell.value !== this.form.value[column.name]) {
      const changes = [{
        coordinates:
          { rowIndex: row.rowIndex, columnName: cell.columnName },
        beforeValue: cell.value,
        afterValue: this.form.value[column.name]
      }];
      this.undoRedoService.setChange(changes);
      this.cellValueChange.emit(changes);
      cell.value = this.form.value[column.name];

      this.setCellValueAndValidate(cell, this.form.value[column.name]);

    }

    this.isEditMode = false;
    this.table?.focus();

    if (this.selectedCellCoordinates?.rowIndex === cell.rowIndex &&
      this.selectedCellCoordinates?.columnName === cell.columnName) {
      cell.selected = true;
    }
  }

  clearSelection() {
    this.selectedRowIndex = -1;
    this.isEditMode = false;
    this.selectedCellCoordinates = undefined;

    let selectedCells: Cell[] = this.data.filter(r => r.cells.filter(d => d.selected).length > 0).flatMap(r => r.cells.filter(c => c.selected));

    selectedCells.forEach(dataCell => {
      dataCell.selected = false;
    });
  }

  cellClick(e: Event, cell: Cell) {
    let event = e as MouseEvent;
    if (event.button === 2 && cell.selected) {
      this.isDisplayContextMenu = false;
      this.isDisplayColumnMenu = false;
      return false;
    }

    if (cell.columnName === this.selectedCellCoordinates?.columnName &&
      cell.rowIndex === this.selectedCellCoordinates.rowIndex) {
      return true;
    }
    this.isDisplayContextMenu = false;
    this.isDisplayColumnMenu = false;
    if (!event.ctrlKey) {
      this.clearSelection();
    }

    this.table?.focus();
    this.isMouseDown = true;
    this.isEditMode = false;
    this.selectedCellCoordinates = { rowIndex: cell.rowIndex, columnName: cell.columnName };

    if (event.shiftKey) {
      this.selectTo(cell.rowIndex, cell.columnName);
    } else {
      cell.selected = true;

      this.startCellIndex = this.columns.indexOf(this.columns.find(c => c.name === cell.columnName)!);
      this.startRowIndex = cell.rowIndex;
    }

    return false; // prevent text selection
  }

  selectTo(rowIndex: number, columnName: string) {
    let rowStart, rowEnd, cellStart, cellEnd;

    const columnIndex = this.columns.indexOf(this.columns.find(c => c.name === columnName)!);

    if (rowIndex < this.startRowIndex) {
      rowStart = rowIndex;
      rowEnd = this.startRowIndex;
    } else {
      rowStart = this.startRowIndex;
      rowEnd = rowIndex;
    }

    if (columnIndex < this.startCellIndex) {
      cellStart = columnIndex;
      cellEnd = this.startCellIndex;
    } else {
      cellStart = this.startCellIndex;
      cellEnd = columnIndex;
    }

    this.endCellIndex = cellEnd;
    this.endRowIndex = rowEnd;

    for (var i = rowStart; i <= rowEnd; i++) {

      for (var j = cellStart; j <= cellEnd; j++) {
        let cellData = this.getDataCell(i, this.columns[j].name);
        if (cellData) cellData.selected = true;
      }
    }
  }

  // context menu
  async openContextMenu(e: Event, cell: Cell) {
    const event = e as MouseEvent;

    this.isMouseDown = false;

    if (event.ctrlKey) {
      return true;
    }

    // To prevent browser's default contextmenu
    e.preventDefault();
    e.stopPropagation();

    if (this.isEditMode) {
      return false;
    }

    this.editableContextMenu = this.columns.find(col => col.name === cell.columnName)!.editable || false;
    this.isDisplayContextMenu = true;
    this.isDisplayColumnMenu = false;

    this.createContextMenuItems(this.columns.find(col => col.name === cell.columnName)!);

    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    return true;
  }

  // columnmneu
  async openColumnMenu(e: Event, column: Column) {
    this.isDisplayColumnMenu = false;
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
      const event = e as MouseEvent;

      this.isMouseDown = false;

      //this.editableColumnMenu = true;
      this.isDisplayColumnMenu = true;
      this.isDisplayContextMenu = false;

      this.createColumnMenuItems(column);

      this.columnMenuPosition = { x: event.clientX, y: event.clientY, column: column };
      return true;

    }, 50);
  }

  handleMenuItemClick(event: any) {
    this.isDisplayContextMenu = false;
    switch (event.menuEvent) {
      case this.contextMenuActions.cut: {
        this.cutSelectedCellsValues();
        this.table?.focus();
        break;
      }
      case this.contextMenuActions.paste: {
        if (navigator?.clipboard) {
          this.handlePaste();
          this.table?.focus();
        }
        break
      }
      case this.contextMenuActions.undo: {
        this.undo();
        this.table?.focus();
        break
      }
      case this.contextMenuActions.redo: {
        this.redo();
        this.table?.focus();
        break
      }
      default:
        break;
    }
    this.contextMenuEvent.emit(this.contextMenuItems.find(item => item.menuEvent === event.menuEvent));
  }

  handleColumnMenuItemClick(event: any) {
    this.isDisplayColumnMenu = false;
    switch (event.menuEvent) {
      case this.columnMenuActions.resetColumn: {

        this.columnMenuPosition.column.minWidth = this.originalColumnsWidth[this.columnMenuPosition.column.name];
        this.setColumnsWidth();
        this.table?.focus();
        break;
      }
      case this.columnMenuActions.resetAllColumns: {
        this.resetColumnWidths();
        this.table?.focus();
        break;
      }
      default:
        break;
    }
    this.columnMenuEvent.emit(this.columnMenuItems.find(item => item.menuEvent === event.menuEvent));
  }

  showTooltip(column: Column) {
    const columnElement = document.getElementById(column.name)!;
    if ((columnElement.offsetWidth < columnElement.scrollWidth) && !columnElement.getAttribute('title')) {
      columnElement?.setAttribute('title', column.displayName!);
    } else {
      columnElement?.removeAttribute('title');
    }
  }

  private setCellValueAndValidate(cell: Cell, value: any) {
    cell.value = value;
    cell.selected = true;
    this.formControl = new FormControl(value, this.columns.find(col => col.name === cell.columnName)!.validators);
    const controlErrors = this.formControl.errors;
    let cellErrors: string[] = [];
    if (controlErrors) {
      Object.keys(controlErrors).forEach(key => {
        if (controlErrors[key])
          cellErrors.push(`<i class="fas fa-exclamation-triangle"></i>${controlErrors[key]}`);
      });
    }

    cell.errors = cellErrors.join('<br>');
  }


  private groupBy<T, K>(list: T[], keyGetter: (item: T) => K) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }

  clickResizer(event: MouseEvent, column: Column) {
    event.preventDefault();
    this.columnBeingResized = column;
    this.htmlColumnBeingResized = (event.target as HTMLElement).closest(".columnHeader")!;
    document.addEventListener('mousemove', this.resize);
    document.addEventListener('mouseup', this.stopResize);
  }

  resize = (event: MouseEvent) => {
    if (this.columnBeingResized && this.htmlColumnBeingResized) {
      const { left } = this.htmlColumnBeingResized.getBoundingClientRect() || 0;
      this.columnBeingResized.minWidth = Math.max(event.pageX - left, this.minColumnWidth);
      const headerWidth = document.querySelector('#widthReference')!.clientWidth - 0.1;
      const columnsWidthSum = this.columns.map(c => { return c.minWidth || this.minColumnWidth }).reduce((a, b) => a + b, 0) + this.indexWidth + 10;
      (document.querySelector('cdk-virtual-scroll-viewport')! as any)['style'].width = Math.max(columnsWidthSum, headerWidth) + 'px';
      document.getElementById('spread-table-header')!['style'].width = Math.max(columnsWidthSum, headerWidth) + 'px';
    }
  }

  stopResize = () => {
    this.columnBeingResized = null;
    document.removeEventListener('mousemove', this.resize);
    document.removeEventListener('mouseup', this.stopResize);
  }

  resetColumnWidths() {
    this.columns.map(c => {
      c.minWidth = this.originalColumnsWidth[c.name];
    });
    this.setColumnsWidth();
  }

  selectRow(row: Row) {
    this.clearSelection();
    row.cells.forEach(cell => {
      cell.selected = true;
    });
    this.selectedRowIndex = row.rowIndex;
  }
}
